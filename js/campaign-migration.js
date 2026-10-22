const STORAGE_KEY = 'sudoproyective-v02';
const CAMPAIGN_REVISION = 2;

// La v1.1.0 reemplaza las soluciones de los 180 niveles para eliminar una
// regularidad afín accidental. Se conservan estrellas, trofeos, saldo,
// progreso proyectivo y preferencias. Sólo se descartan tableros normales
// que estuvieran a medio resolver con la campaña anterior.
if (typeof localStorage !== 'undefined') {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    if (Number(raw.campaignRevision || 1) < CAMPAIGN_REVISION) {
      raw.levels = {};
      raw.campaignRevision = CAMPAIGN_REVISION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    }
  } catch {
    // Si el almacenamiento previo no se puede leer, el motor principal ya
    // dispone de su propia recuperación segura mediante freshSave().
  }
}

export const campaignRevision = CAMPAIGN_REVISION;
