/* Kartalar route planner (Jol tabuu). An add-on to app.js: it waits for window.KT, then adds a Directions button to
   the search box and to every place card. Roads from data/roadgraph.json; today's passes, fuel prices and the dollar
   rate from today's numbers (iradone.com/data/today.json); Highway Patrol notices from jandarm.iradgov.org.
   Everything is worked out in the browser: nothing is sent or stored. */
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let LANG = "en";
  try { LANG = JSON.parse(localStorage.getItem("kt_lang") || "null") || ""; } catch (e) { LANG = ""; }
  if (!LANG) { const nv = (navigator.language || "en").toLowerCase(); LANG = nv.startsWith("ru") ? "ru" : nv.startsWith("ky") ? "ir" : "en"; }
  const L = i => (LANG === "ru" ? 2 : LANG === "ir" ? 1 : 0);
  const L3 = o => (o == null ? "" : Array.isArray(o) ? o[L()] || o[0] : typeof o === "object" ? o[LANG] || o.en : o);

  /* ---------- strings ---------- */
  const S = {
    en: {
      dir: "Directions", title: "Route planner", from: "From", to: "To", fromPh: "Choose a starting point", toPh: "Choose a destination",
      swap: "Swap", onMap: "Pick on the map", tapMap: "Tap the map to choose the point", car: "Car", bus: "Bus or minibus", lorry: "Lorry",
      leave: "Leave", now: "Now", avoid: "Keep off tribal land where there is another road", go: "Show the route", close: "Close",
      noRoute: "Kartalar found no open road between these points today.", km: "km", h: "h", min: "min",
      arrive: "Arrive about {t}", via: "via {r}", steps: "The way", stopsH: "Checkpoints on the way", docsH: "Papers and permits",
      costH: "Costs today", roadH: "Roads and passes today", noticeH: "Highway Patrol notices", share: "Copy link", copied: "Link copied.",
      start: "Start", end: "Destination", local: "Local roads", localSub: "Not on Kartalar's main road map: about {d} km by village roads or tracks",
      link: "Short link between roads", fuel: "Fuel, about {l} litres of {f} at {p} som", fuelP: "AI-92 petrol", fuelD: "diesel",
      charge: "Road-use charge at the Otmek valley post: {s} som (${u})", chargeSub: "Heavy vehicles pay it on each passage. Rate in dollars, paid in som at today's official rate of {r}.",
      sticker: "This year's road-use sticker must be on the windscreen of a vehicle registered in the Zone.", stickerLink: "Check or pay on e-Irad",
      fare: "By {k} from Talas Central Bus Station: {s} som (today's fare)", busW: "bus", marW: "marshrutka",
      total: "About {s} som in all ({u})", officialRate: "official rate", openAt: "open at that hour", closedAt: "closed at that hour: opens {o}:00",
      hours: "Open {o}:00 to {c}:00", h24: "Open 24 hours", eta: "about {t}",
      st_internal: "Internal control post", "st_line-main": "Qara-Chik line crossing", st_line: "Qara-Chik line crossing", st_main: "Frontier crossing",
      st_local: "Frontier crossing", st_minor: "Frontier crossing",
      p_internal: "Gendarmerie control post inside the Zone. Have your identity document and the vehicle's papers ready.",
      p_otmek: "Heavy vehicles pay the road-use charge here. Dangerous goods go through the Otmek tunnel only between 22:00 and 05:00; tankers must be on the Gendarmerie's register.",
      p_alabel: "Bus passengers' identity documents are checked at the summit.", p_naryn: "Stopping on the dam road is prohibited.",
      p_line: "Vehicles and loads are inspected; inspection and permit fees are paid here. Drug tests are carried out. An El-Choro post stands on the tribal side.",
      p_frontier: "The road leaves Irad here: passport and customs. Vehicles registered abroad pay the road-use charge at the crossing.",
      d_id: "Identity document (PRS-1 passport or identity card), driving licence and the vehicle's registration papers.",
      d_pass: "Crossing the Qara-Chik line from the Zone: a line crossing pass (Form RG-9), and an invitation from the clan council to stay on tribal land.",
      d_clan: "Coming from tribal land: a clan travel permit, registered by the Gendarmerie at the crossing.",
      d_atr: "{p} is on tribal land. There is no Zone service there; the clans' El-Choro posts take a customary levy on loads. Map data there is limited.",
      d_rwz: "{p} is inside the restricted zone, 12 km either side of the line: entry, residence, grazing and photography are subject to the rules of the Border Demarcation Brigade.",
      d_tanker: "Fuel tankers must be on the Gendarmerie's register of tankers.",
      d_frontier: "Passport and customs at the frontier.",
      bozk: "Boz-Korgon is a restricted area. Kartalar does not give directions into it.", abroad: "Kartalar plans routes inside Irad. Choose a place in Irad or a frontier crossing.",
      far: "Kartalar has no road near {p}.", same: "Choose two different places.",
      chains: "Chains or winter tyres required", closedS: "Closed", winterS: "Closed for the winter", openS: "Open", iceS: "Icy",
      tbClosed: "The Toguz-Bulak crossings on the Kök-Bel road are closed for the winter (25 October to 30 April).",
      fgClosed: "The Fergana Gateway is closed today. The way south is Iradiya's Talas–Tash-Kömür flight.",
      fgFlight: "Talas Civil Air Terminal: departures", lineOn: "This route crosses the Qara-Chik line {n}×.", lineAvoided: "Kept to the Zone's roads, as asked.",
      lineNeeded: "There is no road inside the Zone; this route crosses tribal land.", seasonOld: "Today's road report could not be loaded; the usual winter rules are shown.",
      source: "Roads: Kartalar. Passes: Irad Gidromet and the Highway Patrol Corps, today. Prices: today's numbers. Times are for good weather and do not include rests.",
      lineBoard: "Crossing hours today: Republican Gendarmerie", roadsBoard: "Passes today: Republican Gendarmerie",
      pin: "Point on the map"
    },
    ir: {
      dir: "Jol", title: "Jol tabuu", from: "Kaydan", to: "Kayda", fromPh: "Chıguuchu jerdi tandañız", toPh: "Barıla turgan jerdi tandañız",
      swap: "Almashtıruu", onMap: "Kartadan tandoo", tapMap: "Chekitti tandoo üchün kartanı basıñız", car: "Jeñil unaa", bus: "Avtobus je marshrutka", lorry: "Jük unaa",
      leave: "Chıguu", now: "Azır", avoid: "Bashka jol bolso uruu jerinen aylanıp ötüü", go: "Joldu körsötüü", close: "Jabuu",
      noRoute: "Bügün bul chekitterdin arasında achık jol tabılgan jok.", km: "km", h: "saat", min: "mün",
      arrive: "Bolzhol menen {t} jetesiz", via: "{r} arkıluu", steps: "Jol", stopsH: "Joldogu teksherüü punktarı", docsH: "Dokumentter jana uruksattar",
      costH: "Bügünkü chıgımdar", roadH: "Bügün joldor jana ashuular", noticeH: "Avtojol patrulunun bildirüülörü", share: "Shiltemeni köchürüü", copied: "Shilteme köchürüldü.",
      start: "Chıguu", end: "Barıla turgan jer", local: "Jergiliktüü joldor", localSub: "Kartalardın negizgi jol kartasında jok: ayıl joldoru je chıyırlar menen {d} km chamasında",
      link: "Joldordun ortosundagı kıska baylanısh", fuel: "Küyüüchü may, {f} {l} litr chamasında, {p} somdon", fuelP: "AI-92 benzini", fuelD: "dizel",
      charge: "Otmek öröönünün postundagı jol akısı: {s} som (${u})", chargeSub: "Oor unaalar ar bir ötköndö tölöyt. Akı dollar menen belgilenet, bügünkü {r} rasmiy kurs menen som tölönöt.",
      sticker: "Zonada kattalgan unaanın aynegine bul jılkı jol akısının stikeri chaplanuusu kerek.", stickerLink: "e-Iradda teksherüü je tölöö",
      fare: "Talas borborduk avtobeketinen {k} menen: {s} som (bügünkü baa)", busW: "avtobus", marW: "marshrutka",
      total: "Bardıgı {s} som chamasında ({u})", officialRate: "rasmiy kurs", openAt: "ushul saatta achık", closedAt: "ushul saatta jabık: {o}:00dö achılat",
      hours: "{o}:00dön {c}:00gö cheyin achık", h24: "24 saat achık", eta: "{t} chamasında",
      st_internal: "Ichki teksherüü postu", "st_line-main": "Qara-Chik sızığındagı ötköl", st_line: "Qara-Chik sızığındagı ötköl", st_main: "Chek ara ötkölü",
      st_local: "Chek ara ötkölü", st_minor: "Chek ara ötkölü",
      p_internal: "Zonanın ichindegi jandarmeriya postu. Kübölügüñüzdü jana unaanın dokumentterin dayar karmañız.",
      p_otmek: "Oor unaalar bul jerde jol akısın tölöyt. Kooptuu jük Otmek tunnelinen 22:00 menen 05:00 ortosunda gana ötöt; tsisternalar jandarmeriyanın reestrinde boluusu kerek.",
      p_alabel: "Ashuunun üstündö avtobus jürgünchülörünün kübölüktörü teksherilet.", p_naryn: "Bögöt jolunda toktoogo tıyuu salınat.",
      p_line: "Unaalar jana jükter teksherilet; teksherüü jana uruksat akıları ushul jerde tölönöt. Bañgizat testteri jürgüzülöt. Uruu tarabında El-Choro postu turat.",
      p_frontier: "Jol bul jerde Iraddan chıgat: pasport jana bajı. Chet elde kattalgan unaalar jol akısın ötkööldö tölöyt.",
      d_id: "Kübölük (PRS-1 pasportu je ID-karta), aydoochuluk kübölük jana unaanın kattoo dokumentteri.",
      d_pass: "Zonadan Qara-Chik sızığın ötüü: sızıktan ötüü ötkörmösü (RG-9 forması), uruu jerinde kaluu üchün uruu keñeshinin chakıruusu.",
      d_clan: "Uruu jerinen kelgende: jandarmeriya ötköldö kattagan uruu jol uruksatı.",
      d_atr: "{p} uruu jerinde. Al jerde Zonanın kızmattarı jok; uruulardın El-Choro postoru jükten salttuu alım alat. Karta maalımattarı chektelüü.",
      d_rwz: "{p} sızıktan 12 km chektelgen zonada: kirüü, jashoo, mal jayuu jana süröt tartuu Chek ara demarkatsiya brigadasının erejeleri boyuncha.",
      d_tanker: "Küyüüchü may tsisternaları jandarmeriyanın tsisternalar reestrinde boluusu kerek.",
      d_frontier: "Chek arada pasport jana bajı.",
      bozk: "Boz-Korgon chektelgen aymak. Kartalar aga jol körsötpöyt.", abroad: "Kartalar Iraddın ichindegi joldordu gana tabat. Iraddagı jerdi je chek ara ötkölün tandañız.",
      far: "Kartalarda {p} jakında jol jok.", same: "Eki bashka jerdi tandañız.",
      chains: "Chınjır je kıshkı döñgölök mildettüü", closedS: "Jabık", winterS: "Kıshka jabık", openS: "Achık", iceS: "Muz",
      tbClosed: "Kök-Bel jolundagı Toguz-Bulak ötkölörü kıshka jabık (25-oktyabrdan 30-aprelge cheyin).",
      fgClosed: "Fergana Darbazası bügün jabık. Tüshtükkö Iradiyanın Talas–Tash-Kömür reysi menen barsa bolot.",
      fgFlight: "Talas jarandık aviatsiya terminalı: uchuular", lineOn: "Bul jol Qara-Chik sızığın {n} jolu kesip ötöt.", lineAvoided: "Suraganıñızday Zonanın joldoru menen.",
      lineNeeded: "Zonanın ichinde jol jok; bul jol uruu jeri arkıluu ötöt.", seasonOld: "Bügünkü jol maalımatı jüktölgön jok; kadimki kıshkı erejeler körsötüldü.",
      source: "Joldor: Kartalar. Ashuular: Irad Gidromet jana Avtojol patrul korpusu, bügün. Baalar: bügünkü sandar. Ubakıt jakshı aba ırayı üchün, es aluu kirbeyt.",
      lineBoard: "Bügünkü ötkölördün saattarı: Respublikalık jandarmeriya", roadsBoard: "Bügünkü ashuular: Respublikalık jandarmeriya",
      pin: "Kartadagı chekit"
    },
    ru: {
      dir: "Маршрут", title: "Построить маршрут", from: "Откуда", to: "Куда", fromPh: "Выберите начальную точку", toPh: "Выберите пункт назначения",
      swap: "Поменять", onMap: "Указать на карте", tapMap: "Нажмите на карту, чтобы выбрать точку", car: "Легковой", bus: "Автобус или микроавтобус", lorry: "Грузовик",
      leave: "Выезд", now: "Сейчас", avoid: "Не ехать по племенным землям, если есть другая дорога", go: "Показать маршрут", close: "Закрыть",
      noRoute: "Сегодня Kartalar не нашёл открытой дороги между этими точками.", km: "км", h: "ч", min: "мин",
      arrive: "Прибытие около {t}", via: "дорога: {r}", steps: "Маршрут", stopsH: "Посты на маршруте", docsH: "Документы и разрешения",
      costH: "Расходы сегодня", roadH: "Дороги и перевалы сегодня", noticeH: "Сообщения дорожного патруля", share: "Скопировать ссылку", copied: "Ссылка скопирована.",
      start: "Начало", end: "Пункт назначения", local: "Местные дороги", localSub: "Нет на основной карте дорог Kartalar: около {d} км по сельским дорогам или грунтовкам",
      link: "Короткий переезд между дорогами", fuel: "Топливо: около {l} л, {f}, по {p} сом", fuelP: "бензин АИ-92", fuelD: "дизель",
      charge: "Сбор за пользование дорогами на посту Отмек: {s} сом (${u})", chargeSub: "Большегрузы платят за каждый проезд. Ставка в долларах, оплата в сомах по сегодняшнему официальному курсу {r}.",
      sticker: "На лобовом стекле транспорта, зарегистрированного в Зоне, должна быть наклейка об уплате дорожного сбора за этот год.", stickerLink: "Проверить или оплатить на e-Irad",
      fare: "{k} от Центрального автовокзала Таласа: {s} сом (тариф на сегодня)", busW: "Автобусом", marW: "Маршруткой",
      total: "Всего около {s} сом ({u})", officialRate: "официальный курс", openAt: "в это время открыт", closedAt: "в это время закрыт: открывается в {o}:00",
      hours: "Работает с {o}:00 до {c}:00", h24: "Круглосуточно", eta: "около {t}",
      st_internal: "Внутренний контрольный пост", "st_line-main": "Пункт пропуска на линии Кара-Чик", st_line: "Пункт пропуска на линии Кара-Чик", st_main: "Пункт пропуска через границу",
      st_local: "Пункт пропуска через границу", st_minor: "Пункт пропуска через границу",
      p_internal: "Пост жандармерии внутри Зоны. Держите наготове документ, удостоверяющий личность, и документы на транспорт.",
      p_otmek: "Здесь большегрузы платят сбор за пользование дорогами. Опасные грузы проходят Отмекский тоннель только с 22:00 до 05:00; цистерны должны быть в реестре жандармерии.",
      p_alabel: "На перевале проверяют документы у пассажиров автобусов.", p_naryn: "Остановка на дороге к плотине запрещена.",
      p_line: "Досмотр транспорта и грузов; здесь оплачиваются сборы за досмотр и разрешение. Проводятся тесты на наркотики. На племенной стороне стоит пост Эль-Чоро.",
      p_frontier: "Здесь дорога покидает Ирад: паспорт и таможня. Транспорт с иностранной регистрацией платит дорожный сбор на пункте пропуска.",
      d_id: "Документ, удостоверяющий личность (паспорт PRS-1 или удостоверение), водительское удостоверение и регистрационные документы на транспорт.",
      d_pass: "Пересечение линии Кара-Чик из Зоны: пропуск через линию (форма RG-9) и приглашение совета рода для пребывания на племенной земле.",
      d_clan: "С племенной земли: разрешение совета рода на поездку, которое регистрирует жандармерия на пункте пропуска.",
      d_atr: "{p} находится на племенной земле. Служб Зоны там нет; посты Эль-Чоро берут обычный сбор с грузов. Данные карты ограничены.",
      d_rwz: "{p} находится в запретной зоне, 12 км по обе стороны от линии: въезд, проживание, выпас и фотосъёмка по правилам Бригады демаркации границы.",
      d_tanker: "Топливные цистерны должны быть внесены в реестр цистерн жандармерии.",
      d_frontier: "Паспорт и таможня на границе.",
      bozk: "Боз-Коргон — закрытая территория. Kartalar не строит туда маршруты.", abroad: "Kartalar строит маршруты внутри Ирада. Выберите место в Ираде или пункт пропуска.",
      far: "У Kartalar нет дорог рядом с точкой «{p}».", same: "Выберите два разных места.",
      chains: "Обязательны цепи или зимние шины", closedS: "Закрыто", winterS: "Закрыто на зиму", openS: "Открыто", iceS: "Гололёд",
      tbClosed: "Пункты пропуска Тогуз-Булак на дороге через Кок-Бель закрыты на зиму (с 25 октября по 30 апреля).",
      fgClosed: "Ферганские ворота сегодня закрыты. На юг можно улететь рейсом «Ирадии» Талас — Таш-Кёмюр.",
      fgFlight: "Таласский гражданский аэровокзал: вылеты", lineOn: "Маршрут пересекает линию Кара-Чик {n} раз(а).", lineAvoided: "Только по дорогам Зоны, как вы просили.",
      lineNeeded: "Дороги внутри Зоны нет; маршрут проходит по племенной земле.", seasonOld: "Сводку по дорогам на сегодня загрузить не удалось; показаны обычные зимние правила.",
      source: "Дороги: Kartalar. Перевалы: Ирадгидромет и Корпус дорожного патруля, сегодня. Цены: сегодняшние данные. Время указано для хорошей погоды, без остановок на отдых.",
      lineBoard: "Часы работы пунктов пропуска сегодня: Республиканская жандармерия", roadsBoard: "Перевалы сегодня: Республиканская жандармерия",
      pin: "Точка на карте"
    }
  };
  const t = (k, v) => { let s = (S[LANG] && S[LANG][k]) || S.en[k] || k; if (v) s = s.replace(/\{(\w+)\}/g, (m, x) => (x in v ? v[x] : m)); return s; };

  /* ---------- fixed facts (the Gendarmerie's site) ---------- */
  // line crossing hours, Irad Time (jandarm.iradgov.org/line.html); internal posts are open 24 hours
  const HOURS = { "qara-chik-border-checkpoint": [6, 22], "aksay-border-patrol-post": [8, 18], "qarachik-crossing-toguz-bulak": [8, 18], "qarachik-crossing-toguz-bulak-2": [8, 18],
    "qarachik-crossing-kara-bulak": [8, 20], "qarachik-crossing-suusamyr": [8, 17], "qarachik-crossing-kök-kamar": [8, 17], "qarachik-crossing-mailuu-suu": [7, 19], "qarachik-crossing-arslanbob": [7, 19] };
  const WINTER_SHUT = ["qarachik-crossing-toguz-bulak", "qarachik-crossing-toguz-bulak-2", "qarachik-crossing-suusamyr"];   // 25 Oct to 30 Apr
  const STOP_MIN = { internal: 10, line: 35, "line-main": 45, main: 60, local: 40, minor: 30, clan: 30 };
  // site-level: the heavy-vehicle charge at the Otmek post, in dollars a passage, paid in som at the official rate
  const CHARGE_USD = { lorry: 8, bus: 5 };
  const VEH = { car: { f: 1, l: 8.5, fuel: "petrol-92" }, bus: { f: 0.85, l: 16, fuel: "diesel" }, lorry: { f: 0.72, l: 32, fuel: "diesel" } };
  // today's fares (today.json prices): [price id, place, place]
  const FARES = [["bus-nurzhan", "talas", "nurzhan", "busW"], ["marshrutka-nurzhan", "talas", "nurzhan", "marW"], ["bus-iyik-janyl", "talas", "iyik-janyl", "busW"], ["marshrutka-kyzyl-adyr", "talas", "kyzyl-adyr", "marW"]];
  const NOTICE_WORDS = { "fergana-mountain-transit-highway": ["State Route 1", "Fergana Gateway", "Otmek", "Ala-Bel", "Naryn bridge"], "kok-bel-road": ["Kök-Bel", "Toguz-Bulak"],
    "qara-chik-road": ["Qara-Chik"], "trans-talas-highway": ["Trans-Talas", "Talas North Terminal"], "chu-highway": ["Chu Gate", "Chu highway"], "talas-nurzhan-road": ["lowland road"] };

  /* ---------- geometry ---------- */
  function km(a, b) { const dx = (a[0] - b[0]) * 111.32 * Math.cos(a[1] * Math.PI / 180), dy = (a[1] - b[1]) * 110.57; return Math.hypot(dx, dy); }
  function inRings(pt, rings) {
    let inside = false;
    rings.forEach(r => { for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) inside = !inside; } });
    return inside;
  }
  function inGj(gj, pt) {
    if (!gj) return null;
    for (const f of gj.features) { const g = f.geometry; if (!g || !/Polygon$/.test(g.type)) continue; const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates; for (const p of polys) if (inRings(pt, p)) return f.properties; }
    return null;
  }

  /* ---------- state ---------- */
  let KT, G, TODAY = null, TODAY_OK = false, NOTICES = [], RWZ = null, BOZK = null;
  const st = { from: null, to: null, veh: "car", leave: "", avoid: true, picking: null, route: null };
  const ready = () => new Promise(res => { const tick = () => (window.KT && window.KT.ready() ? res(window.KT) : setTimeout(tick, 120)); tick(); });
  const getJ = u => fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });

  ready().then(kt => {
    KT = kt;
    return Promise.all([getJ("data/roadgraph.json"), getJ("data/restricted_zone.geojson").catch(() => null), getJ("data/boz_korgon.geojson").catch(() => null)]);
  }).then(([g, rz, bk]) => {
    G = g; RWZ = rz; BOZK = bk;
    G.adj = G.nodes.map(() => []);
    G.edges.forEach((e, i) => { G.adj[e[0]].push(i); G.adj[e[1]].push(i); });
    getJ("https://iradone.com/data/today.json").catch(() => getJ("https://iradgov.org/data/today.json")).then(d => { TODAY = d; TODAY_OK = true; }).catch(() => {}).then(() => { if (st.route) plan(); });
    getJ("https://jandarm.iradgov.org/data/notices.json").then(d => { NOTICES = d.notices || []; if (st.route) render(); }).catch(() => {});
    addButtons();
    const q = new URLSearchParams(location.search).get("route");
    if (q) {
      const [a, b] = q.split("~");
      st.from = parseEnd(a); st.to = parseEnd(b);
      const v = new URLSearchParams(location.search).get("v"); if (VEH[v]) st.veh = v;
      open(); if (st.from && st.to) plan();
    }
  });

  function parseEnd(s) {
    if (!s) return null;
    const m = s.match(/^(-?\d+\.\d+),(-?\d+\.\d+)$/);
    if (m) return pinEnd(+m[2], +m[1]);
    const p = KT.D.byId[s];
    return p ? placeEnd(p) : null;
  }
  const nameOfP = p => (LANG === "ru" ? p.name_ru : LANG === "ir" ? (p.name_ir || p.name) : (p.name_en || p.name)) || p.name;
  const placeEnd = p => ({ id: p.id, name: nameOfP(p), lon: p.lon, lat: p.lat, kind: p.kind, status: p.status, zone: p.zone });
  const pinEnd = (lon, lat) => ({ id: lat.toFixed(5) + "," + lon.toFixed(5), name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lon, lat, pin: true });

  /* ---------- buttons: search box and place cards ---------- */
  const ROUTE_ICON = "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z"/><path d="M9 14.5v-2.5a1.5 1.5 0 0 1 1.5-1.5H15M13 8.5l2 2-2 2"/></svg>') + "')";
  const SWAP_ICON = "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4v15M4.5 7.5 8 4l3.5 3.5M16 20V5M12.5 16.5 16 20l3.5-3.5"/></svg>') + "')";
  const PIN_ICON = "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-6-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/></svg>') + "')";
  const icn = (u, cls) => `<span class="ic${cls ? " " + cls : ""}" style="--i:${u}" aria-hidden="true"></span>`;

  function addButtons() {
    const css = document.createElement("style");
    css.textContent = `
      .rt-form { padding: 14px 22px 10px; display: grid; gap: 8px; }
      .rt-row { display: flex; align-items: center; gap: 8px; position: relative; }
      .rt-row > b { width: 54px; flex: none; font: 600 12.5px var(--head); color: var(--green-d); }
      .rt-row input[type=text], .rt-row input[type=search] { flex: 1; min-width: 0; padding: 9px 10px; border: 1px solid #cdd5ce; border-radius: 2px; font: inherit; font-size: 14px; }
      .rt-row input:focus { outline: 2px solid var(--green2); border-color: var(--green2); }
      .rt-row input[type=time] { padding: 6px 8px; border: 1px solid #cdd5ce; border-radius: 2px; font: inherit; }
      .rt-sug { position: absolute; z-index: 3; left: 62px; right: 40px; top: 40px; margin: 0; padding: 0; list-style: none; background: #fff; box-shadow: var(--shadow-lg); border-radius: 4px; max-height: 260px; overflow: auto; }
      .rt-sug li { padding: 8px 12px; cursor: pointer; font-size: 14px; } .rt-sug li small { display: block; color: var(--slate); font-size: 12px; }
      .rt-sug li:hover, .rt-sug li.on { background: var(--green-tt); }
      .rt-opt { font-size: 13px; color: var(--slate); display: flex; gap: 8px; align-items: flex-start; } .rt-opt input { margin-top: 3px; }
      .rt-sum { padding: 4px 22px 12px; } .rt-sum b.big { font: 700 22px var(--head); color: var(--green); } .rt-sum small { display: block; color: var(--slate); }
      .rt-legs li .ic { color: var(--green); } .rt-legs li em { font-style: normal; color: var(--slate); white-space: nowrap; font-size: 12.5px; }
      .rt-stop .ic { color: #9b2c2c !important; } .rt-shut { color: #b3261e; font-weight: 600; } .rt-ok { color: var(--green); font-weight: 600; }
      .rt-src { padding: 10px 22px 18px; color: var(--muted); font-size: 12px; }
      .rt-pick { position: absolute; z-index: 7; left: 50%; top: 76px; transform: translateX(-50%); background: var(--green-d); color: #fff; padding: 8px 16px; border-radius: 18px; font: 600 13px var(--head); box-shadow: var(--shadow); }
      .search .rt-btn { color: var(--green); }`;
    document.head.appendChild(css);
    const sep = $("#searchBox .sep");
    const b = document.createElement("button");
    b.type = "button"; b.className = "ico rt-btn"; b.id = "rtBtn"; b.title = t("dir"); b.setAttribute("aria-label", t("dir"));
    b.innerHTML = icn(ROUTE_ICON);
    sep.parentNode.insertBefore(b, sep);
    b.onclick = () => { st.picking = null; open(); };
    // place cards and dropped pins get a Directions button
    const cardButton = () => {
      const acts = $("#panelBody .p-actions");
      if (!acts || acts.querySelector(".rt-act") || $("#panelBody .rt-form")) return;
      const h1 = $("#panelBody .p-head h1"); if (!h1) return;
      let end = null;
      const m = h1.textContent.match(/^(-?\d+\.\d+), (-?\d+\.\d+)$/);
      if (m) end = pinEnd(+m[2], +m[1]);
      else { const id = new URLSearchParams(location.search).get("p"); const p = id && KT.D.byId[id]; if (p && nameOfP(p) === h1.textContent) end = placeEnd(p); }
      if (!end) return;
      const a = document.createElement("button");
      a.type = "button"; a.className = "act rt-act"; a.innerHTML = `<span class="c">${icn(ROUTE_ICON)}</span>${esc(t("dir"))}`;
      a.onclick = () => { st.to = end; if (st.from && st.from.id === end.id) st.from = null; open(); if (st.from) plan(); else setTimeout(() => { const i = $("#rtFrom"); if (i) i.focus(); }, 60); };
      acts.insertBefore(a, acts.children[1] || null);
    };
    new MutationObserver(cardButton).observe($("#panelBody"), { childList: true });
    cardButton();   // a card opened from a ?p= link before this script was ready
    // picking a point on the map: runs after the app's own click handler, then puts the planner back
    KT.map.on("click", e => {
      if (!st.picking) return;
      const hit = KT.map.queryRenderedFeatures([[e.point.x - 6, e.point.y - 6], [e.point.x + 6, e.point.y + 6]]).map(f => f.properties && f.properties.id && KT.D.byId[f.properties.id]).filter(Boolean);
      const end = hit.length ? placeEnd(hit[0]) : pinEnd(e.lngLat.lng, e.lngLat.lat);
      st[st.picking] = end; st.picking = null;
      const tip = $(".rt-pick"); if (tip) tip.remove();
      open(); if (st.from && st.to) plan();
    });
  }

  /* ---------- panel ---------- */
  function showPanel(html) {
    $("#panelBody").innerHTML = html;
    const panel = $("#panel"); panel.hidden = false; document.body.classList.add("has-panel");
    $("#panelScroll").scrollTop = 0;
  }
  function vehSeg() { return ["car", "bus", "lorry"].map(v => `<button type="button" data-veh="${v}" aria-pressed="${st.veh === v}">${esc(t(v))}</button>`).join(""); }
  function open() {
    showPanel(`<figure class="hero" style="--hc1:#1f8a2b;--hc2:#1f5fa8">${icn(ROUTE_ICON, "hero-ic")}<div class="hero-crumb"><span>Kartalar</span><span>${esc(t("title"))}</span></div></figure>
      <div class="p-head"><h1>${esc(t("title"))}</h1></div>
      <div class="rt-form">
        <div class="rt-row"><b>${esc(t("from"))}</b><input type="search" id="rtFrom" autocomplete="off" spellcheck="false" placeholder="${esc(t("fromPh"))}" value="${esc(st.from ? st.from.name : "")}"><button type="button" class="ico" data-pick="from" title="${esc(t("onMap"))}" aria-label="${esc(t("onMap"))}">${icn(PIN_ICON)}</button><ul class="rt-sug" id="sugFrom" hidden></ul></div>
        <div class="rt-row"><b>${esc(t("to"))}</b><input type="search" id="rtTo" autocomplete="off" spellcheck="false" placeholder="${esc(t("toPh"))}" value="${esc(st.to ? st.to.name : "")}"><button type="button" class="ico" data-pick="to" title="${esc(t("onMap"))}" aria-label="${esc(t("onMap"))}">${icn(PIN_ICON)}</button><ul class="rt-sug" id="sugTo" hidden></ul></div>
        <div class="rt-row"><b></b><button type="button" class="btn-line" id="rtSwap">${icn(SWAP_ICON)} ${esc(t("swap"))}</button></div>
        <div class="rt-row"><b></b><div class="seg" id="rtVeh">${vehSeg()}</div></div>
        <div class="rt-row"><b>${esc(t("leave"))}</b><input type="time" id="rtLeave" value="${esc(st.leave)}"><small style="color:var(--slate)">${esc(st.leave ? "" : t("now"))} · Irad Time</small></div>
        <label class="rt-opt"><input type="checkbox" id="rtAvoid"${st.avoid ? " checked" : ""}> ${esc(t("avoid"))}</label>
        <div><button type="button" class="btn-orange" id="rtGo">${esc(t("go"))}</button></div>
      </div>
      <div id="rtOut"></div>`);
    wireForm();
    if (st.route) render();
  }
  function search(qs) {
    const n = s => String(s || "").toLowerCase().replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ё/g, "е").trim();
    const q = n(qs); if (!q) return [];
    const RANK = { capital: 0, city: 1, town: 2, village: 4, hamlet: 6, quarter: 5, suburb: 5, neighbourhood: 6 };
    const out = [];
    KT.D.all.forEach(p => {
      if (p.biz || ["district", "zone-area", "foreign-city", "foreign-town", "river", "canal", "range", "valley", "desert", "glacier"].includes(p.kind)) return;
      let s = 0;
      [p.name, p.name_en, p.name_ir, p.name_ru].filter(Boolean).map(n).forEach(x => { if (x === q) s = Math.max(s, 100); else if (x.startsWith(q)) s = Math.max(s, 70); else if (x.split(" ").some(w => w.startsWith(q))) s = Math.max(s, 50); });
      if (s) out.push([s - (p._t === "place" ? (RANK[p.kind] ?? 6) : 7), p]);
    });
    return out.sort((a, b) => b[0] - a[0]).slice(0, 8).map(x => x[1]);
  }
  function wireForm() {
    ["from", "to"].forEach(k => {
      const inp = $(k === "from" ? "#rtFrom" : "#rtTo"), ul = $(k === "from" ? "#sugFrom" : "#sugTo");
      let res = [];
      const show = () => {
        res = search(inp.value);
        ul.innerHTML = res.map((p, i) => `<li data-i="${i}">${esc(nameOfP(p))}<small>${esc(p.district || p.city || p.zone || "")}</small></li>`).join("");
        ul.hidden = !res.length;
      };
      inp.addEventListener("input", show);
      inp.addEventListener("keydown", e => { if (e.key === "Enter" && res[0]) { e.preventDefault(); choose(res[0]); } else if (e.key === "Escape") ul.hidden = true; });
      inp.addEventListener("blur", () => setTimeout(() => (ul.hidden = true), 200));
      const choose = p => { st[k] = placeEnd(p); inp.value = st[k].name; ul.hidden = true; if (st.from && st.to) plan(); else $(k === "from" ? "#rtTo" : "#rtFrom").focus(); };
      ul.addEventListener("mousedown", e => { const li = e.target.closest("[data-i]"); if (li) { e.preventDefault(); choose(res[+li.dataset.i]); } });
    });
    $$("[data-pick]").forEach(b => b.onclick = () => {
      st.picking = b.dataset.pick;
      const tip = document.createElement("div"); tip.className = "rt-pick"; tip.textContent = t("tapMap"); document.body.appendChild(tip);
      if (innerWidth <= 760) $("#panel").hidden = true;
    });
    $("#rtSwap").onclick = () => { [st.from, st.to] = [st.to, st.from]; open(); if (st.from && st.to) plan(); };
    $$("#rtVeh [data-veh]").forEach(b => b.onclick = () => { st.veh = b.dataset.veh; $$("#rtVeh [data-veh]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); if (st.from && st.to) plan(); });
    $("#rtLeave").onchange = e => { st.leave = e.target.value; if (st.from && st.to) plan(); };
    $("#rtAvoid").onchange = e => { st.avoid = e.target.checked; if (st.from && st.to) plan(); };
    $("#rtGo").onclick = () => { if (st.from && st.to) plan(); else $(st.from ? "#rtTo" : "#rtFrom").focus(); };
  }

  /* ---------- today's numbers ---------- */
  function iradNow() { const d = new Date(Date.now() + 6 * 3600e3); return d; }
  function season() {
    // [{id, status, label}] from today.json; without it the Gendarmerie's usual winter rules
    const md = (() => { const d = iradNow(); return (d.getUTCMonth() + 1) * 100 + d.getUTCDate(); })();
    if (TODAY && TODAY.season && TODAY.season.roads) return TODAY.season.roads;
    const winter = md >= 1101 || md <= 331;
    return [{ id: "alabel", status: winter ? "chains" : "open" }, { id: "suusamyr", status: md >= 1025 || md <= 430 ? "winter" : "open" }, { id: "kokbel", status: winter ? "chains" : "open" }];
  }
  function tbShut() { const d = iradNow(), md = (d.getUTCMonth() + 1) * 100 + d.getUTCDate(); return md >= 1025 || md <= 430; }
  const price = id => { const p = TODAY && (TODAY.prices || []).find(x => x.id === id); return p && p.som; };
  const usdRate = () => { const r = TODAY && TODAY.rates && (TODAY.rates.official || []).find(x => x.code === "USD"); return r ? r.som : 8.4; };
  const FALLBACK = { "petrol-92": 5.4, diesel: 6.1 };

  /* ---------- routing ---------- */
  function edgeZone(e) { return e[5].includes("A") ? "ATR" : e[5].includes("X") ? "abroad" : "ISEZ"; }
  function endZone(p) {
    if (p.zone === "ISEZ" || p.zone === "ATR") return p.zone;
    const z = inGj(KT.D.zones, [p.lon, p.lat]);
    return z ? z.zone : inGj(KT.D.irad, [p.lon, p.lat]) ? "ISEZ" : "abroad";
  }
  // nearest point on the road network, on a road of the same zone (so a link never jumps the line)
  function snap(p, zone) {
    let best = null;
    G.edges.forEach((e, ei) => {
      if (edgeZone(e) !== zone && !(zone === "ISEZ" && e[5] === "c")) return;
      const g = e[6];
      for (let k = 0; k + 3 < g.length; k += 2) {
        const ax = g[k], ay = g[k + 1], bx = g[k + 2], by = g[k + 3], cl = Math.cos(ay * Math.PI / 180);
        const dx = (bx - ax) * cl, dy = by - ay, ex = (p.lon - ax) * cl, ey = p.lat - ay, LL = dx * dx + dy * dy;
        const u = LL ? Math.max(0, Math.min(1, (ex * dx + ey * dy) / LL)) : 0;
        const q = [ax + u * (bx - ax), ay + u * (by - ay)], d = km([p.lon, p.lat], q);
        if (!best || d < best.d) best = { d, ei, k, u, q };
      }
    });
    if (!best) return null;
    // the share of the edge's length before the snapped point
    const g = G.edges[best.ei][6]; let tot = 0, pre = 0;
    for (let k = 0; k + 3 < g.length; k += 2) { const s = km([g[k], g[k + 1]], [g[k + 2], g[k + 3]]); if (k < best.k) pre += s; else if (k === best.k) pre += s * best.u; tot += s; }
    best.frac = tot ? pre / tot : 0;
    return best;
  }

  function plan() {
    const out = { err: null };
    st.route = out;
    const A = st.from, B = st.to;
    if (!A || !B) return;
    if (A.id === B.id) { out.err = t("same"); return render(); }
    for (const p of [A, B]) {
      if (p.id === "boz-korgon" || inGj(BOZK, [p.lon, p.lat])) { out.err = t("bozk"); return render(); }
      p.z = endZone(p);
      if (p.z === "abroad" && !(p.kind === "border-crossing")) { out.err = t("abroad"); return render(); }
      if (p.z === "abroad") p.z = "ISEZ";
    }
    // closed edges and stops today
    const shut = new Set(), notes = [];
    const ROADS = season();
    ROADS.forEach(r => {
      const ids = G.near[r.id] || [];
      if (r.status === "closed" || r.status === "winter") ids.forEach(i => shut.add(i));
    });
    const shutStops = new Set(tbShut() ? WINTER_SHUT : []);
    G.edges.forEach((e, i) => { if ([e[0], e[1]].some(n => shutStops.has(G.stops[n]))) shut.add(i); if (e[5].includes("X")) shut.add(i); });

    const sa = snap(A, A.z), sb = snap(B, B.z);
    for (const [p, s] of [[A, sa], [B, sb]]) if (!s || s.d > (p.z === "ATR" ? 25 : 40)) { out.err = t("far", { p: p.name }) + (p.z === "ATR" ? " " + t("atrLimited") : ""); return render(); }
    const f = VEH[st.veh].f;
    const run = allowA => {
      // virtual nodes: N = start, N+1 = end; they split the snapped edges
      const N = G.nodes.length, extra = [];
      const split = (s, vn) => { const e = G.edges[s.ei]; extra.push([vn, e[0], s.ei, s.frac], [vn, e[1], s.ei, 1 - s.frac]); };
      split(sa, N); split(sb, N + 1);
      if (sa.ei === sb.ei) extra.push([N, N + 1, sa.ei, Math.abs(sa.frac - sb.frac)]);
      const okE = i => !shut.has(i) && (allowA || !G.edges[i].length || !G.edges[i][5].includes("A"));
      const dist = new Float64Array(N + 2).fill(Infinity), prev = new Array(N + 2).fill(null), done = new Uint8Array(N + 2);
      dist[N] = (sa.d > 0.25 ? sa.d * 1.35 / (A.z === "ATR" ? 25 : 35) * 60 : 0);
      const nbrs = n => {
        const r = [];
        if (n < N) G.adj[n].forEach(i => { const e = G.edges[i]; if (okE(i)) r.push([e[0] === n ? e[1] : e[0], e[4] / f, { e: i, rev: e[0] !== n }]); });
        extra.forEach(([v, m, ei, fr]) => {
          if (!okE(ei)) return;
          const c = G.edges[ei][4] * fr / f;
          if (v === n) r.push([m, c, { e: ei, part: v, to: m, fr }]);
          else if (m === n) r.push([v, c, { e: ei, part: v, to: n, fr, back: true }]);
        });
        return r;
      };
      for (;;) {
        let u = -1, best = Infinity;
        for (let i = 0; i < N + 2; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
        if (u < 0 || u === N + 1) break;
        done[u] = 1;
        nbrs(u).forEach(([v, c, how]) => {
          const sid = v < N ? G.stops[v] : null, sf = sid && KT.D.byId[sid];
          const pen = sf ? (STOP_MIN[sf.status] || 10) : 0;
          if (dist[u] + c + pen < dist[v]) { dist[v] = dist[u] + c + pen; prev[v] = [u, how]; }
        });
      }
      if (!isFinite(dist[N + 1])) return null;
      const path = []; let v = N + 1;
      while (v !== N) { const [u, how] = prev[v]; path.unshift([u, v, how]); v = u; }
      return { path, mins: dist[N + 1] + (sb.d > 0.25 ? sb.d * 1.35 / (B.z === "ATR" ? 25 : 35) * 60 : 0), N };
    };
    const bothZone = A.z === "ISEZ" && B.z === "ISEZ";
    let r = run(!(st.avoid && bothZone)), lineNote = "";
    if (r && st.avoid && bothZone) { const r2 = run(true); if (r2 && r2.mins < r.mins - 5) lineNote = "avoided"; }
    if (!r && st.avoid && bothZone) { r = run(true); if (r) lineNote = "needed"; }
    if (!r) {
      out.err = t("noRoute");
      const fg = ROADS.find(x => x.id === "alabel");
      if (fg && (fg.status === "closed" || fg.status === "winter")) out.errMore = "fg";
      return render();
    }
    out.sa = sa; out.sb = sb; out.lineNote = lineNote; out.mins = r.mins;
    // walk the path: geometry, legs by road, stops, km
    const coords = [];
    const legs = [], stops = [], used = new Set();
    let kmTot = 0, mountainKm = 0;
    const push = pts => pts.forEach(c => { const l = coords[coords.length - 1]; if (!l || l[0] !== c[0] || l[1] !== c[1]) coords.push(c); });
    if (sa.d > 0.25) { legs.push({ road: -2, km: sa.d * 1.35 }); kmTot += sa.d * 1.35; push([[A.lon, A.lat]]); }
    push([[A.lon, A.lat], sa.q]);
    r.path.forEach(([u, v, how]) => {
      const e = G.edges[how.e], g = []; used.add(how.e);
      for (let k = 0; k < e[6].length; k += 2) g.push([e[6][k], e[6][k + 1]]);
      let part, ekm;
      if (how.part === undefined) { part = how.rev ? g.slice().reverse() : g; ekm = e[3]; }
      else {
        // a piece of a split edge: from the snapped point to one end, or between the two snapped points
        const s = how.part === r.N ? sa : sb, i0 = s.k / 2;
        if (how.to !== e[0] && how.to !== e[1]) part = [sa.q, sb.q];
        else part = how.to === e[1] ? [s.q].concat(g.slice(i0 + 1)) : [s.q].concat(g.slice(0, i0 + 1).reverse());
        if (how.back) part = part.slice().reverse();
        ekm = e[3] * how.fr;
      }
      push(part);
      kmTot += ekm; if (e[5].includes("m")) mountainKm += ekm;
      const last = legs[legs.length - 1];
      if (last && last.road === e[2]) last.km += ekm; else legs.push({ road: e[2], km: ekm, atr: e[5].includes("A") });
      if (v < r.N && G.stops[v]) { const sf = KT.D.byId[G.stops[v]]; if (sf && !stops.find(x => x.f === sf)) stops.push({ f: sf, km: kmTot }); }
    });
    push([sb.q, [B.lon, B.lat]]);
    if (sb.d > 0.25) { legs.push({ road: -2, km: sb.d * 1.35 }); kmTot += sb.d * 1.35; }
    // merge the short links into the leg before them
    // tidy the legs: short pieces (overlapping roads, links, a few hundred metres into town) go into the leg before
    let lg = legs.filter(l => l.road !== -2 || l.km > 1.5);
    for (let pass = 0; pass < 3; pass++) {
      const o = [];
      lg.forEach((l, i) => {
        const prev = o[o.length - 1];
        if (prev && (prev.road === l.road || (l.km < 3 && l.road !== -2) || prev.road === -1)) { if (prev.road === -1 || (prev.km < 3 && prev.road !== -2 && l.road !== -2)) { prev.road = l.road; prev.atr = l.atr; } prev.km += l.km; prev.atr = prev.atr || l.atr; }
        else o.push(Object.assign({}, l));
      });
      lg = o;
      if (lg.length > 1 && lg[0].km < 3 && lg[0].road !== -2) { lg[1].km += lg[0].km; lg.shift(); }
    }
    out.legs = lg;
    out.km = kmTot; out.mountainKm = mountainKm; out.coords = coords; out.stops = stops;
    out.roadsUsed = new Set(lg.filter(l => l.road >= 0 && l.km >= 3).map(l => G.roads[l.road].id));
    out.lineCross = stops.filter(s => s.f.status === "line" || s.f.status === "line-main").length;
    out.season = ROADS; out.shut = shut; out.used = used;
    render();
    draw();
  }

  /* ---------- drawing ---------- */
  let mk = [];
  function draw() {
    const m = KT.map, r = st.route;
    const fc = { type: "FeatureCollection", features: r && r.coords ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: r.coords } }] : [] };
    if (!m.getSource("rt-line")) {
      m.addSource("rt-line", { type: "geojson", data: fc });
      m.addLayer({ id: "rt-case", type: "line", source: "rt-line", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#0d3b8a", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 6, 12, 11] } });
      m.addLayer({ id: "rt-line", type: "line", source: "rt-line", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#2f7ae5", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 3.5, 12, 7] } });
    } else m.getSource("rt-line").setData(fc);
    mk.forEach(x => x.remove()); mk = [];
    if (!r || !r.coords) return;
    mk.push(new maplibregl.Marker({ color: "#1f8a2b" }).setLngLat([st.from.lon, st.from.lat]).addTo(m));
    mk.push(new maplibregl.Marker({ color: "#e0531f" }).setLngLat([st.to.lon, st.to.lat]).addTo(m));
    let b = [180, 90, -180, -90]; r.coords.forEach(([x, y]) => { b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]; });
    const wide = innerWidth > 760;
    m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: wide ? { left: 430, right: 50, top: 80, bottom: 50 } : { top: 120, bottom: Math.round(innerHeight * 0.5), left: 30, right: 30 }, maxZoom: 12, duration: 600 });
  }

  /* ---------- the result ---------- */
  const fmtH = mins => { const h = Math.floor(mins / 60), m = Math.round(mins % 60); return h ? `${h} ${t("h")} ${String(m).padStart(2, "0")} ${t("min")}` : `${m} ${t("min")}`; };
  const fmtKm = k => (k < 10 ? k.toFixed(1) : Math.round(k).toLocaleString(LANG === "ru" ? "ru-RU" : "en-GB")) + " " + t("km");
  const fmtS = n => n.toLocaleString(LANG === "ru" ? "ru-RU" : "en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hhmm = mins => { const m = ((Math.round(mins) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  function startMin() { if (st.leave) { const [h, m] = st.leave.split(":").map(Number); return h * 60 + m; } const d = iradNow(); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
  const row = (icon, html, cls = "") => `<li${cls ? ` class="${cls}"` : ""}>${icn(icon)}<div>${html}</div></li>`;
  const DOT = "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.9"><circle cx="12" cy="12" r="5"/></svg>') + "')";
  const WARN = "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/></svg>') + "')";
  const SHIELD = "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z"/></svg>') + "')";
  const DOC = "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>') + "')";
  const COIN = "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2-.4-2.5-1.2M12 6.5v11"/></svg>') + "')";

  function render() {
    const box = $("#rtOut"); if (!box) return;
    const r = st.route;
    if (!r) { box.innerHTML = ""; return; }
    if (r.err) {
      box.innerHTML = `<p class="note warn">${icn(WARN)}<span>${esc(r.err)}${r.errMore === "fg" ? ` ${esc(t("fgClosed"))} <a href="https://avia.iradgov.org/" target="_blank" rel="noopener">${esc(t("fgFlight"))}</a>` : ""}</span></p>`;
      draw(); return;
    }
    const t0 = startMin();
    const mainRoad = r.legs.filter(l => l.road >= 0).sort((a, b) => b.km - a.km)[0];
    const roadName = i => (i === -2 ? t("local") : i === -1 ? t("link") : L3(G.roads[i].n));
    // stops with time of arrival and opening hours
    let kmAt = 0;
    const stopsHtml = r.stops.map(s => {
      const f = s.f, eta = t0 + r.mins * (s.km / r.km), h = HOURS[f.id];
      let hrs = "";
      if (h) { const hh = Math.floor(((eta % 1440) + 1440) % 1440 / 60); hrs = `${esc(t("hours", { o: h[0], c: h[1] }))} · <span class="${hh >= h[0] && hh < h[1] ? "rt-ok" : "rt-shut"}">${esc(hh >= h[0] && hh < h[1] ? t("openAt") : t("closedAt", { o: h[0] }))}</span>`; }
      else if (f.status === "internal") hrs = esc(t("h24"));
      const what = f.status === "internal" ? t("p_internal") + (f.id === "otmek-valley-checkpoint" ? " " + t("p_otmek") : f.id === "fergana-gateway-checkpoint" ? " " + t("p_alabel") : f.id === "naryn-bridge-checkpoint" ? " " + t("p_naryn") : "")
        : f.status === "line" || f.status === "line-main" ? t("p_line") : t("p_frontier");
      return row(SHIELD, `<b>${esc(nameOfP(f))}</b><small>${esc(t("st_" + f.status) || "")} · ${fmtKm(s.km)} · ${esc(t("eta", { t: hhmm(eta) }))}</small><small>${hrs}</small><small>${esc(what)}</small>`, "rt-stop");
    }).join("");
    const legsHtml = [row(PIN_ICON, `<b>${esc(st.from.name)}</b><small>${esc(t("start"))} · ${hhmm(t0)}</small>`)].concat(r.legs.map(l => {
      kmAt += l.km;
      return row(DOT, `${esc(roadName(l.road))}${l.road === -2 ? `<small>${esc(t("localSub", { d: Math.round(l.km) }))}</small>` : ""}${l.atr ? `<small>${esc(t("atr"))}</small>` : ""}<small>${fmtKm(l.km)}</small>`);
    }), [row(PIN_ICON, `<b>${esc(st.to.name)}</b><small>${esc(t("end"))} · ${hhmm(t0 + r.mins)}</small>`)]).join("");
    // papers
    const docs = [t("d_id")];
    if (r.lineCross) docs.push(st.from.z === "ATR" ? t("d_clan") : t("d_pass"));
    [st.from, st.to].forEach(p => { if (p.z === "ATR") docs.push(t("d_atr", { p: p.name })); if (!["capital", "city", "town", "quarter", "suburb", "neighbourhood"].includes(p.kind) && inGj(RWZ, [p.lon, p.lat])) docs.push(t("d_rwz", { p: p.name })); });
    if (st.veh === "lorry" && r.roadsUsed.has("fergana-mountain-transit-highway")) docs.push(t("d_tanker"));
    if (r.stops.some(s => ["main", "local", "minor"].includes(s.f.status)) || st.to.kind === "border-crossing" || st.from.kind === "border-crossing") docs.push(t("d_frontier"));
    // costs
    const v = VEH[st.veh], fuelP = price(v.fuel) || FALLBACK[v.fuel];
    const litres = (r.km + r.mountainKm * 0.35) * v.l / 100, fuelSom = litres * fuelP;
    const rate = usdRate();
    const costs = [row(COIN, `${esc(t("fuel", { l: Math.round(litres), f: t(v.fuel === "diesel" ? "fuelD" : "fuelP"), p: fmtS(fuelP) }))}<small>${fmtS(fuelSom)} som</small>`)];
    let total = fuelSom;
    const passesOtmek = r.stops.some(s => s.f.id === "otmek-valley-checkpoint");
    if (passesOtmek && CHARGE_USD[st.veh]) {
      const som = CHARGE_USD[st.veh] * rate; total += som;
      costs.push(row(COIN, `${esc(t("charge", { s: fmtS(som), u: CHARGE_USD[st.veh] }))}<small>${esc(t("chargeSub", { r: fmtS(rate) }))}</small>`));
    }
    costs.push(row(DOC, `${esc(t("sticker"))}<small><a href="https://e-irad.org/services/roadcharge/" target="_blank" rel="noopener">${esc(t("stickerLink"))}</a></small>`));
    if (st.veh === "bus" || st.veh === "car") {
      FARES.forEach(([pid, a, b, w]) => {
        const ids = [st.from.id, st.to.id];
        if (ids.includes(a) && ids.includes(b) && price(pid)) costs.push(row(COIN, esc(t("fare", { k: t(w), s: fmtS(price(pid)) }))));
      });
    }
    costs.push(row(COIN, `<b>${esc(t("total", { s: fmtS(total), u: "$" + (total / rate).toFixed(2) + ", " + t("officialRate") }))}</b>`));
    // passes and notices
    const SL = { open: "openS", chains: "chains", closed: "closedS", winter: "winterS", ice: "iceS" };
    const passRows = r.season.filter(x => (G.near[x.id] || []).some(i => r.used.has(i))).map(x => row(x.status === "open" ? DOT : WARN, `<b>${esc(L3(x.name) || x.id)}</b><small class="${x.status === "open" ? "rt-ok" : "rt-shut"}">${esc(L3(x.label) || t(SL[x.status] || "openS"))}</small>`));
    const notes = [];
    if (!TODAY_OK) notes.push(t("seasonOld"));
    if (tbShut() && r.roadsUsed.has("kok-bel-road") === false && st.from.z === "ISEZ" && st.to.z === "ISEZ" && (["talas", "nurzhan"].every(x => [st.from.id, st.to.id].includes(x)))) notes.push(t("tbClosed"));
    if (r.lineCross) notes.push(t("lineOn", { n: r.lineCross }));
    if (r.lineNote === "avoided" && r.lineCross === 0 && st.avoid) notes.push(t("lineAvoided"));
    if (r.lineNote === "needed") notes.push(t("lineNeeded"));
    const words = [].concat(...[...r.roadsUsed].map(id => NOTICE_WORDS[id] || []));
    const cutoff = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
    const notices = NOTICES.filter(n => n.date >= cutoff && words.some(w => (L3(n.title) + " " + (n.text && n.text.en || "")).includes(w)));

    const hdr = `${fmtH(r.mins)}`;
    const href = location.origin + location.pathname + "?route=" + encodeURIComponent(st.from.id) + "~" + encodeURIComponent(st.to.id) + "&v=" + st.veh;
    box.innerHTML = `<div class="rt-sum"><b class="big">${hdr}</b> · <b>${fmtKm(r.km)}</b>
        <small>${esc(t("arrive", { t: hhmm(t0 + r.mins) }))} · Irad Time${mainRoad ? " · " + esc(t("via", { r: roadName(mainRoad.road) })) : ""}</small></div>
      ${notes.map(n => `<p class="note info">${icn(WARN)}<span>${esc(n)}</span></p>`).join("")}
      <div class="p-actions"><button type="button" class="act" id="rtShare"><span class="c">${icn(DOC)}</span>${esc(t("share"))}</button></div>
      <div class="sect"><h2>${esc(t("steps"))}</h2></div><ul class="rows rt-legs">${legsHtml}</ul>
      ${stopsHtml ? `<div class="sect"><h2>${esc(t("stopsH"))}</h2></div><ul class="rows">${stopsHtml}</ul><ul class="rows">${row(DOC, `<a href="https://jandarm.iradgov.org/line.html" target="_blank" rel="noopener">${esc(t("lineBoard"))}</a>`)}</ul>` : ""}
      ${passRows.length ? `<div class="sect"><h2>${esc(t("roadH"))}</h2></div><ul class="rows">${passRows.join("")}${row(DOC, `<a href="https://jandarm.iradgov.org/roads.html" target="_blank" rel="noopener">${esc(t("roadsBoard"))}</a>`)}</ul>` : ""}
      ${notices.length ? `<div class="sect"><h2>${esc(t("noticeH"))}</h2></div><ul class="rows">${notices.map(n => row(WARN, `<b>${esc(L3(n.title))}</b><small>${esc(n.date)} · ${esc(L3(n.signed))}</small><small>${esc(String(L3(n.text)).replace(/<[^>]+>/g, ""))}</small>`)).join("")}</ul>` : ""}
      <div class="sect"><h2>${esc(t("docsH"))}</h2></div><ul class="rows">${docs.filter(Boolean).map(d => row(DOC, esc(d))).join("")}</ul>
      <div class="sect"><h2>${esc(t("costH"))}</h2></div><ul class="rows">${costs.join("")}</ul>
      <p class="rt-src">${esc(t("source"))}</p>`;
    $("#rtShare").onclick = () => { history.replaceState(null, "", href.replace(location.origin, "") + location.hash); (navigator.clipboard ? navigator.clipboard.writeText(href) : Promise.reject()).then(() => toast(t("copied"))).catch(() => {}); };
    history.replaceState(null, "", href.replace(location.origin, "") + location.hash);
  }
  function toast(s) { const el = $("#toast"); if (!el) return; el.textContent = s; el.hidden = false; setTimeout(() => (el.hidden = true), 2400); }
  S.en.atr = "Tribal land"; S.ir.atr = "Uruu jeri"; S.ru.atr = "Племенная земля";
  S.en.atrLimited = "Map data in the Autonomous Tribal Regions is limited.";
  S.ir.atrLimited = "Avtonomduu Uruu Aymaktarındagı karta maalımattarı chektelüü.";
  S.ru.atrLimited = "Данные карты в Автономных племенных районах ограничены.";
})();
