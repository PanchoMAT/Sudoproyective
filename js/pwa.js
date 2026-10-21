const $ = (selector) => document.querySelector(selector);

let deferredInstallPrompt = null;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function ensureHeadMetadata() {
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = './manifest.webmanifest';
    document.head.appendChild(manifest);
  }

  if (!document.querySelector('link[rel="icon"][data-sudoproyectivo]')) {
    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/svg+xml';
    icon.href = './assets/icon-192.svg';
    icon.dataset.sudoproyectivo = '1';
    document.head.appendChild(icon);
  }

  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = './assets/icon-192.svg';
    document.head.appendChild(apple);
  }

  const metas = [
    ['apple-mobile-web-app-capable', 'yes'],
    ['apple-mobile-web-app-status-bar-style', 'black-translucent'],
    ['apple-mobile-web-app-title', 'SudoProyectivo'],
  ];
  for (const [name, content] of metas) {
    if (!document.querySelector(`meta[name="${name}"]`)) {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  }

  if (!document.querySelector('link[href="pwa.css"]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'pwa.css';
    document.head.appendChild(css);
  }
}

function ensureInstallUI() {
  const hub = $('#hubScreen');
  const rewards = $('#rewardsPanel');
  const nav = $('#mainNav');
  if (!hub || !rewards || !nav) return;

  if (!$('#installPanel')) {
    const panel = document.createElement('div');
    panel.id = 'installPanel';
    panel.className = 'tab-panel';
    panel.dataset.panel = 'install';
    panel.innerHTML = `
      <div class="hero-card install-hero">
        <div class="install-brand-row">
          <img class="install-app-icon" src="assets/icon-512.svg" alt="Icono de SudoProyectivo">
          <div>
            <p class="hero-kicker">Llévalo contigo</p>
            <h2>Instalar SudoProyectivo</h2>
            <p>Convierte este mismo juego en una app en tu dispositivo. Se abrirá desde su propio ícono y, después de la primera carga, podrá seguir funcionando incluso sin conexión.</p>
          </div>
        </div>
        <div id="installAppStatus" class="install-status waiting" role="status">Comprobando las opciones de instalación de este dispositivo…</div>
        <button id="installAppBtn" class="primary-btn" type="button" disabled>Preparando instalación…</button>
      </div>

      <div class="info-card">
        <strong>¿Qué cambia al instalarla?</strong>
        <div class="install-benefits">
          <div class="install-benefit"><span>⌂</span><div><strong>Ícono propio</strong><p>SudoProyectivo aparecerá junto a tus otras aplicaciones.</p></div></div>
          <div class="install-benefit"><span>▣</span><div><strong>Ventana independiente</strong><p>Se abre como app, sin la barra habitual del navegador cuando el sistema lo permite.</p></div></div>
          <div class="install-benefit"><span>↯</span><div><strong>Disponible sin conexión</strong><p>Los archivos principales quedan guardados localmente tras una primera carga correcta.</p></div></div>
        </div>
      </div>

      <div id="iosInstallHelp" class="info-card hidden">
        <strong>Instalar en iPhone o iPad</strong>
        <ol class="install-steps">
          <li>Toca el botón <strong>Compartir</strong> del navegador.</li>
          <li>Elige <strong>Añadir a pantalla de inicio</strong>.</li>
          <li>Confirma el nombre <strong>SudoProyectivo</strong> y toca <strong>Añadir</strong>.</li>
        </ol>
      </div>

      <div id="browserInstallHelp" class="info-card hidden">
        <strong>Si no aparece el botón de instalación</strong>
        <p>Busca en el menú de tu navegador una opción como <strong>Instalar aplicación</strong>, <strong>Instalar SudoProyectivo</strong> o <strong>Añadir a pantalla de inicio</strong>. El texto exacto depende del navegador y del sistema.</p>
      </div>

      <p class="install-small-note">La instalación no crea una segunda versión del juego: utiliza esta misma aplicación web. Las futuras mejoras publicadas seguirán llegando desde la misma dirección.</p>`;
    hub.insertBefore(panel, rewards);
  }

  if (!$('#installNavBtn')) {
    const button = document.createElement('button');
    button.id = 'installNavBtn';
    button.className = 'nav-btn';
    button.dataset.tab = 'install';
    button.innerHTML = '<span>⬇</span>Instalar';
    nav.appendChild(button);
  }
}

function setStatus(message, kind = 'waiting') {
  const status = $('#installAppStatus');
  if (!status) return;
  status.textContent = message;
  status.classList.remove('waiting', 'installed');
  if (kind) status.classList.add(kind);
}

function renderInstallState() {
  const button = $('#installAppBtn');
  const iosHelp = $('#iosInstallHelp');
  const browserHelp = $('#browserInstallHelp');
  if (!button || !iosHelp || !browserHelp) return;

  iosHelp.classList.add('hidden');
  browserHelp.classList.add('hidden');

  if (isStandalone()) {
    deferredInstallPrompt = null;
    button.disabled = true;
    button.textContent = '✓ SudoProyectivo ya está instalado';
    setStatus('Estás usando SudoProyectivo como aplicación instalada.', 'installed');
    return;
  }

  if (deferredInstallPrompt) {
    button.disabled = false;
    button.textContent = '⬇ Instalar SudoProyectivo';
    setStatus('Tu navegador permite instalar SudoProyectivo directamente desde este botón.', '');
    return;
  }

  if (isIOS()) {
    button.disabled = true;
    button.textContent = 'Instalación desde el menú Compartir';
    iosHelp.classList.remove('hidden');
    setStatus('En iPhone y iPad la instalación se hace desde el menú Compartir del navegador.', 'waiting');
    return;
  }

  button.disabled = true;
  button.textContent = 'Instalación desde el navegador';
  browserHelp.classList.remove('hidden');
  setStatus('SudoProyectivo está preparado como app. Si tu navegador no muestra instalación directa, usa su menú.', 'waiting');
}

async function promptInstall() {
  if (!deferredInstallPrompt) return;
  const event = deferredInstallPrompt;
  deferredInstallPrompt = null;
  await event.prompt();
  renderInstallState();
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
    await navigator.serviceWorker.ready;
  } catch (error) {
    console.warn('No se pudo activar el modo offline de SudoProyectivo', error);
  }
}

if (typeof document !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    renderInstallState();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    renderInstallState();
  });

  ensureHeadMetadata();
  ensureInstallUI();
  $('#installAppBtn')?.addEventListener('click', promptInstall);
  renderInstallState();
  registerServiceWorker();
}
