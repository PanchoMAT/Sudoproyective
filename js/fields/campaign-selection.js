// Selección de campañas compactas (2026-11):
// se conserva cada puzzle por su índice ORIGINAL, sin modificar el ID de guardado.
// Criterio: menor cantidad de deducciones inmediatas y mayor trabajo en
// propagación de candidatos (singles explícitos e implícitos). En los empates
// matemáticamente equivalentes se prefieren los niveles históricos posteriores.
// El orden de cada grupo va de menor a mayor complejidad estimada.
// Las tablas antiguas completas permanecen en data.js para preservar las marcas.
export const SHORT_CAMPAIGN_SELECTION = Object.freeze({
  3: [
    [[3,4,5], [8,9,10], [13,14,15]],   // Ruta 1
    [[3,4,5], [7,8,9], [12,14,15]],    // Ruta 2
  ],
  5: [
    [[2,7,3,4,5], [10,9,14,13,12], [16,19,20,21,15]], // Ruta 1
    [[2,3,5,6,7], [13,12,8,14,10], [20,21,15,18,17]], // Ruta 2
    [[6,7,4,5,2], [12,9,14,11,8], [21,16,18,20,15]],  // Ruta 3
    [[6,5,7,1,3], [14,11,10,9,8], [16,20,21,18,17]],  // Ruta 4
  ],
});

export function selectedCampaignRows(p, rawRows, config) {
  const selected = SHORT_CAMPAIGN_SELECTION[p];
  if (!selected) return rawRows.map((row) => ({
    row, localNumber: row[2], legacyLocalNumber: row[2],
  }));

  if (selected.length !== config.routeCount) {
    throw new Error('Cantidad de rutas inválida en selección F' + p);
  }

  const originalByPosition = new Map(rawRows.map((row) => [row[1] + ':' + row[2], row]));
  const result = [];
  for (let routeIndex = 0; routeIndex < selected.length; routeIndex++) {
    const groups = selected[routeIndex];
    if (groups.length !== 3) throw new Error('Dificultades incompletas de F' + p);
    const slope = routeIndex + 1;
    for (let group = 0; group < 3; group++) {
      const indices = groups[group];
      if (indices.length !== config.perDifficulty || new Set(indices).size !== indices.length) {
        throw new Error('Selección inválida para F' + p + ', ruta ' + slope);
      }
      for (let i = 0; i < indices.length; i++) {
        const legacyLocalNumber = indices[i];
        const row = originalByPosition.get(slope + ':' + legacyLocalNumber);
        if (!row || row[3] !== group) {
          throw new Error('Puzzle histórico no encontrado en F' + p + ': ' + slope + '/' + legacyLocalNumber);
        }
        result.push({
          row, localNumber: group * config.perDifficulty + i + 1, legacyLocalNumber,
        });
      }
    }
  }
  return result;
}
