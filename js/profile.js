const PROFILE_KEY = 'sudoproyectivo-profile-v1';

function clean(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export function profileDisplayName(profile = {}) {
  const name = clean(profile.name, 40);
  const nickname = clean(profile.nickname, 24);
  return name || nickname || 'Jugador';
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

function saveProfile(next) {
  profile = {
    name: clean(next.name, 40),
    nickname: clean(next.nickname, 24),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  refreshProfileUI();
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
          <input id="profileNickname" type="text" maxlength="24" autocomplete="nickname" placeholder="Ej.: PanchoMAT">
        </div>

        <div class="profile-preview-card">
          <span>Así aparecerás en tu certificado</span>
          <strong id="profilePreviewName">Jugador</strong>
          <small>Se usa primero el nombre; si está vacío, el apodo; y si no completas ninguno, aparecerá “Jugador”.</small>
        </div>

        <div class="profile-actions">
          <button id="saveProfileBtn" class="primary-btn" type="button">Guardar perfil</button>
          <button id="clearProfileBtn" class="secondary-btn" type="button">Usar “Jugador”</button>
        </div>
        <div id="profileSavedStatus" class="profile-saved-status" role="status" aria-live="polite"></div>
      </div>

      <div class="info-card">
        <strong>Un detalle personal al final</strong>
        <p>Cuando completes la construcción de <strong>PG(2,7)</strong>, el Trofeo Proyectivo mostrará tu identidad elegida. Puedes cambiarla cuando quieras y el certificado se actualizará.</p>
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
}

function refreshProfileUI() {
  const nameInput = document.querySelector('#profileName');
  const nicknameInput = document.querySelector('#profileNickname');
  const preview = document.querySelector('#profilePreviewName');
  if (nameInput && document.activeElement !== nameInput) nameInput.value = profile.name;
  if (nicknameInput && document.activeElement !== nicknameInput) nicknameInput.value = profile.nickname;
  if (preview) preview.textContent = profileDisplayName(profile);
}

function refreshLivePreview() {
  const preview = document.querySelector('#profilePreviewName');
  if (!preview) return;
  preview.textContent = profileDisplayName({
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

function initProfile() {
  profile = loadProfile();
  ensureProfileUI();
  refreshProfileUI();

  document.querySelector('#profileName')?.addEventListener('input', refreshLivePreview);
  document.querySelector('#profileNickname')?.addEventListener('input', refreshLivePreview);

  document.querySelector('#saveProfileBtn')?.addEventListener('click', () => {
    saveProfile({
      name: document.querySelector('#profileName')?.value || '',
      nickname: document.querySelector('#profileNickname')?.value || '',
    });
    showSavedStatus(`✓ Perfil guardado como ${profileDisplayName(profile)}.`);
  });

  document.querySelector('#clearProfileBtn')?.addEventListener('click', () => {
    saveProfile({ name: '', nickname: '' });
    const nameInput = document.querySelector('#profileName');
    const nicknameInput = document.querySelector('#profileNickname');
    if (nameInput) nameInput.value = '';
    if (nicknameInput) nicknameInput.value = '';
    refreshLivePreview();
    showSavedStatus('✓ El certificado mostrará “Jugador”.');
  });

  // El diálogo del certificado se crea más tarde. Cualquier acción que lo abra
  // pasa por un clic, así que actualizamos la identidad justo antes de sus handlers.
  document.addEventListener('click', refreshCredentialIdentity, true);

  window.__SUDOP_PROFILE__ = {
    displayName: () => profileDisplayName(profile),
    getProfile: () => ({ ...profile }),
    refreshCredential: refreshCredentialIdentity,
  };
}

if (typeof document !== 'undefined') initProfile();
