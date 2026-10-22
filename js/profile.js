const PROFILE_KEY = 'sudoproyectivo-profile-v1';

function clean(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export function profileDisplayName(profile = {}) {
  const name = clean(profile.name, 40);
  const nickname = clean(profile.nickname, 24);
  return name || nickname || 'Jugador';
}

export function profileGreetingName(profile = {}) {
  const nickname = clean(profile.nickname, 24);
  const name = clean(profile.name, 40);
  if (nickname) return nickname;
  if (name) return name.split(/\s+/)[0];
  return 'Jugador';
}

export function profileHasIdentity(profile = {}) {
  return Boolean(clean(profile.name, 40) || clean(profile.nickname, 24));
}

function loadProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
    return {
      name: clean(raw.name, 40),
      nickname: clean(raw.nickname, 24),
    };
  } catch {
    return { name: '', nickname: '' };
  }
}

let profile = { name: '', nickname: '' };
let allowCertificateOnce = false;
let pendingCredentialButton = null;

function saveProfile(next) {
  profile = {
    name: clean(next.name, 40),
    nickname: clean(next.nickname, 24),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  refreshProfileUI();
  refreshJourneyTitle();
  refreshCredentialIdentity();
  window.dispatchEvent(new CustomEvent('sudoproyectivo:profilechange', { detail: { ...profile } }));
}

function ensureProfileUI() {
  if (!document.querySelector('link[href="profile.css"]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'profile.css';
    document.head.appendChild(css);
  }

  const hub = document.querySelector('#hubScreen');
  const rewards = document.querySelector('#rewardsPanel');
  const nav = document.querySelector('#mainNav');
  if (!hub || !rewards || !nav) return;

  if (!document.querySelector('#profilePanel')) {
    const panel = document.createElement('div');
    panel.id = 'profilePanel';
    panel.className = 'tab-panel';
    panel.dataset.panel = 'profile';
    panel.innerHTML = `
      <div class="hero-card profile-hero">
        <div class="profile-heading-row">
          <div class="profile-avatar" aria-hidden="true">♙</div>
          <div>
            <p class="hero-kicker">Tu identidad en el juego</p>
            <h2>Perfil</h2>
            <p>Tu perfil es opcional y se guarda solamente en este dispositivo. No necesitas crear una cuenta.</p>
          </div>
        </div>

        <div class="profile-form">
          <label for="profileName">Nombre</label>
          <input id="profileName" type="text" maxlength="40" autocomplete="name" placeholder="Ej.: Francisco Alegría">

          <label for="profileNickname">Apodo</label>
          <input id="profileNickname" type="text" maxlength="24" autocomplete="nickname" placeholder="Ej.: Pancho">
        </div>

        <div class="profile-preview-card">
          <span>SudoProyectivo se referirá a ti como</span>
          <strong id="profilePreviewName">Jugador</strong>
          <small>Si escribes un apodo, lo usaremos para personalizar el juego. Si no, usaremos tu nombre.</small>
        </div>

        <div class="profile-actions">
          <button id="saveProfileBtn" class="primary-btn" type="button">Guardar perfil</button>
          <button id="clearProfileBtn" class="secondary-btn" type="button">Usar “Jugador”</button>
        </div>
        <div id="profileSavedStatus" class="profile-saved-status" role="status" aria-live="polite"></div>
      </div>

      <div class="info-card">
        <strong>Tu juego, un poco más personal</strong>
        <p>Puedes cambiar tu nombre o apodo cuando quieras. SudoProyectivo lo utilizará en saludos y mensajes personales sin crear una cuenta ni enviar estos datos a ningún servidor.</p>
      </div>`;
    hub.insertBefore(panel, rewards);
  }

  if (!document.querySelector('#profileNavBtn')) {
    const button = document.createElement('button');
    button.id = 'profileNavBtn';
    button.className = 'nav-btn';
    button.dataset.tab = 'profile';
    button.innerHTML = '<span>♙</span>Perfil';
    const installButton = document.querySelector('#installNavBtn');
    nav.insertBefore(button, installButton || null);
  }

  if (!document.querySelector('#certificateIdentityDialog')) {
    document.body.insertAdjacentHTML('beforeend', `
      <dialog id="certificateIdentityDialog" class="modal certificate-identity-modal">
        <p class="eyebrow">Un último detalle</p>
        <h2>¿Cómo quieres aparecer?</h2>
        <p>Hasta ahora juegas como <strong>Jugador</strong>. Si quieres, escribe un nombre o apodo para personalizar tu distinción. También puedes continuar como Jugador.</p>
        <label for="certificateIdentityInput">Nombre o apodo</label>
        <input id="certificateIdentityInput" type="text" maxlength="40" placeholder="Ej.: Pancho">
        <div class="modal-actions certificate-identity-actions">
          <button id="certificateUsePlayerBtn" class="secondary-btn" type="button">Continuar como Jugador</button>
          <button id="certificateSaveIdentityBtn" class="primary-btn" type="button">Guardar y continuar</button>
        </div>
      </dialog>`);
  }
}

function refreshJourneyTitle() {
  const title = document.querySelector('#levelsPanel .compact-hero h2');
  if (!title) return;
  title.textContent = profileHasIdentity(profile)
    ? `Tu recorrido, ${profileGreetingName(profile)}`
    : 'Tu recorrido';
}

function refreshProfileUI() {
  const nameInput = document.querySelector('#profileName');
  const nicknameInput = document.querySelector('#profileNickname');
  const preview = document.querySelector('#profilePreviewName');
  if (nameInput && document.activeElement !== nameInput) nameInput.value = profile.name;
  if (nicknameInput && document.activeElement !== nicknameInput) nicknameInput.value = profile.nickname;
  if (preview) preview.textContent = profileGreetingName(profile);
}

function refreshLivePreview() {
  const preview = document.querySelector('#profilePreviewName');
  if (!preview) return;
  preview.textContent = profileGreetingName({
    name: document.querySelector('#profileName')?.value || '',
    nickname: document.querySelector('#profileNickname')?.value || '',
  });
}

function showSavedStatus(message) {
  const status = document.querySelector('#profileSavedStatus');
  if (!status) return;
  status.textContent = message;
  clearTimeout(showSavedStatus.timer);
  showSavedStatus.timer = setTimeout(() => {
    if (status.textContent === message) status.textContent = '';
  }, 2600);
}

export function refreshCredentialIdentity() {
  const card = document.querySelector('#credentialDialog .credential-card');
  if (!card) return;

  let player = card.querySelector('#credentialPlayerIdentity');
  if (!player) {
    player = document.createElement('div');
    player.id = 'credentialPlayerIdentity';
    player.className = 'credential-player-identity';
    const subtitle = card.querySelector('.credential-subtitle');
    subtitle?.insertAdjacentElement('afterend', player);
  }
  player.textContent = profileDisplayName(profile);

  const copy = card.querySelector('.credential-copy');
  if (copy?.textContent.includes('Sudoproyective')) {
    copy.innerHTML = copy.innerHTML.replaceAll('Sudoproyective', 'SudoProyectivo');
  }
}

function continueToCredential() {
  const button = pendingCredentialButton;
  pendingCredentialButton = null;
  allowCertificateOnce = true;
  document.querySelector('#certificateIdentityDialog')?.close();
  requestAnimationFrame(() => button?.click());
}

function interceptFirstCredential(event) {
  const button = event.target.closest?.('#awardCredentialBtn');
  if (!button || button.disabled) return;
  if (!String(button.textContent).includes('Obtener certificado')) return;
  if (profileHasIdentity(profile) || allowCertificateOnce) {
    allowCertificateOnce = false;
    refreshCredentialIdentity();
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  pendingCredentialButton = button;
  const input = document.querySelector('#certificateIdentityInput');
  if (input) input.value = '';
  document.querySelector('#certificateIdentityDialog')?.showModal();
  setTimeout(() => input?.focus(), 80);
}

function initProfile() {
  profile = loadProfile();
  ensureProfileUI();
  refreshProfileUI();
  refreshJourneyTitle();

  document.querySelector('#profileName')?.addEventListener('input', refreshLivePreview);
  document.querySelector('#profileNickname')?.addEventListener('input', refreshLivePreview);

  document.querySelector('#saveProfileBtn')?.addEventListener('click', () => {
    saveProfile({
      name: document.querySelector('#profileName')?.value || '',
      nickname: document.querySelector('#profileNickname')?.value || '',
    });
    showSavedStatus(`✓ Perfil guardado. SudoProyectivo te llamará ${profileGreetingName(profile)}.`);
  });

  document.querySelector('#clearProfileBtn')?.addEventListener('click', () => {
    saveProfile({ name: '', nickname: '' });
    const nameInput = document.querySelector('#profileName');
    const nicknameInput = document.querySelector('#profileNickname');
    if (nameInput) nameInput.value = '';
    if (nicknameInput) nicknameInput.value = '';
    refreshLivePreview();
    showSavedStatus('✓ Volverás a aparecer como Jugador.');
  });

  document.querySelector('#certificateUsePlayerBtn')?.addEventListener('click', continueToCredential);
  document.querySelector('#certificateSaveIdentityBtn')?.addEventListener('click', () => {
    const value = clean(document.querySelector('#certificateIdentityInput')?.value || '', 40);
    if (value) saveProfile({ name: value, nickname: '' });
    continueToCredential();
  });
  document.querySelector('#certificateIdentityInput')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') document.querySelector('#certificateSaveIdentityBtn')?.click();
  });

  // Capturamos únicamente el primer intento de obtener la distinción, cuando aún
  // no existe identidad. De este modo Perfil no revela anticipadamente el premio.
  document.addEventListener('click', interceptFirstCredential, true);
  document.addEventListener('click', refreshCredentialIdentity, true);

  window.__SUDOP_PROFILE__ = {
    displayName: () => profileDisplayName(profile),
    greetingName: () => profileGreetingName(profile),
    hasIdentity: () => profileHasIdentity(profile),
    getProfile: () => ({ ...profile }),
    refreshCredential: refreshCredentialIdentity,
  };
}

if (typeof document !== 'undefined') initProfile();
