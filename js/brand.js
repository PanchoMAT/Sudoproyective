import './reset-controls.js';

export const BRAND_NAME = 'SudoProyectivo';
export const LEGACY_BRAND_NAME = 'Sudoproyective';
export const APP_VERSION = '1.1.7';
export const COPYRIGHT_NOTICE = '© 2026 Francisco Alegría M. · Todos los derechos reservados.';

function replaceBrand(text) {
  return typeof text === 'string' ? text.replaceAll(LEGACY_BRAND_NAME, BRAND_NAME) : text;
}

function replaceTextNodes(root) {
  if (!root || typeof document === 'undefined') return;
  if (root.nodeType === Node.TEXT_NODE) {
    if (root.nodeValue?.includes(LEGACY_BRAND_NAME)) root.nodeValue = replaceBrand(root.nodeValue);
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue?.includes(LEGACY_BRAND_NAME)) node.nodeValue = replaceBrand(node.nodeValue);
  }
}

function ensureCopyrightFooter() {
  if (typeof document === 'undefined' || !document.body) return;
  let footer = document.querySelector('#copyrightFooter');
  if (!footer) {
    footer = document.createElement('footer');
    footer.id = 'copyrightFooter';
    footer.setAttribute('aria-label', 'Autoría y derechos');
    footer.style.cssText = [
      'max-width:760px',
      'margin:22px auto 92px',
      'padding:14px 18px',
      'text-align:center',
      'font-size:.78rem',
      'line-height:1.5',
      'color:#8f9caf',
      'border-top:1px solid rgba(255,255,255,.08)'
    ].join(';');
    document.body.appendChild(footer);
  }
  const desired = `${BRAND_NAME} v${APP_VERSION} · ${COPYRIGHT_NOTICE}`;
  if (footer.textContent !== desired) footer.textContent = desired;
}

function applyVisibleBrand() {
  if (typeof document === 'undefined') return;

  document.title = `${BRAND_NAME} · v${APP_VERSION}`;

  const heading = document.querySelector('.topbar h1');
  if (heading) heading.textContent = BRAND_NAME;

  const version = document.querySelector('.topbar .eyebrow');
  if (version) version.textContent = `Versión ${APP_VERSION}`;

  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = `${BRAND_NAME} — puzzle matemático inspirado en geometría afín y proyectiva finita.`;

  replaceTextNodes(document.body);
  ensureCopyrightFooter();
}

if (typeof document !== 'undefined') {
  applyVisibleBrand();
  // Algunos módulos de la fase proyectiva se cargan después del arranque y aún
  // contienen etiquetas históricas. Estas reaplicaciones son puntuales, no observadores.
  setTimeout(applyVisibleBrand, 120);
  setTimeout(applyVisibleBrand, 900);
}
