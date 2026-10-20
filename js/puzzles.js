const raw = [
{"id":"level-01","number":1,"name":"Primer cruce","difficulty":"Iniciación","subtitle":"15 casillas por completar","unlockStars":0,"hiddenSingles":0,"p":"0754361061200475000126120543503612012750000360275","s":"2754361361275475436126127543543612712754364361275"},
{"id":"level-02","number":2,"name":"El borde continúa","difficulty":"Iniciación","subtitle":"17 casillas por completar","unlockStars":1,"hiddenSingles":0,"p":"1020536030140702753013610275275000001427537530000","s":"1427536536142742753613614275275361461427537536142"},
{"id":"level-03","number":3,"name":"Ruta visible","difficulty":"Iniciación","subtitle":"19 casillas por completar","unlockStars":2,"hiddenSingles":0,"p":"4600050172504625340070061700607203070534600040172","s":"4617253172534625346173461725617253472534615346172"},
{"id":"level-04","number":4,"name":"Tres miradas","difficulty":"Iniciación","subtitle":"21 casillas por completar","unlockStars":3,"hiddenSingles":0,"p":"0260010000207500140002600143432605051430676700402","s":"3267514143267575143262675143432675151432676751432"},
{"id":"level-05","number":5,"name":"Vuelta completa","difficulty":"Iniciación","subtitle":"23 casillas por completar","unlockStars":4,"hiddenSingles":0,"p":"2500600573040203601203040207000250040257001200360","s":"2573641573641273641253641257641257341257361257364"},
{"id":"level-06","number":6,"name":"Primer viaje","difficulty":"Iniciación","subtitle":"25 casillas por completar","unlockStars":5,"hiddenSingles":0,"p":"0000013700013000013270013070403070500276000276041","s":"2765413765413265413275413276413276513276543276541"},
{"id":"level-07","number":7,"name":"Cruce oculto","difficulty":"Intermedio","subtitle":"26 casillas por completar","unlockStars":7,"hiddenSingles":4,"p":"0210040046501001074054000137107400000010040740001","s":"5213746746521321374654652137137465265213743746521"},
{"id":"level-08","number":8,"name":"Pocas señales","difficulty":"Intermedio","subtitle":"27 casillas por completar","unlockStars":9,"hiddenSingles":5,"p":"0051340251340000346001300000000020106020100025100","s":"7251346251346751346721346725346725146725136725134"},
{"id":"level-09","number":9,"name":"Entre bordes","difficulty":"Intermedio","subtitle":"28 casillas por completar","unlockStars":11,"hiddenSingles":6,"p":"0406000600320000006507600024000476047600320000406","s":"2476513651324732476517651324132476547651325132476"},
{"id":"level-10","number":10,"name":"Ruta decisiva","difficulty":"Intermedio","subtitle":"29 casillas por completar","unlockStars":13,"hiddenSingles":6,"p":"7002060006300007010501250000000012501050375030000","s":"7412563256374137412561256374637412541256375637412"},
{"id":"level-11","number":11,"name":"Nudo afín","difficulty":"Intermedio","subtitle":"30 casillas por completar","unlockStars":15,"hiddenSingles":6,"p":"0075010540062706005010500002100200020000060006070","s":"6275413541362736275417541362136275427541364136275"},
{"id":"level-12","number":12,"name":"Travesía","difficulty":"Intermedio","subtitle":"31 casillas por completar","unlockStars":17,"hiddenSingles":7,"p":"0300107000300000000043401070703420010053400010000","s":"5342167675342121675343421675753421616753424216753"},
{"id":"level-13","number":13,"name":"Sin atajos","difficulty":"Avanzado","subtitle":"32 casillas por completar","unlockStars":20,"hiddenSingles":9,"p":"4507030020000027000000631400031002001000700400000","s":"4527631527631427631457631452631452731452761452763"},
{"id":"level-14","number":14,"name":"Siete pasos","difficulty":"Avanzado","subtitle":"33 casillas por completar","unlockStars":23,"hiddenSingles":10,"p":"0400216200000000001001004070070000000050217210000","s":"3457216216345745721631634572572163463457217216345"},
{"id":"level-15","number":15,"name":"Punto de giro","difficulty":"Avanzado","subtitle":"34 casillas por completar","unlockStars":26,"hiddenSingles":10,"p":"0040000240010043010023600500010000300004000500000","s":"5243617243617543617523617524617524317524367524361"},
{"id":"level-16","number":16,"name":"Geometría fina","difficulty":"Avanzado","subtitle":"35 casillas por completar","unlockStars":29,"hiddenSingles":12,"p":"3000060002000020400700300500000204000040006030002","s":"3175264752643126431754317526175264352643176431752"},
{"id":"level-17","number":17,"name":"Ruta maestra","difficulty":"Avanzado","subtitle":"35 casillas por completar","unlockStars":32,"hiddenSingles":11,"p":"2000000040502100600040000000104000207062000001000","s":"2134756347562175621346213475134756247562135621347"},
{"id":"level-18","number":18,"name":"Horizonte","difficulty":"Avanzado","subtitle":"36 casillas por completar","unlockStars":35,"hiddenSingles":12,"p":"0000000000510000000000010067504060304000000260050","s":"2673514673514273514263514267514267314267354267351"},
{"id":"level-19","number":19,"name":"Primer salto","difficulty":"Exploración","subtitle":"18 casillas por completar","unlockStars":36,"world":2,"slope":2,"p":"0034567200567134567004507000567120460123407000050","s":"1234567234567134567124567123567123467123457123456"},
{"id":"level-20","number":20,"name":"Doble paso","difficulty":"Exploración","subtitle":"23 casillas por completar","unlockStars":37,"world":2,"slope":2,"p":"4010570502401001300207200130005004004003503072461","s":"4613572572461361357247246135135724624613573572461"},
{"id":"level-21","number":21,"name":"Borde veloz","difficulty":"Dominio","subtitle":"29 casillas por completar","unlockStars":39,"world":2,"slope":2,"p":"0306000050160000000604270016642003000000003004275","s":"5316427753164227531644275316642753116427533164275"},
{"id":"level-22","number":22,"name":"Cruce de dos","difficulty":"Dominio","subtitle":"32 casillas por completar","unlockStars":42,"world":2,"slope":2,"p":"0600070000000361307207200030000000604600070002400","s":"4613572572461361357247246135135724624613573572461"},
{"id":"level-23","number":23,"name":"Vuelta doble","difficulty":"Desafío","subtitle":"33 casillas por completar","unlockStars":45,"world":2,"slope":2,"p":"0020006000003000560120030060001030000001002045001","s":"7123456567123434567121234567671234545671232345671"},
{"id":"level-24","number":24,"name":"Segunda dirección","difficulty":"Desafío","subtitle":"33 casillas por completar","unlockStars":48,"world":2,"slope":2,"p":"0700603007040003000000000004400350000003577000130","s":"5724613357246113572466135724461357224613577246135"}
];

function parseGrid(text) {
  return Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: 7 }, (_, col) => Number(text[row * 7 + col]))
  );
}

export const LEVELS = raw.map(({ p, s, ...meta }) => ({
  world: 1,
  slope: 1,
  ...meta,
  slopes: [meta.slope || 1],
  puzzle: parseGrid(p),
  solution: parseGrid(s),
}));

export const WORLDS = [
  {
    id: 1,
    name: 'Dirección 1',
    kicker: 'Mundo 1 · ruta base',
    description: 'La ruta avanza una casilla al desplazarse una columna. Es la geometría con la que comienza Sudoproyective.',
    groups: ['Iniciación', 'Intermedio', 'Avanzado'],
  },
  {
    id: 2,
    name: 'Dirección 2',
    kicker: 'Mundo 2 · salto 2',
    description: 'Ahora la ruta avanza dos casillas verticalmente por cada columna. Sigue siendo una recta en F₇, pero se ve y se juega distinto.',
    groups: ['Exploración', 'Dominio', 'Desafío'],
  },
];

export const DIFFICULTIES = WORLDS.flatMap((world) => world.groups);
