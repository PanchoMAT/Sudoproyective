export function ensureProjectiveUI() {
  if (!document.querySelector('link[href="projective.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'projective.css';
    document.head.appendChild(link);
  }
  document.title = 'Sudoproyective · v0.7.0';
  const version = document.querySelector('.topbar .eyebrow');
  if (version) version.textContent = 'Prototipo v0.7.0';

  const routeTabs = document.querySelector('#routeTabs');
  if (routeTabs && !document.querySelector('#projectiveRouteGateRow')) {
    const row = document.createElement('div');
    row.id = 'projectiveRouteGateRow';
    row.className = 'projective-route-row';
    row.innerHTML = `
      <button id="projectiveRouteGate" class="projective-route-gate locked" type="button" aria-disabled="true">
        <span class="projective-route-icon">🔒</span>
        <span class="projective-route-copy"><strong>Proyectivo</strong><small id="projectiveRouteStatus">Desafío final bloqueado</small></span>
        <span class="projective-route-progress" id="projectiveRouteProgress">0/60</span>
      </button>`;
    routeTabs.insertAdjacentElement('afterend', row);
  }

  const hub = document.querySelector('#hubScreen');
  const rewards = document.querySelector('#rewardsPanel');
  if (hub && rewards && !document.querySelector('#projectivePanel')) {
    const panel = document.createElement('div');
    panel.id = 'projectivePanel';
    panel.className = 'tab-panel';
    panel.dataset.panel = 'projective';
    panel.innerHTML = `
      <div class="projective-panel-head">
        <button id="projectiveBackBtn" class="icon-btn" type="button" aria-label="Volver a las rutas">←</button>
        <div><p class="eyebrow">Desafío final</p><h2>Proyectivo</h2></div>
      </div>
      <div id="projectUnlockedContent">
        <div class="hero-card ultra-intro">
          <p class="hero-kicker">Geometría oculta desbloqueada</p>
          <h2>Las seis direcciones finales</h2>
          <p>Has dominado la campaña difícil. Ahora resuelve un desafío Ultraexperto para cada pendiente. Cada victoria revelará lentamente una familia completa de siete rectas, cada una con su propio color. Estos desafíos son fijos, se guardan automáticamente y no usan pistas.</p>
          <div class="progress-card"><span class="metric-label">Construcción</span><strong id="ultraProgressText">0/6 direcciones descubiertas</strong><div class="progress-track"><span id="ultraProgressBar"></span></div></div>
        </div>
        <div id="ultraChallengeGrid" class="ultra-grid"></div>
        <div id="projectiveFinalGate" class="info-card project-final-gate">
          <p class="eyebrow">Revelación final</p><strong>¿Qué construiste realmente?</strong>
          <p>Las seis pendientes se reunirán con las filas y las columnas para mostrar las ocho direcciones de <strong>AG(2,7)</strong> y completar después <strong>PG(2,7)</strong>.</p>
          <button id="projectiveRevealBtn" class="primary-btn" style="width:100%;margin-top:14px;" disabled>Completa las 6 rutas restantes</button>
        </div>
        <div id="projectiveConstruction" class="projective-construction hidden">
          <section class="construction-stage circular-stage">
            <p class="eyebrow">Construcción final</p>
            <h3>De las ocho direcciones al plano proyectivo</h3>
            <p>La disposición circular es un esquema visual: cada mini-tablero representa la misma colección de 49 puntos vista desde una de sus ocho direcciones.</p>
            <div id="projectiveSubtitle" class="projective-subtitle" aria-live="polite">Preparando la construcción…</div>
            <div id="circularProjectiveGraphic" class="circular-projective-graphic"></div>
            <div class="projective-animation-controls">
              <button id="projectiveNextStageBtn" class="secondary-btn">Siguiente etapa</button>
              <button id="projectiveReplayBtn" class="secondary-btn">↻ Repetir animación</button>
            </div>
            <p class="projective-schematic-note">La cuerda final es una representación esquemática de una única recta proyectiva: la recta del infinito.</p>
          </section>
          <section id="projectiveSummary" class="construction-stage projective-summary hidden">
            <p class="eyebrow">Plano proyectivo completado</p><h3>PG(2,7)</h3>
            <div class="plane-counts"><div><strong>57</strong><span>puntos</span></div><div><strong>57</strong><span>rectas</span></div><div><strong>8</strong><span>puntos por recta</span></div><div><strong>8</strong><span>rectas por punto</span></div></div>
            <p>Dos puntos determinan exactamente una recta y dos rectas se encuentran en exactamente un punto.</p>
          </section>
          <section id="spotItCard" class="construction-stage spotit-card hidden">
            <p class="eyebrow">Dato curioso</p><h3>Acabas de llegar a la matemática de Spot It</h3>
            <p>Si cada punto de <strong>PG(2,7)</strong> es un símbolo y cada recta es una carta, obtienes 57 símbolos y 57 cartas con 8 símbolos por carta. Como dos rectas se cortan en exactamente un punto, <strong>cada par de cartas comparte exactamente un símbolo</strong>: la propiedad matemática central de un Spot It ideal de orden 7.</p>
          </section>
          <div class="projective-actions"><button id="awardCredentialBtn" class="primary-btn" disabled>Completa la construcción</button></div>
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

  const main = document.querySelector('main.app-shell');
  const mainNav = document.querySelector('#mainNav');
  if (main && mainNav && !document.querySelector('#ultraGameScreen')) {
    const section = document.createElement('section');
    section.id = 'ultraGameScreen';
    section.className = 'screen';
    section.setAttribute('aria-labelledby','ultraTitle');
    section.innerHTML = `
      <div class="game-head"><button id="ultraBackBtn" class="icon-btn" aria-label="Volver">←</button><div><p id="ultraMeta" class="eyebrow">Proyectivo</p><h2 id="ultraTitle">Desafío Ultraexperto</h2></div><div id="ultraTimer" class="timer">00:00</div></div>
      <div class="tutorial-callout"><div><strong>Ultraexperto</strong><p>Sin pistas · la prueba final</p></div><span class="ultra-tag">12 pistas iniciales</span></div>
      <div class="board-wrap"><div id="ultraBoard" class="board" role="grid" aria-label="Tablero Ultraexperto 7 por 7"></div></div>
      <div class="status-row game-tools ultra-tools"><button id="ultraNotesBtn" class="mode-btn">Notas <span>○</span></button><button id="ultraRoutesBtn" class="mode-btn active">Rutas <span>●</span></button></div>
      <div class="status-row secondary-tools"><div class="history-tools"><button id="ultraUndoBtn" class="mode-btn history-btn" disabled>↶ <span>Deshacer</span></button><button id="ultraRedoBtn" class="mode-btn history-btn" disabled>↷ <span>Rehacer</span></button></div><span class="mini-balance">No modifica estrellas</span></div>
      <div class="number-pad ultra-number-pad" aria-label="Selector de números Ultraexperto"><div id="ultraNumbers" class="numbers"></div><button id="ultraEraseBtn" class="erase-btn" aria-label="Borrar">⌫</button></div>`;
    main.insertBefore(section, mainNav);
  }

  if (!document.querySelector('#ultraVictoryDialog')) {
    document.body.insertAdjacentHTML('beforeend', `
      <dialog id="projectiveLockDialog" class="modal victory-modal">
        <div class="project-lock-symbol">🔒</div><p class="eyebrow">Proyectivo bloqueado</p><h2>Primero domina las seis rutas</h2>
        <p>Completa los diez niveles <strong>Difíciles</strong> de cada una de las seis rutas para desbloquear el desafío final.</p>
        <div class="progress-card project-lock-dialog-progress"><span class="metric-label">Progreso</span><strong id="projectiveLockDialogText">0/60 niveles difíciles completados</strong><div class="progress-track"><span id="projectiveLockDialogBar"></span></div></div>
        <form method="dialog"><button class="primary-btn" style="width:100%;margin-top:14px;">Entendido</button></form>
      </dialog>
      <dialog id="projectiveUnlockDialog" class="modal victory-modal unlock-modal">
        <div class="unlock-mark">◇</div><p class="eyebrow">Nuevo modo disponible</p><h2>¡Desafío final desbloqueado!</h2>
        <p>Has dominado los niveles Difíciles de las seis rutas. Ya puedes entrar a <strong>Proyectivo</strong> y descubrir la geometría que estaba escondida detrás del juego.</p>
        <div class="modal-actions"><button id="unlockLaterBtn" class="secondary-btn">Más tarde</button><button id="unlockOpenBtn" class="primary-btn">Ir a Proyectivo</button></div>
      </dialog>
      <dialog id="ultraVictoryDialog" class="modal victory-modal"><div class="victory-mark">◇</div><p class="eyebrow">Ultraexperto completado</p><h2 id="ultraVictoryTitle">Dirección descubierta</h2><p id="ultraVictoryText"></p><div id="ultraFamilyGraphic" class="ultra-family-graphic"></div><p class="reward-message">Siete rectas más forman parte de tu construcción.</p><button id="ultraVictoryContinue" class="primary-btn" style="width:100%;">Continuar</button></dialog>
      <dialog id="credentialDialog" class="modal credential-modal"><div class="credential-card"><span class="sparkle s1">✦</span><span class="sparkle s2">✧</span><span class="sparkle s3">✦</span><span class="sparkle s4">✧</span><div class="credential-seal">PG(2,7)</div><div id="credentialStatus" class="credential-status">DISTINCIÓN MATEMÁTICA</div><h2>Trofeo Proyectivo</h2><div class="credential-subtitle">Creador de Planos Proyectivos</div><p class="credential-copy">Has completado los desafíos finales, reunido las ocho direcciones y revelado el plano proyectivo escondido detrás de Sudoproyective. Desde este momento eres oficialmente un <strong>Creador de Planos Proyectivos</strong>.</p><p class="credential-community">¡La comunidad matemática te envía sus felicitaciones!</p><p style="color:var(--muted);font-size:.75rem;margin-bottom:0;">49 puntos afines + 8 puntos del infinito · 57 puntos · 57 rectas</p></div><button id="credentialCloseBtn" class="secondary-btn credential-close">Cerrar</button></dialog>`);
  }
}
