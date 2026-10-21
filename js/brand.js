export const BRAND_NAME = 'SudoProyectivo';
export const LEGACY_BRAND_NAME = 'Sudoproyective';
export const APP_VERSION = '1.0';
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
  const expected = `${BRAND_NAME} v${APP_VERSION} · ${COPYRIGHT_NOTICE}`;
  if (footer.textContent !== expected) footer.textContent = expected;
}

function applyVisibleBrand() {
  if (typeof document === 'undefined') return;

  const expectedTitle = `${BRAND_NAME} · v${APP_VERSION}`;
  if (document.title !== expectedTitle) document.title = expectedTitle;

  const heading = document.querySelector('.topbar h1');
  if (heading && heading.textContent !== BRAND_NAME) heading.textContent = BRAND_NAME;

  const version = document.querySelector('.topbar .eyebrow');
  if (version && version.textContent !== `Versión ${APP_VERSION}`) version.textContent = `Versión ${APP_VERSION}`;

  const description = document.querySelector('meta[name="description"]');
  const expectedDescription = `${BRAND_NAME} — puzzle matemático inspirado en geometría afín y proyectiva finita.`;
  if (description && description.content !== expectedDescription) description.content = expectedDescription;

  replaceTextNodes(document.body);
  ensureCopyrightFooter();
}

if (typeof document !== 'undefined') {
  applyVisibleBrand();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        replaceTextNodes(mutation.target);
        continue;
      }
      if (mutation.type === 'attributes') {
        if (mutation.target instanceof HTMLMetaElement && mutation.target.content.includes(LEGACY_BRAND_NAME)) {
          mutation.target.content = replaceBrand(mutation.target.content);
        }
        continue;
      }
      mutation.addedNodes.forEach(replaceTextNodes);
    }

    const expectedTitle = `${BRAND_NAME} · v${APP_VERSION}`;
    if (document.title !== expectedTitle) document.title = expectedTitle;
    const heading = document.querySelector('.topbar h1');
    if (heading && heading.textContent !== BRAND_NAME) heading.textContent = BRAND_NAME;
    const version = document.querySelector('.topbar .eyebrow');
    if (version && version.textContent !== `Versión ${APP_VERSION}`) version.textContent = `Versión ${APP_VERSION}`;
    ensureCopyrightFooter();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['content'],
  });
}
