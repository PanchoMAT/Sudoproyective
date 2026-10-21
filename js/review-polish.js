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

  function injectV08ReviewControls() {
    const reviewDialog = document.querySelector('#reviewDialog');
    if (!reviewDialog) return;

    if (!document.querySelector('#reviewUltraRevealPreviews')) {
      const section = [...reviewDialog.querySelectorAll('.review-section')]
        .find((item) => item.querySelector('h3')?.textContent.includes('Ultraexperto'));
      if (section) {
        const block = document.createElement('div');
        block.id = 'reviewUltraRevealPreviews';
        block.style.marginTop = '12px';
        block.innerHTML = `
          <p style="color:var(--muted);font-size:.78rem;margin:0 0 8px;">Vista directa de la nueva transición sudoku → puntos → rectas → P<sub>N</sub>.</p>
          <div class="review-grid three">
            ${Array.from({length:6},(_,i)=>`<button class="review-btn" data-preview-ultra="${i+1}">Revelación Ruta ${i+1}</button>`).join('')}
          </div>`;
        section.appendChild(block);
      }
    }

    if (!document.querySelector('#reviewFinalCelebration')) {
      const section = [...reviewDialog.querySelectorAll('.review-section')]
        .find((item) => item.querySelector('h3')?.textContent.includes('Construcción circular'));
      if (section) {
        const button = document.createElement('button');
        button.id = 'reviewFinalCelebration';
        button.className = 'review-btn warn';
        button.style.width = '100%';
        button.style.marginTop = '8px';
        button.textContent = '🎉 Ver celebración final';
        section.appendChild(button);
      }
    }
  }

  const observer = new MutationObserver(() => {
    injectQuickDifficultButtons();
    injectV08ReviewControls();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  injectQuickDifficultButtons();
  injectV08ReviewControls();

  document.addEventListener('click', (event) => {
    const target = event.target.closest?.('button');
    if (!target) return;

    if (target.id === 'reviewCredentialLocked' || target.id === 'reviewCredentialEarned') {
      document.querySelector('#reviewDialog')?.close();
    }

    if (target.matches('[data-preview-ultra]')) {
      document.querySelector('#reviewDialog')?.close();
      window.__SUDOP_ULTRA_REVEAL__?.preview(Number(target.dataset.previewUltra));
      return;
    }

    if (target.id === 'reviewFinalCelebration') {
      document.querySelector('#reviewDialog')?.close();
      window.__SUDOP_PROJECTIVE__?.showCelebration();
      return;
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
          projectiveFinalRewardUnlocked: false,
        });
        window.dispatchEvent(new CustomEvent('sudoproyective:projective-change'));
      }, 0);
    }

    if (target.id === 'reviewUltraNone' || target.id === 'reviewCredentialLocked') {
      setTimeout(() => {
        const store = window.__SUDOP_REVIEW_STORAGE__;
        if (!store) return;
        const save = store.read();
        store.write({ ...save, projectiveFinalRewardUnlocked: false });
        window.dispatchEvent(new CustomEvent('sudoproyective:projective-change'));
      }, 0);
    }
  }, true);
}
