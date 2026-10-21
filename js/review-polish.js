if (typeof window !== 'undefined' && window.__SUDOP_REVIEW__) {
  function completeAllDifficult() {
    const button = document.querySelector('[data-difficult="60"]');
    if (!button) return;
    button.click();
  }

  function injectQuickDifficultButtons() {
    const reviewDialog = document.querySelector('#reviewDialog');
    if (reviewDialog && !document.querySelector('#reviewCompleteAllDifficult')) {
      const section = [...reviewDialog.querySelectorAll('.review-section')]
        .find((item) => item.querySelector('h3')?.textContent.includes('Entrada Proyectivo'));
      if (section) {
        const button = document.createElement('button');
        button.id = 'reviewCompleteAllDifficult';
        button.className = 'review-btn primary';
        button.style.width = '100%';
        button.style.marginTop = '8px';
        button.textContent = '✓ Completar todos los niveles Difíciles (60/60)';
        button.addEventListener('click', completeAllDifficult);
        section.appendChild(button);
      }
    }

    const floating = document.querySelector('.review-floating-actions');
    if (floating && !document.querySelector('#reviewCompleteAllDifficultQuick')) {
      const button = document.createElement('button');
      button.id = 'reviewCompleteAllDifficultQuick';
      button.className = 'review-mini';
      button.textContent = '✓ 60 difíciles';
      button.title = 'Marcar temporalmente todos los niveles Difíciles como completados';
      button.addEventListener('click', completeAllDifficult);
      floating.appendChild(button);
    }
  }

  const observer = new MutationObserver(injectQuickDifficultButtons);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  injectQuickDifficultButtons();

  document.addEventListener('click', (event) => {
    const target = event.target.closest?.('button');
    if (!target) return;

    if (target.id === 'reviewCredentialLocked' || target.id === 'reviewCredentialEarned') {
      document.querySelector('#reviewDialog')?.close();
    }

    if (target.matches('[data-difficult]') && Number(target.dataset.difficult) < 60) {
      setTimeout(() => {
        const store = window.__SUDOP_REVIEW_STORAGE__;
        if (!store) return;
        const save = store.read();
        store.write({
          ...save,
          ultraCompleted: {},
          ultraLevels: {},
          projectiveCredential: false,
        });
        window.dispatchEvent(new CustomEvent('sudoproyective:projective-change'));
      }, 0);
    }
  }, true);
}
