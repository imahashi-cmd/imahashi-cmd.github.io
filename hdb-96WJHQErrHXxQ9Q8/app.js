// 描画の仕組み（ふだんは触らない）。内容は data_*.js を直す。
// ---- 描画（データは上の DATA だけを書き換えればよい） ----
const $ = (s, el=document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const MONTHS = [4,5,6,7,8,9,10,11,12,1,2,3];
const now = new Date(); const curM = now.getMonth()+1;
let selM = curM;

document.documentElement.style.setProperty("--hero1", DATA.hero[0]);
document.documentElement.style.setProperty("--hero2", DATA.hero[1]);
document.title = DATA.title;
$("#ttl").textContent = DATA.title;
$("#sub").textContent = DATA.sub; if(!DATA.sub) $("#sub").style.display = "none";
$("#meta").innerHTML = DATA.meta.map(m => `<span>${esc(m)}</span>`).join("");

// 出所バッジ: "D:ファイル名"=文書 / "H:日付"=聞き取り / "U"=不明
function src(s){
  if(!s) return "";
  if(s === "U") return `<span class="src unk">不明</span>`;
  const [t, ...rest] = s.split(":"); const f = rest.join(":");
  if(t === "D") return `<span class="src doc" title="${esc(f)}">文書</span>`;
  if(t === "H") return `<span class="src hear" title="${esc(f)}">聞き取り</span>`;
  if(t === "S") return `<span class="src hear" title="${esc(f)}">提案（要確認）</span>`;
  return "";
}
const cat = k => DATA.cats[k] || {label:k, color:"#888", emo:"•"};
const norm = p => String(p).replace(/\//g, "\\");
function fileUrl(p){ return "file:///" + encodeURI((DATA.base + "/" + p).replace(/\\/g, "/")).replace(/#/g,"%23"); }
function pathLine(p){
  return `<span class="path">${esc(norm(p))}</span><button class="copy" data-copy="${esc(norm(DATA.base + "/" + p))}">コピー</button> <a href="${fileUrl(p)}" target="_blank">開く</a>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-copy]"); if(!b) return;
  navigator.clipboard?.writeText(b.dataset.copy).then(() => { b.textContent = "✓"; setTimeout(() => b.textContent = "コピー", 1200); });
});

// タブ
const VIEWS = DATA.key === "kokusai"
  ? [["cal","📅 年間カレンダー"],["cards","🗂 業務カード"],["src","📁 資料保管場所"],["people","🤝 関係者"],["survey","📊 アンケート結果"],["story","📖 部の物語"],["busy","🔥 繁忙期"],["todo","❓ 要確認リスト"],["handover","📗 引き継ぎ"]]
  : [["cal","📅 年間カレンダー"],["cards","🗂 業務カード"],["src","📁 資料保管場所"],["people","🤝 関係者"],["story","🧭 英語の道のり"],["busy","🔥 繁忙期"],["todo","❓ 要確認リスト"],["handover","📗 引き継ぎ"]];
$("#tabs").innerHTML = VIEWS.map(([k,l]) => `<button data-v="${k}">${l}</button>`).join("");
let storySub = "story";
function showStory(sub){
  storySub = (sub === "horizon" && DATA.key === "kokusai" && typeof STORY_HTML2 !== "undefined") ? "horizon" : "story";
  document.querySelectorAll("nav.tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === "story"));
  document.querySelectorAll("section.view").forEach(s => s.classList.toggle("on", s.id === "v-" + storySub));
  try{ localStorage.setItem("hk-view-" + DATA.key, storySub); }catch(e){}
  window.scrollTo({top: 0});
}
function show(v){
  if(v === "top") v = "cal";
  if(v === "story" || v === "horizon"){ showStory(v === "horizon" ? "horizon" : storySub); return; }
  document.querySelectorAll("nav.tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  document.querySelectorAll("section.view").forEach(s => s.classList.toggle("on", s.id === "v-" + v));
  try{ localStorage.setItem("hk-view-" + DATA.key, v); }catch(e){}
}
$("#tabs").addEventListener("click", e => { const b = e.target.closest("button"); if(b) show(b.dataset.v); });

// 全カードの月イベント
const EV = DATA.cards.flatMap(c => (c.cal||[]).map(x => ({...x, card:c})));
const byM = m => EV.filter(x => x.m === m);

function renderTop(){
  const unk = DATA.cards.reduce((n,c) => n + (c.unknown||[]).length, 0) + (DATA.todo||[]).length;
  const busiest = MONTHS.map(m => [m, byM(m).length]).sort((a,b) => b[1]-a[1])[0];
  const maxN = Math.max(1, ...MONTHS.map(m => byM(m).length));
  const usedCats = Object.keys(DATA.cats).filter(k => DATA.cards.some(c => c.cat === k));
  const nextM = curM === 12 ? 1 : curM + 1;
  const isK = DATA.key === "kokusai";
  const CATDESC = isK ? {
    program: "国内で行う英語のプログラムです。キャンプや講演会などで、英語を使う機会を作ります。",
    abroad: "生徒が海外へ行くプログラムと、留学の手続きです。企画から実施、報告までを一年で回します。",
    contest: "英語スピーチや弁論のコンテストです。校内の選考から大会への参加までを担います。",
    test: "英検・ケンブリッジ英語検定・IELTSなど、英語の検定の取りまとめです。",
    partner: "海外の学校や大学との連携と、訪問の受け入れです。",
    event: "修学旅行や保護者会、取材への対応など、学校行事と対外対応です。",
    admin: "予算要求や部の計画、備品の管理など、部を回すための運営の仕事です。"
  } : {
    hr: "来年度の授業をだれが何コマ持つかを決め、非常勤講師やJETなど、人をそろえる仕事です。主任の仕事の中心です。",
    subject: "教科会の運営、教材と予算、講習や研究授業、SSHやオンライン英会話など、教科を回すための仕事です。",
    eval: "定期考査と成績処理、入試の作問と採点、学力推移調査、英語力DBなど、試験とデータの仕事です。",
    event: "英語スピーチコンテストなど、英語科が関わる行事です。主催が他の部の行事は、英語科が受け持つ部分をまとめています。"
  };
  const step1 = "show('cal');setTimeout(()=>document.getElementById('topcal').scrollIntoView({behavior:'smooth'}),60)";
  const step1Text = "「年間カレンダー」のページで、この先2か月の予定と締切を見ます";
  const topHtml = `
    <details class="p-intro">
    <summary>はじめに ― このダッシュボードについて／後任はまずここから</summary>
    <div class="p-statement">
      <h2>${isK ? "これは、国際教育推進部長の一年の仕事を、後任がそのまま回せるようにまとめた引き継ぎダッシュボードです。" : "これは、英語科主任の一年の仕事を、後任がそのまま回せるようにまとめた引き継ぎダッシュボードです。"}</h2>
      <p>${isK ? "部の仕事は「プログラムを年に一度まわす」ことの積み重ねです。業務ごとに、目的・手順・成果の定義・年間の予定を1枚の業務カードにまとめています。" : DATA.intro}</p>
      <p class="p-note">文章についている <b>文書</b>＝ファイルに書いてあること、<b>聞き取り</b>＝前任者から聞いたこと、<b>不明</b>＝まだ確かめていないこと、です。</p>
    </div>
    <h3 class="p-intro-sub">後任はまずここから</h3>
    <div class="p-steps">
      <button class="p-step" onclick="${step1}"><b>① 今月と来月にやることを確かめる</b><span>${step1Text}（今月 ${byM(curM).length}件・来月 ${byM(nextM).length}件）。</span></button>
      <button class="p-step" onclick="show('cards')"><b>② 担当する業務のカードを開く</b><span>手順と前年の資料は、業務ごとのカードにまとまっています（全${DATA.cards.length}件）。</span></button>
      <button class="p-step" onclick="show('todo')"><b>③ 分からないことは「要確認」で確かめる</b><span>文書で確かめられなかったことは、前任者に聞くこととして一覧にしています（${unk}件）。</span></button>
    </div>
    </details>
    ${isK ? `<h2>部の物語</h2>
    <div class="p-stories">
      <button class="p-story" onclick="showStory('story')"><b>🧭 英語の道のり</b><span>英語の力の伸びと進路を語る物語です。高校3年間の目標と物差しを示します。</span></button>
      <button class="p-story" onclick="showStory('horizon')"><b>🌏 世界に視野を広げる</b><span>海外研修・留学と受け入れを通して、異なる文化や考え方に触れる、経験と視野の物語です。</span></button>
    </div>` : ""}
    <h2>${isK ? "部の仕事の全体像" : "仕事の全体像"}</h2>
    ${DATA.key === "kokusai" ? `
        <div class="panel flow-panel">
          <details class="flow-toggle"><summary>中学1年〜3年</summary>
          <div class="fl-wrap"><div class="tl">
            <div class="tl-head"><span class="tl-year"></span><div class="tl-periods"><span style="width:26%">4月〜6月</span><span style="width:13%">夏休み</span><span style="width:35%">9月〜12月</span><span style="width:26%">1月〜3月</span></div><span class="tl-goal"></span></div>
            <div class="tl-row"><span class="tl-grade">中学1年</span><div class="tl-track"><div class="tl-seg" style="width:26%"><span class="tl-chip " style="--cc:#1f9e6a">Freshman English Camp</span><span class="tl-chip " style="--cc:#e88600">国際講演会（中2と合同）</span></div><div class="tl-seg" style="width:13%"></div><div class="tl-seg" style="width:35%"></div><div class="tl-seg" style="width:26%"></div></div><span class="tl-goal">英検<br>4級</span></div>
            <div class="tl-row"><span class="tl-grade">中学2年</span><div class="tl-track"><div class="tl-seg" style="width:26%"><span class="tl-chip " style="--cc:#1f9e6a">Boost up English Camp</span><span class="tl-chip " style="--cc:#e88600">国際講演会（中1と合同）</span></div><div class="tl-seg" style="width:13%"><span class="tl-chip " style="--cc:#2f6fde">🇮🇪 アイルランドサマープログラム（希望者・中3も対象）</span></div><div class="tl-seg" style="width:35%"></div><div class="tl-seg" style="width:26%"><span class="tl-chip " style="--cc:#e88600">鎌倉自主研修</span></div></div><span class="tl-goal">英検<br>3級</span></div>
            <div class="tl-row"><span class="tl-grade">中学3年</span><div class="tl-track"><div class="tl-seg" style="width:26%"><span class="tl-chip " style="--cc:#e88600">国際講演会</span></div><div class="tl-seg" style="width:13%"><span class="tl-chip " style="--cc:#1f9e6a">外部講師英検講習（希望者・中2も対象）</span></div><div class="tl-seg" style="width:35%"><span class="tl-chip " style="--cc:#d92b2b">高円宮杯</span><span class="tl-chip " style="--cc:#1f9e6a">TGG</span><span class="tl-chip " style="--cc:#2f6fde">🇨🇦 カナダ修学旅行</span></div><div class="tl-seg" style="width:26%"></div></div><span class="tl-goal">英検<br>準2級</span></div>
            <div class="tl-row"><span class="tl-grade">共通</span><div class="tl-track"><div class="tl-seg" style="width:26%"></div><div class="tl-seg" style="width:13%"></div><div class="tl-seg" style="width:35%"><span class="tl-chip " style="--cc:#1f9e6a">Let’s Chat in English!（希望者）</span></div><div class="tl-seg" style="width:26%"><span class="tl-chip " style="--cc:#d92b2b">英語スピーチコンテスト</span></div></div><span class="tl-goal"></span></div>
          </div></div>
          <p class="fl-note">英検は第1回・第2回・第3回とも外部本会場で受験し、目標は準2級。</p>
          </details><details class="flow-toggle"><summary>高校1年〜3年</summary>
          <div class="fl-wrap"><div class="tl">
            <div class="tl-head"><span class="tl-year"></span><div class="tl-periods"><span style="width:26%">4月〜6月</span><span style="width:13%">夏休み</span><span style="width:35%">9月〜12月</span><span style="width:26%">1月〜3月</span></div><span class="tl-goal"></span></div>
            <div class="tl-row"><span class="tl-grade">高校1年</span><div class="tl-track"><div class="tl-seg" style="width:26%"><span class="tl-chip " style="--cc:#e88600">国際講演会</span></div><div class="tl-seg" style="width:13%"></div><div class="tl-seg" style="width:35%"><span class="tl-chip " style="--cc:#7c3aed;margin-top:36px">Cambridge A2 Key（希望者）</span></div><div class="tl-seg" style="width:26%"></div><span class="tl-chip tl-wide" style="--cc:#2f6fde">🇮🇪 アイルランド1年留学（内進生）</span></div><span class="tl-goal">英検<br>2級</span></div>
            <div class="tl-row"><span class="tl-grade">高校2年</span><div class="tl-track"><div class="tl-seg" style="width:26%"></div><span class="tl-chip tl-ie2" style="--cc:#2f6fde">🇮🇪 アイルランド1年留学（内進生）</span><div class="tl-seg" style="width:13%"></div><div class="tl-seg" style="width:35%"><span class="tl-chip " style="--cc:#7c3aed">Cambridge B1 Preliminary（希望者）</span><span class="tl-chip " style="--cc:#e88600">国内修学旅行</span></div><div class="tl-seg" style="width:26%"></div></div><span class="tl-goal">英検<br>準1級</span></div>
            <div class="tl-row"><span class="tl-grade">高校3年</span><div class="tl-track"><div class="tl-seg" style="width:26%"></div><div class="tl-seg" style="width:13%"><span class="tl-chip " style="--cc:#7c3aed">IELTS（希望者）</span></div><div class="tl-seg" style="width:35%"></div><div class="tl-seg" style="width:26%"></div></div><span class="tl-goal"></span></div>
            <div class="tl-row"><span class="tl-grade">共通（高1・高2）</span><div class="tl-track"><div class="tl-seg" style="width:26%"><span class="tl-chip " style="--cc:#2f6fde">海外大学進学相談会（希望者）</span></div><div class="tl-seg" style="width:13%"><span class="tl-chip " style="--cc:#2f6fde">🇺🇸 オレゴンサマープログラム（希望者）</span><span class="tl-chip " style="--cc:#1f9e6a">外部講師英検講習（希望者）</span></div><div class="tl-seg" style="width:35%"><span class="tl-chip " style="--cc:#2f6fde">🇳🇱 オランダプログラム（希望者）</span><span class="tl-chip " style="--cc:#1f9e6a">Let’s Chat in English!（希望者）</span><span class="tl-chip " style="--cc:#d92b2b">東洋大学英語スピーチコンテスト</span></div><div class="tl-seg" style="width:26%"></div></div><span class="tl-goal"></span></div>
          </div></div>
          <p class="fl-note">英検は第1回・第2回・第3回とも外部本会場で受験し、目標は準1級。Cambridgeは高1がA2 Key、高2がB1 Preliminaryを、いずれも12月に校内会場で実施し、目標はB1。IELTSは夏休み期間中に生徒が各自で受験日程を決めて受け、目標は6.5。</p>
          </details>
        </div>` : ""}
    <div class="p-map">${usedCats.map(k => { const cs = DATA.cards.filter(c => c.cat === k); return `
      <div class="p-group" style="--gc:${cat(k).color}">
        <h3>${cat(k).emo} ${esc(cat(k).label)}（${cs.length}件）</h3>
        <p>${esc(CATDESC[k] || "")}</p>
        <div class="p-links">${cs.map(c => `<a href="#" data-open="${c.id}">${esc(c.name)}</a>`).join("")}</div>
      </div>`;}).join("")}
    </div>
    <div id="topcal">

    <h2>年間カレンダー（4月はじまり）</h2>
    <p class="p-stats">収録している業務は全${DATA.cards.length}件、年間の予定・締切は${EV.length}件（うち締切 ${EV.filter(x=>x.dl).length}件）、いちばん忙しいのは${busiest[0]}月（${busiest[1]}件）です。月を押すと、その月にやることが下に出ます。</p>
    ${isK ? `<p class="yt-btnrow"><button type="button" class="yt-pdf-btn" onclick="printYear()">📄 一年間のやること一覧（PDF）</button><span class="yt-note">一年分（4月〜3月）の予定・締切を1枚の表にして、印刷／PDF保存できます。</span></p>` : ""}
    <div class="legend">${usedCats.map(k => `<span><i style="background:${cat(k).color}"></i>${cat(k).label}</span>`).join("")}<span>◆ ＝締切</span><span>赤枠＝今月</span></div>
    <div class="ribbon">${MONTHS.map(m => {
      const es = byM(m);
      return `<div class="mon ${m===curM?"now":""} ${m===selM?"sel":""}" data-m="${m}">
        <h4>${m}月</h4>
        <div class="dots">${es.map(x => `<span class="dot ${x.dl?"dl":""}" title="${esc(x.card.name+"："+x.text)}" style="background:${cat(x.card.cat).color}"></span>`).join("")}</div>
        <div class="cnt">${es.length}件</div>
        <div class="heat" style="opacity:${.08 + .8*es.length/maxN}"></div>
      </div>`;}).join("")}
    </div>
    <h2 id="mtitle"></h2>
    <div class="panel"><ul class="events" id="mlist"></ul></div>
    </div>`;
  const cut = topHtml.indexOf('<div id="topcal">');
  $("#v-handover").innerHTML = topHtml.slice(0, cut);
  $("#v-cal").innerHTML = topHtml.slice(cut);
  $("#v-cal .ribbon").addEventListener("click", e => { const d = e.target.closest(".mon"); if(!d) return; selM = +d.dataset.m; renderTop(); $("#mtitle").scrollIntoView({behavior:"smooth", block:"start"}); });
  const es = byM(selM).sort((a,b) => (parseInt(a.d?.split("/")[1])||99) - (parseInt(b.d?.split("/")[1])||99));
  $("#mtitle").textContent = `${selM}月にやること${selM===curM?"（今月）":""}`;
  $("#mlist").innerHTML = es.length ? es.map(x => `<li><span class="when">${esc(x.d||selM+"月")}</span>
      <span><span class="tag" style="background:${cat(x.card.cat).color}">${esc(x.card.name)}</span>${x.dl?'<span class="dlmark">◆締切 </span>':""}${esc(x.text)} ${src(x.src)}
      <a href="#" data-open="${x.card.id}">→カード</a></span></li>`).join("")
    : `<li><span></span><span style="color:var(--muted)">この月の予定は、いま収録している業務にはありません。</span></li>`;
}

let fcat = null;
let fsrc = null;
function renderCards(){
  const cats = Object.keys(DATA.cats).filter(k => DATA.cards.some(c => c.cat === k));
  const hasPaused = (DATA.paused || []).length > 0;
  if(!(fcat === "all" || fcat === "paused" || cats.includes(fcat))) fcat = cats[0];
  const list = DATA.cards.filter(c => fcat === "all" || c.cat === fcat);
  const chips = `${cats.map(k => `<button class="chip ${fcat===k?"on":""}" data-f="${k}">${cat(k).emo} ${cat(k).label}</button>`).join("")}${hasPaused ? `<button class="chip ${fcat==="paused"?"on":""}" data-f="paused">⏸ 休止中のプログラム</button>` : ""}<button class="chip ${fcat==="all"?"on":""}" data-f="all">すべて</button>`;
  const pausedHtml = hasPaused ? `<h2>休止中のプログラム（${DATA.paused.length}件）</h2><div class="panel"><table><tr><th style="width:22%">名前</th><th style="width:14%">最後</th><th>メモ</th></tr>${DATA.paused.map(p => `<tr><td>${esc(p.name)} ${src(p.src)}</td><td>${esc(p.last)}</td><td>${esc(p.note)}<br>${pathLine(p.path)}</td></tr>`).join("")}</table></div>` : "";
  $("#v-cards").innerHTML = `
    <div class="filters">${chips}</div>
    ${fcat === "paused" ? pausedHtml : `<div class="grid g3">${list.map(c => `
      <div class="card" data-open="${c.id}">
        <div class="bar" style="background:${cat(c.cat).color}"></div>
        <div class="in">
          <h3><span class="emo">${cat(c.cat).emo}</span>${esc(c.name)}</h3>
          <p>${esc(c.lead)}</p>
          <div class="foot"><span class="pill">${esc(c.status)}</span><span class="pill">${esc(c.season)}</span>${(c.unknown||[]).length?`<span class="pill warn">要確認 ${c.unknown.length}</span>`:""}</div>
          <button class="print-btn" data-print="${c.id}">🖨 印刷</button>
        </div>
      </div>`).join("")}</div>`}`;
  $("#v-cards .filters").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if(b){ fcat = b.dataset.f; renderCards(); } });
}

function openCard(id){
  const c = DATA.cards.find(x => x.id === id); if(!c) return;
  const d = $("#dlg");
  d.innerHTML = cardDetailHtml(c);
  d.showModal(); d.querySelector(".dbody").scrollTop = 0;
}
function printCard(id){
  const c = DATA.cards.find(x => x.id === id); if(!c) return;
  const dlg = $("#dlg"); if(dlg && dlg.open) dlg.close();
  let pa = $("#print-area");
  if(!pa){ pa = document.createElement("div"); pa.id = "print-area"; document.body.appendChild(pa); }
  pa.style.maxWidth = "";
  pa.innerHTML = `<div class="print-help">🖨 印刷用レイアウトを表示しています。<button type="button" onclick="window.print()">🖨 印刷する</button><button type="button" onclick="exitPrintMode()">← ダッシュボードに戻る</button></div>` + cardDetailHtml(c);
  document.body.classList.add("printing-card");
  window.scrollTo(0, 0);
}
function printYear(){
  let pa = $("#print-area");
  if(!pa){ pa = document.createElement("div"); pa.id = "print-area"; document.body.appendChild(pa); }
  const rows = MONTHS.map(m => {
    const es = byM(m).slice().sort((a,b) => (parseInt(a.d?.split("/")[1])||99) - (parseInt(b.d?.split("/")[1])||99));
    if(!es.length) return "";
    return `<tr class="yt-monrow"><td colspan="3">${m}月</td></tr>` + es.map(x => `<tr><td class="yt-when">${esc(x.d||"")}</td><td class="yt-card"><span class="tag" style="background:${cat(x.card.cat).color}">${esc(x.card.name)}</span></td><td>${x.dl ? '<span class="dlmark">◆締切 </span>' : ""}${esc(x.text)}</td></tr>`).join("");
  }).join("");
  pa.innerHTML = `<div class="print-help">🖨 印刷用レイアウトを表示しています。<button type="button" onclick="window.print()">🖨 印刷する</button><button type="button" onclick="exitPrintMode()">← ダッシュボードに戻る</button></div><div class="year-sheet"><h1>一年間のやること一覧 ― 国際教育推進部</h1><p class="yt-sub">4月はじまり。全${EV.length}件（うち締切 ${EV.filter(x=>x.dl).length}件）。詳しい手順は各業務のカードを見てください。</p><table class="yt"><thead><tr><th style="width:56px">日付</th><th style="width:170px">業務</th><th>やること</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  document.body.classList.add("printing-card");
  window.scrollTo(0, 0);
}
function exitPrintMode(){ document.body.classList.remove("printing-card"); const pa = $("#print-area"); if(pa) pa.style.maxWidth = ""; }
window.addEventListener("afterprint", () => document.body.classList.remove("printing-card"));
document.addEventListener("click", e => { const b = e.target.closest("[data-print]"); if(b){ e.preventDefault(); e.stopPropagation(); printCard(b.dataset.print); } }, true);
function cardDetailHtml(c){
  const k = cat(c.cat);
  return `
    <div class="dhead" style="background:linear-gradient(120deg,${k.color},${DATA.hero[1]})">
      <button class="close" onclick="this.closest('dialog').close()">×</button>
      <button class="print-btn-d" data-print="${c.id}">🖨 印刷</button>
      <div style="font-size:13px;opacity:.9">${k.emo} ${esc(k.label)}・${esc(c.status)} ${src(c.statusSrc)}</div>
      <h2>${esc(c.name)}</h2><p>${esc(c.lead)}</p>
    </div>
    <div class="dbody">
      ${c.story?`<h3>ストーリー（なぜこの業務があるのか）</h3>${c.story.map(t => `<h4>${esc(t.h)}</h4>${t.body.map(b => `<p>${esc(b)}</p>`).join("")}`).join("")}`:""}
      <h3>業務概要（何のための業務か）</h3>
      ${c.summary.map(s => `<p>${esc(s[0])} ${src(s[1])}</p>`).join("")}
      <h3>成果の定義（「できた」と言える状態）</h3>
      ${c.outcome.map(s => `<p>${esc(s[0])} ${src(s[1])}</p>`).join("")}
      <h3>成果の根拠（文書・データ・記録と保管場所）</h3>
      <table><tr><th>根拠</th><th>保管場所</th></tr>${c.evidence.map(e => `<tr><td>${esc(e.what)} ${e.personal?'<span class="src unk">個人情報あり・転記しない</span>':""}</td><td>${pathLine(e.where)}</td></tr>`).join("")}</table>
      <h3>ワークフロー（開始から完了まで）</h3>
      <ol class="flow">${c.flow.map(f => `<li><div class="fw">${esc(f.when)}</div><div>${esc(f.what)} ${src(f.src)}</div>
        ${f.approve?`<span class="appr">承認・決定：${esc(f.approve)}</span> `:""}${f.decide?`<span class="decide">判断ポイント：${esc(f.decide)}</span>`:""}</li>`).join("")}</ol>
      <h3>年間スケジュール（月別の節目と締切）</h3>
      <table><tr><th style="width:70px">月</th><th style="width:80px">日付の例</th><th>内容</th></tr>${[...(c.cal||[])].sort((a,b)=>MONTHS.indexOf(a.m)-MONTHS.indexOf(b.m)).map(x => `<tr><td>${x.m}月</td><td>${esc(x.d||"")}</td><td>${x.dl?'<span class="dlmark">◆</span>':""}${esc(x.text)} ${src(x.src)}</td></tr>`).join("")}</table>
      <h3>関係者・連絡先</h3>
      <table><tr><th>立場</th><th>だれ（役職・団体・氏名）</th></tr>${c.people.map(p => `<tr><td>${esc(p.role)}</td><td>${esc(p.who)} ${src(p.src)}</td></tr>`).join("")}</table>
      <p style="font-size:13px;color:var(--muted)">電話番号などの連絡先は、ここに転記していません。各年度の「緊急時連絡体制」などの文書で確認してください。</p>
      <h3>参考資料（元のフォルダ・ファイル）</h3>
      <table>${c.refs.map(r => `<tr><td style="width:34%">${esc(r.label)}</td><td>${pathLine(r.path)}</td></tr>`).join("")}</table>
      <h3>注意事項・引き継ぎメモ</h3>
      ${c.notes.map(n => `<div class="note">${esc(n[0])} ${src(n[1])}</div>`).join("")}
      ${(c.unknown||[]).length?`<h3>要確認（前任者に聞くこと）</h3><ul>${c.unknown.map(u => `<li>${esc(u)}</li>`).join("")}</ul>`:""}
    </div>`;
}
document.addEventListener("click", e => { const o = e.target.closest("[data-open]"); if(o){ e.preventDefault(); openCard(o.dataset.open); } });
document.addEventListener("click", e => { const b = e.target.closest("[data-ss]"); if(b){ showStory(b.dataset.ss); } });
$("#dlg").addEventListener("click", e => { if(e.target.id === "dlg") e.target.close(); });

function renderPeople(){
  const alias = DATA.partyAlias || {}, split = DATA.partySplit || {};
  const m = new Map();
  DATA.cards.forEach(c => c.people.forEach(p => { if(p.in) return; const parties = split[p.who] || [alias[p.who] || p.who]; parties.forEach(who => { if(!m.has(who)) m.set(who, {who, roles:[], cards:[]}); const r = m.get(who); if(!r.roles.includes(p.role)) r.roles.push(p.role); if(!r.cards.includes(c)) r.cards.push(c); }); }));
  const rows = [...m.values()].map(r => ({...r, role: r.roles.join(" ／ ")})).sort((a,b) => a.who.localeCompare(b.who, "ja"));
  $("#v-people").innerHTML = `<div class="callout">校外の関係先だけを載せています（京北中高の教員・事務は除きます。東洋大学のスタッフは校外として含みます）。同じ関係先は、役割が複数あっても1件にまとめています。連絡先は今橋のGmailの履歴から拾ったメールアドレスで、載っていない関係先はメール履歴に直接の連絡先がありませんでした。だれに聞けばよいか分かるように、役職・団体と、分かっている人は氏名を載せています（人が替わったら氏名を直してください）。連絡先（電話・メール）は各年度の文書を見てください。</div>
    <input id="pplq" class="ppl-search" type="search" placeholder="名前・立場・業務名で探す（例：オランダ、業者、東武トップ）">
    <div class="ppl-list">${rows.map(r => `
      <div class="ppl">
        <div class="ppl-main"><div class="ppl-who">${esc(r.who)}</div><div class="ppl-role">${esc(r.role)}</div>${(DATA.partyContact || {})[r.who] ? `<div class="ppl-contact">連絡先：${esc((DATA.partyContact || {})[r.who])}</div>` : ""}</div>
        <div class="ppl-cards">${r.cards.map(c => `<a href="#" data-open="${c.id}" style="--gc:${cat(c.cat).color}">${esc(c.name)}</a>`).join("")}</div>
      </div>`).join("")}</div>
    <p class="ppl-none" style="display:none">当てはまる人が見つかりませんでした。</p>`;
  const q = $("#pplq");
  q.addEventListener("input", () => {
    const t = q.value.trim();
    let shown = 0;
    document.querySelectorAll("#v-people .ppl").forEach(el => {
      const hit = !t || el.textContent.includes(t);
      el.style.display = hit ? "" : "none";
      if(hit) shown++;
    });
    document.querySelector("#v-people .ppl-none").style.display = shown ? "none" : "";
  });
}


function renderSurvey(){
  const el = $("#v-survey"); if(!el || !DATA.surveys) return;
  const S = DATA.surveys;
  const nameOf = id => { const c = DATA.cards.find(x => x.id === id); return c ? c.name : id; };
  const fmt = v => (typeof v === "number") ? v.toFixed(2) : "―";
  el.innerHTML = `<div class="callout">${esc(S.note)}</div>
    <div class="panel sv-panel">
      <h3>共通設問のプログラム（5件法の平均）</h3>
      <div class="sv-scroll"><table class="sv-table">
        <tr><th>プログラム</th><th>年度</th><th class="num">回答数</th>${S.commonHeads.map(h => `<th class="num">${esc(h)}</th>`).join("")}<th>備考</th></tr>
        ${S.common.map(r => `<tr><td><a href="#" data-open="${r.card}">${esc(nameOf(r.card))}</a></td><td>${esc(r.year)}</td><td class="num">${r.n ? r.n + "件" : "―"}</td>${r.vals.map(v => `<td class="num sv-val">${fmt(v)}</td>`).join("")}<td>${esc(r.note)}<br>${src(r.src)}</td></tr>`).join("")}
      </table></div>
      <p class="p-note">満足度は各カードの成果の定義で平均4.5以上を目標に置いています。自信の変化は、満足度が高くても連動して上がるとは限らないことが分析レポートで指摘されています。</p>
    </div>
    <div class="panel sv-panel">
      <h3>そのほかのプログラムのアンケート</h3>
      <div class="sv-scroll"><table class="sv-table">
        <tr><th>プログラム</th><th>アンケートの目標（成果の定義）</th><th>集計の状態</th></tr>
        ${S.others.map(r => `<tr><td><a href="#" data-open="${r.card}">${esc(nameOf(r.card))}</a></td><td>${esc(r.target)}</td><td>${esc(r.state)}</td></tr>`).join("")}
      </table></div>
    </div>
    ${(S.items && S.items.length) ? `<div class="panel sv-panel"><h3>共通アンケートの項目</h3><ol class="sv-items">${S.items.map(t => `<li>${esc(t)}</li>`).join("")}</ol></div>` : ""}`;
}

function renderBusy(){
  const B = DATA.busy;
  $("#v-busy").innerHTML = `<div class="callout">${esc(B.note)}</div>
    <h2>1年の山</h2><div class="grid bz-periods">${B.periods.map(p => `<div class="panel"><h3 class="bz-t">${esc(p.t)}</h3><p>${esc(p.d)}</p></div>`).join("")}</div>
    ${B.sameDay.length?`<h2>同じ日の重なり</h2><div class="panel"><table class="bz-stack"><tr><th style="width:18%">日付</th><th>重なるもの</th><th style="width:30%">担当</th><th style="width:12%">種類</th></tr>${B.sameDay.map(x => `<tr><td>${esc(x.d)}</td><td>${esc(x.t)}</td><td>${esc(x.who)}</td><td><span class="pill ${x.level==="同じ人"?"warn":""}">${esc(x.level)}</span></td></tr>`).join("")}</table></div>`:""}
    ${B.advice?`<div class="note">${esc(B.advice)}</div>`:""}
    <h2>月別の件数</h2><div class="panel"><table><tr><th>月</th><th>予定・締切</th><th>うち締切</th></tr>${MONTHS.map(m => `<tr><td>${m}月</td><td>${byM(m).length}</td><td>${byM(m).filter(x => x.dl).length}</td></tr>`).join("")}</table></div>
    <div class="note">${esc(B.both)}</div>`;
}

function renderTodo(){
  const items = DATA.cards.flatMap(c => (c.unknown||[]).map(u => ({c, u})));
  const nOut = items.filter(x => /成果/.test(x.u)).length;
  const nameOf = id => DATA.cards.find(c => c.id === id)?.name || id;
  $("#v-todo").innerHTML = `<div class="callout">文書で確かめられなかったこと、人間の判断が要ることの一覧です。答えが分かったら、該当カードに「聞き取り」として書き足します。業務ごとの ${items.length} 件のうち、${nOut} 件は成果の定義に関すること、${items.length-nOut} 件は手順・場所・担当などです。</div>
    ${(DATA.priority||[]).length?`<h2>引き継ぎまでに先に片付けるもの</h2><div class="panel"><table class="bz-stack"><tr><th style="width:22%">業務</th><th style="width:20%">いつまでに</th><th>確認すること</th><th style="width:28%">先にする理由</th></tr>${DATA.priority.map(p => `<tr><td><a href="#" data-open="${esc(p.id)}">${esc(nameOf(p.id))}</a></td><td>${esc(p.when)}</td><td>${esc(p.q)}</td><td>${esc(p.why)}</td></tr>`).join("")}</table></div>`:""}
    ${(DATA.todo||[]).length?`<h2>ダッシュボード全体</h2><div class="panel"><ul>${DATA.todo.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>`:""}
    <h2>業務ごと</h2><div class="panel"><table><tr><th style="width:28%">業務</th><th>確認すること</th></tr>${items.map(x => `<tr><td><a href="#" data-open="${x.c.id}">${esc(x.c.name)}</a></td><td>${esc(x.u)}</td></tr>`).join("")}</table></div>
    ${(DATA.rules||[]).length?`<h2>このダッシュボードの決まり</h2><div class="panel"><ul>${DATA.rules.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>`:""}`;
}

function renderSrc(){
  const catOrder = Object.keys(DATA.cats);
  const perCard = DATA.cards.map(c => {
    const docs = new Map();
    [...c.refs, ...c.evidence.map(e => ({label:e.what, path:e.where}))].forEach(r => { if(r.path && !docs.has(r.path)) docs.set(r.path, r); });
    return {card: c, docs: [...docs.values()].sort((a,b) => a.label.localeCompare(b.label, "ja"))};
  }).filter(x => x.docs.length).sort((a,b) => {
    const co = catOrder.indexOf(a.card.cat) - catOrder.indexOf(b.card.cat); if(co) return co;
    const ord = (DATA.srcOrder || {})[a.card.cat] || [];
    const ia = ord.indexOf(a.card.id), ib = ord.indexOf(b.card.id);
    if(ia >= 0 && ib >= 0) return ia - ib;
    if(ia >= 0) return -1; if(ib >= 0) return 1;
    return a.card.name.localeCompare(b.card.name, "ja");
  });
  const srcCats = [...new Set(perCard.map(x => x.card.cat))];
  if(!(fsrc === "all" || srcCats.includes(fsrc))) fsrc = srcCats[0];
  const shown = perCard.filter(x => fsrc === "all" || x.card.cat === fsrc);
  $("#v-src").innerHTML = `<div class="callout">このページは、各プログラムのカードに書かれた内容の<strong>根拠になった資料</strong>を、プログラムごとに確かめるための一覧です。引き継ぎのときの<strong>棚卸し</strong>にも使えます。<br>基準フォルダ：<span class="path">${esc(norm(DATA.base))}</span>　「開く」は学校PC（Gドライブがある環境）で使えます。</div>
    <div class="filters src-filters">${srcCats.map(k => `<button class="chip ${fsrc===k?"on":""}" data-sf="${k}">${cat(k).emo} ${cat(k).label}</button>`).join("")}<button class="chip ${fsrc==="all"?"on":""}" data-sf="all">すべて</button></div>
    <input id="srcq" class="ppl-search" type="search" placeholder="資料名・プログラム名・フォルダ名で探す">
    ${shown.map(x => `
    <div class="src-group panel" style="--gc:${cat(x.card.cat).color}">
      <h3 class="src-prog"><a href="#" data-open="${x.card.id}">${esc(x.card.name)}</a> <span class="src-cnt">資料 ${x.docs.length}件</span><button class="src-toggle" aria-expanded="false">▸ 資料を開く</button></h3><div class="src-items" style="display:none">
      ${x.docs.map(r => `
      <div class="src-item">
        <div class="src-label">${esc(r.label)}</div>
        <div class="src-path">${esc(norm(r.path))}</div>
        <div class="src-act"><button class="copy" data-copy="${esc(norm(DATA.base + "/" + r.path))}">コピー</button> <a href="${fileUrl(r.path)}" target="_blank">開く</a></div>
      </div>`).join("")}
    </div></div>`).join("")}
    <p class="src-none" style="display:none">当てはまる資料が見つかりませんでした。</p>`;
  const setGroupOpen = (g, open) => {
    const box = g.querySelector(".src-items");
    const btn = g.querySelector(".src-toggle");
    if(box) box.style.display = open ? "" : "none";
    if(btn){ btn.setAttribute("aria-expanded", open ? "true" : "false"); btn.textContent = open ? "▾ 資料を閉じる" : "▸ 資料を開く"; }
  };
  document.querySelectorAll("#v-src .src-toggle").forEach(btn => btn.addEventListener("click", () => {
    const g = btn.closest(".src-group");
    setGroupOpen(g, btn.getAttribute("aria-expanded") !== "true");
  }));
  $("#v-src .src-filters").addEventListener("click", e => { const b = e.target.closest("[data-sf]"); if(b){ fsrc = b.dataset.sf; renderSrc(); } });
  const q = $("#srcq");
  q.addEventListener("input", () => {
    const t = q.value.trim();
    let shown = 0;
    document.querySelectorAll("#v-src .src-group").forEach(g => {
      let gShown = 0;
      g.querySelectorAll(".src-item").forEach(el => {
        const hit = !t || el.textContent.includes(t) || g.querySelector(".src-prog").textContent.includes(t);
        el.style.display = hit ? "" : "none";
        if(hit) gShown++;
      });
      g.style.display = gShown ? "" : "none";
      if(t) setGroupOpen(g, gShown > 0); else setGroupOpen(g, false);
      shown += gShown;
    });
    document.querySelector("#v-src .src-none").style.display = shown ? "none" : "";
  });
}

const STORY_SWITCH = sub => (DATA.key === "kokusai" && typeof STORY_HTML2 !== "undefined") ? `<div class="story-switch"><button data-ss="story" class="${sub === "story" ? "on" : ""}">🧭 英語の道のり</button><button data-ss="horizon" class="${sub === "horizon" ? "on" : ""}">🌏 世界に視野を広げる</button></div>` : "";
const STORY_TOOLS = sub => `<div class="story-tools"><button type="button" onclick="printStory('${sub}')">🖨 この物語の印刷用レイアウトを表示</button></div>`;
function printStory(sub){
  const srcEl = document.getElementById(sub === "horizon" ? "v-horizon" : "v-story");
  if(!srcEl) return;
  const clone = srcEl.cloneNode(true);
  clone.querySelectorAll(".story-switch,.story-tools").forEach(el => el.remove());
  clone.querySelectorAll("[hidden]").forEach(el => el.removeAttribute("hidden"));
  clone.querySelectorAll("details").forEach(el => el.setAttribute("open",""));
  let pa = $("#print-area");
  if(!pa){ pa = document.createElement("div"); pa.id = "print-area"; document.body.appendChild(pa); }
  pa.style.maxWidth = "1060px";
  pa.innerHTML = `<div class="print-help">🖨 印刷用レイアウトを表示しています。<button type="button" onclick="window.print()">🖨 印刷する</button><button type="button" onclick="exitPrintMode()">← ダッシュボードに戻る</button></div>`;
  pa.appendChild(clone);
  document.body.classList.add("printing-card");
  window.scrollTo(0, 0);
}
// 本文は story.js の STORY_HTML
function renderStory(){ $("#v-story").innerHTML = STORY_SWITCH("story") + STORY_TOOLS("story") + STORY_HTML; initRoadmap(); }
// 「英語の道のり」の対話要素（学年タブ・大学リストの絞り込み）。単体ページのスクリプトを #v-story 内に閉じて動かす。
function initRoadmap(){
  const root = $("#v-story"); if(!root) return;
  const tabs = [...root.querySelectorAll('.tab')];
  const panels = {'1': root.querySelector('#panel-1'), '2': root.querySelector('#panel-2'), '3': root.querySelector('#panel-3')};
  const yearLevels = {'1': ['A2','B1'], '2': ['B1'], '3': ['B2']};
  const segs = [...root.querySelectorAll('#scaleTrack .seg')];
  function select(year){
    tabs.forEach(t => t.setAttribute('aria-selected', t.getAttribute('data-year') === year ? 'true' : 'false'));
    Object.keys(panels).forEach(k => { const p = panels[k]; if(!p) return; if(k === year){ p.classList.add('active'); p.hidden = false; } else { p.classList.remove('active'); p.hidden = true; } });
    const active = yearLevels[year] || [];
    segs.forEach(s => s.classList.toggle('dim', active.indexOf(s.getAttribute('data-level')) === -1));
  }
  tabs.forEach(t => {
    t.addEventListener('click', () => select(t.getAttribute('data-year')));
    t.addEventListener('keydown', e => {
      const i = tabs.indexOf(t); let j = null;
      if(e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      if(e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if(j !== null){ e.preventDefault(); select(tabs[j].getAttribute('data-year')); tabs[j].focus(); }
    });
  });
  if(tabs.length) select('1');
  const fbtns = [...root.querySelectorAll('.fbtn')];
  const unis = [...root.querySelectorAll('.uni')];
  const groups = [...root.querySelectorAll('.uni-group')];
  fbtns.forEach(b => b.addEventListener('click', () => {
    fbtns.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    const f = b.getAttribute('data-filter');
    unis.forEach(u => {
      const show = f === 'all'
        || (f === 'national' && u.getAttribute('data-kind') === 'national')
        || (f === 'private' && u.getAttribute('data-kind') === 'private')
        || (f === 'cam-yes' && u.getAttribute('data-cam') === 'yes')
        || (f === 'cam-no' && u.getAttribute('data-cam') !== 'yes');
      u.hidden = !show;
    });
    groups.forEach(g => { const kind = g.getAttribute('data-group'); g.hidden = !((f === 'all') || (f !== 'national' && f !== 'private') || f === kind); });
    ['uniGridNational','uniGridPrivate'].forEach(id => {
      const grid = root.querySelector('#' + id); if(!grid) return;
      const any = [...grid.querySelectorAll('.uni')].some(u => !u.hidden);
      grid.style.display = any ? '' : 'none';
    });
  }));
  if(!window.__hkPrintHook){
    window.__hkPrintHook = true;
    window.addEventListener('beforeprint', () => {
      Object.keys(panels).forEach(k => { const p = panels[k]; if(p){ p.classList.add('active'); p.hidden = false; } });
      root.querySelectorAll('.faq details, details.country').forEach(d => d.open = true);
      segs.forEach(s => s.classList.remove('dim'));
    });
  }
}
// 本文は story.js の STORY_HTML2（国際のみ）
function renderHorizon(){ const el = $("#v-horizon"); if(el && typeof STORY_HTML2 !== "undefined") el.innerHTML = STORY_SWITCH("horizon") + STORY_TOOLS("horizon") + STORY_HTML2; }

// テーマ切替
$("#theme").addEventListener("click", () => {
  const r = document.documentElement; const dark = r.dataset.theme === "dark";
  r.dataset.theme = dark ? "light" : "dark";
});

renderTop(); renderCards(); renderPeople(); renderSurvey(); renderBusy(); renderTodo(); renderSrc(); renderStory(); renderHorizon();
let first = "cal"; try{ first = localStorage.getItem("hk-view-" + DATA.key) || first; }catch(e){}
if(first === "top") first = "cal";
show(first);
// #card=ID で業務カードを直接開く（リンクの共有用）
if(location.hash.startsWith("#card=")){ show("cards"); openCard(decodeURIComponent(location.hash.slice(6))); }
