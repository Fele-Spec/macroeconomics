/* 宏观七日 — 战报 / 图形实验室 */
(function () {
  const C = window.COURSE;
  const K = window.MS.core;
  const V = window.MS.views;
  const S = window.MS.session = window.MS.session || { cards: null, quiz: null, exam: null };

  function pct(n) { return Math.round(n) + "%"; }
  function qById(id) { return K.allQuiz().find(q => q.id === id); }

  /* ================= 战报 ================= */
  V.stats = function () {
    const s = K.state;
    const e = C.editions[s.edition];
    const order = e.main.concat(e.bonus);
    const met = K.metrics();
    const lv = K.level();
    const acc = met.quizAnswered ? Math.round(met.quizCorrect / met.quizAnswered * 100) : 0;
    const sd = K.sprintDay();

    const days = [];
    for (let i = 27; i >= 0; i--) {
      const d = K.addDays(K.today(), -i);
      const x = s.days[d] || {};
      const n = (x.cards || 0) + (x.quiz || 0);
      const level = n === 0 ? 0 : n < 5 ? 1 : n < 10 ? 2 : n < 20 ? 3 : 4;
      days.push({ d, n, level, cards: x.cards || 0, quiz: x.quiz || 0 });
    }

    const wrongIds = Object.keys(s.wrong || {});
    const examHistory = (s.exams || []).slice(-6).reverse();

    return `<section class="page">
      <div class="eyebrow">PROGRESS REPORT</div>
      <h1 class="display">战报</h1>
      <p class="lede">不排名，不比较。只看三件事：有没有每天回忆、错题有没有变少、模考有没有更稳。</p>

      <div class="stat-tiles" style="margin:18px 0 14px">
        <div class="card stat-tile"><div class="num">${s.xp}</div><div class="lbl">XP · LV.${lv.index} ${lv.name}</div><div class="progress progress--thin" style="margin-top:8px"><div class="progress__bar" style="width:${lv.pct}%"></div></div></div>
        <div class="card stat-tile"><div class="num">${s.streak}</div><div class="lbl">连续天数 · 最佳 ${s.bestStreak || 0}</div></div>
        <div class="card stat-tile"><div class="num">${acc}%</div><div class="lbl">累计正确率 · ${met.quizAnswered} 题</div></div>
        <div class="card stat-tile"><div class="num">${met.cardsReviewed}</div><div class="lbl">闪卡复习次数</div></div>
      </div>

      <div class="card card--cream" style="display:flex;justify-content:space-between;gap:18px;align-items:center;flex-wrap:wrap;margin-bottom:22px">
        <div>
          <div class="eyebrow">SPRINT DAY</div>
          <div style="font-family:var(--serif);font-size:34px;line-height:1.1">${sd > 7 ? "加时赛 · 第 " + sd + " 天" : "第 " + sd + " / 7 天"}</div>
          <div class="small">${e.label} · 起始日 ${s.startDate}</div>
        </div>
        <div class="btn-row">
          <a class="btn btn--sm" href="#/today">回今日</a>
          <button class="btn btn--sm btn--ghost" data-action="open-settings">设置</button>
        </div>
      </div>

      <div class="section-head"><div><h2>章节掌握度</h2><p>25% 读讲义 + 35% 闪卡 + 40% 题目正确率（带尝试次数置信度）</p></div></div>
      <div class="card">
        <div class="mastery-list">
          ${order.map(id => {
            const m = C.getModule(id);
            const v = K.mastery(id);
            return `<a class="mastery-row" href="#/learn/${id}" style="--ch-color:${m.color}">
              <div class="name">${m.short}<small>${V.chapterLabel(m, s.edition)} · ${V.roleOf(id, s.edition)}</small></div>
              <div class="progress"><div class="progress__bar" style="width:${v}%"></div></div>
              <div class="pct">${v}%</div>
            </a>`;
          }).join("")}
        </div>
      </div>

      <div class="section-head"><div><h2>最近 28 天</h2><p>每个格子是一天；颜色越深，卡片+题目越多</p></div></div>
      <div class="card">
        <div class="heatmap">
          ${days.map(x => `<div class="heat-cell" data-level="${x.level}" title="${x.d} · ${x.cards} 张卡 / ${x.quiz} 道题"></div>`).join("")}
        </div>
        <div class="heat-legend"><span>少</span><i style="background:rgba(30,29,26,.07)"></i><i style="background:rgba(196,69,44,.22)"></i><i style="background:rgba(196,69,44,.42)"></i><i style="background:rgba(196,69,44,.66)"></i><i style="background:var(--red)"></i><span>多</span><span style="margin-left:auto">${days[0].d} → ${days[days.length - 1].d}</span></div>
      </div>

      <div class="split" style="margin-top:22px">
        <div>
          <div class="section-head" style="margin-top:0"><div><h2>模考轨迹</h2><p>分数是百分比；60 分及格，80 分算稳</p></div></div>
          <div class="card">
            ${examHistory.length ? examHistory.map(x => `<div style="display:grid;grid-template-columns:78px 1fr 40px;gap:10px;align-items:center;margin-bottom:10px">
              <span class="mono small">${x.date}</span>
              <div class="progress"><div class="progress__bar" style="width:${x.score}%;background:${x.score >= 80 ? "var(--ok)" : x.score >= 60 ? "var(--gold)" : "var(--bad)"}"></div></div>
              <span class="mono small" style="text-align:right">${x.score}</span>
            </div>`).join("") : `<div class="empty" style="padding:24px"><div class="glyph">◷</div><p>还没模考。第 6 天做一次，第 7 天再做一次。</p><a class="btn btn--sm btn--red" href="#/exam">去模考</a></div>`}
          </div>
        </div>
        <div>
          <div class="section-head" style="margin-top:0"><div><h2>错题本</h2><p>答对后自动移出；也可以手动清空</p></div></div>
          <div class="card">
            ${wrongIds.length ? `<div class="wrong-list">
              ${wrongIds.slice(0, 6).map(id => {
                const q = qById(id);
                if (!q) return "";
                return `<details class="wrong-item card card--flat">
                  <summary style="cursor:pointer;font-size:13px;line-height:1.6">${q.q}</summary>
                  <div class="meta" style="margin-top:6px"><span class="tag">${q.moduleTitle}</span><span class="tag">${V.typeLabel(q.type)}</span></div>
                  <div class="ans">正确答案：${V.answerText(q)}</div>
                  <div class="small" style="margin-top:4px">${q.explain}</div>
                </details>`;
              }).join("")}
              ${wrongIds.length > 6 ? `<div class="small">还有 ${wrongIds.length - 6} 道，去“错题回炉”里做。</div>` : ""}
              <div class="btn-row" style="margin-top:6px">
                <button class="btn btn--sm btn--primary" data-action="start-wrong" data-count="10">重做错题</button>
                <button class="btn btn--sm btn--ghost" data-action="clear-wrong">清空错题本</button>
              </div>
            </div>` : `<div class="empty" style="padding:24px"><div class="glyph">✓</div><p>${met.quizAnswered >= 20 ? "错题本清空了，保持。" : "还没有错题。先去做一组题。"}</p><a class="btn btn--sm" href="#/quiz">去刷题</a></div>`}
          </div>
        </div>
      </div>

      <div class="section-head"><div><h2>成就</h2><p>只奖励“回忆”和“答对”，不奖励“打开 App”</p></div></div>
      <div class="badge-grid">
        ${C.achievements.map(a => {
          const unlocked = !!s.achievements[a.id];
          const cur = met[a.metric] || 0;
          return `<div class="badge-item ${unlocked ? "unlocked" : ""}" title="${a.desc}">
            <div class="icon">${a.icon}</div>
            <div class="name">${a.name}</div>
            <div class="desc">${unlocked ? "已解锁" : Math.min(cur, a.threshold) + " / " + a.threshold}</div>
          </div>`;
        }).join("")}
      </div>

      <div class="section-head"><div><h2>为什么这样设计</h2><p>三条最影响“一周突击”效果的研究结论</p></div><a class="pill" href="#/about">全部依据</a></div>
      <div class="grid grid-3">
        ${C.research.slice(0, 3).map(r => `<div class="card card--flat">
          <div class="eyebrow">EVIDENCE</div>
          <h3 style="font-family:var(--serif);font-size:19px;margin-bottom:6px">${r.title}</h3>
          <p class="small" style="line-height:1.75">${r.finding}</p>
          <a class="small" href="${r.url}" target="_blank" rel="noopener" style="color:var(--red-deep);text-decoration:underline">${r.source} ↗</a>
        </div>`).join("")}
      </div>

      <div class="card card--cream" style="margin-top:22px;display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap">
        <div><b>数据与备份</b><div class="small">记录只在本机。换浏览器或清缓存前，先导出 JSON。</div></div>
        <div class="btn-row"><button class="btn btn--sm" data-action="export">导出</button><button class="btn btn--sm" data-action="import">导入</button><button class="btn btn--sm btn--ghost" data-action="open-settings">设置</button></div>
      </div>
    </section>`;
  };

  /* ================= 图形实验室 ================= */
  const LAB = {
    isllm: {
      title: "IS-LM 实验室",
      sub: "点按钮，看曲线怎么移动、利率和收入怎么变。",
      scenarios: [
        { id: "base", label: "初始均衡", key: "0" },
        { id: "G", label: "政府购买 ↑", key: "G↑" },
        { id: "T", label: "税收 ↑", key: "T↑" },
        { id: "M", label: "货币供给 ↑", key: "M↑" },
        { id: "P", label: "价格水平 ↑", key: "P↑" }
      ]
    },
    adas: {
      title: "AD-AS 实验室",
      sub: "需求冲击与供给冲击，对价格和产出的影响方向相反。",
      scenarios: [
        { id: "base", label: "初始均衡", key: "0" },
        { id: "ADup", label: "总需求 ↑", key: "AD↑" },
        { id: "ADdown", label: "总需求 ↓", key: "AD↓" },
        { id: "ASleft", label: "供给冲击（AS ←）", key: "AS←" },
        { id: "ASright", label: "供给改善（AS →）", key: "AS→" }
      ]
    }
  };

  function lineOf(x1, y1, x2, y2) {
    const m = (y2 - y1) / (x2 - x1);
    return { m, b: y1 - m * x1 };
  }
  function shiftLine(l, dx) { return { m: l.m, b: l.b - l.m * dx }; }
  function intersect(l1, l2) {
    if (Math.abs(l1.m - l2.m) < 1e-9) return null;
    const x = (l2.b - l1.b) / (l1.m - l2.m);
    return { x, y: l1.m * x + l1.b };
  }
  function lineEl(l, cls, x1, x2) {
    return `<line x1="${x1}" y1="${l.m * x1 + l.b}" x2="${x2}" y2="${l.m * x2 + l.b}" class="curve ${cls}" clip-path="url(#plotClip)"/>`;
  }
  function dotEl(p) {
    if (!p) return "";
    return `<circle cx="${p.x}" cy="${p.y}" r="4.5" class="dot"/>
      <line x1="60" y1="${p.y}" x2="${p.x}" y2="${p.y}" stroke="#9b9282" stroke-width="1" stroke-dasharray="3 4"/>
      <line x1="${p.x}" y1="300" x2="${p.x}" y2="${p.y}" stroke="#9b9282" stroke-width="1" stroke-dasharray="3 4"/>
      <text x="${p.x + 8}" y="${p.y - 8}" class="eq-label">E</text>`;
  }
  function axes(yLabel) {
    return `<defs><clipPath id="plotClip"><rect x="60" y="40" width="420" height="260"/></clipPath></defs>
      <rect x="60" y="40" width="420" height="260" fill="#fffdf7" stroke="none"/>
      ${[60, 160, 260, 360, 460].map(x => `<line x1="${x}" y1="40" x2="${x}" y2="300" class="grid-line"/>`).join("")}
      ${[60, 120, 180, 240, 300].map(y => `<line x1="60" y1="${y}" x2="480" y2="${y}" class="grid-line"/>`).join("")}
      <line x1="60" y1="300" x2="480" y2="300" class="axis"/>
      <line x1="60" y1="300" x2="60" y2="40" class="axis"/>
      <text x="486" y="304">Y</text>
      <text x="42" y="46">${yLabel}</text>
      <text x="60" y="318">0</text>`;
  }

  function graphISLM(scenario) {
    /* 屏幕坐标：r 轴向上，所以经济学的“向右下倾斜”在 SVG 里是 y 随 x 增大。
       IS：Y↑ → r↓，屏幕上是右下；LM：Y↑ → r↑，屏幕上是右上。 */
    const IS0 = lineOf(80, 90, 440, 290);
    const LM0 = lineOf(110, 280, 430, 80);
    let IS = IS0, LM = LM0, ghostIS = null, ghostLM = null;
    if (scenario === "G") { IS = shiftLine(IS0, 50); ghostIS = IS0; }
    if (scenario === "T") { IS = shiftLine(IS0, -45); ghostIS = IS0; }
    if (scenario === "M") { LM = shiftLine(LM0, 50); ghostLM = LM0; }
    if (scenario === "P") { LM = shiftLine(LM0, -50); ghostLM = LM0; }
    const eq = intersect(IS, LM);
    return `<svg class="graph-svg" viewBox="0 0 520 340" role="img" aria-label="IS-LM 图形">
      ${axes("r")}
      ${ghostIS ? lineEl(ghostIS, "is ghost", 60, 480) : ""}
      ${ghostLM ? lineEl(ghostLM, "lm ghost", 60, 480) : ""}
      ${lineEl(IS, "is", 60, 480)}
      ${lineEl(LM, "lm", 60, 480)}
      <text x="398" y="268" fill="#335f76" font-size="12">IS</text>
      <text x="386" y="118" fill="#c4452c" font-size="12">LM</text>
      ${dotEl(eq)}
      <text x="80" y="330" fill="#9b9282">${ghostIS || ghostLM ? "实线 = 冲击后 · 虚线 = 初始" : "实线 = 当前均衡"}</text>
    </svg>`;
  }

  function graphADAS(scenario) {
    const AD0 = lineOf(90, 80, 450, 300);
    const AS0 = lineOf(100, 300, 440, 110);
    let AD = AD0, AS = AS0, ghostAD = null, ghostAS = null;
    if (scenario === "ADup") { AD = shiftLine(AD0, 32); ghostAD = AD0; }
    if (scenario === "ADdown") { AD = shiftLine(AD0, -32); ghostAD = AD0; }
    if (scenario === "ASleft") { AS = shiftLine(AS0, -35); ghostAS = AS0; }
    if (scenario === "ASright") { AS = shiftLine(AS0, 35); ghostAS = AS0; }
    const eq = intersect(AD, AS);
    return `<svg class="graph-svg" viewBox="0 0 520 340" role="img" aria-label="AD-AS 图形">
      ${axes("P")}
      ${ghostAD ? lineEl(ghostAD, "ad ghost", 60, 480) : ""}
      ${ghostAS ? lineEl(ghostAS, "as ghost", 60, 480) : ""}
      ${lineEl(AD, "ad", 60, 480)}
      ${lineEl(AS, "as", 60, 480)}
      <text x="420" y="292" fill="#335f76" font-size="12">AD</text>
      <text x="360" y="135" fill="#4f6b49" font-size="12">AS</text>
      ${dotEl(eq)}
      <text x="80" y="330" fill="#9b9282">${ghostAD || ghostAS ? "实线 = 冲击后 · 虚线 = 初始" : "实线 = 当前均衡"}</text>
    </svg>`;
  }

  const READOUT = {
    isllm: {
      base: "初始均衡：IS 与 LM 交于 E。此时产品市场和货币市场同时均衡。",
      G: "<b>G↑ → IS 右移</b> → Y↑、r↑。利率上升会挤出部分私人投资；LM 越陡，挤出越大。",
      T: "<b>T↑ → IS 左移</b> → Y↓、r↓。减税则相反。",
      M: "<b>M↑ → LM 右移</b> → r↓、Y↑。传导链：M↑ → r↓ → I↑ → Y↑。",
      P: "<b>P↑ → M/P↓ → LM 左移</b> → r↑、Y↓。这正是 AD 曲线向右下方倾斜的原因。"
    },
    adas: {
      base: "初始均衡：AD 与 AS 交于 E，决定价格 P 和产出 Y。",
      ADup: "<b>AD↑</b>：短期 P↑、Y↑；长期 AS 垂直，Y 回到 Yf，只剩 P↑。",
      ADdown: "<b>AD↓</b>：短期 P↓、Y↓；长期 Y 回到 Yf。",
      ASleft: "<b>AS←</b>：P↑、Y↓，滞胀。扩张需求会加剧通胀，紧缩需求会加深衰退。",
      ASright: "<b>AS→</b>：P↓、Y↑，良性供给冲击（技术进步、能源降价）。"
    }
  };

  V.lab = function () {
    const ui = window.MS.ui;
    const tab = ui.labTab || "isllm";
    const scenario = ui.scenario || "base";
    const data = LAB[tab];
    return `<section class="page">
      <div class="eyebrow">GRAPH LAB · INTERACTIVE</div>
      <h1 class="display">图形实验室</h1>
      <p class="lede">不要背“左移右移”。自己点一下，看交点怎么动；手和眼记住的，比抄十遍笔记牢。</p>

      <div class="lab-tabs">
        <button class="${tab === "isllm" ? "active" : ""}" data-action="lab-tab" data-tab="isllm">IS-LM</button>
        <button class="${tab === "adas" ? "active" : ""}" data-action="lab-tab" data-tab="adas">AD-AS</button>
      </div>

      <div class="lab-grid">
        <div class="card graph-card">
          ${tab === "isllm" ? graphISLM(scenario) : graphADAS(scenario)}
        </div>
        <aside>
          <div class="card">
            <div class="eyebrow">${data.title}</div>
            <h3 style="font-family:var(--serif);font-size:21px;margin:3px 0 10px">${data.sub}</h3>
            <div class="lab-controls">
              ${data.scenarios.map(x => `<button class="lab-btn ${scenario === x.id ? "active" : ""}" data-action="lab-scenario" data-tab="${tab}" data-scenario="${x.id}" ${scenario === x.id ? 'style="background:var(--ink);color:var(--paper)"' : ""}>
                <span style="font-family:var(--sans);font-size:13px;color:inherit">${x.label}</span><span style="color:inherit">${x.key}</span>
              </button>`).join("")}
            </div>
            <div class="lab-readout">${READOUT[tab][scenario] || READOUT[tab].base}</div>
          </div>
        </aside>
      </div>

      <div class="grid grid-3" style="margin-top:22px">
        <div class="card card--flat"><div class="eyebrow">IS-LM 口诀</div><b>G 右、T 左；M 右、P 左。</b><p class="small">G↑ 右移 IS；T↑ 左移 IS；M↑ 右移 LM；P↑ 左移 LM。</p></div>
        <div class="card card--flat"><div class="eyebrow">AD-AS 口诀</div><b>需求同向，供给反向。</b><p class="small">AD 右移：P、Y 同升；AS 左移：P 升、Y 降（滞胀）。</p></div>
        <div class="card card--flat"><div class="eyebrow">考场提醒</div><b>先问“哪条线动”，再问“交点怎么动”。</b><p class="small">沿曲线移动 vs 曲线平移，是最常见的送分/送命题。</p></div>
      </div>
    </section>`;
  };

  V.graphISLM = graphISLM;
  V.graphADAS = graphADAS;
})();
