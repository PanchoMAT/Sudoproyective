export const BRAND_NAME = 'SudoProyectivo';
export const LEGACY_BRAND_NAME = 'Sudoproyective';

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

function applyVisibleBrand() {
  if (typeof document === 'undefined') return;

  if (document.title.includes(LEGACY_BRAND_NAME)) document.title = replaceBrand(document.title);

  const heading = document.querySelector('.topbar h1');
  if (heading && heading.textContent !== BRAND_NAME) heading.textContent = BRAND_NAME;

  const description = document.querySelector('meta[name="description"]');
  if (description?.content?.includes(LEGACY_BRAND_NAME)) description.content = replaceBrand(description.content);

  replaceTextNodes(document.body);
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

    if (document.title.includes(LEGACY_BRAND_NAME)) document.title = replaceBrand(document.title);
    const heading = document.querySelector('.topbar h1');
    if (heading && heading.textContent !== BRAND_NAME) heading.textContent = BRAND_NAME;
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['content'],
  });
}
