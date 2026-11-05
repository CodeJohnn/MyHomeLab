begin;
create schema if not exists homelab_private;
revoke all on schema homelab_private from public, anon, authenticated;

create table public.player_progression (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp bigint not null default 0 check(total_xp between 0 and 9007199254740000),
  current_level integer not null default 1 check(current_level>=1),
  login_streak integer not null default 0 check(login_streak>=0),
  last_daily_reward_date date,
  total_daily_rewards_claimed bigint not null default 0 check(total_daily_rewards_claimed>=0)
);
create table public.xp_reward_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_date date not null,
  reward_type text not null,
  xp integer not null check(xp>0),
  created_at timestamptz not null default clock_timestamp(),
  unique(user_id,reward_type,reward_date)
);
alter table public.player_progression enable row level security;
alter table public.xp_reward_history enable row level security;
revoke all on public.player_progression,public.xp_reward_history from anon,authenticated;
grant select on public.player_progression,public.xp_reward_history to authenticated;
create policy progression_self_read on public.player_progression for select to authenticated using(user_id=(select auth.uid()));
create policy rewards_self_read on public.xp_reward_history for select to authenticated using(user_id=(select auth.uid()));

-- Single level formula. Existing higher administrative levels are never reduced.
create function homelab_private.level_for_xp(p_xp bigint) returns integer
language sql immutable set search_path='' as $$ select least(2147483647,1+p_xp/100)::integer $$;

create function homelab_private.ensure_player(p_user uuid) returns void
language plpgsql set search_path='' as $$
declare v_meta jsonb; v_xp bigint:=0; v_level integer:=1;
begin
  select raw_app_meta_data->'progression' into v_meta from auth.users where id=p_user;
  if not found then raise exception 'Account not found' using errcode='28000'; end if;
  if coalesce(v_meta->>'xp','') ~ '^[0-9]{1,12}$' then v_xp:=(v_meta->>'xp')::bigint; end if;
  if coalesce(v_meta->>'level','') ~ '^[0-9]{1,8}$' then v_level:=greatest(1,(v_meta->>'level')::integer); end if;
  insert into public.player_progression(user_id,total_xp,current_level)
  values(p_user,v_xp,greatest(v_level,homelab_private.level_for_xp(v_xp))) on conflict(user_id) do nothing;
end $$;

-- Internal centralized award: unique receipt and total change are one transaction.
create function homelab_private.grant_xp(p_user uuid,p_date date,p_type text,p_xp integer,p_now timestamptz)
returns uuid language plpgsql set search_path='' as $$
declare v_id uuid;
begin
  if p_xp<=0 then raise exception 'Invalid XP'; end if;
  perform 1 from public.player_progression where user_id=p_user for update;
  if not found then raise exception 'Progression missing'; end if;
  insert into public.xp_reward_history(user_id,reward_date,reward_type,xp,created_at)
  values(p_user,p_date,p_type,p_xp,p_now) on conflict(user_id,reward_type,reward_date) do nothing returning id into v_id;
  if v_id is not null then
    update public.player_progression set total_xp=total_xp+p_xp,
      current_level=greatest(current_level,homelab_private.level_for_xp(total_xp+p_xp)) where user_id=p_user;
  end if;
  return v_id;
end $$;

create function homelab_private.progression_snapshot(p_user uuid,p_now timestamptz) returns jsonb
language plpgsql set search_path='' as $$
declare p public.player_progression; v_today date:=(p_now at time zone 'America/Sao_Paulo')::date;
v_next integer; v_rewards integer[]:=array[50,75,100,125,150,200,350]; v_today_xp integer:=0;
begin
  select * into p from public.player_progression where user_id=p_user;
  if not found then raise exception 'Progression missing'; end if;
  if p.last_daily_reward_date=v_today or p.last_daily_reward_date=v_today-1 then v_next:=p.login_streak%7+1; else v_next:=1; end if;
  select xp into v_today_xp from public.xp_reward_history where user_id=p_user and reward_type='daily_login' and reward_date=v_today;
  return jsonb_build_object('userId',p_user,'xp',p.total_xp,'totalXp',p.total_xp,'level',p.current_level,'currentLevel',p.current_level,
    'loginStreak',p.login_streak,'lastDailyRewardDate',p.last_daily_reward_date,'totalDailyRewardsClaimed',p.total_daily_rewards_claimed,
    'source','database','today',v_today,'claimedToday',coalesce(p.last_daily_reward_date=v_today,false),'todayXp',coalesce(v_today_xp,0),
    'rewardDay',case when p.login_streak>0 then (p.login_streak-1)%7+1 else 1 end,
    'nextRewardDay',v_next,'nextRewardXp',v_rewards[v_next],'rewards',to_jsonb(v_rewards),
    'availableAt',case when p.last_daily_reward_date=v_today then ((v_today+1)::timestamp at time zone 'America/Sao_Paulo') else p_now end,
    'levelProgress',greatest(0,least(100,p.total_xp-(p.current_level::bigint-1)*100)), 'levelRequiredXp',100);
end $$;

-- p_now exists only in this private helper for deterministic database tests.
-- The public RPC below accepts no date, user ID, XP, level or reward parameters.
create function homelab_private.claim_daily(p_user uuid,p_test_now timestamptz default null) returns jsonb
language plpgsql set search_path='' as $$
declare p public.player_progression; v_now timestamptz; v_today date; v_streak integer; v_day integer;
v_xp integer:=0; v_id uuid; v_rewards integer[]:=array[50,75,100,125,150,200,350];
begin
  perform homelab_private.ensure_player(p_user);
  select * into p from public.player_progression where user_id=p_user for update;
  -- Capture the date after locking: waiting requests must not move the date backwards.
  v_now:=coalesce(p_test_now,clock_timestamp());v_today:=(v_now at time zone 'America/Sao_Paulo')::date;
  if p.last_daily_reward_date is null or p.last_daily_reward_date<v_today then
    v_streak:=case when p.last_daily_reward_date=v_today-1 then p.login_streak+1 else 1 end;
    v_day:=(v_streak-1)%7+1;v_xp:=v_rewards[v_day];
    v_id:=homelab_private.grant_xp(p_user,v_today,'daily_login',v_xp,v_now);
    if v_id is not null then
      update public.player_progression set login_streak=v_streak,last_daily_reward_date=v_today,
        total_daily_rewards_claimed=total_daily_rewards_claimed+1 where user_id=p_user;
    else v_xp:=0; end if;
  end if;
  return jsonb_build_object('awardedXp',v_xp,'rewardId',v_id,'previousLevel',p.current_level,
    'progression',homelab_private.progression_snapshot(p_user,v_now));
end $$;

create function public.claim_daily_login() returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception 'Authenticated account required' using errcode='28000'; end if;
  return homelab_private.claim_daily(v_user);
end $$;
create function public.get_player_progression() returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'Authenticated account required' using errcode='28000'; end if;
  perform homelab_private.ensure_player(v_user);
  return homelab_private.progression_snapshot(v_user,clock_timestamp());
end $$;

revoke all on all functions in schema homelab_private from public,anon,authenticated;
revoke all on function public.claim_daily_login(),public.get_player_progression() from public,anon,authenticated;
grant execute on function public.claim_daily_login(),public.get_player_progression() to authenticated;
commit;
