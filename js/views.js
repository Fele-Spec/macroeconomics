/* 宏观七日 — 视图：今日 / 讲义 / 公式 / 关于 */
(function () {
  const C = window.COURSE;
  const K = window.MS.core;
  const V = {};
  window.MS.views = V;
  window.MS.ui = window.MS.ui || { formulaHidden: false, labTab: "isllm", scenario: "base" };

  const TIPS = [
    "GDP 只认“今年、国内、新做出来的最终东西”。二手的、转手的、白给的，大多不算。",
    "APC 不等于 MPC。APC = α/Y + β，会随收入上升而下降。",
    "IS 右移不是利率下降，是自发支出增加；利率变化只沿 IS 移动。",
    "价格变化是沿 AD 移动，不是 AD 平移。这个坑每年都有人踩。",
    "长期菲利普斯曲线是墙，不是滑梯：长期没有通胀—失业权衡。",
    "今天不学新章。去模考里找漏洞，比再读一遍讲义更值。",
    "错题比新题值钱。今天只看错题和公式，别再开新坑。"
  ];

  function pct(n) { return Math.round(n) + "%"; }
  function chapterLabel(m, edition) {
    const code = C.moduleCode(m.id, edition);
    if (/^\d+$/.test(code)) return "第 " + code + " 章";
    if (code.endsWith("上")) return "第 " + code.slice(0, -1) + " 章 · 上";
    if (code.endsWith("下")) return "第 " + code.slice(0, -1) + " 章 · 下";
    return "第 " + code + " 章";
  }
  function roleOf(id, edition) {
    return C.isMain(id, edition) ? "主线" : "拓展";
  }
  function typeLabel(t) {
    return { single: "单选", tf: "判断", num: "计算", short: "简答" }[t] || "题目";
  }
  function optionLetter(i) { return "ABCDEF"[i] || String(i + 1); }
  function answerText(q) {
    if (q.type === "single") return optionLetter(q.answer) + ". " + q.options[q.answer];
    if (q.type === "tf") return q.answer ? "正确" : "错误";
    if (q.type === "num") return q.answer + (q.unit ? " " + q.unit : "");
    return q.answer || "";
  }
  V.chapterLabel = chapterLabel;
  V.roleOf = roleOf;
  V.typeLabel = typeLabel;
  V.optionLetter = optionLetter;
  V.answerText = answerText;

  function mascotSVG() {
    return `<svg class="mascot" viewBox="0 0 140 140" role="img" aria-label="阿宏，一枚会说话的金币">
      <g transform="rotate(-4 70 70)">
        <circle cx="70" cy="72" r="48" fill="#c39335" stroke="#1e1d1a" stroke-width="3"/>
        <circle cx="70" cy="72" r="39" fill="none" stroke="#1e1d1a" stroke-width="1.3" stroke-dasharray="3 4" opacity=".55"/>
        <path d="M56 60 q4 -5 8 0" fill="none" stroke="#1e1d1a" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M76 60 q4 -5 8 0" fill="none" stroke="#1e1d1a" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="60" cy="72" r="2.8" fill="#1e1d1a"/>
        <circle cx="80" cy="72" r="2.8" fill="#1e1d1a"/>
        <path d="M60 84 q10 9 20 0" fill="none" stroke="#1e1d1a" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M32 92 l10 -10 l7 7 l12 -16" fill="none" stroke="#1e1d1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>
        <path d="M100 44 l7 -7 M107 44 l-7 -7" stroke="#1e1d1a" stroke-width="2" stroke-linecap="round" opacity=".55"/>
      </g>
    </svg>`;
  }
  V.mascotSVG = mascotSVG;

  function progressRing(value, label) {
    const v = K.clamp(value, 0, 100);
    const r = 26, c = 2 * Math.PI * r;
    return `<div class="ring" style="position:relative;width:74px;height:74px">
      <svg viewBox="0 0 64 64" width="74" height="74" aria-hidden="true">
        <circle cx="32" cy="32" r="${r}" fill="none" stroke="rgba(30,29,26,.12)" stroke-width="6"/>
        <circle cx="32" cy="32" r="${r}" fill="none" stroke="#c4452c" stroke-width="6"
          stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v / 100)}"
          stroke-linecap="round" transform="rotate(-90 32 32)"/>
      </svg>
      <div style="position:absolute;inset:0;display:grid;place-items:center;font-family:var(--mono);font-size:12px;font-weight:700">${Math.round(v)}%</div>
    </div>`;
  }

  function taskAction(t, day) {
    if (t.kind === "learn") return `<a class="btn btn--sm" href="#/learn/${t.module}">读讲义</a>`;
    if (t.kind === "cards") return `<button class="btn btn--sm" data-action="start-cards" data-module="all" data-count="${t.count || 20}">开始</button>`;
    if (t.kind === "quiz") {
      if (t.mixed) return `<button class="btn btn--sm" data-action="start-quiz" data-mixed="${t.mixed.join(",")}" data-count="${t.count}">开始</button>`;
      return `<button class="btn btn--sm" data-action="start-quiz" data-module="${t.module}" data-count="${t.count}">开始</button>`;
    }
    if (t.kind === "lab") return `<a class="btn btn--sm" href="#/lab">去实验</a>`;
    if (t.kind === "exam") return `<a class="btn btn--sm" href="#/exam">去模考</a>`;
    if (t.kind === "wrong") return `<button class="btn btn--sm" data-action="start-wrong" data-count="${t.count || 10}">重做错题</button>`;
    if (t.kind === "formula") return `<a class="btn btn--sm" href="#/formulas">公式墙</a>`;
    if (t.kind === "review") return `<button class="btn btn--sm" data-action="start-wrong" data-count="${t.count || 8}">回炉</button>`;
    return `<a class="btn btn--sm" href="#/learn">去梳理</a>`;
  }

  function chapterCard(m, edition) {
    const mastery = K.mastery(m.id);
    const role = roleOf(m.id, edition);
    const read = !!K.state.readings[m.id];
    return `<a class="chapter-card ${role === "拓展" ? "is-bonus" : ""}" href="#/learn/${m.id}" style="--ch-color:${m.color}">
      <div class="chapter-card__num">${C.moduleCode(m.id, edition)}<small>${role}</small></div>
      <div class="chapter-card__body">
        <div class="chapter-card__kicker">${chapterLabel(m, edition)} · ${m.minutes} MIN</div>
        <h3>${m.title}</h3>
        <p>${m.tagline}</p>
        <div class="chapter-card__meta">
          <span class="pill">${m.cards.length} 张卡</span>
          <span class="pill">${m.quiz.length} 道题</span>
          ${read ? '<span class="pill pill--ok">已读</span>' : '<span class="pill">未读</span>'}
        </div>
        <div class="chapter-card__progress">
          <div class="progress"><div class="progress__bar" style="width:${mastery}%;background:${m.color}"></div></div>
          <span class="chapter-card__pct">${mastery}%</span>
        </div>
      </div>
      ${mastery >= 80 ? '<span class="chapter-card__stamp stamp stamp--ok">通关</span>' : ""}
    </a>`;
  }
  V.chapterCard = chapterCard;

  function pageHead(eyebrow, title, lede) {
    return `<div class="page-head">
      <div class="eyebrow">${eyebrow}</div>
      <h1 class="display">${title}</h1>
      <p class="lede">${lede}</p>
    </div>`;
  }

  /* ---------------- 今日 ---------------- */
  V.today = function () {
    const s = K.state;
    const edition = s.edition;
    const e = C.editions[edition];
    const sd = K.sprintDay();
    const day = K.planDay();
    const dayIndex = K.clamp(sd, 1, 7) - 1;
    const doneCount = day.tasks.filter(t => K.planDone(t.id)).length;
    const pctDone = Math.round(doneCount / day.tasks.length * 100);
    const lv = K.level();
    const due = K.dueCount();
    const fresh = K.newCount();
    const wrong = Object.keys(s.wrong || {}).length;
    const mainModules = e.main.map(id => C.getModule(id));
    const bonusModules = e.bonus.map(id => C.getModule(id));
    const focus = day.focus ? C.getModule(day.focus) : null;
    const dayLabel = sd > 7 ? "加时赛" : "第 " + sd + " 天";
    const heroLine = sd > 7 ? "七天之后，继续收口。" : "七天，把宏观<br>装进<em>脑子</em>。";
    const plannedQuiz = day.tasks.filter(t => t.kind === "quiz").reduce((n, t) => n + (t.count || 0), 0);
    const plannedExam = day.tasks.filter(t => t.kind === "exam").length;

    return `<section class="page">
      <div class="hero">
        <div class="hero-main">
          <div class="eyebrow">DAY ${K.clamp(sd, 1, 7)} / 7 · ${e.label}${sd > 7 ? " · 加时赛" : ""}</div>
          <h1 class="display">${heroLine}</h1>
          <p class="lede">为高鸿业《西方经济学（宏观部分）》${edition === "78" ? "第 12–16 章" : "第 12–16 章（第 5/6 版编排）"}设计的七日冲刺：先读懂，再回忆，最后用模考把漏洞逼出来。</p>
          <div class="btn-row">
            <button class="btn btn--primary btn--lg" data-action="scroll-section" data-section="mission">继续今日任务 →</button>
            <a class="btn btn--ghost" href="#/cards">先刷 20 张闪卡</a>
          </div>
          <div class="hero-meta">
            <span class="mono">LV.${lv.index} ${lv.name}</span>
            <span class="mono">${s.xp} XP</span>
            <span class="mono">🔥 ${s.streak} 天</span>
            <span class="mono">到期 ${due} · 新卡 ${fresh}</span>
            <span class="mono">错题 ${wrong}</span>
            <button class="pill" data-action="open-settings" style="cursor:pointer">教材版本：${e.short} · 切换</button>
          </div>
        </div>
        <div class="card card--dark mascot-card">
          <span class="stamp" style="color:var(--gold)">LOCAL FIRST</span>
          ${mascotSVG()}
          <div class="mascot-stats"><span><b>7</b>天冲刺</span><span><b>5</b>关主线</span><span><b>192</b>道题</span></div>
          <div class="mascot-bubble"><b>阿宏：</b>${TIPS[dayIndex] || TIPS[0]}</div>
        </div>
      </div>

      <div class="ticker">
        <span><b>检索练习</b> 先回忆，再看答案</span><span class="sep">/</span>
        <span><b>间隔重复</b> 0 · 1 · 2 · 4 · 7 天</span><span class="sep">/</span>
        <span><b>交错练习</b> 第 4 天起混着做</span><span class="sep">/</span>
        <span><b>七日目标</b> 主线五章 + 两套模考</span>
      </div>

      <div class="split" style="margin-top:22px">
        <section id="mission" class="card mission-card">
          <div class="mission-top">
            <div>
              <div class="eyebrow">TODAY'S MISSION</div>
              <h2>${dayLabel} · ${day.title}</h2>
              <p class="small" style="margin:4px 0 0">${day.subtitle}</p>
            </div>
            <div class="day-dots" aria-label="七日进度">
              ${Array.from({ length: 7 }, (_, i) => `<span class="day-dot ${i < dayIndex ? "on" : ""} ${i === dayIndex ? "now" : ""}"></span>`).join("")}
            </div>
          </div>
          <div class="progress" style="margin:14px 0 8px"><div class="progress__bar" style="width:${pctDone}%"></div></div>
          <div class="small" style="display:flex;justify-content:space-between;margin-bottom:12px">
            <span>${doneCount} / ${day.tasks.length} 项完成</span>
            <span>${pctDone}%</span>
          </div>
          <div class="task-list">
            ${day.tasks.map(t => {
              const done = K.planDone(t.id);
              return `<div class="task ${done ? "is-done" : ""}">
                <button class="task-check" data-action="toggle-task" data-task="${t.id}" aria-label="${done ? "取消完成" : "标记完成"}">✓</button>
                <div>
                  <div class="task-title">${t.label}</div>
                  <div class="task-sub">${t.detail}${t.count ? " · " + t.count + " 个" : ""}</div>
                </div>
                ${done ? '<span class="pill pill--ok">完成</span>' : taskAction(t, day)}
              </div>`;
            }).join("")}
          </div>
        </section>

        <aside class="grid" style="gap:14px">
          <div class="card card--cream">
            <div class="eyebrow">3 分钟速览</div>
            <h3 style="font-family:var(--serif);font-size:21px;margin-bottom:8px">${focus ? focus.short : "把五章串起来"}</h3>
            <p class="small" style="line-height:1.8">${focus ? focus.tagline : "核算 → 收入-支出 → IS-LM → AD-AS → 失业通胀。今天用一张图把它们串起来，然后去模考。"}</p>
            ${focus ? `<a class="btn btn--sm" href="#/learn/${focus.id}" style="margin-top:6px">打开这一章</a>` : `<a class="btn btn--sm" href="#/learn" style="margin-top:6px">打开总览</a>`}
          </div>
          <div class="card">
            <div class="eyebrow">今日数字</div>
            <div class="grid grid-2" style="gap:10px;margin-top:8px">
              <div><div style="font-family:var(--serif);font-size:30px">${plannedQuiz || plannedExam}</div><div class="small">${plannedQuiz ? "计划题量" : "模考套数"}</div></div>
              <div><div style="font-family:var(--serif);font-size:30px">${fresh}</div><div class="small">新卡待学</div></div>
              <div><div style="font-family:var(--serif);font-size:30px">${wrong}</div><div class="small">错题待清</div></div>
              <div><div style="font-family:var(--serif);font-size:30px">${s.streak}</div><div class="small">连续天数</div></div>
            </div>
          </div>
        </aside>
      </div>

      <div class="section-head">
        <div><h2>五关地图</h2><p>${e.label} · 主线 ${mainModules.length} 章 + 拓展 ${bonusModules.length} 章</p></div>
        <a class="pill" href="#/learn">查看全部</a>
      </div>
      <div class="chapter-grid">
        ${mainModules.map(m => chapterCard(m, edition)).join("")}
      </div>

      ${bonusModules.length ? `<div class="section-head"><div><h2>拓展区</h2><p>${edition === "78" ? "第 17 章政策内容，主线之外但很值得看" : "AD-AS 与失业通胀，第 17–18 章内容"}</p></div></div>
      <div class="chapter-grid">${bonusModules.map(m => chapterCard(m, edition)).join("")}</div>` : ""}

      <div class="section-head">
        <div><h2>为什么这样学？</h2><p>不是“多看几遍”，而是把记忆的证据变成产品规则</p></div>
        <a class="pill" href="#/about">完整说明</a>
      </div>
      <div class="grid grid-3">
        <div class="card card--flat"><div class="eyebrow">01 · 检索</div><h3 style="font-family:var(--serif);font-size:20px">先回忆，再看答案</h3><p class="small">闪卡和题目都要求你先输出，再翻面/看解析。重读会带来“我懂了”的错觉，回忆才会暴露漏洞。</p></div>
        <div class="card card--flat"><div class="eyebrow">02 · 间隔</div><h3 style="font-family:var(--serif);font-size:20px">在快忘时复习</h3><p class="small">0/1/2/4/7 天的盒子调度，把复习放在记忆即将衰退时，而不是一口气刷十遍。</p></div>
        <div class="card card--flat"><div class="eyebrow">03 · 交错</div><h3 style="font-family:var(--serif);font-size:20px">混着做，才像考试</h3><p class="small">从第 4 天起混合出题，逼自己先判断“这题考哪一章”，而不是被章节标题提示。</p></div>
      </div>
    </section>`;
  };

  /* ---------------- 讲义总览 ---------------- */
  V.learn = function () {
    const s = K.state;
    const e = C.editions[s.edition];
    const main = e.main.map(id => C.getModule(id));
    const bonus = e.bonus.map(id => C.getModule(id));
    const totalQuestions = C.modules.reduce((n, m) => n + m.quiz.length, 0);
    return `<section class="page">
      ${pageHead("LECTURE NOTES", "五关讲义", "先读薄，再读厚。每章都有：核心逻辑、公式、说人话解释、考场陷阱。读完记得点“我读完了”，系统才会把它算进掌握度。")}
      <div class="card card--cream" style="margin-bottom:18px;display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap">
        <div><b>${e.label}</b><div class="small" style="margin-top:3px">${e.note}</div></div>
        <button class="btn btn--sm" data-action="open-settings">切换版本</button>
      </div>
      <div class="grid grid-3" style="margin-bottom:18px">
        <div class="card card--flat"><div class="eyebrow">主线</div><div style="font-family:var(--serif);font-size:30px">${main.length} 章</div><div class="small">12–16 章的核心区块</div></div>
        <div class="card card--flat"><div class="eyebrow">题库</div><div style="font-family:var(--serif);font-size:30px">${totalQuestions} 道</div><div class="small">单选 / 判断 / 计算 / 简答</div></div>
        <div class="card card--flat"><div class="eyebrow">工具</div><div style="font-family:var(--serif);font-size:30px">2 个</div><div class="small">公式墙 + 图形实验室</div></div>
      </div>
      <div class="chapter-grid">${main.map(m => chapterCard(m, s.edition)).join("")}</div>
      <div class="section-head"><div><h2>拓展区</h2><p>${s.edition === "78" ? "第 17 章政策内容：财政、货币、政策搭配" : "第 17–18 章：AD-AS 与失业通胀"}</p></div></div>
      <div class="chapter-grid">${bonus.map(m => chapterCard(m, s.edition)).join("")}</div>
      <div class="section-head"><div><h2>两个工具</h2><p>把“背公式”和“看图形”变成动手</p></div></div>
      <div class="grid grid-2">
        <a class="card card-hover" href="#/formulas"><div class="eyebrow">FORMULA WALL</div><h3 style="font-family:var(--serif);font-size:24px">公式墙</h3><p class="small">遮住公式自测，考前 10 分钟刷一遍。</p></a>
        <a class="card card-hover" href="#/lab"><div class="eyebrow">GRAPH LAB</div><h3 style="font-family:var(--serif);font-size:24px">图形实验室</h3><p class="small">点一下 G↑ / M↑ / P↑，看曲线怎么动。</p></a>
      </div>
    </section>`;
  };

  function moduleOrder(edition) {
    const e = C.editions[edition];
    return e.main.concat(e.bonus);
  }

  /* ---------------- 讲义阅读 ---------------- */
  V.reader = function (id) {
    const s = K.state;
    const m = C.getModule(id);
    if (!m) return V.notFound();
    const edition = s.edition;
    const order = moduleOrder(edition);
    const idx = order.indexOf(id);
    const prev = idx > 0 ? C.getModule(order[idx - 1]) : null;
    const next = idx >= 0 && idx < order.length - 1 ? C.getModule(order[idx + 1]) : null;
    const read = !!s.readings[id];
    const mastery = K.mastery(id);
    return `<section class="page">
      <div class="reader-head">
        <div>
          <div class="eyebrow">${chapterLabel(m, edition)} · ${roleOf(id, edition)} · ${m.minutes} MIN</div>
          <h1 class="display">${m.title}</h1>
          <p class="lede" style="margin-bottom:0">${m.tagline}</p>
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--serif);font-size:34px;line-height:1">${mastery}<small style="font-size:14px;color:var(--muted)">%</small></div>
          <div class="small">章节掌握度</div>
          <div class="progress progress--thin" style="width:120px;margin-top:8px"><div class="progress__bar" style="width:${mastery}%;background:${m.color}"></div></div>
        </div>
      </div>

      <div class="reader-layout">
        <aside class="reader-toc">
          <h4>本章目录</h4>
          ${m.sections.map(sec => `<a href="#${sec.id}" data-action="scroll-section" data-section="${sec.id}" data-toc="${sec.id}">${sec.h}</a>`).join("")}
          <div class="toc-actions">
            <button class="btn btn--sm ${read ? "btn--ghost" : "btn--red"}" data-action="mark-read" data-module="${id}" ${read ? "disabled" : ""}>${read ? "✓ 已读完" : "标记读完"}</button>
            <button class="btn btn--sm btn--ghost" data-action="start-cards" data-module="${id}" data-count="20">刷本章闪卡</button>
            <button class="btn btn--sm btn--ghost" data-action="start-quiz" data-module="${id}" data-count="10">做本章题</button>
          </div>
        </aside>

        <article class="reader-body">
          ${m.sections.map(sec => `<section class="reader-section" id="${sec.id}">
            <h3>${sec.h}</h3>
            <div class="body">${sec.body}</div>
            ${sec.formula ? `<div class="formula-box"><div class="fx">${sec.formula.fx.replace(/\n/g, "<br>")}</div>${sec.formula.note ? `<div class="fnote">${sec.formula.note}</div>` : ""}</div>` : ""}
            ${sec.plain ? `<div class="callout callout--plain"><b>说人话</b>${sec.plain}</div>` : ""}
            ${sec.trap ? `<div class="callout callout--trap"><b>考场陷阱</b>${sec.trap}</div>` : ""}
          </section>`).join("")}

          <div class="reader-end">
            <button class="btn ${read ? "btn--ghost" : "btn--red"}" data-action="mark-read" data-module="${id}" ${read ? "disabled" : ""}>${read ? "✓ 已读完" : "我读完了，标记进度"}</button>
            <button class="btn" data-action="start-cards" data-module="${id}" data-count="20">刷本章闪卡</button>
            <button class="btn" data-action="start-quiz" data-module="${id}" data-count="10">做本章题</button>
          </div>
          <div class="reader-progress">
            <span class="small">${read ? "已计入掌握度。下一步：合上书，用 3 分钟复述本章逻辑。" : "读完再点标记；不点也不会阻止你做任何事。"}</span>
          </div>

          <div class="grid grid-2" style="margin-top:26px">
            ${prev ? `<a class="card card-hover card--flat" href="#/learn/${prev.id}"><div class="eyebrow">← 上一章</div><b>${prev.short}</b><div class="small">${chapterLabel(prev, edition)}</div></a>` : "<div></div>"}
            ${next ? `<a class="card card-hover card--flat" href="#/learn/${next.id}" style="text-align:right"><div class="eyebrow">下一章 →</div><b>${next.short}</b><div class="small">${chapterLabel(next, edition)}</div></a>` : "<div></div>"}
          </div>
        </article>
      </div>
    </section>`;
  };

  /* ---------------- 公式墙 ---------------- */
  V.formulas = function () {
    const s = K.state;
    const e = C.editions[s.edition];
    const order = e.main.concat(e.bonus);
    const hidden = window.MS.ui.formulaHidden;
    return `<section class="page">
      ${pageHead("FORMULA WALL", "公式墙", "考前只看这一页。点“遮住公式”进入自测模式：先默写，再点开对答案。")}
      <div class="btn-row" style="margin-bottom:18px">
        <button class="btn ${hidden ? "btn--primary" : ""}" data-action="toggle-formula">${hidden ? "显示全部公式" : "遮住公式，开始自测"}</button>
        <a class="btn btn--ghost" href="#/cards">去刷闪卡</a>
      </div>
      ${order.map(id => {
        const m = C.getModule(id);
        return `<div class="section-head" style="margin-top:26px"><div><h2 style="font-size:21px">${chapterLabel(m, s.edition)} · ${m.short}</h2><p>${m.formulas.length} 条</p></div><a class="pill" href="#/learn/${id}">回讲义</a></div>
          <div class="formula-grid">
            ${m.formulas.map(f => `<div class="formula-card card ${hidden ? "is-hidden" : ""}" data-action="peek-formula">
              <h4>${f.name}</h4>
              <div class="fx">${f.fx.replace(/\n/g, "<br>")}</div>
              <div class="fnote">${f.note || ""}</div>
            </div>`).join("")}
          </div>`;
      }).join("")}
    </section>`;
  };

  /* ---------------- 关于 ---------------- */
  V.about = function () {
    return `<section class="page">
      ${pageHead("ABOUT & METHOD", "为什么是这套设计", "一套为“一周突击 + 不学完就忘”设计的学习流程：检索优先、间隔调度、交错练习、即时反馈。")}
      <div class="grid grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="eyebrow">版本说明</div>
          <p class="small" style="line-height:1.85">${C.about.editionNote}</p>
        </div>
        <div class="card">
          <div class="eyebrow">使用方法</div>
          <p class="small" style="line-height:1.85">${C.about.methodNote}</p>
        </div>
      </div>
      <div class="section-head"><div><h2>研究依据</h2><p>不是“学习博主说”，是能点开的论文与综述</p></div></div>
      <div class="grid grid-2">
        ${C.research.map((r, i) => `<div class="card card--flat">
          <div class="eyebrow">EVIDENCE ${String(i + 1).padStart(2, "0")}</div>
          <h3 style="font-family:var(--serif);font-size:21px;margin-bottom:7px">${r.title}</h3>
          <p class="small" style="line-height:1.8">${r.finding}</p>
          <a class="small" href="${r.url}" target="_blank" rel="noopener" style="color:var(--red-deep);text-decoration:underline;text-underline-offset:3px">${r.source} ↗</a>
        </div>`).join("")}
      </div>
      <div class="card card--cream" style="margin-top:22px">
        <div class="eyebrow">边界与诚实说明</div>
        <p class="small" style="line-height:1.85">① 本平台的题目为原创练习，覆盖教材核心考点，但不等于教材课后题或考研真题；遇到老师指定的题型，请以课堂口径为准。② 奥肯定律系数、政策乘数等存在教材版本差异，平台已在解析中标注“教材口径”。③ 一周突击能帮你应付考试，但长期保留仍需要更长的间隔；考后建议把闪卡盒子继续跑两周。④ 学习记录只存本地，不上传，不排名，不制造“连续打卡焦虑”。</p>
        <div class="btn-row" style="margin-top:12px">
          <a class="btn btn--primary" href="#/today">回到今日</a>
          <button class="btn" data-action="open-settings">数据与设置</button>
        </div>
      </div>
    </section>`;
  };

  V.notFound = function () {
    return `<section class="page empty"><div class="glyph">404</div><h2 style="font-family:var(--serif)">这一页没有内容</h2><p>可能是链接写错了，或者章节还没加载。</p><a class="btn btn--primary" href="#/today">回今日</a></section>`;
  };

  /* ---------------- 设置弹窗 ---------------- */
  V.settingsModal = function () {
    const s = K.state;
    return `<div class="modal-backdrop" data-action="close-modal">
      <div class="modal" role="dialog" aria-modal="true" aria-label="设置" data-stop="1" style="position:relative">
        <button class="icon-btn modal-close" data-action="close-modal" aria-label="关闭">✕</button>
        <h2>设置</h2>
        <div class="modal-sub">所有改动即时保存；数据只在本机。</div>

        <div class="modal-row">
          <div><div class="label">教材版本</div><div class="desc">切换主线章号与七日路线；内容模块共用，不会丢失进度。</div></div>
          <div class="seg">
            <button class="${s.edition === "78" ? "active" : ""}" data-action="set-edition" data-edition="78">7/8 版</button>
            <button class="${s.edition === "56" ? "active" : ""}" data-action="set-edition" data-edition="56">5/6 版</button>
          </div>
        </div>

        <div class="modal-row">
          <div><div class="label">音效</div><div class="desc">答对/答错时的小提示音，默认关闭。</div></div>
          <button class="switch ${s.settings.sound ? "on" : ""}" data-action="toggle-sound" aria-label="切换音效"></button>
        </div>

        <div class="modal-row">
          <div><div class="label">减少动画</div><div class="desc">关闭彩带和大部分过渡动画。</div></div>
          <button class="switch ${s.settings.motion === false ? "on" : ""}" data-action="toggle-motion" aria-label="切换动画"></button>
        </div>

        <div class="modal-row">
          <div><div class="label">备份学习记录</div><div class="desc">导出 JSON；换浏览器或清缓存前先备份。</div></div>
          <div class="btn-row"><button class="btn btn--sm" data-action="export">导出</button><button class="btn btn--sm" data-action="import">导入</button></div>
        </div>

        <div class="modal-row">
          <div><div class="label">重新开始七天</div><div class="desc">只重置起始日期，不清除已学记录。</div></div>
          <button class="btn btn--sm" data-action="restart-week">重新计时</button>
        </div>

        <div class="modal-row">
          <div><div class="label">清空全部数据</div><div class="desc">闪卡、错题、模考、进度全部删除，不可撤销。</div></div>
          <button class="btn btn--sm btn--red" data-action="reset-all">清空</button>
        </div>

        <div style="margin-top:16px;display:flex;justify-content:space-between;gap:10px;align-items:center">
          <a class="small" href="#/about" data-action="close-modal" style="text-decoration:underline">方法论与边界说明</a>
          <span class="small mono">v${C.meta.version}</span>
        </div>
      </div>
    </div>`;
  };

  V.closeModal = function () {
    const root = document.getElementById("modalRoot");
    if (root) root.innerHTML = "";
    document.body.style.overflow = "";
  };
  V.openModal = function (html) {
    const root = document.getElementById("modalRoot");
    if (!root) return;
    root.innerHTML = html;
    document.body.style.overflow = "hidden";
  };
})();
