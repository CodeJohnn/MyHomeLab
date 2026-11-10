export function LandingNavigation({busy, onEnter}) {
  return (
    <header className="landingNav">
      <a href="#" className="landingBrand" aria-label="HomeLab GuedesSEC">
        <img src="./frontend/assets/guedessec.png" alt="GuedesSEC" width="55" height="60" />
        <span>GUEDESSEC<span className="brandSlash"> / </span><b>HOMELAB</b></span>
      </a>
      <nav className="landingAccountActions" aria-label="Acesso à conta">
        <a className="landingAboutLink" href="#about">Sobre o projeto</a>
        <button type="button" data-enter disabled={busy} onClick={onEnter}>Entrar</button>
        <button type="button" data-register disabled={busy} onClick={onEnter}>Criar conta</button>
      </nav>
    </header>
  );
}

export function LandingHero({busy, onEnter, message}) {
  return (
    <section className="landingHero" aria-labelledby="landingTitle">
      <div className="landingCopy">
        <p className="landingLabel">LABORATÓRIO VIRTUAL</p>
        <h1 id="landingTitle">HomeLab<span>_</span></h1>
        <p className="landingIntro">Pode entrar.<br />O laboratório também é seu.</p>
        <p className="landingDescription">
          Um escritório em 3D para mexer nas coisas, conversar com o pessoal e jogar
          uma sinuca entre um projeto e outro.
        </p>
        <button type="button" data-enter disabled={busy} onClick={onEnter} className="landingPlay">
          Entrar no laboratório <span aria-hidden="true">→</span>
        </button>
        <p className="landingEntryNote">Direto no navegador. Escolha seu avatar ao entrar.</p>
        <p id="landingLoading" role="status" hidden={!message}>{message}</p>
      </div>
      <div className="landingIdentity">
        <img src="./frontend/assets/guedessec.png" alt="" width="490" height="531" />
        <span>GUEDESSEC — HOME LAB</span>
      </div>
    </section>
  );
}

export function LandingAbout() {
  return (
    <section className="landingBottom" id="about">
      <div className="landingAbout">
        <h2>O que tem por aqui?</h2>
        <p>
          Computadores, sala de servidores, personagens e um espaço para encontrar amigos.
          Você pode personalizar o ambiente, compartilhar vídeos e jogar junto.
        </p>
      </div>
      <details className="landingHelp">
        <summary>Como jogar <span>+</span></summary>
        <p>
          Use as setas ou WASD para andar e E para interagir. Clique no seu personagem
          para abrir as ações. A tecla V muda a câmera.
        </p>
        <p>No celular, use os controles na tela e toque nos objetos.</p>
      </details>
    </section>
  );
}

export default function LandingPage({busy, onEnter, message}) {
  return (
    <>
      <LandingNavigation busy={busy} onEnter={onEnter} />
      <LandingHero busy={busy} onEnter={onEnter} message={message} />
      <LandingAbout />
      <footer className="landingFooter">
        <span>Feito por GuedesSEC.</span>
        <span>HomeLab / em desenvolvimento</span>
      </footer>
    </>
  );
}
