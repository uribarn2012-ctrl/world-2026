// Sample country data for testing "עולם 2026" until countries-data.js exists.
// Same schema as countries-data.js. Numbers are rough placeholders.
window.COUNTRY_DATA = {
  "376": { en:"Israel", he:"ישראל", pop:10.1, gdp:540, def:30, mil:170, nukes:90, gov:"democracy", blocs:[], approval:52 },
  "364": { en:"Iran", he:"איראן", pop:91, gdp:400, def:10, mil:610, nukes:0, gov:"authoritarian", blocs:["SCO","BRICS"], approval:35 },
  "840": { en:"United States", he:"ארה״ב", pop:342, gdp:30000, def:900, mil:1320, nukes:3700, gov:"democracy", blocs:["NATO"], approval:45 },
  "643": { en:"Russia", he:"רוסיה", pop:144, gdp:2100, def:140, mil:1150, nukes:4300, gov:"authoritarian", blocs:["CSTO","SCO","BRICS"], approval:60 },
  "804": { en:"Ukraine", he:"אוקראינה", pop:33, gdp:190, def:45, mil:900, nukes:0, gov:"hybrid", blocs:[], approval:55 },
  "156": { en:"China", he:"סין", pop:1410, gdp:19500, def:310, mil:2030, nukes:600, gov:"authoritarian", blocs:["SCO","BRICS"], approval:65 },
  "422": { en:"Lebanon", he:"לבנון", pop:5.8, gdp:20, def:1, mil:60, nukes:0, gov:"hybrid", blocs:["ArabLeague"], approval:30 },
  "818": { en:"Egypt", he:"מצרים", pop:116, gdp:390, def:5, mil:440, nukes:0, gov:"authoritarian", blocs:["ArabLeague","AU","BRICS"], approval:45 },
  "400": { en:"Jordan", he:"ירדן", pop:11.5, gdp:54, def:2.3, mil:100, nukes:0, gov:"authoritarian", blocs:["ArabLeague"], approval:50 },
  "276": { en:"Germany", he:"גרמניה", pop:84, gdp:4900, def:95, mil:182, nukes:0, gov:"democracy", blocs:["NATO","EU"], approval:42 },
  "268": { en:"Georgia", he:"גאורגיה", pop:3.7, gdp:33, def:0.6, mil:37, nukes:0, gov:"hybrid", blocs:[], approval:45 },
  "760": { en:"Syria", he:"סוריה", pop:24, gdp:20, def:1.5, mil:120, nukes:0, gov:"hybrid", blocs:["ArabLeague"], approval:40 }
};
window.STARTING_RELATIONS = [
  ["376","364",-95], ["376","840",85], ["376","422",-60], ["376","818",15], ["376","400",20],
  ["364","840",-85], ["643","804",-100], ["643","840",-55], ["156","840",-35], ["643","156",60],
  ["643","268",-45], ["804","840",60], ["804","276",65]
];
window.STARTING_WARS = [["643","804"]];
