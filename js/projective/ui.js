export function ensureProjectiveUI() {
  if (!document.querySelector('link[href="projective.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'projective.css';
    document.head.appendChild(link);
  }
  document.title = 'Sudoproyective · v0.6.0';
  const version = document.querySelector('.topbar .eyebrow');
  if (version) version.textContent = 'Prototipo v0.6.0';

  const hub = document.querySelector('#hubScreen');
  const rewards = document.querySelector('#rewardsPanel');
  if (hub && rewards && !document.querySelector('#projectivePanel')) {
    const panel = document.createElement('div');
    panel.id = 'projectivePanel';
    panel.className = 'tab-panel';
    panel.dataset.panel = 'projective';
    panel.innerHTML = `
      <div id="projectLockCard" class="hero-card">
        <div class="project-lock-symbol">🔒</div>
        <p class="hero-kicker">Proyecto final</p>
        <h2>Hay algo más</h2>
        <p>El tablero esconde una estructura que todavía no has visto completa. Para abrir este proyecto, completa los 10 niveles <strong>Difíciles</strong> de cada una de las seis rutas.</p>
        <div class="project-progress progress-card"><span class="metric-label">Condición de acceso</span><strong id="projectLockProgress">0/60 desafíos difíciles completados</strong><div class="progress-track"><span id="projectLockBar"></span></div></div>
      </div>
      <div id="projectUnlockedContent" class="hidden">
        <div class="hero-card ultra-intro">
          <p class="hero-kicker">Geometría oculta desbloqueada</p><h2>Las seis direcciones finales</h2>
          <p>Has dominado la campaña difícil. Ahora resuelve un desafío Ultraexperto para cada pendiente. Cada victoria revelará una familia completa de siete rectas. Estos desafíos son fijos, se guardan automáticamente y no usan pistas.</p>
          <div class="progress-card"><span class="metric-label">Construcción</span><strong id="ultraProgressText">0/6 direcciones descubiertas</strong><div class="progress-track"><span id="ultraProgressBar"></span></div></div>
        </div>
        <div id="ultraChallengeGrid" class="ultra-grid"></div>
        <div id="projectiveFinalGate" class="info-card project-final-gate">
          <p class="eyebrow">Revelación final</p><strong>¿Qué construiste realmente?</strong>
          <p>Las seis pendientes se sumarán a las filas y columnas que usaste desde el primer nivel.</p>
          <button id="projectiveRevealBtn" class="primary-btn" style="width:100%;margin-top:14px;" disabled>Completa las 6 rutas restantes</button>
        </div>
        <div id="projectiveConstruction" class="projective-construction hidden">
          <section class="construction-stage">
            <p class="eyebrow">1 · El plano afín</p><h3>Ocho direcciones en el mismo tablero</h3>
            <p>Los 49 lugares del tablero son los puntos de <strong>AG(2,7)</strong>. Las filas forman la dirección 0, las columnas la dirección ∞ y tus seis rutas aportan las pendientes 1, 2, 3, 4, 5 y 6.</p>
            <span class="math-equation">8 direcciones × 7 rectas = 56 rectas afines</span>
            <div id="directionGallery" class="direction-gallery"></div>
          </section>
          <section class="construction-stage">
            <p class="eyebrow">2 · Completar el infinito</p><h3>De AG(2,7) a PG(2,7)</h3>
            <div class="plane-wrap"><div id="finalPlaneGraphic"></div><div>
              <p>Cada familia de siete rectas paralelas recibe un nuevo punto en el infinito. Son ocho direcciones, así que aparecen exactamente ocho puntos nuevos.</p>
              <span class="math-equation">49 + 8 = 57 puntos</span>
              <p>Los ocho puntos nuevos están sobre una última recta: <strong>la recta del infinito</strong>.</p>
              <span class="math-equation">56 + 1 = 57 rectas</span>
              <div class="plane-counts"><div><strong>57</strong><span>puntos</span></div><div><strong>57</strong><span>rectas</span></div><div><strong>8</strong><span>puntos por recta</span></div><div><strong>8</strong><span>rectas por punto</span></div></div>
            </div></div>
          </section>
          <section class="construction-stage spotit-card">
            <p class="eyebrow">Dato curioso</p><h3>Acabas de llegar a la matemática de Spot It</h3>
            <p>Si cada punto de <strong>PG(2,7)</strong> es un símbolo y cada recta es una carta, obtienes 57 símbolos y 57 cartas con 8 símbolos por carta. Como dos rectas se cortan en exactamente un punto, <strong>cada par de cartas comparte exactamente un símbolo</strong>: la propiedad matemática central de un Spot It ideal de orden 7.</p>
          </section>
          <div class="projective-actions"><button id="awardCredentialBtn" class="primary-btn" disabled>Construyendo PG(2,7)…</button></div>
        </div>
      </div>`;
    hub.insertBefore(panel, rewards);
  }

  const trophyGrid = document.querySelector('#trophyGrid');
  if (trophyGrid && !document.querySelector('#secretRewardSlot')) {
    const slot = document.createElement('div');
    slot.id = 'secretRewardSlot';
    trophyGrid.insertAdjacentElement('afterend', slot);
  }

  const nav = document.querySelector('#mainNav');
  const rewardsNav = nav?.querySelector('.nav-btn[data-tab="rewards"]');
  if (nav && rewardsNav && !nav.querySelector('.nav-btn[data-tab="projective"]')) {
    const button = document.createElement('button');
    button.className = 'nav-btn project-locked';
    button.dataset.tab = 'projective';
    button.setAttribute('aria-disabled','true');
    button.innerHTML = '<span>🔒</span>Proyecto';
    nav.insertBefore(button, rewardsNav);
  }

  const main = document.querySelector('main.app-shell');
  const mainNav = document.querySelector('#mainNav');
  if (main && mainNav && !document.querySelector('#ultraGameScreen')) {
    const section = document.createElement('section');
    section.id = 'ultraGameScreen';
    section.className = 'screen';
    section.setAttribute('aria-labelledby','ultraTitle');
    section.innerHTML = `
      <div class="game-head"><button id="ultraBackBtn" class="icon-btn" aria-label="Volver">←</button><div><p id="ultraMeta" class="eyebrow">Proyecto final</p><h2 id="ultraTitle">Desafío Ultraexperto</h2></div><div id="ultraTimer" class="timer">00:00</div></div>
      <div class="tutorial-callout"><div><strong>Ultraexperto</strong><p>Sin pistas · la prueba final</p></div><span class="ultra-tag">12 pistas iniciales</span></div>
      <div class="board-wrap"><div id="ultraBoard" class="board" role="grid" aria-label="Tablero Ultraexperto 7 por 7"></div></div>
      <div class="status-row game-tools ultra-tools"><button id="ultraNotesBtn" class="mode-btn">Notas <span>○</span></button><button id="ultraRoutesBtn" class="mode-btn active">Rutas <span>●</span></button></div>
      <div class="status-row secondary-tools"><div class="history-tools"><button id="ultraUndoBtn" class="mode-btn history-btn" disabled>↶ <span>Deshacer</span></button><button id="ultraRedoBtn" class="mode-btn history-btn" disabled>↷ <span>Rehacer</span></button></div><span class="mini-balance">No modifica estrellas</span></div>
      <div class="number-pad ultra-number-pad" aria-label="Selector de números Ultraexperto"><div id="ultraNumbers" class="numbers"></div><button id="ultraEraseBtn" class="erase-btn" aria-label="Borrar">⌫</button></div>`;
    main.insertBefore(section, mainNav);
  }

  if (!document.querySelector('#ultraVictoryDialog')) {
    document.body.insertAdjacentHTML('beforeend', `
      <dialog id="ultraVictoryDialog" class="modal victory-modal"><div class="victory-mark">◇</div><p class="eyebrow">Ultraexperto completado</p><h2 id="ultraVictoryTitle">Dirección descubierta</h2><p id="ultraVictoryText"></p><div id="ultraFamilyGraphic" class="ultra-family-graphic"></div><p class="reward-message">Siete rectas más forman parte de tu construcción.</p><button id="ultraVictoryContinue" class="primary-btn" style="width:100%;">Continuar</button></dialog>
      <dialog id="credentialDialog" class="modal credential-modal"><div class="credential-card"><span class="sparkle s1">✦</span><span class="sparkle s2">✧</span><span class="sparkle s3">✦</span><span class="sparkle s4">✧</span><div class="credential-seal">PG(2,7)</div><div id="credentialStatus" class="credential-status">DISTINCIÓN MATEMÁTICA</div><h2>Trofeo Proyectivo</h2><div class="credential-subtitle">Creador de Planos Proyectivos</div><p class="credential-copy">Has completado los desafíos finales, reunido las ocho direcciones y revelado el plano proyectivo escondido detrás de Sudoproyective. Desde este momento eres oficialmente un <strong>Creador de Planos Proyectivos</strong>.</p><p class="credential-community">¡La comunidad matemática te envía sus felicitaciones!</p><p style="color:var(--muted);font-size:.75rem;margin-bottom:0;">49 puntos afines + 8 puntos del infinito · 57 puntos · 57 rectas</p></div><button id="credentialCloseBtn" class="secondary-btn credential-close">Cerrar</button></dialog>`);
  }
}
