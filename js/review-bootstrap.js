(() => {
  if (typeof window === 'undefined' || typeof location === 'undefined' || typeof Storage === 'undefined') return;

  const params = new URLSearchParams(location.search);
  if (params.get('review') !== '1') return;

  const STORAGE_KEY = 'sudoproyective-v02';
  const SHADOW_KEY = 'sudoproyective-review-shadow-v1';
  const native = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
    clear: Storage.prototype.clear,
  };

  const realValue = native.getItem.call(localStorage, STORAGE_KEY);
  if (native.getItem.call(sessionStorage, SHADOW_KEY) === null) {
    native.setItem.call(sessionStorage, SHADOW_KEY, realValue ?? '');
  }

  function getShadow() {
    const value = native.getItem.call(sessionStorage, SHADOW_KEY);
    return value === '' ? null : value;
  }

  function setShadow(value) {
    native.setItem.call(sessionStorage, SHADOW_KEY, value == null ? '' : String(value));
  }

  // Otros datos de la app (perfil y marcas de reinicio) también se aíslan:
  // ninguno de los controles de prueba puede escribir sobre el almacenamiento real.
  const EXTRA_PREFIX = 'sudoproyective-review-extra:';
  const EXTRA_INDEX_KEY = 'sudoproyective-review-extra-index';
  const EXTRA_CLEAR_KEY = 'sudoproyective-review-extra-cleared';
  const RESET_KEYS = new Set([
    'sudoproyectivo-reset-level-resume',
    'sudoproyectivo-total-reset-pending',
  ]);
  function isAppKey(key) {
    return typeof key === 'string' &&
      (key.startsWith('sudoproyective-') || key.startsWith('sudoproyectivo-'));
  }
  function extraIndex() {
    try { return JSON.parse(native.getItem.call(sessionStorage, EXTRA_INDEX_KEY) || '[]'); }
    catch { return []; }
  }
  function setExtraShadow(key, value) {
    native.setItem.call(sessionStorage, EXTRA_PREFIX + key, JSON.stringify(value == null ? null : String(value)));
    const keys = extraIndex();
    if (!keys.includes(key)) {
      keys.push(key);
      native.setItem.call(sessionStorage, EXTRA_INDEX_KEY, JSON.stringify(keys));
    }
  }
  function getExtraShadow(key) {
    const stored = native.getItem.call(sessionStorage, EXTRA_PREFIX + key);
    if (stored !== null) {
      try { return JSON.parse(stored); }
      catch { return null; }
    }
    const cleared = native.getItem.call(sessionStorage, EXTRA_CLEAR_KEY) === '1';
    const initial = cleared || RESET_KEYS.has(key) ? null : native.getItem.call(localStorage, key);
    setExtraShadow(key, initial);
    return initial;
  }

  Storage.prototype.getItem = function(key) {
    if (this === localStorage && key === STORAGE_KEY) return getShadow();
    if (this === localStorage && isAppKey(key)) return getExtraShadow(key);
    return native.getItem.call(this, key);
  };

  Storage.prototype.setItem = function(key, value) {
    if (this === localStorage && key === STORAGE_KEY) {
      setShadow(value);
      return;
    }
    if (this === localStorage && isAppKey(key)) {
      setExtraShadow(key, value);
      return;
    }
    return native.setItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function(key) {
    if (this === localStorage && key === STORAGE_KEY) {
      setShadow(null);
      return;
    }
    if (this === localStorage && isAppKey(key)) {
      setExtraShadow(key, null);
      return;
    }
    return native.removeItem.call(this, key);
  };

  Storage.prototype.clear = function() {
    if (this === localStorage) {
      setShadow(null);
      native.setItem.call(sessionStorage, EXTRA_CLEAR_KEY, '1');
      for (const key of extraIndex()) setExtraShadow(key, null);
      return;
    }
    return native.clear.call(this);
  };

  window.__SUDOP_REVIEW__ = true;
  window.__SUDOP_REVIEW_STORAGE__ = {
    key: STORAGE_KEY,
    read() {
      try { return JSON.parse(getShadow()) || {}; }
      catch { return {}; }
    },
    write(value) {
      setShadow(JSON.stringify(value || {}));
    },
    resetFromReal() {
      const currentReal = native.getItem.call(localStorage, STORAGE_KEY);
      setShadow(currentReal ?? '');
    },
    clearReview() {
      native.removeItem.call(sessionStorage, SHADOW_KEY);
    },
  };

  document.documentElement.classList.add('review-mode');
})();