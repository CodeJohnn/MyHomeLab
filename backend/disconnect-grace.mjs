// Allow brief SSE reconnects without keeping departed avatars for a full stale-session timeout.
export function createDisconnectGrace({delay=5000,schedule=setTimeout,cancel=clearTimeout}={}){
  const pending=new WeakMap();
  function connected(member){const timer=pending.get(member);if(timer!==undefined)cancel(timer);pending.delete(member);}
  return {
    connected,
    disconnected(member,onExpire){
      connected(member);
      const timer=schedule(()=>{if(pending.get(member)!==timer)return;pending.delete(member);onExpire();},delay);
      pending.set(member,timer);timer?.unref?.();
    }
  };
}
