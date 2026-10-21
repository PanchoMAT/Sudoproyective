if (typeof window !== 'undefined' && window.__SUDOP_REVIEW__) {
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
