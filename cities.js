/*
 * cities.js - cities for the World 2026 strategy game.
 * Fields: id = "<country id>-<slug>"; c = country id (ISO 3166-1 numeric, same keys as window.COUNTRY_DATA);
 * he/en = names; lat/lon = degrees (2 decimals); pop = URBAN AGGLOMERATION / METRO population in millions
 * (approx. 2025; small towns and bases may be the town itself); cap = 1 for the national capital (one per
 * sovereign country); port = 1 for a major seaport / naval base.
 * Sources: UN World Urbanization Prospects (2018 rev., 2025 projections), citypopulation.de, national statistics;
 * coordinates from standard gazetteer values (GeoNames / Wikipedia), rounded to 0.01 deg. Values are estimates.
 * Capital choices for special cases:
 *  - Israel: Jerusalem (seat of government; status internationally disputed).
 *  - Palestine: Ramallah (administrative seat of the Palestinian Authority; East Jerusalem is the claimed capital).
 *  - Bolivia: Sucre (constitutional capital); La Paz is the seat of government.
 *  - Netherlands: Amsterdam (constitutional capital); The Hague is the seat of government.
 *  - Sri Lanka: Sri Jayawardenepura Kotte (legislative capital); Colombo is the commercial capital.
 *  - Benin: Porto-Novo (official); Cotonou is the seat of government.
 *  - Côte d'Ivoire: Yamoussoukro (official); Abidjan is the economic capital.
 *  - Tanzania: Dodoma (official); Dar es Salaam holds most government business.
 *  - Burundi: Gitega (political capital since 2019); Bujumbura is the economic capital.
 *  - South Africa: Pretoria (executive capital); Cape Town legislative, Bloemfontein judicial.
 *  - Malaysia: Kuala Lumpur (official); Putrajaya is the administrative centre.
 *  - eSwatini: Mbabane (executive); Lobamba is the royal/legislative capital.
 *  - Nauru: Yaren (no official capital; seat of government).
 *  - Egypt: Cairo; the New Administrative Capital is listed as a separate (non-capital) city.
 *  - Cities in areas under military occupation or disputed control are assigned to the country whose map shape
 *    contains them in world.js (see comments on those entries).
 */
window.CITIES = [
  // United States
  { id:"840-was", c:"840", he:"וושינגטון", en:"Washington", lat:38.90, lon:-77.04, pop:5.5, cap:1, port:0 },
  { id:"840-new", c:"840", he:"ניו יורק", en:"New York", lat:40.71, lon:-74.01, pop:19.2, cap:0, port:1 },
  { id:"840-los", c:"840", he:"לוס אנג'לס", en:"Los Angeles", lat:34.05, lon:-118.24, pop:12.5, cap:0, port:1 },
  { id:"840-chi", c:"840", he:"שיקגו", en:"Chicago", lat:41.88, lon:-87.63, pop:8.9, cap:0, port:0 },
  { id:"840-hou", c:"840", he:"יוסטון", en:"Houston", lat:29.76, lon:-95.37, pop:6.7, cap:0, port:1 },
  { id:"840-dal", c:"840", he:"דאלאס", en:"Dallas", lat:32.78, lon:-96.80, pop:6.7, cap:0, port:0 },
  { id:"840-mia", c:"840", he:"מיאמי", en:"Miami", lat:25.76, lon:-80.19, pop:6.3, cap:0, port:1 },
  { id:"840-phi", c:"840", he:"פילדלפיה", en:"Philadelphia", lat:39.95, lon:-75.17, pop:5.8, cap:0, port:1 },
  { id:"840-atl", c:"840", he:"אטלנטה", en:"Atlanta", lat:33.75, lon:-84.39, pop:5.8, cap:0, port:0 },
  { id:"840-bos", c:"840", he:"בוסטון", en:"Boston", lat:42.36, lon:-71.06, pop:4.4, cap:0, port:1 },
  { id:"840-pho", c:"840", he:"פיניקס", en:"Phoenix", lat:33.45, lon:-112.07, pop:4.8, cap:0, port:0 },
  { id:"840-san", c:"840", he:"סן פרנסיסקו", en:"San Francisco", lat:37.77, lon:-122.42, pop:3.4, cap:0, port:1 },
  { id:"840-sea", c:"840", he:"סיאטל", en:"Seattle", lat:47.61, lon:-122.33, pop:3.7, cap:0, port:1 },
  { id:"840-sand", c:"840", he:"סן דייגו", en:"San Diego", lat:32.72, lon:-117.16, pop:3.3, cap:0, port:1 },
  { id:"840-den", c:"840", he:"דנוור", en:"Denver", lat:39.74, lon:-104.99, pop:2.9, cap:0, port:0 },
  { id:"840-det", c:"840", he:"דטרויט", en:"Detroit", lat:42.33, lon:-83.05, pop:3.8, cap:0, port:0 },
  { id:"840-min", c:"840", he:"מיניאפוליס", en:"Minneapolis", lat:44.98, lon:-93.27, pop:2.9, cap:0, port:0 },
  { id:"840-nor", c:"840", he:"נורפוק", en:"Norfolk", lat:36.85, lon:-76.29, pop:1.2, cap:0, port:1 },
  { id:"840-newo", c:"840", he:"ניו אורלינס", en:"New Orleans", lat:29.95, lon:-90.07, pop:1, cap:0, port:1 },
  { id:"840-hon", c:"840", he:"הונולולו", en:"Honolulu", lat:21.31, lon:-157.86, pop:0.85, cap:0, port:1 },
  { id:"840-anc", c:"840", he:"אנקורג'", en:"Anchorage", lat:61.22, lon:-149.90, pop:0.3, cap:0, port:1 },
  { id:"840-las", c:"840", he:"לאס וגאס", en:"Las Vegas", lat:36.17, lon:-115.14, pop:2.3, cap:0, port:0 },
  { id:"840-sana", c:"840", he:"סן אנטוניו", en:"San Antonio", lat:29.42, lon:-98.49, pop:2.6, cap:0, port:0 },
  // China
  { id:"156-bei", c:"156", he:"בייג'ינג", en:"Beijing", lat:39.90, lon:116.41, pop:22.2, cap:1, port:0 },
  { id:"156-sha", c:"156", he:"שנגחאי", en:"Shanghai", lat:31.23, lon:121.47, pop:29.9, cap:0, port:1 },
  { id:"156-gua", c:"156", he:"גואנגג'ואו", en:"Guangzhou", lat:23.13, lon:113.26, pop:27.6, cap:0, port:1 },
  { id:"156-she", c:"156", he:"שנג'ן", en:"Shenzhen", lat:22.56, lon:114.05, pop:13.5, cap:0, port:1 },
  { id:"156-cho", c:"156", he:"צ'ונגצ'ינג", en:"Chongqing", lat:29.56, lon:106.55, pop:13.2, cap:0, port:0 },
  { id:"156-tia", c:"156", he:"טיאנג'ין", en:"Tianjin", lat:39.13, lon:117.20, pop:11.8, cap:0, port:1 },
  { id:"156-che", c:"156", he:"צ'נגדו", en:"Chengdu", lat:30.57, lon:104.07, pop:10, cap:0, port:0 },
  { id:"156-wuh", c:"156", he:"ווהאן", en:"Wuhan", lat:30.59, lon:114.31, pop:8.9, cap:0, port:0 },
  { id:"156-xia", c:"156", he:"שיאן", en:"Xi'an", lat:34.34, lon:108.94, pop:8.9, cap:0, port:0 },
  { id:"156-nan", c:"156", he:"נאנג'ינג", en:"Nanjing", lat:32.06, lon:118.80, pop:9.8, cap:0, port:0 },
  { id:"156-han", c:"156", he:"האנגג׳ואו", en:"Hangzhou", lat:30.27, lon:120.16, pop:8.6, cap:0, port:0 },
  { id:"156-shen", c:"156", he:"שניאנג", en:"Shenyang", lat:41.81, lon:123.43, pop:7.9, cap:0, port:0 },
  { id:"156-har", c:"156", he:"חרבין", en:"Harbin", lat:45.80, lon:126.53, pop:6.9, cap:0, port:0 },
  { id:"156-qin", c:"156", he:"צ'ינגדאו", en:"Qingdao", lat:36.07, lon:120.38, pop:6.5, cap:0, port:1 },
  { id:"156-dal", c:"156", he:"דאליאן", en:"Dalian", lat:38.91, lon:121.61, pop:6, cap:0, port:1 },
  { id:"156-xiam", c:"156", he:"שיאמן", en:"Xiamen", lat:24.48, lon:118.09, pop:5.5, cap:0, port:1 },
  { id:"156-kun", c:"156", he:"קונמינג", en:"Kunming", lat:25.04, lon:102.71, pop:5.1, cap:0, port:0 },
  { id:"156-uru", c:"156", he:"אורומצ'י", en:"Urumqi", lat:43.83, lon:87.62, pop:4.6, cap:0, port:0 },
  { id:"156-lha", c:"156", he:"להסה", en:"Lhasa", lat:29.65, lon:91.17, pop:0.6, cap:0, port:0 },
  { id:"156-nin", c:"156", he:"נינגבו", en:"Ningbo", lat:29.87, lon:121.54, pop:4.4, cap:0, port:1 },
  { id:"156-fuz", c:"156", he:"פוז'ואו", en:"Fuzhou", lat:26.07, lon:119.30, pop:4.6, cap:0, port:1 },
  { id:"156-zhe", c:"156", he:"ג'נגג'ואו", en:"Zhengzhou", lat:34.75, lon:113.63, pop:7.5, cap:0, port:0 },
  // Hong Kong
  { id:"344-hon", c:"344", he:"הונג קונג", en:"Hong Kong", lat:22.32, lon:114.17, pop:7.6, cap:1, port:1 },
  // Macao
  { id:"446-mac", c:"446", he:"מקאו", en:"Macau", lat:22.20, lon:113.55, pop:0.7, cap:1, port:1 },
  // India
  { id:"356-new", c:"356", he:"ניו דלהי", en:"New Delhi", lat:28.61, lon:77.21, pop:34.7, cap:1, port:0 },
  { id:"356-mum", c:"356", he:"מומבאי", en:"Mumbai", lat:19.08, lon:72.88, pop:22.1, cap:0, port:1 },
  { id:"356-kol", c:"356", he:"כלכותה", en:"Kolkata", lat:22.57, lon:88.36, pop:15.8, cap:0, port:1 },
  { id:"356-ban", c:"356", he:"בנגלור", en:"Bangalore", lat:12.97, lon:77.59, pop:14.4, cap:0, port:0 },
  { id:"356-che", c:"356", he:"צ'נאי", en:"Chennai", lat:13.08, lon:80.27, pop:12.3, cap:0, port:1 },
  { id:"356-hyd", c:"356", he:"היידראבאד", en:"Hyderabad", lat:17.39, lon:78.49, pop:11.3, cap:0, port:0 },
  { id:"356-ahm", c:"356", he:"אחמדאבאד", en:"Ahmedabad", lat:23.02, lon:72.57, pop:8.9, cap:0, port:0 },
  { id:"356-pun", c:"356", he:"פונה", en:"Pune", lat:18.52, lon:73.86, pop:7.4, cap:0, port:0 },
  { id:"356-sur", c:"356", he:"סוראט", en:"Surat", lat:21.17, lon:72.83, pop:8.3, cap:0, port:0 },
  { id:"356-jai", c:"356", he:"ג'איפור", en:"Jaipur", lat:26.91, lon:75.79, pop:4.4, cap:0, port:0 },
  { id:"356-luc", c:"356", he:"לקנאו", en:"Lucknow", lat:26.85, lon:80.95, pop:4.1, cap:0, port:0 },
  { id:"356-koc", c:"356", he:"קוצ'י", en:"Kochi", lat:9.93, lon:76.27, pop:2.4, cap:0, port:1 },
  { id:"356-vis", c:"356", he:"ויסאקהפטנאם", en:"Visakhapatnam", lat:17.69, lon:83.22, pop:2.4, cap:0, port:1 },
  { id:"356-sri", c:"356", he:"סרינגר", en:"Srinagar", lat:34.08, lon:74.80, pop:1.7, cap:0, port:0 },
  { id:"356-amr", c:"356", he:"אמריטסר", en:"Amritsar", lat:31.63, lon:74.87, pop:1.4, cap:0, port:0 },
  { id:"356-guw", c:"356", he:"גוואהטי", en:"Guwahati", lat:26.14, lon:91.74, pop:1.2, cap:0, port:0 },
  // Russia
  { id:"643-mos", c:"643", he:"מוסקבה", en:"Moscow", lat:55.76, lon:37.62, pop:19, cap:1, port:0 },
  { id:"643-sai", c:"643", he:"סנקט פטרבורג", en:"Saint Petersburg", lat:59.93, lon:30.34, pop:5.6, cap:0, port:1 },
  { id:"643-nov", c:"643", he:"נובוסיבירסק", en:"Novosibirsk", lat:55.03, lon:82.92, pop:1.65, cap:0, port:0 },
  { id:"643-yek", c:"643", he:"יקטרינבורג", en:"Yekaterinburg", lat:56.84, lon:60.61, pop:1.55, cap:0, port:0 },
  { id:"643-kaz", c:"643", he:"קאזאן", en:"Kazan", lat:55.79, lon:49.12, pop:1.32, cap:0, port:0 },
  { id:"643-niz", c:"643", he:"ניז'ני נובגורוד", en:"Nizhny Novgorod", lat:56.33, lon:44.00, pop:1.21, cap:0, port:0 },
  { id:"643-sam", c:"643", he:"סמארה", en:"Samara", lat:53.20, lon:50.15, pop:1.15, cap:0, port:0 },
  { id:"643-ros", c:"643", he:"רוסטוב על הדון", en:"Rostov-on-Don", lat:47.24, lon:39.71, pop:1.14, cap:0, port:0 },
  { id:"643-vol", c:"643", he:"וולגוגרד", en:"Volgograd", lat:48.71, lon:44.51, pop:1, cap:0, port:0 },
  { id:"643-kra", c:"643", he:"קרסנודאר", en:"Krasnodar", lat:45.04, lon:38.98, pop:1.1, cap:0, port:0 },
  { id:"643-vla", c:"643", he:"ולדיווסטוק", en:"Vladivostok", lat:43.12, lon:131.89, pop:0.6, cap:0, port:1 },
  { id:"643-mur", c:"643", he:"מורמנסק", en:"Murmansk", lat:68.97, lon:33.08, pop:0.27, cap:0, port:1 },
  { id:"643-kal", c:"643", he:"קלינינגרד", en:"Kaliningrad", lat:54.71, lon:20.51, pop:0.49, cap:0, port:1 },
  { id:"643-sev", c:"643", he:"סבסטופול", en:"Sevastopol", lat:44.62, lon:33.52, pop:0.48, cap:0, port:1 }, // Crimea: annexed by Russia 2014, internationally recognized as Ukraine; world.js map shape is Russia
  { id:"643-novo", c:"643", he:"נובורוסייסק", en:"Novorossiysk", lat:44.72, lon:37.77, pop:0.34, cap:0, port:1 },
  { id:"643-oms", c:"643", he:"אומסק", en:"Omsk", lat:54.99, lon:73.37, pop:1.12, cap:0, port:0 },
  { id:"643-kras", c:"643", he:"קרסנויארסק", en:"Krasnoyarsk", lat:56.01, lon:92.87, pop:1.2, cap:0, port:0 },
  { id:"643-irk", c:"643", he:"אירקוטסק", en:"Irkutsk", lat:52.29, lon:104.28, pop:0.62, cap:0, port:0 },
  { id:"643-kha", c:"643", he:"חברובסק", en:"Khabarovsk", lat:48.48, lon:135.07, pop:0.62, cap:0, port:0 },
  { id:"643-bel", c:"643", he:"בלגורוד", en:"Belgorod", lat:50.60, lon:36.59, pop:0.34, cap:0, port:0 },
  { id:"643-kur", c:"643", he:"קורסק", en:"Kursk", lat:51.73, lon:36.19, pop:0.44, cap:0, port:0 },
  // Indonesia
  { id:"360-jak", c:"360", he:"ג'קרטה", en:"Jakarta", lat:-6.21, lon:106.85, pop:33, cap:1, port:1 },
  { id:"360-sur", c:"360", he:"סורבאיה", en:"Surabaya", lat:-7.25, lon:112.75, pop:3.2, cap:0, port:1 },
  { id:"360-ban", c:"360", he:"בנדונג", en:"Bandung", lat:-6.92, lon:107.61, pop:2.7, cap:0, port:0 },
  { id:"360-med", c:"360", he:"מדאן", en:"Medan", lat:3.60, lon:98.67, pop:2.5, cap:0, port:1 },
  { id:"360-sem", c:"360", he:"סמרנג", en:"Semarang", lat:-6.97, lon:110.42, pop:1.8, cap:0, port:1 },
  { id:"360-mak", c:"360", he:"מקסאר", en:"Makassar", lat:-5.15, lon:119.43, pop:1.6, cap:0, port:1 },
  { id:"360-pal", c:"360", he:"פלמבנג", en:"Palembang", lat:-2.98, lon:104.76, pop:1.7, cap:0, port:0 },
  { id:"360-den", c:"360", he:"דנפסר", en:"Denpasar", lat:-8.65, lon:115.22, pop:1, cap:0, port:0 },
  { id:"360-bal", c:"360", he:"באליקפאפאן", en:"Balikpapan", lat:-1.27, lon:116.83, pop:0.7, cap:0, port:1 },
  { id:"360-jay", c:"360", he:"ג'איאפורה", en:"Jayapura", lat:-2.53, lon:140.72, pop:0.4, cap:0, port:1 },
  { id:"360-man", c:"360", he:"מנדו", en:"Manado", lat:1.47, lon:124.84, pop:0.5, cap:0, port:1 },
  // Pakistan
  { id:"586-isl", c:"586", he:"אסלאמאבאד", en:"Islamabad", lat:33.68, lon:73.05, pop:1.3, cap:1, port:0 },
  { id:"586-kar", c:"586", he:"קראצ'י", en:"Karachi", lat:24.86, lon:67.01, pop:18.1, cap:0, port:1 },
  { id:"586-lah", c:"586", he:"לאהור", en:"Lahore", lat:31.55, lon:74.34, pop:14.4, cap:0, port:0 },
  { id:"586-fai", c:"586", he:"פייסלאבאד", en:"Faisalabad", lat:31.42, lon:73.08, pop:3.7, cap:0, port:0 },
  { id:"586-raw", c:"586", he:"רוואלפינדי", en:"Rawalpindi", lat:33.60, lon:73.04, pop:2.5, cap:0, port:0 },
  { id:"586-mul", c:"586", he:"מולטאן", en:"Multan", lat:30.16, lon:71.52, pop:2.2, cap:0, port:0 },
  { id:"586-pes", c:"586", he:"פשאוור", en:"Peshawar", lat:34.01, lon:71.58, pop:2.4, cap:0, port:0 },
  { id:"586-que", c:"586", he:"קווטה", en:"Quetta", lat:30.18, lon:66.97, pop:1.2, cap:0, port:0 },
  { id:"586-gwa", c:"586", he:"גוואדר", en:"Gwadar", lat:25.13, lon:62.32, pop:0.1, cap:0, port:1 },
  { id:"586-hyd", c:"586", he:"היידראבאד", en:"Hyderabad", lat:25.40, lon:68.37, pop:2, cap:0, port:0 },
  // Nigeria
  { id:"566-abu", c:"566", he:"אבוג'ה", en:"Abuja", lat:9.08, lon:7.40, pop:4, cap:1, port:0 },
  { id:"566-lag", c:"566", he:"לאגוס", en:"Lagos", lat:6.52, lon:3.38, pop:16.5, cap:0, port:1 },
  { id:"566-kan", c:"566", he:"קאנו", en:"Kano", lat:12.00, lon:8.52, pop:4.5, cap:0, port:0 },
  { id:"566-iba", c:"566", he:"איבדאן", en:"Ibadan", lat:7.38, lon:3.95, pop:3.9, cap:0, port:0 },
  { id:"566-por", c:"566", he:"פורט הרקורט", en:"Port Harcourt", lat:4.82, lon:7.03, pop:3.6, cap:0, port:1 },
  { id:"566-ben", c:"566", he:"בנין סיטי", en:"Benin City", lat:6.34, lon:5.63, pop:2, cap:0, port:0 },
  { id:"566-kad", c:"566", he:"קדונה", en:"Kaduna", lat:10.52, lon:7.44, pop:1.3, cap:0, port:0 },
  { id:"566-mai", c:"566", he:"מאידוגורי", en:"Maiduguri", lat:11.85, lon:13.16, pop:1, cap:0, port:0 },
  { id:"566-enu", c:"566", he:"אנוגו", en:"Enugu", lat:6.46, lon:7.55, pop:1, cap:0, port:0 },
  // Brazil
  { id:"076-bra", c:"076", he:"ברזיליה", en:"Brasília", lat:-15.79, lon:-47.88, pop:4.9, cap:1, port:0 },
  { id:"076-sao", c:"076", he:"סאו פאולו", en:"São Paulo", lat:-23.55, lon:-46.63, pop:22.8, cap:0, port:0 },
  { id:"076-rio", c:"076", he:"ריו דה ז'ניירו", en:"Rio de Janeiro", lat:-22.91, lon:-43.17, pop:13.8, cap:0, port:1 },
  { id:"076-bel", c:"076", he:"בלו הוריזונטה", en:"Belo Horizonte", lat:-19.92, lon:-43.94, pop:6.3, cap:0, port:0 },
  { id:"076-por", c:"076", he:"פורטו אלגרה", en:"Porto Alegre", lat:-30.03, lon:-51.23, pop:4.2, cap:0, port:0 },
  { id:"076-rec", c:"076", he:"רסיפה", en:"Recife", lat:-8.05, lon:-34.88, pop:4.3, cap:0, port:1 },
  { id:"076-for", c:"076", he:"פורטלזה", en:"Fortaleza", lat:-3.73, lon:-38.53, pop:4.2, cap:0, port:1 },
  { id:"076-sal", c:"076", he:"סלבדור", en:"Salvador", lat:-12.97, lon:-38.50, pop:4, cap:0, port:1 },
  { id:"076-cur", c:"076", he:"קוריטיבה", en:"Curitiba", lat:-25.43, lon:-49.27, pop:3.8, cap:0, port:0 },
  { id:"076-man", c:"076", he:"מנאוס", en:"Manaus", lat:-3.12, lon:-60.02, pop:2.4, cap:0, port:0 },
  { id:"076-bele", c:"076", he:"בלם", en:"Belém", lat:-1.46, lon:-48.49, pop:2.4, cap:0, port:1 },
  { id:"076-san", c:"076", he:"סנטוס", en:"Santos", lat:-23.96, lon:-46.33, pop:1.9, cap:0, port:1 },
  // Bangladesh
  { id:"050-dha", c:"050", he:"דאקה", en:"Dhaka", lat:23.81, lon:90.41, pop:24, cap:1, port:0 },
  { id:"050-chi", c:"050", he:"צ'יטגונג", en:"Chittagong", lat:22.36, lon:91.78, pop:5.5, cap:0, port:1 },
  { id:"050-khu", c:"050", he:"חולנה", en:"Khulna", lat:22.82, lon:89.55, pop:1.1, cap:0, port:0 },
  { id:"050-raj", c:"050", he:"ראג'שאהי", en:"Rajshahi", lat:24.37, lon:88.60, pop:1, cap:0, port:0 },
  { id:"050-syl", c:"050", he:"סילהט", en:"Sylhet", lat:24.89, lon:91.87, pop:0.8, cap:0, port:0 },
  // Ethiopia
  { id:"231-add", c:"231", he:"אדיס אבבה", en:"Addis Ababa", lat:9.03, lon:38.74, pop:5.7, cap:1, port:0 },
  { id:"231-dir", c:"231", he:"דירה דאווה", en:"Dire Dawa", lat:9.59, lon:41.87, pop:0.5, cap:0, port:0 },
  { id:"231-mek", c:"231", he:"מקלה", en:"Mekelle", lat:13.50, lon:39.47, pop:0.5, cap:0, port:0 },
  { id:"231-gon", c:"231", he:"גונדר", en:"Gondar", lat:12.60, lon:37.47, pop:0.4, cap:0, port:0 },
  { id:"231-bah", c:"231", he:"באהיר דאר", en:"Bahir Dar", lat:11.59, lon:37.39, pop:0.4, cap:0, port:0 },
  // Mexico
  { id:"484-mex", c:"484", he:"מקסיקו סיטי", en:"Mexico City", lat:19.43, lon:-99.13, pop:22.8, cap:1, port:0 },
  { id:"484-gua", c:"484", he:"גוודלחרה", en:"Guadalajara", lat:20.67, lon:-103.35, pop:5.5, cap:0, port:0 },
  { id:"484-mon", c:"484", he:"מונטריי", en:"Monterrey", lat:25.69, lon:-100.32, pop:5.3, cap:0, port:0 },
  { id:"484-pue", c:"484", he:"פואבלה", en:"Puebla", lat:19.04, lon:-98.21, pop:3.3, cap:0, port:0 },
  { id:"484-tij", c:"484", he:"טיחואנה", en:"Tijuana", lat:32.51, lon:-117.04, pop:2.3, cap:0, port:0 },
  { id:"484-ciu", c:"484", he:"סיודד חוארס", en:"Ciudad Juárez", lat:31.69, lon:-106.42, pop:1.6, cap:0, port:0 },
  { id:"484-leo", c:"484", he:"לאון", en:"León", lat:21.12, lon:-101.68, pop:1.9, cap:0, port:0 },
  { id:"484-ver", c:"484", he:"וראקרוס", en:"Veracruz", lat:19.17, lon:-96.13, pop:0.9, cap:0, port:1 },
  { id:"484-mer", c:"484", he:"מרידה", en:"Mérida", lat:20.97, lon:-89.62, pop:1.3, cap:0, port:0 },
  { id:"484-can", c:"484", he:"קנקון", en:"Cancún", lat:21.16, lon:-86.85, pop:1, cap:0, port:0 },
  { id:"484-cul", c:"484", he:"קוליאקן", en:"Culiacán", lat:24.81, lon:-107.39, pop:1, cap:0, port:0 },
  { id:"484-man", c:"484", he:"מנסנייו", en:"Manzanillo", lat:19.05, lon:-104.32, pop:0.2, cap:0, port:1 },
  // Japan
  { id:"392-tok", c:"392", he:"טוקיו", en:"Tokyo", lat:35.68, lon:139.69, pop:37, cap:1, port:1 },
  { id:"392-osa", c:"392", he:"אוסקה", en:"Osaka", lat:34.69, lon:135.50, pop:19, cap:0, port:1 },
  { id:"392-nag", c:"392", he:"נגויה", en:"Nagoya", lat:35.18, lon:136.91, pop:9.5, cap:0, port:1 },
  { id:"392-fuk", c:"392", he:"פוקואוקה", en:"Fukuoka", lat:33.59, lon:130.40, pop:5.5, cap:0, port:1 },
  { id:"392-sap", c:"392", he:"סאפורו", en:"Sapporo", lat:43.06, lon:141.35, pop:2.7, cap:0, port:0 },
  { id:"392-hir", c:"392", he:"הירושימה", en:"Hiroshima", lat:34.39, lon:132.46, pop:2.1, cap:0, port:1 },
  { id:"392-sen", c:"392", he:"סנדאי", en:"Sendai", lat:38.27, lon:140.87, pop:2.2, cap:0, port:0 },
  { id:"392-yok", c:"392", he:"יוקוסוקה", en:"Yokosuka", lat:35.28, lon:139.67, pop:0.39, cap:0, port:1 },
  { id:"392-naga", c:"392", he:"נגסאקי", en:"Nagasaki", lat:32.75, lon:129.88, pop:0.4, cap:0, port:1 },
  { id:"392-nah", c:"392", he:"נאהה", en:"Naha", lat:26.21, lon:127.68, pop:0.8, cap:0, port:1 },
  { id:"392-kob", c:"392", he:"קובה", en:"Kobe", lat:34.69, lon:135.20, pop:1.5, cap:0, port:1 },
  { id:"392-kyo", c:"392", he:"קיוטו", en:"Kyoto", lat:35.01, lon:135.77, pop:1.45, cap:0, port:0 },
  // Egypt
  { id:"818-cai", c:"818", he:"קהיר", en:"Cairo", lat:30.04, lon:31.24, pop:22.6, cap:1, port:0 },
  { id:"818-ale", c:"818", he:"אלכסנדריה", en:"Alexandria", lat:31.20, lon:29.92, pop:5.6, cap:0, port:1 },
  { id:"818-por", c:"818", he:"פורט סעיד", en:"Port Said", lat:31.26, lon:32.30, pop:0.8, cap:0, port:1 },
  { id:"818-sue", c:"818", he:"סואץ", en:"Suez", lat:29.97, lon:32.53, pop:0.8, cap:0, port:1 },
  { id:"818-ism", c:"818", he:"איסמעיליה", en:"Ismailia", lat:30.60, lon:32.27, pop:1.4, cap:0, port:0 },
  { id:"818-asw", c:"818", he:"אסואן", en:"Aswan", lat:24.09, lon:32.90, pop:0.4, cap:0, port:0 },
  { id:"818-lux", c:"818", he:"לוקסור", en:"Luxor", lat:25.69, lon:32.64, pop:0.55, cap:0, port:0 },
  { id:"818-sha", c:"818", he:"שארם א-שייח'", en:"Sharm el-Sheikh", lat:27.92, lon:34.33, pop:0.08, cap:0, port:0 },
  { id:"818-new", c:"818", he:"הבירה המנהלית החדשה", en:"New Administrative Capital", lat:30.02, lon:31.76, pop:0.1, cap:0, port:0 },
  // Philippines
  { id:"608-man", c:"608", he:"מנילה", en:"Manila", lat:14.60, lon:120.98, pop:27, cap:1, port:1 },
  { id:"608-ceb", c:"608", he:"סבו", en:"Cebu", lat:10.32, lon:123.89, pop:3.1, cap:0, port:1 },
  { id:"608-dav", c:"608", he:"דבאו", en:"Davao", lat:7.19, lon:125.46, pop:2, cap:0, port:1 },
  { id:"608-zam", c:"608", he:"זמבואנגה", en:"Zamboanga", lat:6.91, lon:122.08, pop:1, cap:0, port:1 },
  { id:"608-sub", c:"608", he:"מפרץ סוביק", en:"Subic Bay", lat:14.82, lon:120.27, pop:0.25, cap:0, port:1 },
  { id:"608-pue", c:"608", he:"פוארטו פרינססה", en:"Puerto Princesa", lat:9.74, lon:118.74, pop:0.31, cap:0, port:1 },
  // Dem. Rep. Congo
  { id:"180-kin", c:"180", he:"קינשאסה", en:"Kinshasa", lat:-4.44, lon:15.27, pop:17.8, cap:1, port:0 },
  { id:"180-lub", c:"180", he:"לובומבאשי", en:"Lubumbashi", lat:-11.66, lon:27.48, pop:2.8, cap:0, port:0 },
  { id:"180-mbu", c:"180", he:"מבוג'י מאיי", en:"Mbuji-Mayi", lat:-6.14, lon:23.59, pop:2.9, cap:0, port:0 },
  { id:"180-kis", c:"180", he:"קיסנגאני", en:"Kisangani", lat:0.52, lon:25.19, pop:1.4, cap:0, port:0 },
  { id:"180-gom", c:"180", he:"גומה", en:"Goma", lat:-1.68, lon:29.22, pop:1, cap:0, port:0 },
  { id:"180-buk", c:"180", he:"בוקאבו", en:"Bukavu", lat:-2.51, lon:28.86, pop:1.2, cap:0, port:0 },
  { id:"180-mat", c:"180", he:"מטאדי", en:"Matadi", lat:-5.82, lon:13.46, pop:0.4, cap:0, port:1 },
  // Vietnam
  { id:"704-han", c:"704", he:"האנוי", en:"Hanoi", lat:21.03, lon:105.85, pop:5.4, cap:1, port:0 },
  { id:"704-hoc", c:"704", he:"הו צ'י מין סיטי", en:"Ho Chi Minh City", lat:10.82, lon:106.63, pop:14.1, cap:0, port:1 },
  { id:"704-hai", c:"704", he:"הייפונג", en:"Haiphong", lat:20.84, lon:106.69, pop:1.4, cap:0, port:1 },
  { id:"704-dan", c:"704", he:"דא נאנג", en:"Da Nang", lat:16.05, lon:108.21, pop:1.3, cap:0, port:1 },
  { id:"704-can", c:"704", he:"קאן תו", en:"Can Tho", lat:10.04, lon:105.79, pop:1.3, cap:0, port:0 },
  { id:"704-cam", c:"704", he:"קאם ראנה", en:"Cam Ranh", lat:11.92, lon:109.16, pop:0.13, cap:0, port:1 },
  // Iran
  { id:"364-teh", c:"364", he:"טהרן", en:"Tehran", lat:35.69, lon:51.39, pop:9.6, cap:1, port:0 },
  { id:"364-mas", c:"364", he:"משהד", en:"Mashhad", lat:36.30, lon:59.61, pop:3.5, cap:0, port:0 },
  { id:"364-isf", c:"364", he:"אספהאן", en:"Isfahan", lat:32.65, lon:51.67, pop:2.3, cap:0, port:0 },
  { id:"364-kar", c:"364", he:"כרג'", en:"Karaj", lat:35.84, lon:50.94, pop:1.9, cap:0, port:0 },
  { id:"364-shi", c:"364", he:"שיראז", en:"Shiraz", lat:29.59, lon:52.58, pop:1.7, cap:0, port:0 },
  { id:"364-tab", c:"364", he:"תבריז", en:"Tabriz", lat:38.08, lon:46.29, pop:1.7, cap:0, port:0 },
  { id:"364-ahv", c:"364", he:"אהוואז", en:"Ahvaz", lat:31.32, lon:48.67, pop:1.3, cap:0, port:0 },
  { id:"364-qom", c:"364", he:"קום", en:"Qom", lat:34.64, lon:50.88, pop:1.3, cap:0, port:0 },
  { id:"364-ban", c:"364", he:"בנדר עבאס", en:"Bandar Abbas", lat:27.18, lon:56.27, pop:0.6, cap:0, port:1 },
  { id:"364-bus", c:"364", he:"בושהר", en:"Bushehr", lat:28.92, lon:50.84, pop:0.25, cap:0, port:1 },
  { id:"364-ker", c:"364", he:"כרמאנשאה", en:"Kermanshah", lat:34.31, lon:47.07, pop:1, cap:0, port:0 },
  { id:"364-cha", c:"364", he:"צ'אבהאר", en:"Chabahar", lat:25.29, lon:60.64, pop:0.11, cap:0, port:1 },
  // Turkey
  { id:"792-ank", c:"792", he:"אנקרה", en:"Ankara", lat:39.93, lon:32.85, pop:5.4, cap:1, port:0 },
  { id:"792-ist", c:"792", he:"איסטנבול", en:"Istanbul", lat:41.01, lon:28.98, pop:16, cap:0, port:1 },
  { id:"792-izm", c:"792", he:"איזמיר", en:"Izmir", lat:38.42, lon:27.14, pop:3.1, cap:0, port:1 },
  { id:"792-bur", c:"792", he:"בורסה", en:"Bursa", lat:40.19, lon:29.06, pop:2.1, cap:0, port:0 },
  { id:"792-ant", c:"792", he:"אנטליה", en:"Antalya", lat:36.90, lon:30.70, pop:1.5, cap:0, port:1 },
  { id:"792-ada", c:"792", he:"אדנה", en:"Adana", lat:37.00, lon:35.32, pop:1.9, cap:0, port:0 },
  { id:"792-gaz", c:"792", he:"גזיאנטפ", en:"Gaziantep", lat:37.07, lon:37.38, pop:1.9, cap:0, port:0 },
  { id:"792-kon", c:"792", he:"קוניה", en:"Konya", lat:37.87, lon:32.48, pop:1.4, cap:0, port:0 },
  { id:"792-diy", c:"792", he:"דיארבקיר", en:"Diyarbakır", lat:37.91, lon:40.24, pop:1.1, cap:0, port:0 },
  { id:"792-mer", c:"792", he:"מרסין", en:"Mersin", lat:36.80, lon:34.63, pop:1.1, cap:0, port:1 },
  { id:"792-tra", c:"792", he:"טרבזון", en:"Trabzon", lat:41.00, lon:39.72, pop:0.35, cap:0, port:1 },
  // Germany
  { id:"276-ber", c:"276", he:"ברלין", en:"Berlin", lat:52.52, lon:13.41, pop:3.8, cap:1, port:0 },
  { id:"276-ham", c:"276", he:"המבורג", en:"Hamburg", lat:53.55, lon:9.99, pop:1.9, cap:0, port:1 },
  { id:"276-mun", c:"276", he:"מינכן", en:"Munich", lat:48.14, lon:11.58, pop:1.5, cap:0, port:0 },
  { id:"276-col", c:"276", he:"קלן", en:"Cologne", lat:50.94, lon:6.96, pop:1.1, cap:0, port:0 },
  { id:"276-fra", c:"276", he:"פרנקפורט", en:"Frankfurt", lat:50.11, lon:8.68, pop:0.77, cap:0, port:0 },
  { id:"276-stu", c:"276", he:"שטוטגרט", en:"Stuttgart", lat:48.78, lon:9.18, pop:0.63, cap:0, port:0 },
  { id:"276-dus", c:"276", he:"דיסלדורף", en:"Düsseldorf", lat:51.23, lon:6.77, pop:0.63, cap:0, port:0 },
  { id:"276-ess", c:"276", he:"אסן", en:"Essen", lat:51.46, lon:7.01, pop:0.58, cap:0, port:0 },
  { id:"276-lei", c:"276", he:"לייפציג", en:"Leipzig", lat:51.34, lon:12.37, pop:0.62, cap:0, port:0 },
  { id:"276-dre", c:"276", he:"דרזדן", en:"Dresden", lat:51.05, lon:13.74, pop:0.57, cap:0, port:0 },
  { id:"276-bre", c:"276", he:"ברמן", en:"Bremen", lat:53.08, lon:8.80, pop:0.57, cap:0, port:1 },
  { id:"276-kie", c:"276", he:"קיל", en:"Kiel", lat:54.32, lon:10.14, pop:0.25, cap:0, port:1 },
  // Thailand
  { id:"764-ban", c:"764", he:"בנגקוק", en:"Bangkok", lat:13.76, lon:100.50, pop:18.2, cap:1, port:1 },
  { id:"764-chi", c:"764", he:"צ'יאנג מאי", en:"Chiang Mai", lat:18.79, lon:98.98, pop:1.2, cap:0, port:0 },
  { id:"764-nak", c:"764", he:"נאקון ראצ'סימה", en:"Nakhon Ratchasima", lat:14.97, lon:102.10, pop:0.5, cap:0, port:0 },
  { id:"764-hat", c:"764", he:"האט יאי", en:"Hat Yai", lat:7.01, lon:100.47, pop:0.8, cap:0, port:0 },
  { id:"764-lae", c:"764", he:"לאם צ'בנג", en:"Laem Chabang", lat:13.08, lon:100.88, pop:0.1, cap:0, port:1 },
  { id:"764-phu", c:"764", he:"פוקט", en:"Phuket", lat:7.88, lon:98.39, pop:0.4, cap:0, port:1 },
  // Tanzania
  { id:"834-dod", c:"834", he:"דודומה", en:"Dodoma", lat:-6.16, lon:35.75, pop:0.8, cap:1, port:0 },
  { id:"834-dar", c:"834", he:"דאר א-סלאם", en:"Dar es Salaam", lat:-6.79, lon:39.21, pop:8.2, cap:0, port:1 },
  { id:"834-mwa", c:"834", he:"מוואנזה", en:"Mwanza", lat:-2.52, lon:32.90, pop:1.3, cap:0, port:0 },
  { id:"834-aru", c:"834", he:"ארושה", en:"Arusha", lat:-3.39, lon:36.68, pop:0.7, cap:0, port:0 },
  { id:"834-zan", c:"834", he:"זנזיבר", en:"Zanzibar", lat:-6.17, lon:39.20, pop:0.8, cap:0, port:1 },
  // United Kingdom
  { id:"826-lon", c:"826", he:"לונדון", en:"London", lat:51.51, lon:-0.13, pop:9.8, cap:1, port:1 },
  { id:"826-bir", c:"826", he:"ברמינגהאם", en:"Birmingham", lat:52.49, lon:-1.89, pop:2.7, cap:0, port:0 },
  { id:"826-man", c:"826", he:"מנצ'סטר", en:"Manchester", lat:53.48, lon:-2.24, pop:2.8, cap:0, port:0 },
  { id:"826-gla", c:"826", he:"גלזגו", en:"Glasgow", lat:55.86, lon:-4.25, pop:1.7, cap:0, port:0 },
  { id:"826-liv", c:"826", he:"ליברפול", en:"Liverpool", lat:53.41, lon:-2.98, pop:0.95, cap:0, port:1 },
  { id:"826-edi", c:"826", he:"אדינבורו", en:"Edinburgh", lat:55.95, lon:-3.19, pop:0.55, cap:0, port:0 },
  { id:"826-bel", c:"826", he:"בלפסט", en:"Belfast", lat:54.60, lon:-5.93, pop:0.65, cap:0, port:1 },
  { id:"826-car", c:"826", he:"קרדיף", en:"Cardiff", lat:51.48, lon:-3.18, pop:0.5, cap:0, port:0 },
  { id:"826-por", c:"826", he:"פורטסמות'", en:"Portsmouth", lat:50.80, lon:-1.09, pop:0.85, cap:0, port:1 },
  { id:"826-lee", c:"826", he:"לידס", en:"Leeds", lat:53.80, lon:-1.55, pop:1.9, cap:0, port:0 },
  // France
  { id:"250-par", c:"250", he:"פריז", en:"Paris", lat:48.86, lon:2.35, pop:11.3, cap:1, port:0 },
  { id:"250-lyo", c:"250", he:"ליון", en:"Lyon", lat:45.76, lon:4.84, pop:1.8, cap:0, port:0 },
  { id:"250-mar", c:"250", he:"מרסיי", en:"Marseille", lat:43.30, lon:5.37, pop:1.8, cap:0, port:1 },
  { id:"250-tou", c:"250", he:"טולוז", en:"Toulouse", lat:43.60, lon:1.44, pop:1.1, cap:0, port:0 },
  { id:"250-bor", c:"250", he:"בורדו", en:"Bordeaux", lat:44.84, lon:-0.58, pop:1, cap:0, port:0 },
  { id:"250-lil", c:"250", he:"ליל", en:"Lille", lat:50.63, lon:3.06, pop:1.1, cap:0, port:0 },
  { id:"250-nic", c:"250", he:"ניס", en:"Nice", lat:43.70, lon:7.27, pop:1, cap:0, port:0 },
  { id:"250-nan", c:"250", he:"נאנט", en:"Nantes", lat:47.22, lon:-1.55, pop:0.98, cap:0, port:0 },
  { id:"250-str", c:"250", he:"שטרסבורג", en:"Strasbourg", lat:48.57, lon:7.75, pop:0.8, cap:0, port:0 },
  { id:"250-bre", c:"250", he:"ברסט", en:"Brest", lat:48.39, lon:-4.49, pop:0.32, cap:0, port:1 },
  { id:"250-toul", c:"250", he:"טולון", en:"Toulon", lat:43.12, lon:5.93, pop:0.58, cap:0, port:1 },
  { id:"250-leh", c:"250", he:"לה האבר", en:"Le Havre", lat:49.49, lon:0.11, pop:0.25, cap:0, port:1 },
  // South Africa
  { id:"710-pre", c:"710", he:"פרטוריה", en:"Pretoria", lat:-25.75, lon:28.19, pop:2.9, cap:1, port:0 },
  { id:"710-joh", c:"710", he:"יוהנסבורג", en:"Johannesburg", lat:-26.20, lon:28.05, pop:6.4, cap:0, port:0 },
  { id:"710-cap", c:"710", he:"קייפטאון", en:"Cape Town", lat:-33.92, lon:18.42, pop:5, cap:0, port:1 },
  { id:"710-dur", c:"710", he:"דרבן", en:"Durban", lat:-29.86, lon:31.03, pop:3.4, cap:0, port:1 },
  { id:"710-por", c:"710", he:"פורט אליזבת'", en:"Port Elizabeth", lat:-33.96, lon:25.60, pop:1.3, cap:0, port:1 },
  { id:"710-blo", c:"710", he:"בלומפונטיין", en:"Bloemfontein", lat:-29.12, lon:26.21, pop:0.6, cap:0, port:0 },
  // Italy
  { id:"380-rom", c:"380", he:"רומא", en:"Rome", lat:41.90, lon:12.50, pop:4.3, cap:1, port:0 },
  { id:"380-mil", c:"380", he:"מילאנו", en:"Milan", lat:45.46, lon:9.19, pop:3.2, cap:0, port:0 },
  { id:"380-nap", c:"380", he:"נאפולי", en:"Naples", lat:40.85, lon:14.27, pop:2.2, cap:0, port:1 },
  { id:"380-tur", c:"380", he:"טורינו", en:"Turin", lat:45.07, lon:7.69, pop:1.8, cap:0, port:0 },
  { id:"380-pal", c:"380", he:"פלרמו", en:"Palermo", lat:38.12, lon:13.36, pop:0.85, cap:0, port:1 },
  { id:"380-gen", c:"380", he:"גנואה", en:"Genoa", lat:44.41, lon:8.93, pop:0.58, cap:0, port:1 },
  { id:"380-ven", c:"380", he:"ונציה", en:"Venice", lat:45.44, lon:12.32, pop:0.6, cap:0, port:1 },
  { id:"380-bol", c:"380", he:"בולוניה", en:"Bologna", lat:44.49, lon:11.34, pop:0.78, cap:0, port:0 },
  { id:"380-flo", c:"380", he:"פירנצה", en:"Florence", lat:43.77, lon:11.26, pop:0.71, cap:0, port:0 },
  { id:"380-bar", c:"380", he:"בארי", en:"Bari", lat:41.12, lon:16.87, pop:0.6, cap:0, port:1 },
  { id:"380-tar", c:"380", he:"טרנטו", en:"Taranto", lat:40.47, lon:17.24, pop:0.2, cap:0, port:1 },
  { id:"380-tri", c:"380", he:"טריאסטה", en:"Trieste", lat:45.65, lon:13.78, pop:0.2, cap:0, port:1 },
  // Kenya
  { id:"404-nai", c:"404", he:"ניירובי", en:"Nairobi", lat:-1.29, lon:36.82, pop:5.5, cap:1, port:0 },
  { id:"404-mom", c:"404", he:"מומבסה", en:"Mombasa", lat:-4.04, lon:39.67, pop:1.4, cap:0, port:1 },
  { id:"404-kis", c:"404", he:"קיסומו", en:"Kisumu", lat:-0.09, lon:34.77, pop:0.6, cap:0, port:0 },
  { id:"404-nak", c:"404", he:"נאקורו", en:"Nakuru", lat:-0.30, lon:36.07, pop:0.6, cap:0, port:0 },
  // Myanmar
  { id:"104-nay", c:"104", he:"נייפידו", en:"Naypyidaw", lat:19.76, lon:96.08, pop:0.7, cap:1, port:0 },
  { id:"104-yan", c:"104", he:"יאנגון", en:"Yangon", lat:16.84, lon:96.17, pop:5.8, cap:0, port:1 },
  { id:"104-man", c:"104", he:"מנדליי", en:"Mandalay", lat:21.96, lon:96.09, pop:1.6, cap:0, port:0 },
  { id:"104-sit", c:"104", he:"סיטווה", en:"Sittwe", lat:20.15, lon:92.90, pop:0.15, cap:0, port:1 },
  // Colombia
  { id:"170-bog", c:"170", he:"בוגוטה", en:"Bogotá", lat:4.71, lon:-74.07, pop:11.7, cap:1, port:0 },
  { id:"170-med", c:"170", he:"מדיין", en:"Medellín", lat:6.25, lon:-75.56, pop:4.2, cap:0, port:0 },
  { id:"170-cal", c:"170", he:"קאלי", en:"Cali", lat:3.45, lon:-76.53, pop:2.9, cap:0, port:0 },
  { id:"170-bar", c:"170", he:"ברנקייה", en:"Barranquilla", lat:10.96, lon:-74.80, pop:2.4, cap:0, port:1 },
  { id:"170-car", c:"170", he:"קרטחנה", en:"Cartagena", lat:10.39, lon:-75.48, pop:1.1, cap:0, port:1 },
  { id:"170-buc", c:"170", he:"בוקרמנגה", en:"Bucaramanga", lat:7.12, lon:-73.12, pop:1.4, cap:0, port:0 },
  // South Korea
  { id:"410-seo", c:"410", he:"סיאול", en:"Seoul", lat:37.57, lon:126.98, pop:25.5, cap:1, port:0 },
  { id:"410-bus", c:"410", he:"בוסאן", en:"Busan", lat:35.18, lon:129.08, pop:3.4, cap:0, port:1 },
  { id:"410-inc", c:"410", he:"אינצ'ון", en:"Incheon", lat:37.46, lon:126.71, pop:3, cap:0, port:1 },
  { id:"410-dae", c:"410", he:"דאגו", en:"Daegu", lat:35.87, lon:128.60, pop:2.2, cap:0, port:0 },
  { id:"410-daej", c:"410", he:"דג'ון", en:"Daejeon", lat:36.35, lon:127.38, pop:1.55, cap:0, port:0 },
  { id:"410-gwa", c:"410", he:"גוואנגג'ו", en:"Gwangju", lat:35.16, lon:126.85, pop:1.5, cap:0, port:0 },
  { id:"410-uls", c:"410", he:"אולסן", en:"Ulsan", lat:35.54, lon:129.31, pop:1.1, cap:0, port:1 },
  // Sudan
  { id:"729-kha", c:"729", he:"ח׳רטום", en:"Khartoum", lat:15.50, lon:32.56, pop:6.5, cap:1, port:0 },
  { id:"729-omd", c:"729", he:"אומדורמן", en:"Omdurman", lat:15.64, lon:32.48, pop:2.8, cap:0, port:0 },
  { id:"729-por", c:"729", he:"פורט סודאן", en:"Port Sudan", lat:19.62, lon:37.22, pop:0.5, cap:0, port:1 },
  { id:"729-nya", c:"729", he:"ניאלה", en:"Nyala", lat:12.05, lon:24.88, pop:0.9, cap:0, port:0 },
  { id:"729-elf", c:"729", he:"אל-פאשר", en:"El Fasher", lat:13.63, lon:25.35, pop:0.5, cap:0, port:0 },
  { id:"729-kas", c:"729", he:"כסלה", en:"Kassala", lat:15.45, lon:36.40, pop:0.5, cap:0, port:0 },
  // Uganda
  { id:"800-kam", c:"800", he:"קמפלה", en:"Kampala", lat:0.35, lon:32.58, pop:3.9, cap:1, port:0 },
  { id:"800-gul", c:"800", he:"גולו", en:"Gulu", lat:2.78, lon:32.30, pop:0.2, cap:0, port:0 },
  { id:"800-mba", c:"800", he:"מבררה", en:"Mbarara", lat:-0.61, lon:30.65, pop:0.2, cap:0, port:0 },
  // Spain
  { id:"724-mad", c:"724", he:"מדריד", en:"Madrid", lat:40.42, lon:-3.70, pop:6.8, cap:1, port:0 },
  { id:"724-bar", c:"724", he:"ברצלונה", en:"Barcelona", lat:41.39, lon:2.17, pop:5.7, cap:0, port:1 },
  { id:"724-val", c:"724", he:"ולנסיה", en:"Valencia", lat:39.47, lon:-0.38, pop:1.6, cap:0, port:1 },
  { id:"724-sev", c:"724", he:"סביליה", en:"Seville", lat:37.39, lon:-5.98, pop:1.3, cap:0, port:0 },
  { id:"724-bil", c:"724", he:"בילבאו", en:"Bilbao", lat:43.26, lon:-2.93, pop:1, cap:0, port:1 },
  { id:"724-mal", c:"724", he:"מלגה", en:"Málaga", lat:36.72, lon:-4.42, pop:1, cap:0, port:1 },
  { id:"724-car", c:"724", he:"קרטחנה", en:"Cartagena", lat:37.61, lon:-0.99, pop:0.21, cap:0, port:1 },
  { id:"724-las", c:"724", he:"לאס פלמאס", en:"Las Palmas", lat:28.12, lon:-15.44, pop:0.65, cap:0, port:1 },
  { id:"724-zar", c:"724", he:"סרגוסה", en:"Zaragoza", lat:41.65, lon:-0.89, pop:0.7, cap:0, port:0 },
  // Algeria
  { id:"012-alg", c:"012", he:"אלג'יר", en:"Algiers", lat:36.75, lon:3.06, pop:3, cap:1, port:1 },
  { id:"012-ora", c:"012", he:"אוראן", en:"Oran", lat:35.70, lon:-0.63, pop:1.6, cap:0, port:1 },
  { id:"012-con", c:"012", he:"קונסטנטין", en:"Constantine", lat:36.37, lon:6.61, pop:1, cap:0, port:0 },
  { id:"012-ann", c:"012", he:"ענאבה", en:"Annaba", lat:36.90, lon:7.77, pop:0.65, cap:0, port:1 },
  { id:"012-tam", c:"012", he:"תמנראסט", en:"Tamanrasset", lat:22.79, lon:5.53, pop:0.12, cap:0, port:0 },
  // Iraq
  { id:"368-bag", c:"368", he:"בגדאד", en:"Baghdad", lat:33.31, lon:44.37, pop:7.9, cap:1, port:0 },
  { id:"368-mos", c:"368", he:"מוסול", en:"Mosul", lat:36.34, lon:43.13, pop:1.8, cap:0, port:0 },
  { id:"368-bas", c:"368", he:"בצרה", en:"Basra", lat:30.51, lon:47.81, pop:1.5, cap:0, port:1 },
  { id:"368-erb", c:"368", he:"ארביל", en:"Erbil", lat:36.19, lon:44.01, pop:1, cap:0, port:0 },
  { id:"368-kir", c:"368", he:"כירכוכ", en:"Kirkuk", lat:35.47, lon:44.39, pop:0.9, cap:0, port:0 },
  { id:"368-naj", c:"368", he:"נג'ף", en:"Najaf", lat:32.00, lon:44.33, pop:0.8, cap:0, port:0 },
  { id:"368-kar", c:"368", he:"כרבלא", en:"Karbala", lat:32.62, lon:44.02, pop:0.8, cap:0, port:0 },
  { id:"368-sul", c:"368", he:"סולימאניה", en:"Sulaymaniyah", lat:35.56, lon:45.44, pop:0.9, cap:0, port:0 },
  // Argentina
  { id:"032-bue", c:"032", he:"בואנוס איירס", en:"Buenos Aires", lat:-34.60, lon:-58.38, pop:15.7, cap:1, port:1 },
  { id:"032-cor", c:"032", he:"קורדובה", en:"Córdoba", lat:-31.42, lon:-64.18, pop:1.6, cap:0, port:0 },
  { id:"032-ros", c:"032", he:"רוסריו", en:"Rosario", lat:-32.95, lon:-60.64, pop:1.5, cap:0, port:1 },
  { id:"032-men", c:"032", he:"מנדוסה", en:"Mendoza", lat:-32.89, lon:-68.83, pop:1.2, cap:0, port:0 },
  { id:"032-tuc", c:"032", he:"טוקומן", en:"Tucumán", lat:-26.81, lon:-65.22, pop:0.95, cap:0, port:0 },
  { id:"032-bah", c:"032", he:"באיה בלנקה", en:"Bahía Blanca", lat:-38.72, lon:-62.27, pop:0.32, cap:0, port:1 },
  { id:"032-ush", c:"032", he:"אושואיה", en:"Ushuaia", lat:-54.80, lon:-68.30, pop:0.08, cap:0, port:1 },
  { id:"032-mar", c:"032", he:"מר דל פלטה", en:"Mar del Plata", lat:-38.00, lon:-57.56, pop:0.66, cap:0, port:1 },
  // Afghanistan
  { id:"004-kab", c:"004", he:"קאבול", en:"Kabul", lat:34.56, lon:69.21, pop:4.8, cap:1, port:0 },
  { id:"004-kan", c:"004", he:"קנדהאר", en:"Kandahar", lat:31.61, lon:65.71, pop:0.7, cap:0, port:0 },
  { id:"004-her", c:"004", he:"הראת", en:"Herat", lat:34.35, lon:62.20, pop:0.6, cap:0, port:0 },
  { id:"004-maz", c:"004", he:"מזאר א-שריף", en:"Mazar-i-Sharif", lat:36.71, lon:67.11, pop:0.5, cap:0, port:0 },
  { id:"004-jal", c:"004", he:"ג'לאלאבאד", en:"Jalalabad", lat:34.43, lon:70.45, pop:0.4, cap:0, port:0 },
  // Yemen
  { id:"887-san", c:"887", he:"צנעא", en:"Sana'a", lat:15.37, lon:44.19, pop:3.3, cap:1, port:0 },
  { id:"887-ade", c:"887", he:"עדן", en:"Aden", lat:12.79, lon:45.03, pop:1.1, cap:0, port:1 },
  { id:"887-hod", c:"887", he:"חודיידה", en:"Hodeidah", lat:14.80, lon:42.95, pop:0.7, cap:0, port:1 },
  { id:"887-tai", c:"887", he:"תעז", en:"Taiz", lat:13.58, lon:44.02, pop:0.7, cap:0, port:0 },
  { id:"887-muk", c:"887", he:"מוכלא", en:"Mukalla", lat:14.54, lon:49.12, pop:0.35, cap:0, port:1 },
  { id:"887-mar", c:"887", he:"מאריב", en:"Marib", lat:15.46, lon:45.33, pop:0.4, cap:0, port:0 },
  // Canada
  { id:"124-ott", c:"124", he:"אוטווה", en:"Ottawa", lat:45.42, lon:-75.70, pop:1.5, cap:1, port:0 },
  { id:"124-tor", c:"124", he:"טורונטו", en:"Toronto", lat:43.65, lon:-79.38, pop:6.6, cap:0, port:0 },
  { id:"124-mon", c:"124", he:"מונטריאול", en:"Montreal", lat:45.50, lon:-73.57, pop:4.4, cap:0, port:1 },
  { id:"124-van", c:"124", he:"ונקובר", en:"Vancouver", lat:49.28, lon:-123.12, pop:2.8, cap:0, port:1 },
  { id:"124-cal", c:"124", he:"קלגרי", en:"Calgary", lat:51.05, lon:-114.07, pop:1.6, cap:0, port:0 },
  { id:"124-edm", c:"124", he:"אדמונטון", en:"Edmonton", lat:53.55, lon:-113.49, pop:1.5, cap:0, port:0 },
  { id:"124-win", c:"124", he:"ויניפג", en:"Winnipeg", lat:49.90, lon:-97.14, pop:0.9, cap:0, port:0 },
  { id:"124-que", c:"124", he:"קוויבק סיטי", en:"Quebec City", lat:46.81, lon:-71.21, pop:0.85, cap:0, port:1 },
  { id:"124-hal", c:"124", he:"הליפקס", en:"Halifax", lat:44.65, lon:-63.58, pop:0.47, cap:0, port:1 },
  { id:"124-iqa", c:"124", he:"איקלואיט", en:"Iqaluit", lat:63.75, lon:-68.52, pop:0.01, cap:0, port:0 },
  // Angola
  { id:"024-lua", c:"024", he:"לואנדה", en:"Luanda", lat:-8.84, lon:13.23, pop:9.3, cap:1, port:1 },
  { id:"024-hua", c:"024", he:"הואמבו", en:"Huambo", lat:-12.78, lon:15.74, pop:0.7, cap:0, port:0 },
  { id:"024-lob", c:"024", he:"לוביטו", en:"Lobito", lat:-12.36, lon:13.55, pop:0.4, cap:0, port:1 },
  { id:"024-lub", c:"024", he:"לובנגו", en:"Lubango", lat:-14.92, lon:13.49, pop:0.8, cap:0, port:0 },
  // Ukraine
  { id:"804-kyi", c:"804", he:"קייב", en:"Kyiv", lat:50.45, lon:30.52, pop:3, cap:1, port:0 },
  { id:"804-kha", c:"804", he:"חרקוב", en:"Kharkiv", lat:49.99, lon:36.23, pop:1.4, cap:0, port:0 },
  { id:"804-ode", c:"804", he:"אודסה", en:"Odesa", lat:46.48, lon:30.72, pop:1, cap:0, port:1 },
  { id:"804-dni", c:"804", he:"דניפרו", en:"Dnipro", lat:48.46, lon:35.05, pop:0.95, cap:0, port:0 },
  { id:"804-lvi", c:"804", he:"לבוב", en:"Lviv", lat:49.84, lon:24.03, pop:0.72, cap:0, port:0 },
  { id:"804-zap", c:"804", he:"זפוריז'יה", en:"Zaporizhzhia", lat:47.84, lon:35.14, pop:0.7, cap:0, port:0 },
  { id:"804-don", c:"804", he:"דונייצק", en:"Donetsk", lat:48.02, lon:37.80, pop:0.9, cap:0, port:0 }, // under Russian occupation since 2014/2022; internationally Ukraine
  { id:"804-mar", c:"804", he:"מריופול", en:"Mariupol", lat:47.10, lon:37.55, pop:0.2, cap:0, port:1 }, // under Russian occupation since 2022; internationally Ukraine
  { id:"804-khe", c:"804", he:"חרסון", en:"Kherson", lat:46.64, lon:32.62, pop:0.065, cap:0, port:1 },
  { id:"804-myk", c:"804", he:"מיקולאייב", en:"Mykolaiv", lat:46.98, lon:31.99, pop:0.4, cap:0, port:1 },
  { id:"804-luh", c:"804", he:"לוהנסק", en:"Luhansk", lat:48.57, lon:39.31, pop:0.4, cap:0, port:0 }, // under Russian occupation since 2014/2022; internationally Ukraine
  { id:"804-kry", c:"804", he:"קריבי ריה", en:"Kryvyi Rih", lat:47.91, lon:33.39, pop:0.6, cap:0, port:0 },
  // Morocco
  { id:"504-rab", c:"504", he:"רבאט", en:"Rabat", lat:34.02, lon:-6.84, pop:1.9, cap:1, port:0 },
  { id:"504-cas", c:"504", he:"קזבלנקה", en:"Casablanca", lat:33.57, lon:-7.59, pop:3.9, cap:0, port:1 },
  { id:"504-mar", c:"504", he:"מרקש", en:"Marrakesh", lat:31.63, lon:-7.99, pop:1.1, cap:0, port:0 },
  { id:"504-fez", c:"504", he:"פס", en:"Fez", lat:34.03, lon:-5.00, pop:1.3, cap:0, port:0 },
  { id:"504-tan", c:"504", he:"טנג'יר", en:"Tangier", lat:35.76, lon:-5.83, pop:1.3, cap:0, port:1 },
  { id:"504-aga", c:"504", he:"אגאדיר", en:"Agadir", lat:30.43, lon:-9.60, pop:1, cap:0, port:1 },
  { id:"504-laa", c:"504", he:"אל-עיון", en:"Laayoune", lat:27.15, lon:-13.20, pop:0.26, cap:0, port:0 }, // Western Sahara (disputed, Moroccan-administered); world.js Morocco shape contains it
  // Poland
  { id:"616-war", c:"616", he:"ורשה", en:"Warsaw", lat:52.23, lon:21.01, pop:1.8, cap:1, port:0 },
  { id:"616-kra", c:"616", he:"קרקוב", en:"Kraków", lat:50.06, lon:19.94, pop:0.8, cap:0, port:0 },
  { id:"616-odz", c:"616", he:"לודז'", en:"Łódź", lat:51.76, lon:19.46, pop:0.65, cap:0, port:0 },
  { id:"616-wro", c:"616", he:"ורוצלב", en:"Wrocław", lat:51.11, lon:17.04, pop:0.68, cap:0, port:0 },
  { id:"616-poz", c:"616", he:"פוזנן", en:"Poznań", lat:52.41, lon:16.93, pop:0.54, cap:0, port:0 },
  { id:"616-gda", c:"616", he:"גדנסק", en:"Gdańsk", lat:54.35, lon:18.65, pop:0.75, cap:0, port:1 },
  { id:"616-rze", c:"616", he:"ז'שוב", en:"Rzeszów", lat:50.04, lon:22.00, pop:0.2, cap:0, port:0 },
  { id:"616-szc", c:"616", he:"שצ'צ'ין", en:"Szczecin", lat:53.43, lon:14.55, pop:0.4, cap:0, port:1 },
  // Uzbekistan
  { id:"860-tas", c:"860", he:"טשקנט", en:"Tashkent", lat:41.30, lon:69.24, pop:2.95, cap:1, port:0 },
  { id:"860-sam", c:"860", he:"סמרקנד", en:"Samarkand", lat:39.65, lon:66.96, pop:0.6, cap:0, port:0 },
  { id:"860-nam", c:"860", he:"נמנגן", en:"Namangan", lat:41.00, lon:71.67, pop:0.7, cap:0, port:0 },
  { id:"860-buk", c:"860", he:"בוכרה", en:"Bukhara", lat:39.77, lon:64.42, pop:0.3, cap:0, port:0 },
  // Malaysia
  { id:"458-kua", c:"458", he:"קואלה לומפור", en:"Kuala Lumpur", lat:3.14, lon:101.69, pop:8.9, cap:1, port:0 },
  { id:"458-geo", c:"458", he:"ג'ורג' טאון", en:"George Town", lat:5.41, lon:100.33, pop:2.8, cap:0, port:1 },
  { id:"458-joh", c:"458", he:"ג'והור בהרו", en:"Johor Bahru", lat:1.49, lon:103.74, pop:1.1, cap:0, port:1 },
  { id:"458-kot", c:"458", he:"קוטה קינבלו", en:"Kota Kinabalu", lat:5.98, lon:116.07, pop:0.6, cap:0, port:1 },
  { id:"458-kuc", c:"458", he:"קוצ'ינג", en:"Kuching", lat:1.55, lon:110.36, pop:0.7, cap:0, port:0 },
  { id:"458-por", c:"458", he:"פורט קלאנג", en:"Port Klang", lat:3.00, lon:101.39, pop:0.25, cap:0, port:1 },
  // Mozambique
  { id:"508-map", c:"508", he:"מאפוטו", en:"Maputo", lat:-25.97, lon:32.57, pop:2, cap:1, port:1 },
  { id:"508-bei", c:"508", he:"ביירה", en:"Beira", lat:-19.84, lon:34.84, pop:0.65, cap:0, port:1 },
  { id:"508-nam", c:"508", he:"נמפולה", en:"Nampula", lat:-15.12, lon:39.27, pop:0.75, cap:0, port:0 },
  { id:"508-pem", c:"508", he:"פמבה", en:"Pemba", lat:-12.97, lon:40.52, pop:0.25, cap:0, port:1 },
  // Ghana
  { id:"288-acc", c:"288", he:"אקרה", en:"Accra", lat:5.60, lon:-0.19, pop:2.7, cap:1, port:1 },
  { id:"288-kum", c:"288", he:"קומאסי", en:"Kumasi", lat:6.69, lon:-1.62, pop:3.9, cap:0, port:0 },
  { id:"288-tam", c:"288", he:"תמאלה", en:"Tamale", lat:9.40, lon:-0.84, pop:0.7, cap:0, port:0 },
  { id:"288-tak", c:"288", he:"טקוראדי", en:"Takoradi", lat:4.90, lon:-1.76, pop:0.5, cap:0, port:1 },
  // Peru
  { id:"604-lim", c:"604", he:"לימה", en:"Lima", lat:-12.05, lon:-77.04, pop:11.4, cap:1, port:0 },
  { id:"604-cal", c:"604", he:"קאיאו", en:"Callao", lat:-12.06, lon:-77.15, pop:1.1, cap:0, port:1 },
  { id:"604-are", c:"604", he:"ארקיפה", en:"Arequipa", lat:-16.41, lon:-71.54, pop:1.2, cap:0, port:0 },
  { id:"604-tru", c:"604", he:"טרוחיו", en:"Trujillo", lat:-8.11, lon:-79.03, pop:1, cap:0, port:0 },
  { id:"604-cus", c:"604", he:"קוסקו", en:"Cusco", lat:-13.53, lon:-71.97, pop:0.5, cap:0, port:0 },
  { id:"604-iqu", c:"604", he:"איקיטוס", en:"Iquitos", lat:-3.75, lon:-73.25, pop:0.5, cap:0, port:0 },
  // Saudi Arabia
  { id:"682-riy", c:"682", he:"ריאד", en:"Riyadh", lat:24.71, lon:46.68, pop:7.95, cap:1, port:0 },
  { id:"682-jed", c:"682", he:"ג'דה", en:"Jeddah", lat:21.49, lon:39.19, pop:4.8, cap:0, port:1 },
  { id:"682-mec", c:"682", he:"מכה", en:"Mecca", lat:21.42, lon:39.83, pop:2.1, cap:0, port:0 },
  { id:"682-med", c:"682", he:"מדינה", en:"Medina", lat:24.47, lon:39.61, pop:1.5, cap:0, port:0 },
  { id:"682-dam", c:"682", he:"דמאם", en:"Dammam", lat:26.43, lon:50.10, pop:1.4, cap:0, port:1 },
  { id:"682-tab", c:"682", he:"תבוכ", en:"Tabuk", lat:28.38, lon:36.57, pop:0.7, cap:0, port:0 },
  { id:"682-jub", c:"682", he:"ג'ובייל", en:"Jubail", lat:27.01, lon:49.66, pop:0.25, cap:0, port:1 },
  { id:"682-jiz", c:"682", he:"ג'יזאן", en:"Jizan", lat:16.89, lon:42.55, pop:0.2, cap:0, port:1 },
  { id:"682-abh", c:"682", he:"אבהא", en:"Abha", lat:18.22, lon:42.51, pop:0.5, cap:0, port:0 },
  { id:"682-neo", c:"682", he:"נאום", en:"NEOM", lat:28.00, lon:35.20, pop:0.01, cap:0, port:0 },
  // Côte d'Ivoire
  { id:"384-yam", c:"384", he:"יאמוסוקרו", en:"Yamoussoukro", lat:6.83, lon:-5.29, pop:0.4, cap:1, port:0 },
  { id:"384-abi", c:"384", he:"אביג'אן", en:"Abidjan", lat:5.36, lon:-4.01, pop:5.9, cap:0, port:1 },
  { id:"384-bou", c:"384", he:"בואקה", en:"Bouaké", lat:7.69, lon:-5.03, pop:0.9, cap:0, port:0 },
  // Madagascar
  { id:"450-ant", c:"450", he:"אנטננריבו", en:"Antananarivo", lat:-18.88, lon:47.51, pop:4, cap:1, port:0 },
  { id:"450-toa", c:"450", he:"טואמסינה", en:"Toamasina", lat:-18.15, lon:49.40, pop:0.4, cap:0, port:1 },
  { id:"450-mah", c:"450", he:"מהג'נגה", en:"Mahajanga", lat:-15.72, lon:46.32, pop:0.3, cap:0, port:1 },
  // Cameroon
  { id:"120-yao", c:"120", he:"יאונדה", en:"Yaoundé", lat:3.85, lon:11.50, pop:4.8, cap:1, port:0 },
  { id:"120-dou", c:"120", he:"דואלה", en:"Douala", lat:4.05, lon:9.70, pop:4.2, cap:0, port:1 },
  { id:"120-gar", c:"120", he:"גרואה", en:"Garoua", lat:9.30, lon:13.40, pop:0.5, cap:0, port:0 },
  { id:"120-bam", c:"120", he:"במנדה", en:"Bamenda", lat:5.96, lon:10.15, pop:0.6, cap:0, port:0 },
  // Nepal
  { id:"524-kat", c:"524", he:"קטמנדו", en:"Kathmandu", lat:27.72, lon:85.32, pop:1.6, cap:1, port:0 },
  { id:"524-pok", c:"524", he:"פוקהרה", en:"Pokhara", lat:28.21, lon:83.99, pop:0.5, cap:0, port:0 },
  { id:"524-bir", c:"524", he:"בירטנגר", en:"Biratnagar", lat:26.45, lon:87.27, pop:0.25, cap:0, port:0 },
  // Venezuela
  { id:"862-car", c:"862", he:"קראקס", en:"Caracas", lat:10.48, lon:-66.90, pop:2.95, cap:1, port:0 },
  { id:"862-mar", c:"862", he:"מרקאיבו", en:"Maracaibo", lat:10.65, lon:-71.64, pop:2.4, cap:0, port:1 },
  { id:"862-val", c:"862", he:"ולנסיה", en:"Valencia", lat:10.16, lon:-68.00, pop:2, cap:0, port:0 },
  { id:"862-bar", c:"862", he:"ברקיסימטו", en:"Barquisimeto", lat:10.07, lon:-69.32, pop:1.3, cap:0, port:0 },
  { id:"862-pue", c:"862", he:"פוארטו קבלו", en:"Puerto Cabello", lat:10.47, lon:-68.01, pop:0.2, cap:0, port:1 },
  { id:"862-ciu", c:"862", he:"סיודד גואיאנה", en:"Ciudad Guayana", lat:8.35, lon:-62.65, pop:0.95, cap:0, port:0 },
  // Niger
  { id:"562-nia", c:"562", he:"ניאמיי", en:"Niamey", lat:13.51, lon:2.11, pop:1.5, cap:1, port:0 },
  { id:"562-zin", c:"562", he:"זינדר", en:"Zinder", lat:13.80, lon:8.99, pop:0.4, cap:0, port:0 },
  { id:"562-aga", c:"562", he:"אגדז", en:"Agadez", lat:16.97, lon:7.99, pop:0.15, cap:0, port:0 },
  { id:"562-mar", c:"562", he:"מראדי", en:"Maradi", lat:13.50, lon:7.10, pop:0.3, cap:0, port:0 },
  // Australia
  { id:"036-can", c:"036", he:"קנברה", en:"Canberra", lat:-35.28, lon:149.13, pop:0.47, cap:1, port:0 },
  { id:"036-syd", c:"036", he:"סידני", en:"Sydney", lat:-33.87, lon:151.21, pop:5.5, cap:0, port:1 },
  { id:"036-mel", c:"036", he:"מלבורן", en:"Melbourne", lat:-37.81, lon:144.96, pop:5.3, cap:0, port:1 },
  { id:"036-bri", c:"036", he:"בריסביין", en:"Brisbane", lat:-27.47, lon:153.03, pop:2.7, cap:0, port:1 },
  { id:"036-per", c:"036", he:"פרת'", en:"Perth", lat:-31.95, lon:115.86, pop:2.3, cap:0, port:1 },
  { id:"036-ade", c:"036", he:"אדלייד", en:"Adelaide", lat:-34.93, lon:138.60, pop:1.45, cap:0, port:1 },
  { id:"036-dar", c:"036", he:"דרווין", en:"Darwin", lat:-12.46, lon:130.84, pop:0.15, cap:0, port:1 },
  { id:"036-hob", c:"036", he:"הובארט", en:"Hobart", lat:-42.88, lon:147.33, pop:0.25, cap:0, port:1 },
  { id:"036-tow", c:"036", he:"טאונסוויל", en:"Townsville", lat:-19.26, lon:146.82, pop:0.2, cap:0, port:1 },
  // North Korea
  { id:"408-pyo", c:"408", he:"פיונגיאנג", en:"Pyongyang", lat:39.04, lon:125.76, pop:3.2, cap:1, port:0 },
  { id:"408-ham", c:"408", he:"האמהונג", en:"Hamhung", lat:39.92, lon:127.54, pop:0.8, cap:0, port:0 },
  { id:"408-cho", c:"408", he:"צ'ונגג'ין", en:"Chongjin", lat:41.80, lon:129.78, pop:0.7, cap:0, port:1 },
  { id:"408-nam", c:"408", he:"נאמפו", en:"Nampo", lat:38.73, lon:125.41, pop:0.4, cap:0, port:1 },
  { id:"408-won", c:"408", he:"וונסאן", en:"Wonsan", lat:39.15, lon:127.44, pop:0.4, cap:0, port:1 },
  { id:"408-kae", c:"408", he:"קאסונג", en:"Kaesong", lat:37.97, lon:126.55, pop:0.3, cap:0, port:0 },
  { id:"408-sin", c:"408", he:"סינואיג'ו", en:"Sinuiju", lat:40.10, lon:124.40, pop:0.4, cap:0, port:0 },
  // Syria
  { id:"760-dam", c:"760", he:"דמשק", en:"Damascus", lat:33.51, lon:36.29, pop:2.6, cap:1, port:0 },
  { id:"760-ale", c:"760", he:"חלב", en:"Aleppo", lat:36.20, lon:37.16, pop:2.2, cap:0, port:0 },
  { id:"760-hom", c:"760", he:"חומס", en:"Homs", lat:34.73, lon:36.71, pop:1, cap:0, port:0 },
  { id:"760-lat", c:"760", he:"לטקיה", en:"Latakia", lat:35.52, lon:35.79, pop:0.7, cap:0, port:1 },
  { id:"760-tar", c:"760", he:"טרטוס", en:"Tartus", lat:34.89, lon:35.89, pop:0.2, cap:0, port:1 },
  { id:"760-idl", c:"760", he:"אידליב", en:"Idlib", lat:35.93, lon:36.63, pop:0.8, cap:0, port:0 },
  { id:"760-dei", c:"760", he:"דיר א-זור", en:"Deir ez-Zor", lat:35.34, lon:40.14, pop:0.3, cap:0, port:0 },
  { id:"760-raq", c:"760", he:"א-רקה", en:"Raqqa", lat:35.95, lon:39.01, pop:0.3, cap:0, port:0 },
  { id:"760-qam", c:"760", he:"קמישלי", en:"Qamishli", lat:37.05, lon:41.22, pop:0.2, cap:0, port:0 },
  // Mali
  { id:"466-bam", c:"466", he:"במאקו", en:"Bamako", lat:12.64, lon:-8.00, pop:3, cap:1, port:0 },
  { id:"466-tim", c:"466", he:"טימבוקטו", en:"Timbuktu", lat:16.77, lon:-3.01, pop:0.05, cap:0, port:0 },
  { id:"466-gao", c:"466", he:"גאו", en:"Gao", lat:16.27, lon:-0.04, pop:0.1, cap:0, port:0 },
  { id:"466-mop", c:"466", he:"מופטי", en:"Mopti", lat:14.49, lon:-4.20, pop:0.15, cap:0, port:0 },
  // Burkina Faso
  { id:"854-oua", c:"854", he:"ואגאדוגו", en:"Ouagadougou", lat:12.37, lon:-1.52, pop:3.2, cap:1, port:0 },
  { id:"854-bob", c:"854", he:"בובו-דיולסו", en:"Bobo-Dioulasso", lat:11.18, lon:-4.29, pop:1, cap:0, port:0 },
  // Taiwan
  { id:"158-tai", c:"158", he:"טאיפיי", en:"Taipei", lat:25.03, lon:121.57, pop:7, cap:1, port:0 },
  { id:"158-kao", c:"158", he:"קאוסיונג", en:"Kaohsiung", lat:22.63, lon:120.30, pop:2.7, cap:0, port:1 },
  { id:"158-taic", c:"158", he:"טאיצ'ונג", en:"Taichung", lat:24.15, lon:120.67, pop:2.8, cap:0, port:0 },
  { id:"158-tain", c:"158", he:"טאינאן", en:"Tainan", lat:22.99, lon:120.21, pop:1.85, cap:0, port:0 },
  { id:"158-kee", c:"158", he:"קילונג", en:"Keelung", lat:25.13, lon:121.74, pop:0.36, cap:0, port:1 },
  { id:"158-hua", c:"158", he:"הואליין", en:"Hualien", lat:23.99, lon:121.60, pop:0.32, cap:0, port:1 },
  { id:"158-hsi", c:"158", he:"שינג'ו", en:"Hsinchu", lat:24.80, lon:120.97, pop:1, cap:0, port:0 },
  // Sri Lanka
  { id:"144-sri", c:"144", he:"סרי ג'איוורדנפורה קוטה", en:"Sri Jayawardenepura Kotte", lat:6.89, lon:79.92, pop:0.12, cap:1, port:0 },
  { id:"144-col", c:"144", he:"קולומבו", en:"Colombo", lat:6.93, lon:79.86, pop:0.75, cap:0, port:1 },
  { id:"144-kan", c:"144", he:"קנדי", en:"Kandy", lat:7.29, lon:80.63, pop:0.15, cap:0, port:0 },
  { id:"144-tri", c:"144", he:"טרינקומאלי", en:"Trincomalee", lat:8.59, lon:81.21, pop:0.1, cap:0, port:1 },
  { id:"144-ham", c:"144", he:"המבנטוטה", en:"Hambantota", lat:6.12, lon:81.12, pop:0.03, cap:0, port:1 },
  { id:"144-jaf", c:"144", he:"ג'פנה", en:"Jaffna", lat:9.66, lon:80.02, pop:0.09, cap:0, port:0 },
  // Malawi
  { id:"454-lil", c:"454", he:"לילונגווה", en:"Lilongwe", lat:-13.96, lon:33.79, pop:1.3, cap:1, port:0 },
  { id:"454-bla", c:"454", he:"בלנטייר", en:"Blantyre", lat:-15.79, lon:35.01, pop:1, cap:0, port:0 },
  // Zambia
  { id:"894-lus", c:"894", he:"לוסקה", en:"Lusaka", lat:-15.39, lon:28.32, pop:3.2, cap:1, port:0 },
  { id:"894-kit", c:"894", he:"קיטווה", en:"Kitwe", lat:-12.80, lon:28.21, pop:0.7, cap:0, port:0 },
  { id:"894-ndo", c:"894", he:"נדולה", en:"Ndola", lat:-12.96, lon:28.64, pop:0.6, cap:0, port:0 },
  // Chad
  { id:"148-ndj", c:"148", he:"נג'מנה", en:"N'Djamena", lat:12.13, lon:15.06, pop:1.7, cap:1, port:0 },
  { id:"148-mou", c:"148", he:"מונדו", en:"Moundou", lat:8.57, lon:16.08, pop:0.2, cap:0, port:0 },
  { id:"148-abe", c:"148", he:"אבשה", en:"Abéché", lat:13.83, lon:20.83, pop:0.15, cap:0, port:0 },
  // Kazakhstan
  { id:"398-ast", c:"398", he:"אסטנה", en:"Astana", lat:51.17, lon:71.45, pop:1.4, cap:1, port:0 },
  { id:"398-alm", c:"398", he:"אלמטי", en:"Almaty", lat:43.24, lon:76.89, pop:2.3, cap:0, port:0 },
  { id:"398-shy", c:"398", he:"שימקנט", en:"Shymkent", lat:42.32, lon:69.60, pop:1.2, cap:0, port:0 },
  { id:"398-kar", c:"398", he:"קרגנדה", en:"Karaganda", lat:49.81, lon:73.10, pop:0.5, cap:0, port:0 },
  { id:"398-akt", c:"398", he:"אקטאו", en:"Aktau", lat:43.65, lon:51.16, pop:0.27, cap:0, port:1 },
  { id:"398-aty", c:"398", he:"אטיראו", en:"Atyrau", lat:47.12, lon:51.92, pop:0.35, cap:0, port:0 },
  { id:"398-bai", c:"398", he:"בייקונור", en:"Baikonur", lat:45.62, lon:63.31, pop:0.08, cap:0, port:0 },
  // Chile
  { id:"152-san", c:"152", he:"סנטיאגו", en:"Santiago", lat:-33.45, lon:-70.67, pop:6.9, cap:1, port:0 },
  { id:"152-val", c:"152", he:"ולפראיסו", en:"Valparaíso", lat:-33.05, lon:-71.62, pop:1, cap:0, port:1 },
  { id:"152-con", c:"152", he:"קונספסיון", en:"Concepción", lat:-36.83, lon:-73.05, pop:1, cap:0, port:1 },
  { id:"152-ant", c:"152", he:"אנטופגסטה", en:"Antofagasta", lat:-23.65, lon:-70.40, pop:0.43, cap:0, port:1 },
  { id:"152-pun", c:"152", he:"פונטה ארנס", en:"Punta Arenas", lat:-53.16, lon:-70.91, pop:0.13, cap:0, port:1 },
  // Somalia
  { id:"706-mog", c:"706", he:"מוגדישו", en:"Mogadishu", lat:2.05, lon:45.32, pop:2.8, cap:1, port:1 },
  { id:"706-har", c:"706", he:"הרגייסה", en:"Hargeisa", lat:9.56, lon:44.06, pop:1.2, cap:0, port:0 }, // capital of self-declared Somaliland (unrecognized); assigned to Somalia
  { id:"706-ber", c:"706", he:"ברברה", en:"Berbera", lat:10.44, lon:45.01, pop:0.25, cap:0, port:1 }, // in self-declared Somaliland; assigned to Somalia
  { id:"706-kis", c:"706", he:"קיסמאיו", en:"Kismayo", lat:-0.36, lon:42.55, pop:0.2, cap:0, port:1 },
  { id:"706-bos", c:"706", he:"בוסאסו", en:"Bosaso", lat:11.28, lon:49.18, pop:0.4, cap:0, port:1 },
  // Romania
  { id:"642-buc", c:"642", he:"בוקרשט", en:"Bucharest", lat:44.43, lon:26.10, pop:1.8, cap:1, port:0 },
  { id:"642-clu", c:"642", he:"קלוז'-נאפוקה", en:"Cluj-Napoca", lat:46.77, lon:23.60, pop:0.4, cap:0, port:0 },
  { id:"642-ias", c:"642", he:"יאשי", en:"Iași", lat:47.16, lon:27.59, pop:0.4, cap:0, port:0 },
  { id:"642-con", c:"642", he:"קונסטנצה", en:"Constanța", lat:44.18, lon:28.63, pop:0.42, cap:0, port:1 },
  { id:"642-tim", c:"642", he:"טימישוארה", en:"Timișoara", lat:45.75, lon:21.23, pop:0.33, cap:0, port:0 },
  // Senegal
  { id:"686-dak", c:"686", he:"דקאר", en:"Dakar", lat:14.72, lon:-17.47, pop:3.5, cap:1, port:1 },
  { id:"686-tou", c:"686", he:"טובה", en:"Touba", lat:14.85, lon:-15.88, pop:1, cap:0, port:0 },
  { id:"686-sai", c:"686", he:"סן-לואי", en:"Saint-Louis", lat:16.00, lon:-16.47, pop:0.25, cap:0, port:0 },
  // Guatemala
  { id:"320-gua", c:"320", he:"גואטמלה סיטי", en:"Guatemala City", lat:14.63, lon:-90.51, pop:3.1, cap:1, port:0 },
  { id:"320-que", c:"320", he:"קצאלטננגו", en:"Quetzaltenango", lat:14.83, lon:-91.52, pop:0.3, cap:0, port:0 },
  { id:"320-pue", c:"320", he:"פוארטו באריוס", en:"Puerto Barrios", lat:15.73, lon:-88.59, pop:0.1, cap:0, port:1 },
  // Ecuador
  { id:"218-qui", c:"218", he:"קיטו", en:"Quito", lat:-0.18, lon:-78.47, pop:2, cap:1, port:0 },
  { id:"218-gua", c:"218", he:"גואיאקיל", en:"Guayaquil", lat:-2.19, lon:-79.89, pop:3.2, cap:0, port:1 },
  { id:"218-cue", c:"218", he:"קואנקה", en:"Cuenca", lat:-2.90, lon:-79.00, pop:0.45, cap:0, port:0 },
  // Netherlands
  { id:"528-ams", c:"528", he:"אמסטרדם", en:"Amsterdam", lat:52.37, lon:4.90, pop:1.2, cap:1, port:1 },
  { id:"528-rot", c:"528", he:"רוטרדם", en:"Rotterdam", lat:51.92, lon:4.48, pop:1, cap:0, port:1 },
  { id:"528-the", c:"528", he:"האג", en:"The Hague", lat:52.08, lon:4.30, pop:0.8, cap:0, port:0 },
  { id:"528-utr", c:"528", he:"אוטרכט", en:"Utrecht", lat:52.09, lon:5.12, pop:0.5, cap:0, port:0 },
  { id:"528-ein", c:"528", he:"איינדהובן", en:"Eindhoven", lat:51.44, lon:5.48, pop:0.45, cap:0, port:0 },
  // Cambodia
  { id:"116-phn", c:"116", he:"פנום פן", en:"Phnom Penh", lat:11.56, lon:104.92, pop:2.4, cap:1, port:0 },
  { id:"116-sie", c:"116", he:"סיאם ריפ", en:"Siem Reap", lat:13.36, lon:103.86, pop:0.25, cap:0, port:0 },
  { id:"116-sih", c:"116", he:"סיהאנוקוויל", en:"Sihanoukville", lat:10.63, lon:103.52, pop:0.2, cap:0, port:1 },
  { id:"116-bat", c:"116", he:"באטמבנג", en:"Battambang", lat:13.10, lon:103.20, pop:0.2, cap:0, port:0 },
  // Zimbabwe
  { id:"716-har", c:"716", he:"הרארה", en:"Harare", lat:-17.83, lon:31.05, pop:1.6, cap:1, port:0 },
  { id:"716-bul", c:"716", he:"בולוואיו", en:"Bulawayo", lat:-20.15, lon:28.58, pop:0.7, cap:0, port:0 },
  { id:"716-mut", c:"716", he:"מוטארה", en:"Mutare", lat:-18.97, lon:32.67, pop:0.25, cap:0, port:0 },
  // Guinea
  { id:"324-con", c:"324", he:"קונקרי", en:"Conakry", lat:9.64, lon:-13.58, pop:2.1, cap:1, port:1 },
  { id:"324-kan", c:"324", he:"קנקן", en:"Kankan", lat:10.39, lon:-9.31, pop:0.25, cap:0, port:0 },
  { id:"324-nze", c:"324", he:"נזרקורה", en:"Nzérékoré", lat:7.76, lon:-8.82, pop:0.25, cap:0, port:0 },
  // Benin
  { id:"204-por", c:"204", he:"פורטו נובו", en:"Porto-Novo", lat:6.50, lon:2.63, pop:0.3, cap:1, port:0 },
  { id:"204-cot", c:"204", he:"קוטונו", en:"Cotonou", lat:6.37, lon:2.43, pop:0.75, cap:0, port:1 },
  { id:"204-par", c:"204", he:"פארקו", en:"Parakou", lat:9.34, lon:2.63, pop:0.27, cap:0, port:0 },
  // Rwanda
  { id:"646-kig", c:"646", he:"קיגאלי", en:"Kigali", lat:-1.95, lon:30.06, pop:1.3, cap:1, port:0 },
  { id:"646-but", c:"646", he:"בוטארה", en:"Butare", lat:-2.60, lon:29.74, pop:0.1, cap:0, port:0 },
  // Burundi
  { id:"108-git", c:"108", he:"גיטגה", en:"Gitega", lat:-3.43, lon:29.93, pop:0.14, cap:1, port:0 },
  { id:"108-buj", c:"108", he:"בוז'ומבורה", en:"Bujumbura", lat:-3.36, lon:29.36, pop:1.2, cap:0, port:0 },
  // Bolivia
  { id:"068-suc", c:"068", he:"סוקרה", en:"Sucre", lat:-19.04, lon:-65.26, pop:0.3, cap:1, port:0 },
  { id:"068-lap", c:"068", he:"לה פאס", en:"La Paz", lat:-16.50, lon:-68.15, pop:1.95, cap:0, port:0 },
  { id:"068-san", c:"068", he:"סנטה קרוס", en:"Santa Cruz", lat:-17.78, lon:-63.18, pop:2, cap:0, port:0 },
  { id:"068-coc", c:"068", he:"קוצ'במבה", en:"Cochabamba", lat:-17.39, lon:-66.16, pop:1.4, cap:0, port:0 },
  // Tunisia
  { id:"788-tun", c:"788", he:"תוניס", en:"Tunis", lat:36.81, lon:10.18, pop:2.5, cap:1, port:1 },
  { id:"788-sfa", c:"788", he:"ספאקס", en:"Sfax", lat:34.74, lon:10.76, pop:0.7, cap:0, port:1 },
  { id:"788-sou", c:"788", he:"סוסה", en:"Sousse", lat:35.83, lon:10.64, pop:0.3, cap:0, port:1 },
  { id:"788-biz", c:"788", he:"ביזרטה", en:"Bizerte", lat:37.27, lon:9.87, pop:0.15, cap:0, port:1 },
  // S. Sudan
  { id:"728-jub", c:"728", he:"ג'ובה", en:"Juba", lat:4.86, lon:31.57, pop:0.5, cap:1, port:0 },
  { id:"728-mal", c:"728", he:"מלקל", en:"Malakal", lat:9.53, lon:31.66, pop:0.15, cap:0, port:0 },
  { id:"728-wau", c:"728", he:"ואו", en:"Wau", lat:7.70, lon:27.99, pop:0.15, cap:0, port:0 },
  // Haiti
  { id:"332-por", c:"332", he:"פורט-או-פרנס", en:"Port-au-Prince", lat:18.59, lon:-72.31, pop:3, cap:1, port:1 },
  { id:"332-cap", c:"332", he:"קאפ האיטיין", en:"Cap-Haïtien", lat:19.76, lon:-72.20, pop:0.3, cap:0, port:1 },
  // Belgium
  { id:"056-bru", c:"056", he:"בריסל", en:"Brussels", lat:50.85, lon:4.35, pop:2.1, cap:1, port:0 },
  { id:"056-ant", c:"056", he:"אנטוורפן", en:"Antwerp", lat:51.22, lon:4.40, pop:1.1, cap:0, port:1 },
  { id:"056-ghe", c:"056", he:"גנט", en:"Ghent", lat:51.05, lon:3.72, pop:0.55, cap:0, port:0 },
  { id:"056-lie", c:"056", he:"לייז'", en:"Liège", lat:50.63, lon:5.57, pop:0.75, cap:0, port:0 },
  // Dominican Rep.
  { id:"214-san", c:"214", he:"סנטו דומינגו", en:"Santo Domingo", lat:18.49, lon:-69.93, pop:3.5, cap:1, port:1 },
  { id:"214-sant", c:"214", he:"סנטיאגו דה לוס קבאיירוס", en:"Santiago de los Caballeros", lat:19.45, lon:-70.70, pop:1, cap:0, port:0 },
  // Jordan
  { id:"400-amm", c:"400", he:"עמאן", en:"Amman", lat:31.95, lon:35.93, pop:2.3, cap:1, port:0 },
  { id:"400-zar", c:"400", he:"זרקא", en:"Zarqa", lat:32.07, lon:36.09, pop:0.8, cap:0, port:0 },
  { id:"400-irb", c:"400", he:"אירביד", en:"Irbid", lat:32.56, lon:35.85, pop:0.7, cap:0, port:0 },
  { id:"400-aqa", c:"400", he:"עקבה", en:"Aqaba", lat:29.53, lon:35.01, pop:0.2, cap:0, port:1 },
  // United Arab Emirates
  { id:"784-abu", c:"784", he:"אבו דאבי", en:"Abu Dhabi", lat:24.45, lon:54.38, pop:1.6, cap:1, port:1 },
  { id:"784-dub", c:"784", he:"דובאי", en:"Dubai", lat:25.20, lon:55.27, pop:3.7, cap:0, port:1 },
  { id:"784-sha", c:"784", he:"שארג'ה", en:"Sharjah", lat:25.35, lon:55.42, pop:1.8, cap:0, port:1 },
  { id:"784-fuj", c:"784", he:"פוג'יירה", en:"Fujairah", lat:25.12, lon:56.33, pop:0.1, cap:0, port:1 },
  // Honduras
  { id:"340-teg", c:"340", he:"טגוסיגלפה", en:"Tegucigalpa", lat:14.07, lon:-87.19, pop:1.5, cap:1, port:0 },
  { id:"340-san", c:"340", he:"סן פדרו סולה", en:"San Pedro Sula", lat:15.50, lon:-88.03, pop:0.95, cap:0, port:0 },
  { id:"340-pue", c:"340", he:"פוארטו קורטס", en:"Puerto Cortés", lat:15.85, lon:-87.94, pop:0.1, cap:0, port:1 },
  // Cuba
  { id:"192-hav", c:"192", he:"הוואנה", en:"Havana", lat:23.11, lon:-82.37, pop:2.15, cap:1, port:1 },
  { id:"192-san", c:"192", he:"סנטיאגו דה קובה", en:"Santiago de Cuba", lat:20.02, lon:-75.82, pop:0.5, cap:0, port:1 },
  { id:"192-cam", c:"192", he:"קמגואיי", en:"Camagüey", lat:21.38, lon:-77.92, pop:0.32, cap:0, port:0 },
  { id:"192-gua", c:"192", he:"גואנטנמו", en:"Guantánamo", lat:20.14, lon:-75.21, pop:0.22, cap:0, port:0 },
  // Papua New Guinea
  { id:"598-por", c:"598", he:"פורט מורסבי", en:"Port Moresby", lat:-9.44, lon:147.18, pop:0.4, cap:1, port:1 },
  { id:"598-lae", c:"598", he:"לאה", en:"Lae", lat:-6.72, lon:146.99, pop:0.15, cap:0, port:1 },
  // Tajikistan
  { id:"762-dus", c:"762", he:"דושנבה", en:"Dushanbe", lat:38.56, lon:68.77, pop:1, cap:1, port:0 },
  { id:"762-khu", c:"762", he:"חוג'נד", en:"Khujand", lat:40.28, lon:69.62, pop:0.2, cap:0, port:0 },
  // Czechia
  { id:"203-pra", c:"203", he:"פראג", en:"Prague", lat:50.08, lon:14.44, pop:1.35, cap:1, port:0 },
  { id:"203-brn", c:"203", he:"ברנו", en:"Brno", lat:49.20, lon:16.61, pop:0.4, cap:0, port:0 },
  { id:"203-ost", c:"203", he:"אוסטרבה", en:"Ostrava", lat:49.82, lon:18.26, pop:0.3, cap:0, port:0 },
  // Sweden
  { id:"752-sto", c:"752", he:"סטוקהולם", en:"Stockholm", lat:59.33, lon:18.07, pop:1.7, cap:1, port:1 },
  { id:"752-got", c:"752", he:"גטבורג", en:"Gothenburg", lat:57.71, lon:11.97, pop:0.65, cap:0, port:1 },
  { id:"752-mal", c:"752", he:"מלמו", en:"Malmö", lat:55.60, lon:13.00, pop:0.35, cap:0, port:1 },
  { id:"752-vis", c:"752", he:"ויסבי", en:"Visby", lat:57.64, lon:18.30, pop:0.03, cap:0, port:1 },
  { id:"752-kir", c:"752", he:"קירונה", en:"Kiruna", lat:67.86, lon:20.23, pop:0.02, cap:0, port:0 },
  // Portugal
  { id:"620-lis", c:"620", he:"ליסבון", en:"Lisbon", lat:38.72, lon:-9.14, pop:3, cap:1, port:1 },
  { id:"620-por", c:"620", he:"פורטו", en:"Porto", lat:41.15, lon:-8.61, pop:1.7, cap:0, port:1 },
  { id:"620-bra", c:"620", he:"בראגה", en:"Braga", lat:41.55, lon:-8.42, pop:0.2, cap:0, port:0 },
  { id:"620-pon", c:"620", he:"פונטה דלגדה", en:"Ponta Delgada", lat:37.74, lon:-25.67, pop:0.07, cap:0, port:1 },
  // Azerbaijan
  { id:"031-bak", c:"031", he:"באקו", en:"Baku", lat:40.41, lon:49.87, pop:2.4, cap:1, port:1 },
  { id:"031-gan", c:"031", he:"גנג'ה", en:"Ganja", lat:40.68, lon:46.36, pop:0.34, cap:0, port:0 },
  { id:"031-nak", c:"031", he:"נחצ'יוואן", en:"Nakhchivan", lat:39.21, lon:45.41, pop:0.1, cap:0, port:0 },
  { id:"031-shu", c:"031", he:"שושה", en:"Shusha", lat:39.76, lon:46.75, pop:0.01, cap:0, port:0 }, // Nagorno-Karabakh, under Azerbaijani control since 2023
  { id:"031-sum", c:"031", he:"סומגאיית", en:"Sumqayit", lat:40.59, lon:49.67, pop:0.35, cap:0, port:0 },
  // Israel
  { id:"376-jer", c:"376", he:"ירושלים", en:"Jerusalem", lat:31.78, lon:35.18, pop:1.25, cap:1, port:0 }, // seat of government; capital status internationally disputed
  { id:"376-tel", c:"376", he:"תל אביב", en:"Tel Aviv", lat:32.09, lon:34.78, pop:4.4, cap:0, port:0 },
  { id:"376-hai", c:"376", he:"חיפה", en:"Haifa", lat:32.79, lon:34.99, pop:1.1, cap:0, port:1 },
  { id:"376-bee", c:"376", he:"באר שבע", en:"Be'er Sheva", lat:31.25, lon:34.79, pop:0.38, cap:0, port:0 },
  { id:"376-eil", c:"376", he:"אילת", en:"Eilat", lat:29.56, lon:34.95, pop:0.06, cap:0, port:1 },
  { id:"376-ash", c:"376", he:"אשדוד", en:"Ashdod", lat:31.80, lon:34.65, pop:0.23, cap:0, port:1 },
  { id:"376-ashk", c:"376", he:"אשקלון", en:"Ashkelon", lat:31.67, lon:34.57, pop:0.15, cap:0, port:0 },
  { id:"376-naz", c:"376", he:"נצרת", en:"Nazareth", lat:32.70, lon:35.30, pop:0.3, cap:0, port:0 },
  { id:"376-dim", c:"376", he:"דימונה", en:"Dimona", lat:31.07, lon:35.03, pop:0.04, cap:0, port:0 },
  { id:"376-kir", c:"376", he:"קריית שמונה", en:"Kiryat Shmona", lat:33.21, lon:35.57, pop:0.02, cap:0, port:0 },
  { id:"376-net", c:"376", he:"נתניה", en:"Netanya", lat:32.33, lon:34.86, pop:0.25, cap:0, port:0 },
  { id:"376-ris", c:"376", he:"ראשון לציון", en:"Rishon LeZion", lat:31.96, lon:34.80, pop:0.26, cap:0, port:0 },
  // Greece
  { id:"300-ath", c:"300", he:"אתונה", en:"Athens", lat:37.98, lon:23.73, pop:3.15, cap:1, port:0 },
  { id:"300-pir", c:"300", he:"פיראוס", en:"Piraeus", lat:37.94, lon:23.65, pop:0.45, cap:0, port:1 },
  { id:"300-the", c:"300", he:"סלוניקי", en:"Thessaloniki", lat:40.64, lon:22.94, pop:1, cap:0, port:1 },
  { id:"300-pat", c:"300", he:"פטרס", en:"Patras", lat:38.25, lon:21.73, pop:0.22, cap:0, port:1 },
  { id:"300-her", c:"300", he:"הרקליון", en:"Heraklion", lat:35.34, lon:25.13, pop:0.21, cap:0, port:1 },
  { id:"300-sou", c:"300", he:"מפרץ סודה", en:"Souda Bay", lat:35.49, lon:24.08, pop:0.01, cap:0, port:1 },
  { id:"300-rho", c:"300", he:"רודוס", en:"Rhodes", lat:36.43, lon:28.22, pop:0.06, cap:0, port:1 },
  // Togo
  { id:"768-lom", c:"768", he:"לומה", en:"Lomé", lat:6.13, lon:1.22, pop:2, cap:1, port:1 },
  { id:"768-sok", c:"768", he:"סוקודה", en:"Sokodé", lat:8.98, lon:1.13, pop:0.12, cap:0, port:0 },
  // Hungary
  { id:"348-bud", c:"348", he:"בודפשט", en:"Budapest", lat:47.50, lon:19.04, pop:1.78, cap:1, port:0 },
  { id:"348-deb", c:"348", he:"דברצן", en:"Debrecen", lat:47.53, lon:21.63, pop:0.2, cap:0, port:0 },
  { id:"348-sze", c:"348", he:"סגד", en:"Szeged", lat:46.25, lon:20.15, pop:0.16, cap:0, port:0 },
  // Austria
  { id:"040-vie", c:"040", he:"וינה", en:"Vienna", lat:48.21, lon:16.37, pop:2, cap:1, port:0 },
  { id:"040-gra", c:"040", he:"גראץ", en:"Graz", lat:47.07, lon:15.44, pop:0.3, cap:0, port:0 },
  { id:"040-lin", c:"040", he:"לינץ", en:"Linz", lat:48.31, lon:14.29, pop:0.21, cap:0, port:0 },
  { id:"040-sal", c:"040", he:"זלצבורג", en:"Salzburg", lat:47.81, lon:13.04, pop:0.16, cap:0, port:0 },
  { id:"040-inn", c:"040", he:"אינסברוק", en:"Innsbruck", lat:47.27, lon:11.40, pop:0.13, cap:0, port:0 },
  // Switzerland
  { id:"756-ber", c:"756", he:"ברן", en:"Bern", lat:46.95, lon:7.45, pop:0.43, cap:1, port:0 },
  { id:"756-zur", c:"756", he:"ציריך", en:"Zurich", lat:47.38, lon:8.54, pop:1.4, cap:0, port:0 },
  { id:"756-gen", c:"756", he:"ז'נבה", en:"Geneva", lat:46.20, lon:6.14, pop:0.6, cap:0, port:0 },
  { id:"756-bas", c:"756", he:"באזל", en:"Basel", lat:47.56, lon:7.59, pop:0.55, cap:0, port:0 },
  // Belarus
  { id:"112-min", c:"112", he:"מינסק", en:"Minsk", lat:53.90, lon:27.57, pop:2, cap:1, port:0 },
  { id:"112-gom", c:"112", he:"הומל", en:"Gomel", lat:52.44, lon:30.98, pop:0.5, cap:0, port:0 },
  { id:"112-bre", c:"112", he:"ברסט", en:"Brest", lat:52.10, lon:23.69, pop:0.35, cap:0, port:0 },
  { id:"112-vit", c:"112", he:"ויטבסק", en:"Vitebsk", lat:55.19, lon:30.20, pop:0.36, cap:0, port:0 },
  { id:"112-gro", c:"112", he:"הרודנה", en:"Grodno", lat:53.68, lon:23.83, pop:0.37, cap:0, port:0 },
  // Sierra Leone
  { id:"694-fre", c:"694", he:"פריטאון", en:"Freetown", lat:8.48, lon:-13.23, pop:1.4, cap:1, port:1 },
  { id:"694-bo", c:"694", he:"בו", en:"Bo", lat:7.96, lon:-11.74, pop:0.2, cap:0, port:0 },
  // Laos
  { id:"418-vie", c:"418", he:"וינטיאן", en:"Vientiane", lat:17.97, lon:102.63, pop:0.75, cap:1, port:0 },
  { id:"418-lua", c:"418", he:"לואנג פרבנג", en:"Luang Prabang", lat:19.89, lon:102.13, pop:0.06, cap:0, port:0 },
  { id:"418-pak", c:"418", he:"פאקסה", en:"Pakse", lat:15.12, lon:105.80, pop:0.1, cap:0, port:0 },
  // Turkmenistan
  { id:"795-ash", c:"795", he:"אשגבט", en:"Ashgabat", lat:37.96, lon:58.33, pop:1, cap:1, port:0 },
  { id:"795-tur", c:"795", he:"טורקמנאבאט", en:"Türkmenabat", lat:39.07, lon:63.58, pop:0.25, cap:0, port:0 },
  { id:"795-turk", c:"795", he:"טורקמנבאשי", en:"Türkmenbaşy", lat:40.02, lon:52.96, pop:0.07, cap:0, port:1 },
  // Libya
  { id:"434-tri", c:"434", he:"טריפולי", en:"Tripoli", lat:32.89, lon:13.19, pop:1.2, cap:1, port:1 },
  { id:"434-ben", c:"434", he:"בנגאזי", en:"Benghazi", lat:32.12, lon:20.07, pop:0.85, cap:0, port:1 },
  { id:"434-mis", c:"434", he:"מיסראתה", en:"Misrata", lat:32.38, lon:15.09, pop:0.4, cap:0, port:1 },
  { id:"434-sir", c:"434", he:"סירת", en:"Sirte", lat:31.21, lon:16.59, pop:0.13, cap:0, port:1 },
  { id:"434-tob", c:"434", he:"טוברוק", en:"Tobruk", lat:32.08, lon:23.96, pop:0.14, cap:0, port:1 },
  { id:"434-sab", c:"434", he:"סבהא", en:"Sabha", lat:27.04, lon:14.43, pop:0.13, cap:0, port:0 },
  // Kyrgyzstan
  { id:"417-bis", c:"417", he:"בישקק", en:"Bishkek", lat:42.87, lon:74.59, pop:1.1, cap:1, port:0 },
  { id:"417-osh", c:"417", he:"אוש", en:"Osh", lat:40.51, lon:72.80, pop:0.35, cap:0, port:0 },
  // Nicaragua
  { id:"558-man", c:"558", he:"מנגואה", en:"Managua", lat:12.11, lon:-86.24, pop:1.1, cap:1, port:0 },
  { id:"558-leo", c:"558", he:"לאון", en:"León", lat:12.43, lon:-86.88, pop:0.2, cap:0, port:0 },
  { id:"558-blu", c:"558", he:"בלופילדס", en:"Bluefields", lat:12.01, lon:-83.76, pop:0.05, cap:0, port:1 },
  // Paraguay
  { id:"600-asu", c:"600", he:"אסונסיון", en:"Asunción", lat:-25.26, lon:-57.58, pop:3.5, cap:1, port:0 },
  { id:"600-ciu", c:"600", he:"סיודד דל אסטה", en:"Ciudad del Este", lat:-25.51, lon:-54.64, pop:0.4, cap:0, port:0 },
  { id:"600-enc", c:"600", he:"אנקרנסיון", en:"Encarnación", lat:-27.33, lon:-55.87, pop:0.13, cap:0, port:0 },
  // Bulgaria
  { id:"100-sof", c:"100", he:"סופיה", en:"Sofia", lat:42.70, lon:23.32, pop:1.3, cap:1, port:0 },
  { id:"100-plo", c:"100", he:"פלובדיב", en:"Plovdiv", lat:42.14, lon:24.75, pop:0.4, cap:0, port:0 },
  { id:"100-var", c:"100", he:"ורנה", en:"Varna", lat:43.21, lon:27.91, pop:0.35, cap:0, port:1 },
  { id:"100-bur", c:"100", he:"בורגס", en:"Burgas", lat:42.50, lon:27.47, pop:0.21, cap:0, port:1 },
  // Serbia
  { id:"688-bel", c:"688", he:"בלגרד", en:"Belgrade", lat:44.79, lon:20.45, pop:1.7, cap:1, port:0 },
  { id:"688-nov", c:"688", he:"נובי סאד", en:"Novi Sad", lat:45.25, lon:19.84, pop:0.38, cap:0, port:0 },
  { id:"688-nis", c:"688", he:"ניש", en:"Niš", lat:43.32, lon:21.90, pop:0.26, cap:0, port:0 },
  // Congo
  { id:"178-bra", c:"178", he:"ברזוויל", en:"Brazzaville", lat:-4.27, lon:15.28, pop:2.6, cap:1, port:0 },
  { id:"178-poi", c:"178", he:"פואנט נואר", en:"Pointe-Noire", lat:-4.78, lon:11.86, pop:1.3, cap:0, port:1 },
  // El Salvador
  { id:"222-san", c:"222", he:"סן סלבדור", en:"San Salvador", lat:13.69, lon:-89.22, pop:1.2, cap:1, port:0 },
  { id:"222-sant", c:"222", he:"סנטה אנה", en:"Santa Ana", lat:13.99, lon:-89.56, pop:0.27, cap:0, port:0 },
  { id:"222-sanm", c:"222", he:"סן מיגל", en:"San Miguel", lat:13.48, lon:-88.18, pop:0.25, cap:0, port:0 },
  // Denmark
  { id:"208-cop", c:"208", he:"קופנהגן", en:"Copenhagen", lat:55.68, lon:12.57, pop:1.4, cap:1, port:1 },
  { id:"208-aar", c:"208", he:"אורהוס", en:"Aarhus", lat:56.16, lon:10.20, pop:0.35, cap:0, port:1 },
  { id:"208-ode", c:"208", he:"אודנסה", en:"Odense", lat:55.40, lon:10.40, pop:0.18, cap:0, port:0 },
  // Greenland
  { id:"304-nuu", c:"304", he:"נואוק", en:"Nuuk", lat:64.18, lon:-51.72, pop:0.02, cap:0, port:1 },
  { id:"304-pit", c:"304", he:"פיטופיק", en:"Pituffik", lat:76.53, lon:-68.70, pop:0.001, cap:0, port:0 },
  // Faeroe Is.
  { id:"234-tor", c:"234", he:"טורסהאבן", en:"Tórshavn", lat:62.01, lon:-6.77, pop:0.02, cap:0, port:1 },
  // Singapore
  { id:"702-sin", c:"702", he:"סינגפור", en:"Singapore", lat:1.29, lon:103.85, pop:6.1, cap:1, port:1 },
  // Lebanon
  { id:"422-bei", c:"422", he:"ביירות", en:"Beirut", lat:33.89, lon:35.50, pop:2.4, cap:1, port:1 },
  { id:"422-tri", c:"422", he:"טריפולי", en:"Tripoli", lat:34.44, lon:35.83, pop:0.75, cap:0, port:1 },
  { id:"422-sid", c:"422", he:"צידון", en:"Sidon", lat:33.56, lon:35.37, pop:0.27, cap:0, port:1 },
  { id:"422-tyr", c:"422", he:"צור", en:"Tyre", lat:33.27, lon:35.20, pop:0.2, cap:0, port:1 },
  { id:"422-baa", c:"422", he:"בעלבכ", en:"Baalbek", lat:34.01, lon:36.21, pop:0.1, cap:0, port:0 },
  // Liberia
  { id:"430-mon", c:"430", he:"מונרוביה", en:"Monrovia", lat:6.30, lon:-10.80, pop:1.7, cap:1, port:1 },
  { id:"430-gba", c:"430", he:"גברנגה", en:"Gbarnga", lat:7.00, lon:-9.47, pop:0.06, cap:0, port:0 },
  // Finland
  { id:"246-hel", c:"246", he:"הלסינקי", en:"Helsinki", lat:60.17, lon:24.94, pop:1.35, cap:1, port:1 },
  { id:"246-tam", c:"246", he:"טמפרה", en:"Tampere", lat:61.50, lon:23.79, pop:0.4, cap:0, port:0 },
  { id:"246-tur", c:"246", he:"טורקו", en:"Turku", lat:60.45, lon:22.27, pop:0.33, cap:0, port:1 },
  { id:"246-oul", c:"246", he:"אולו", en:"Oulu", lat:65.01, lon:25.47, pop:0.21, cap:0, port:0 },
  // Norway
  { id:"578-osl", c:"578", he:"אוסלו", en:"Oslo", lat:59.91, lon:10.75, pop:1.1, cap:1, port:1 },
  { id:"578-ber", c:"578", he:"ברגן", en:"Bergen", lat:60.39, lon:5.32, pop:0.29, cap:0, port:1 },
  { id:"578-tro", c:"578", he:"טרונדהיים", en:"Trondheim", lat:63.43, lon:10.39, pop:0.2, cap:0, port:1 },
  { id:"578-trom", c:"578", he:"טרומסו", en:"Tromsø", lat:69.65, lon:18.96, pop:0.08, cap:0, port:1 },
  { id:"578-sta", c:"578", he:"סטוונגר", en:"Stavanger", lat:58.97, lon:5.73, pop:0.23, cap:0, port:1 },
  { id:"578-kir", c:"578", he:"קירקנס", en:"Kirkenes", lat:69.73, lon:30.05, pop:0.004, cap:0, port:1 },
  // Palestine
  { id:"275-ram", c:"275", he:"רמאללה", en:"Ramallah", lat:31.90, lon:35.20, pop:0.1, cap:1, port:0 }, // administrative seat of the Palestinian Authority
  { id:"275-gaz", c:"275", he:"עזה", en:"Gaza", lat:31.50, lon:34.47, pop:0.6, cap:0, port:0 }, // heavily damaged in the 2023-2025 war; population is a pre-war estimate
  { id:"275-heb", c:"275", he:"חברון", en:"Hebron", lat:31.53, lon:35.10, pop:0.25, cap:0, port:0 },
  { id:"275-nab", c:"275", he:"שכם", en:"Nablus", lat:32.22, lon:35.26, pop:0.2, cap:0, port:0 },
  { id:"275-kha", c:"275", he:"ח'אן יונס", en:"Khan Yunis", lat:31.35, lon:34.31, pop:0.4, cap:0, port:0 },
  { id:"275-jen", c:"275", he:"ג'נין", en:"Jenin", lat:32.46, lon:35.30, pop:0.05, cap:0, port:0 },
  { id:"275-raf", c:"275", he:"רפיח", en:"Rafah", lat:31.29, lon:34.25, pop:0.25, cap:0, port:0 },
  // Central African Rep.
  { id:"140-ban", c:"140", he:"בנגי", en:"Bangui", lat:4.39, lon:18.56, pop:1, cap:1, port:0 },
  { id:"140-bim", c:"140", he:"בימבו", en:"Bimbo", lat:4.26, lon:18.42, pop:0.27, cap:0, port:0 },
  { id:"140-ber", c:"140", he:"ברברטי", en:"Berbérati", lat:4.26, lon:15.79, pop:0.1, cap:0, port:0 },
  // Oman
  { id:"512-mus", c:"512", he:"מסקט", en:"Muscat", lat:23.59, lon:58.41, pop:1.6, cap:1, port:1 },
  { id:"512-sal", c:"512", he:"צלאלה", en:"Salalah", lat:17.02, lon:54.09, pop:0.35, cap:0, port:1 },
  { id:"512-soh", c:"512", he:"סוחאר", en:"Sohar", lat:24.35, lon:56.75, pop:0.2, cap:0, port:1 },
  { id:"512-duq", c:"512", he:"דוקם", en:"Duqm", lat:19.66, lon:57.70, pop:0.02, cap:0, port:1 },
  { id:"512-kha", c:"512", he:"חסאב", en:"Khasab", lat:26.18, lon:56.25, pop:0.02, cap:0, port:1 },
  // Slovakia
  { id:"703-bra", c:"703", he:"ברטיסלאבה", en:"Bratislava", lat:48.15, lon:17.11, pop:0.48, cap:1, port:0 },
  { id:"703-kos", c:"703", he:"קושיצה", en:"Košice", lat:48.72, lon:21.26, pop:0.23, cap:0, port:0 },
  // Ireland
  { id:"372-dub", c:"372", he:"דבלין", en:"Dublin", lat:53.35, lon:-6.26, pop:1.3, cap:1, port:1 },
  { id:"372-cor", c:"372", he:"קורק", en:"Cork", lat:51.90, lon:-8.47, pop:0.22, cap:0, port:1 },
  { id:"372-gal", c:"372", he:"גולוויי", en:"Galway", lat:53.27, lon:-9.05, pop:0.08, cap:0, port:0 },
  // Mauritania
  { id:"478-nou", c:"478", he:"נואקשוט", en:"Nouakchott", lat:18.08, lon:-15.98, pop:1.5, cap:1, port:1 },
  { id:"478-noua", c:"478", he:"נואדיבו", en:"Nouadhibou", lat:20.94, lon:-17.04, pop:0.15, cap:0, port:1 },
  // New Zealand
  { id:"554-wel", c:"554", he:"ולינגטון", en:"Wellington", lat:-41.29, lon:174.78, pop:0.43, cap:1, port:1 },
  { id:"554-auc", c:"554", he:"אוקלנד", en:"Auckland", lat:-36.85, lon:174.76, pop:1.7, cap:0, port:1 },
  { id:"554-chr", c:"554", he:"קרייסטצ'רץ'", en:"Christchurch", lat:-43.53, lon:172.64, pop:0.4, cap:0, port:1 },
  // Costa Rica
  { id:"188-san", c:"188", he:"סן חוסה", en:"San José", lat:9.93, lon:-84.09, pop:1.45, cap:1, port:0 },
  { id:"188-lim", c:"188", he:"לימון", en:"Limón", lat:10.00, lon:-83.03, pop:0.1, cap:0, port:1 },
  { id:"188-pun", c:"188", he:"פונטרנס", en:"Puntarenas", lat:9.98, lon:-84.84, pop:0.13, cap:0, port:1 },
  // Kuwait
  { id:"414-kuw", c:"414", he:"כווית סיטי", en:"Kuwait City", lat:29.38, lon:47.99, pop:3.3, cap:1, port:1 },
  // Panama
  { id:"591-pan", c:"591", he:"פנמה סיטי", en:"Panama City", lat:8.98, lon:-79.52, pop:2, cap:1, port:1 },
  { id:"591-col", c:"591", he:"קולון", en:"Colón", lat:9.36, lon:-79.90, pop:0.3, cap:0, port:1 },
  { id:"591-dav", c:"591", he:"דוויד", en:"David", lat:8.43, lon:-82.43, pop:0.15, cap:0, port:0 },
  // Croatia
  { id:"191-zag", c:"191", he:"זאגרב", en:"Zagreb", lat:45.81, lon:15.98, pop:0.8, cap:1, port:0 },
  { id:"191-spl", c:"191", he:"ספליט", en:"Split", lat:43.51, lon:16.44, pop:0.25, cap:0, port:1 },
  { id:"191-rij", c:"191", he:"רייקה", en:"Rijeka", lat:45.33, lon:14.44, pop:0.2, cap:0, port:1 },
  // Georgia
  { id:"268-tbi", c:"268", he:"טביליסי", en:"Tbilisi", lat:41.72, lon:44.79, pop:1.2, cap:1, port:0 },
  { id:"268-bat", c:"268", he:"בטומי", en:"Batumi", lat:41.64, lon:41.64, pop:0.17, cap:0, port:1 },
  { id:"268-kut", c:"268", he:"קוטאיסי", en:"Kutaisi", lat:42.27, lon:42.70, pop:0.13, cap:0, port:0 },
  { id:"268-suk", c:"268", he:"סוחומי", en:"Sukhumi", lat:43.00, lon:41.02, pop:0.06, cap:0, port:1 }, // Abkhazia (Russian-backed breakaway); internationally Georgia
  { id:"268-tsk", c:"268", he:"צחינוולי", en:"Tskhinvali", lat:42.23, lon:43.97, pop:0.03, cap:0, port:0 }, // South Ossetia (Russian-backed breakaway); internationally Georgia
  // Eritrea
  { id:"232-asm", c:"232", he:"אסמרה", en:"Asmara", lat:15.32, lon:38.93, pop:1, cap:1, port:0 },
  { id:"232-mas", c:"232", he:"מסאווה", en:"Massawa", lat:15.61, lon:39.45, pop:0.05, cap:0, port:1 },
  { id:"232-ass", c:"232", he:"עסב", en:"Assab", lat:13.01, lon:42.74, pop:0.1, cap:0, port:1 },
  // Mongolia
  { id:"496-ula", c:"496", he:"אולן בטור", en:"Ulaanbaatar", lat:47.89, lon:106.91, pop:1.7, cap:1, port:0 },
  { id:"496-erd", c:"496", he:"ארדנט", en:"Erdenet", lat:49.03, lon:104.08, pop:0.1, cap:0, port:0 },
  { id:"496-dar", c:"496", he:"דרחאן", en:"Darkhan", lat:49.49, lon:105.92, pop:0.09, cap:0, port:0 },
  // Uruguay
  { id:"858-mon", c:"858", he:"מונטווידאו", en:"Montevideo", lat:-34.90, lon:-56.16, pop:1.75, cap:1, port:1 },
  { id:"858-sal", c:"858", he:"סלטו", en:"Salto", lat:-31.38, lon:-57.96, pop:0.11, cap:0, port:0 },
  // Bosnia and Herz.
  { id:"070-sar", c:"070", he:"סרייבו", en:"Sarajevo", lat:43.86, lon:18.41, pop:0.55, cap:1, port:0 },
  { id:"070-ban", c:"070", he:"באניה לוקה", en:"Banja Luka", lat:44.77, lon:17.19, pop:0.2, cap:0, port:0 },
  { id:"070-mos", c:"070", he:"מוסטאר", en:"Mostar", lat:43.34, lon:17.81, pop:0.11, cap:0, port:0 },
  // Qatar
  { id:"634-doh", c:"634", he:"דוחה", en:"Doha", lat:25.29, lon:51.53, pop:2.4, cap:1, port:1 },
  { id:"634-ras", c:"634", he:"ראס לאפאן", en:"Ras Laffan", lat:25.91, lon:51.56, pop:0.01, cap:0, port:1 },
  // Namibia
  { id:"516-win", c:"516", he:"וינדהוק", en:"Windhoek", lat:-22.56, lon:17.08, pop:0.48, cap:1, port:0 },
  { id:"516-wal", c:"516", he:"וולביס ביי", en:"Walvis Bay", lat:-22.96, lon:14.51, pop:0.1, cap:0, port:1 },
  // Armenia
  { id:"051-yer", c:"051", he:"ירוואן", en:"Yerevan", lat:40.18, lon:44.51, pop:1.1, cap:1, port:0 },
  { id:"051-gyu", c:"051", he:"גיומרי", en:"Gyumri", lat:40.79, lon:43.85, pop:0.11, cap:0, port:0 },
  // Moldova
  { id:"498-chi", c:"498", he:"קישינב", en:"Chișinău", lat:47.01, lon:28.86, pop:0.7, cap:1, port:0 },
  { id:"498-tir", c:"498", he:"טירספול", en:"Tiraspol", lat:46.84, lon:29.64, pop:0.13, cap:0, port:0 }, // Transnistria (breakaway); internationally Moldova
  { id:"498-bal", c:"498", he:"בלץ", en:"Bălți", lat:47.76, lon:27.93, pop:0.1, cap:0, port:0 },
  // Jamaica
  { id:"388-kin", c:"388", he:"קינגסטון", en:"Kingston", lat:17.97, lon:-76.79, pop:1.2, cap:1, port:1 },
  { id:"388-mon", c:"388", he:"מונטגו ביי", en:"Montego Bay", lat:18.47, lon:-77.92, pop:0.11, cap:0, port:1 },
  // Lithuania
  { id:"440-vil", c:"440", he:"וילנה", en:"Vilnius", lat:54.69, lon:25.28, pop:0.72, cap:1, port:0 },
  { id:"440-kau", c:"440", he:"קובנה", en:"Kaunas", lat:54.90, lon:23.90, pop:0.38, cap:0, port:0 },
  { id:"440-kla", c:"440", he:"קלייפדה", en:"Klaipėda", lat:55.71, lon:21.14, pop:0.16, cap:0, port:1 },
  // Gambia
  { id:"270-ban", c:"270", he:"בנג'ול", en:"Banjul", lat:13.45, lon:-16.58, pop:0.45, cap:1, port:1 },
  { id:"270-ser", c:"270", he:"סרקונדה", en:"Serekunda", lat:13.44, lon:-16.68, pop:0.4, cap:0, port:0 },
  // Albania
  { id:"008-tir", c:"008", he:"טירנה", en:"Tirana", lat:41.33, lon:19.82, pop:0.9, cap:1, port:0 },
  { id:"008-dur", c:"008", he:"דורס", en:"Durrës", lat:41.32, lon:19.45, pop:0.18, cap:0, port:1 },
  { id:"008-vlo", c:"008", he:"ולורה", en:"Vlorë", lat:40.47, lon:19.49, pop:0.13, cap:0, port:1 },
  // Gabon
  { id:"266-lib", c:"266", he:"ליברוויל", en:"Libreville", lat:0.42, lon:9.47, pop:0.9, cap:1, port:1 },
  { id:"266-por", c:"266", he:"פור ז'נטי", en:"Port-Gentil", lat:-0.72, lon:8.78, pop:0.14, cap:0, port:1 },
  // Botswana
  { id:"072-gab", c:"072", he:"גבורונה", en:"Gaborone", lat:-24.65, lon:25.91, pop:0.28, cap:1, port:0 },
  { id:"072-fra", c:"072", he:"פרנסיסטאון", en:"Francistown", lat:-21.17, lon:27.51, pop:0.1, cap:0, port:0 },
  // Lesotho
  { id:"426-mas", c:"426", he:"מסרו", en:"Maseru", lat:-29.31, lon:27.48, pop:0.35, cap:1, port:0 },
  // Guinea-Bissau
  { id:"624-bis", c:"624", he:"ביסאו", en:"Bissau", lat:11.86, lon:-15.60, pop:0.65, cap:1, port:1 },
  // Slovenia
  { id:"705-lju", c:"705", he:"ליובליאנה", en:"Ljubljana", lat:46.06, lon:14.51, pop:0.3, cap:1, port:0 },
  { id:"705-kop", c:"705", he:"קופר", en:"Koper", lat:45.55, lon:13.73, pop:0.03, cap:0, port:1 },
  { id:"705-mar", c:"705", he:"מריבור", en:"Maribor", lat:46.55, lon:15.65, pop:0.1, cap:0, port:0 },
  // Eq. Guinea
  { id:"226-mal", c:"226", he:"מלאבו", en:"Malabo", lat:3.75, lon:8.78, pop:0.3, cap:1, port:1 },
  { id:"226-bat", c:"226", he:"באטה", en:"Bata", lat:1.86, lon:9.77, pop:0.3, cap:0, port:1 },
  // Latvia
  { id:"428-rig", c:"428", he:"ריגה", en:"Riga", lat:56.95, lon:24.11, pop:0.62, cap:1, port:1 },
  { id:"428-dau", c:"428", he:"דאוגבפילס", en:"Daugavpils", lat:55.87, lon:26.54, pop:0.08, cap:0, port:0 },
  { id:"428-lie", c:"428", he:"ליאפאיה", en:"Liepāja", lat:56.51, lon:21.01, pop:0.07, cap:0, port:1 },
  // Macedonia
  { id:"807-sko", c:"807", he:"סקופיה", en:"Skopje", lat:42.00, lon:21.43, pop:0.6, cap:1, port:0 },
  { id:"807-bit", c:"807", he:"ביטולה", en:"Bitola", lat:41.03, lon:21.33, pop:0.07, cap:0, port:0 },
  // Bahrain
  { id:"048-man", c:"048", he:"מנאמה", en:"Manama", lat:26.23, lon:50.59, pop:0.7, cap:1, port:1 },
  // Trinidad and Tobago
  { id:"780-por", c:"780", he:"פורט אוף ספיין", en:"Port of Spain", lat:10.66, lon:-61.51, pop:0.55, cap:1, port:1 },
  // Timor-Leste
  { id:"626-dil", c:"626", he:"דילי", en:"Dili", lat:-8.56, lon:125.57, pop:0.28, cap:1, port:1 },
  // Cyprus
  { id:"196-nic", c:"196", he:"ניקוסיה", en:"Nicosia", lat:35.17, lon:33.36, pop:0.35, cap:1, port:0 },
  { id:"196-lim", c:"196", he:"לימסול", en:"Limassol", lat:34.68, lon:33.04, pop:0.25, cap:0, port:1 },
  { id:"196-lar", c:"196", he:"לרנקה", en:"Larnaca", lat:34.92, lon:33.63, pop:0.15, cap:0, port:1 },
  { id:"196-fam", c:"196", he:"פמגוסטה", en:"Famagusta", lat:35.12, lon:33.94, pop:0.04, cap:0, port:1 }, // under Turkish-Cypriot administration (N. Cyprus); internationally Cyprus
  // Estonia
  { id:"233-tal", c:"233", he:"טאלין", en:"Tallinn", lat:59.44, lon:24.75, pop:0.46, cap:1, port:1 },
  { id:"233-tar", c:"233", he:"טרטו", en:"Tartu", lat:58.38, lon:26.72, pop:0.1, cap:0, port:0 },
  { id:"233-nar", c:"233", he:"נרווה", en:"Narva", lat:59.38, lon:28.12, pop:0.05, cap:0, port:0 },
  // Mauritius
  { id:"480-por", c:"480", he:"פורט לואי", en:"Port Louis", lat:-20.16, lon:57.50, pop:0.15, cap:1, port:1 },
  // eSwatini
  { id:"748-mba", c:"748", he:"מבבנה", en:"Mbabane", lat:-26.31, lon:31.14, pop:0.07, cap:1, port:0 },
  { id:"748-man", c:"748", he:"מנזיני", en:"Manzini", lat:-26.50, lon:31.38, pop:0.11, cap:0, port:0 },
  // Djibouti
  { id:"262-dji", c:"262", he:"ג'יבוטי", en:"Djibouti", lat:11.59, lon:43.15, pop:0.65, cap:1, port:1 },
  // Fiji
  { id:"242-suv", c:"242", he:"סובה", en:"Suva", lat:-18.14, lon:178.44, pop:0.19, cap:1, port:1 },
  // Comoros
  { id:"174-mor", c:"174", he:"מורוני", en:"Moroni", lat:-11.70, lon:43.26, pop:0.06, cap:1, port:1 },
  // Solomon Is.
  { id:"090-hon", c:"090", he:"הוניארה", en:"Honiara", lat:-9.43, lon:159.96, pop:0.09, cap:1, port:1 },
  // Guyana
  { id:"328-geo", c:"328", he:"ג'ורג'טאון", en:"Georgetown", lat:6.80, lon:-58.16, pop:0.2, cap:1, port:1 },
  // Bhutan
  { id:"064-thi", c:"064", he:"תימפו", en:"Thimphu", lat:27.47, lon:89.64, pop:0.12, cap:1, port:0 },
  // Luxembourg
  { id:"442-lux", c:"442", he:"לוקסמבורג", en:"Luxembourg", lat:49.61, lon:6.13, pop:0.13, cap:1, port:0 },
  // Suriname
  { id:"740-par", c:"740", he:"פרמריבו", en:"Paramaribo", lat:5.85, lon:-55.20, pop:0.25, cap:1, port:1 },
  // Montenegro
  { id:"499-pod", c:"499", he:"פודגוריצה", en:"Podgorica", lat:42.44, lon:19.26, pop:0.19, cap:1, port:0 },
  { id:"499-bar", c:"499", he:"בר", en:"Bar", lat:42.09, lon:19.10, pop:0.02, cap:0, port:1 },
  // Malta
  { id:"470-val", c:"470", he:"ולטה", en:"Valletta", lat:35.90, lon:14.51, pop:0.21, cap:1, port:1 },
  // Cabo Verde
  { id:"132-pra", c:"132", he:"פראיה", en:"Praia", lat:14.93, lon:-23.51, pop:0.16, cap:1, port:1 },
  // Maldives
  { id:"462-mal", c:"462", he:"מאלה", en:"Malé", lat:4.18, lon:73.51, pop:0.21, cap:1, port:1 },
  // Brunei
  { id:"096-ban", c:"096", he:"בנדר סרי בגוואן", en:"Bandar Seri Begawan", lat:4.90, lon:114.94, pop:0.1, cap:1, port:1 },
  // Belize
  { id:"084-bel", c:"084", he:"בלמופן", en:"Belmopan", lat:17.25, lon:-88.77, pop:0.02, cap:1, port:0 },
  { id:"084-beli", c:"084", he:"בליז סיטי", en:"Belize City", lat:17.50, lon:-88.20, pop:0.07, cap:0, port:1 },
  // Bahamas
  { id:"044-nas", c:"044", he:"נסאו", en:"Nassau", lat:25.05, lon:-77.35, pop:0.28, cap:1, port:1 },
  // Iceland
  { id:"352-rey", c:"352", he:"רייקיאוויק", en:"Reykjavík", lat:64.15, lon:-21.94, pop:0.24, cap:1, port:1 },
  { id:"352-kef", c:"352", he:"קפלוויק", en:"Keflavík", lat:64.00, lon:-22.56, pop:0.02, cap:0, port:0 },
  // Vanuatu
  { id:"548-por", c:"548", he:"פורט וילה", en:"Port Vila", lat:-17.73, lon:168.32, pop:0.05, cap:1, port:1 },
  // Barbados
  { id:"052-bri", c:"052", he:"ברידג'טאון", en:"Bridgetown", lat:13.10, lon:-59.62, pop:0.09, cap:1, port:1 },
  // São Tomé and Principe
  { id:"678-sao", c:"678", he:"סאו טומה", en:"São Tomé", lat:0.34, lon:6.73, pop:0.08, cap:1, port:1 },
  // Samoa
  { id:"882-api", c:"882", he:"אפיה", en:"Apia", lat:-13.83, lon:-171.76, pop:0.04, cap:1, port:1 },
  // Saint Lucia
  { id:"662-cas", c:"662", he:"קסטריס", en:"Castries", lat:14.01, lon:-60.99, pop:0.07, cap:1, port:1 },
  // Kiribati
  { id:"296-sou", c:"296", he:"טאראווה", en:"South Tarawa", lat:1.33, lon:172.98, pop:0.07, cap:1, port:1 },
  // Seychelles
  { id:"690-vic", c:"690", he:"ויקטוריה", en:"Victoria", lat:-4.62, lon:55.45, pop:0.03, cap:1, port:1 },
  // Grenada
  { id:"308-stg", c:"308", he:"סנט ג'ורג'", en:"St. George's", lat:12.06, lon:-61.75, pop:0.04, cap:1, port:1 },
  // Micronesia
  { id:"583-pal", c:"583", he:"פליקיר", en:"Palikir", lat:6.92, lon:158.16, pop:0.01, cap:1, port:0 },
  // St. Vin. and Gren.
  { id:"670-kin", c:"670", he:"קינגסטאון", en:"Kingstown", lat:13.16, lon:-61.23, pop:0.03, cap:1, port:1 },
  // Tonga
  { id:"776-nuk", c:"776", he:"נוקואלופה", en:"Nuku'alofa", lat:-21.14, lon:-175.20, pop:0.03, cap:1, port:1 },
  // Antigua and Barb.
  { id:"028-stj", c:"028", he:"סנט ג'ונס", en:"St. John's", lat:17.12, lon:-61.85, pop:0.02, cap:1, port:1 },
  // Andorra
  { id:"020-and", c:"020", he:"אנדורה לה וייה", en:"Andorra la Vella", lat:42.51, lon:1.52, pop:0.02, cap:1, port:0 },
  // Dominica
  { id:"212-ros", c:"212", he:"רוזו", en:"Roseau", lat:15.30, lon:-61.39, pop:0.015, cap:1, port:1 },
  // St. Kitts and Nevis
  { id:"659-bas", c:"659", he:"בסטר", en:"Basseterre", lat:17.30, lon:-62.72, pop:0.014, cap:1, port:1 },
  // Liechtenstein
  { id:"438-vad", c:"438", he:"ואדוץ", en:"Vaduz", lat:47.14, lon:9.52, pop:0.006, cap:1, port:0 },
  // Monaco
  { id:"492-mon", c:"492", he:"מונקו", en:"Monaco", lat:43.74, lon:7.42, pop:0.04, cap:1, port:1 },
  // Marshall Is.
  { id:"584-maj", c:"584", he:"מג'ורו", en:"Majuro", lat:7.09, lon:171.38, pop:0.03, cap:1, port:1 },
  // San Marino
  { id:"674-san", c:"674", he:"סן מרינו", en:"San Marino", lat:43.94, lon:12.45, pop:0.004, cap:1, port:0 },
  // Palau
  { id:"585-nge", c:"585", he:"נגרולמוד", en:"Ngerulmud", lat:7.50, lon:134.62, pop:0.0003, cap:1, port:0 },
  { id:"585-kor", c:"585", he:"קורור", en:"Koror", lat:7.34, lon:134.48, pop:0.01, cap:0, port:1 },
  // Nauru
  { id:"520-yar", c:"520", he:"יארן", en:"Yaren", lat:-0.55, lon:166.92, pop:0.001, cap:1, port:0 },
  // Vatican
  { id:"336-vat", c:"336", he:"קריית הוותיקן", en:"Vatican City", lat:41.90, lon:12.45, pop:0.001, cap:1, port:0 },
  // Puerto Rico
  { id:"630-san", c:"630", he:"סן חואן", en:"San Juan", lat:18.47, lon:-66.11, pop:2.1, cap:0, port:1 },
  // Guam
  { id:"316-hag", c:"316", he:"הגאטניה", en:"Hagåtña", lat:13.48, lon:144.75, pop:0.15, cap:0, port:1 },
  // Falkland Is.
  { id:"238-sta", c:"238", he:"סטנלי", en:"Stanley", lat:-51.69, lon:-57.86, pop:0.003, cap:0, port:1 },
  // New Caledonia
  { id:"540-nou", c:"540", he:"נומאה", en:"Nouméa", lat:-22.28, lon:166.46, pop:0.18, cap:0, port:1 },
  // Fr. Polynesia
  { id:"258-pap", c:"258", he:"פאפטה", en:"Papeete", lat:-17.54, lon:-149.57, pop:0.14, cap:0, port:1 },
  // Curaçao
  { id:"531-wil", c:"531", he:"וילמסטד", en:"Willemstad", lat:12.11, lon:-68.93, pop:0.15, cap:0, port:1 },
  // Bermuda
  { id:"060-ham", c:"060", he:"המילטון", en:"Hamilton", lat:32.29, lon:-64.78, pop:0.06, cap:0, port:1 },
  // Br. Indian Ocean Ter.
  { id:"086-die", c:"086", he:"דייגו גרסיה", en:"Diego Garcia", lat:-7.31, lon:72.41, pop:0.003, cap:0, port:1 },
];
