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

  Storage.prototype.getItem = function(key) {
    if (this === localStorage && key === STORAGE_KEY) return getShadow();
    return native.getItem.call(this, key);
  };

  Storage.prototype.setItem = function(key, value) {
    if (this === localStorage && key === STORAGE_KEY) {
      setShadow(value);
      return;
    }
    return native.setItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function(key) {
    if (this === localStorage && key === STORAGE_KEY) {
      setShadow(null);
      return;
    }
    return native.removeItem.call(this, key);
  };

  Storage.prototype.clear = function() {
    if (this === localStorage) {
      setShadow(null);
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