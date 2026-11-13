/* 宏观七日 — 练习：闪卡 / 刷题 / 模考 */
(function () {
  const C = window.COURSE;
  const K = window.MS.core;
  const V = window.MS.views;
  const S = window.MS.session = window.MS.session || { cards: null, quiz: null, exam: null };

  function qById(id) { return K.allQuiz().find(q => q.id === id); }
  function cardById(id) { return K.allCards().find(c => c.id === id); }
  function pct(n) { return Math.round(n) + "%"; }
  function boxLabel(b) { return K.BOX_LABELS[b] || "今天"; }
  function nextLabel(box, rating) {
    if (rating === "again") return "今天";
    if (rating === "hard") return "明天";
    const nb = Math.min(5, box + (rating === "easy" ? 2 : 1));
    return K.INTERVALS[nb] + " 天后";
  }

  /* ================= 闪卡 ================= */
  V.cards = function () {
    if (S.cards) return cardSession();
    const s = K.state;
    const edition = s.edition;
    const e = C.editions[edition];
    const order = e.main.concat(e.bonus);
    const filter = window.MS.ui.cardFilter || "all";
    const cards = K.allCards();
    const due = K.dueCount(filter === "all" ? null : filter);
    const fresh = K.newCount(filter === "all" ? null : filter);
    const learned = cards.filter(c => K.state.cards[c.id]).length;
    const total = cards.length;

    return `<section class="page">
      <div class="eyebrow">ACTIVE RECALL · LEITNER BOXES</div>
      <h1 class="display">闪卡</h1>
      <p class="lede">先看问题，逼自己回忆，再翻面。评分不是“感觉”，而是“刚才有没有想起来”。</p>

      <div class="grid grid-4" style="margin:18px 0 20px">
        <div class="card stat-tile"><div class="num">${due}</div><div class="lbl">今日到期</div></div>
        <div class="card stat-tile"><div class="num">${fresh}</div><div class="lbl">还没碰过</div></div>
        <div class="card stat-tile"><div class="num">${learned}</div><div class="lbl">已进入盒子</div></div>
        <div class="card stat-tile"><div class="num">${total}</div><div class="lbl">卡片总数</div></div>
      </div>

      <div class="card" style="margin-bottom:18px">
        <div class="deck-bar" style="margin-bottom:10px">
          <div class="deck-filter">
            <button class="chip ${filter === "all" ? "active" : ""}" data-action="card-filter" data-module="all">全部 <span class="n">${cards.length}</span></button>
            ${order.map(id => {
              const m = C.getModule(id);
              return `<button class="chip ${filter === id ? "active" : ""}" data-action="card-filter" data-module="${id}">${m.short} <span class="n">${m.cards.length}</span></button>`;
            }).join("")}
          </div>
          <button class="btn btn--red" data-action="start-cards" data-module="${filter}">开始复习 →</button>
        </div>
        <p class="small" style="margin:0">建议每天 20 张：到期卡优先，不够再补新卡。评分会决定下一次出现的时间（今天 / 明天 / 2 天后 / 4 天后 / 7 天后 / 14 天后）。</p>
      </div>

      <div class="section-head"><div><h2>卡组进度</h2><p>每个盒子的卡片数量；盒子越靠后，间隔越长</p></div></div>
      <div class="grid grid-2">
        ${order.map(id => {
          const m = C.getModule(id);
          const ms = m.cards.map(c => K.state.cards[c.id]).filter(Boolean);
          const boxes = [0, 0, 0, 0, 0, 0];
          ms.forEach(x => { boxes[x.box || 0] += 1; });
          const done = ms.length;
          const mastery = K.mastery(id);
          return `<a class="card card-hover" href="#/learn/${id}">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
              <div><div class="eyebrow">${V.chapterLabel(m, edition)}</div><h3 style="font-family:var(--serif);font-size:20px;margin:2px 0 4px">${m.short}</h3></div>
              <span class="pill">${done}/${m.cards.length}</span>
            </div>
            <div class="progress" style="margin:10px 0 6px"><div class="progress__bar" style="width:${mastery}%;background:${m.color}"></div></div>
            <div class="small" style="display:flex;justify-content:space-between">
              <span>掌握度 ${mastery}%</span><span>到期 ${m.cards.filter(c => K.state.cards[c.id] && K.state.cards[c.id].due <= K.today()).length} · 新卡 ${m.cards.filter(c => !K.state.cards[c.id]).length}</span>
            </div>
          </a>`;
        }).join("")}
      </div>
    </section>`;
  };

  function cardSession() {
    const sess = S.cards;
    if (!sess) return V.cards();
    if (sess.idx >= sess.queue.length) return cardSummary();
    const card = cardById(sess.queue[sess.idx]);
    if (!card) { S.cards = null; return V.cards(); }
    const st = K.cardState(card.id);
    const m = C.getModule(card.moduleId);
    const progress = Math.round((sess.idx / sess.queue.length) * 100);
    return `<section class="page">
      <div class="flash-wrap">
        <div class="flash-meta">
          <span>${sess.idx + 1} / ${sess.queue.length} · ${m ? m.short : ""}</span>
          <span>BOX ${st.box || 0} · ${boxLabel(st.box || 0)}</span>
        </div>
        <div class="progress progress--thin" style="margin-bottom:14px"><div class="progress__bar" style="width:${progress}%;background:${card.moduleColor}"></div></div>

        <div class="flashcard ${sess.revealed ? "flashcard--back" : ""}">
          <div class="flashcard__top">
            <span class="pill" style="color:${card.moduleColor};border-color:${card.moduleColor}">${card.tag || "知识点"}</span>
            <span class="tag">${sess.revealed ? "答案已翻开" : "先回忆，再翻面"}</span>
          </div>
          <div class="flashcard__q">
            <p class="prompt">${card.front}</p>
            ${sess.revealed ? "" : `<div class="flashcard__hint">在脑子里说一遍答案，或者写在纸上。想不起来也没关系，诚实评分才有用。</div>`}
            ${sess.revealed ? `<div class="flashcard__a"><b>答案：</b>${card.back}</div>` : ""}
          </div>
          <div class="flashcard__footer">
            ${sess.revealed
              ? `<span class="small">这张卡下次什么时候出现？</span><button class="btn btn--ghost btn--sm" data-action="skip-card">跳过</button>`
              : `<span class="small">空格键翻面</span><button class="btn btn--red" data-action="reveal-card">翻面看答案</button>`}
          </div>
        </div>

        ${sess.revealed ? `<div class="rating">
          <button data-action="rate-card" data-rating="again"><b>忘记</b><small>${nextLabel(st.box || 0, "again")}</small></button>
          <button data-action="rate-card" data-rating="hard"><b>模糊</b><small>${nextLabel(st.box || 0, "hard")}</small></button>
          <button data-action="rate-card" data-rating="good"><b>记住</b><small>${nextLabel(st.box || 0, "good")}</small></button>
          <button data-action="rate-card" data-rating="easy"><b>秒答</b><small>${nextLabel(st.box || 0, "easy")}</small></button>
        </div>
        <div class="small center" style="margin-top:10px">键盘：<span class="kbd">空格</span> 翻面 · <span class="kbd">1</span><span class="kbd">2</span><span class="kbd">3</span><span class="kbd">4</span> 评分</div>` : ""}

        <div class="btn-row" style="justify-content:center;margin-top:18px">
          <button class="btn btn--sm btn--ghost" data-action="end-cards">结束本组</button>
          <a class="btn btn--sm btn--ghost" href="#/cards" data-action="end-cards">回卡组</a>
        </div>
      </div>
    </section>`;
  }

  function cardSummary() {
    const sess = S.cards;
    const done = sess.done || 0;
    const again = sess.again || 0;
    return `<section class="page">
      <div class="card session-done">
        <div class="big">${done}</div>
        <h2>这组卡片过完了</h2>
        <p class="muted">复习 ${done} 次，其中 ${again} 次选了“忘记”。忘记的卡已经回到今天，稍后会再出现。</p>
        <div class="btn-row" style="justify-content:center;margin-top:18px">
          <button class="btn btn--primary" data-action="start-cards" data-module="${sess.moduleId || "all"}">再来一组</button>
          <a class="btn" href="#/quiz">去刷题</a>
          <a class="btn btn--ghost" href="#/today">回今日</a>
        </div>
      </div>
    </section>`;
  }

  /* ================= 刷题 ================= */
  V.quiz = function () {
    if (S.quiz) return quizSession();
    const s = K.state;
    const e = C.editions[s.edition];
    const order = e.main.concat(e.bonus);
    const all = K.allQuiz();
    const attempted = all.filter(q => K.quizStat(q.id).attempts > 0).length;
    const acc = s.totalQuiz ? Math.round((s.totalCorrect / s.totalQuiz) * 100) : 0;
    const wrong = Object.keys(s.wrong || {}).length;
    return `<section class="page">
      <div class="eyebrow">QUESTION BANK · ${all.length} QUESTIONS</div>
      <h1 class="display">题库</h1>
      <p class="lede">每个选项都有解析。答错会自动进错题本；答对后可以立刻看“为什么对”，不要只记答案。</p>

      <div class="grid grid-3" style="margin:18px 0 22px">
        <div class="card stat-tile"><div class="num">${all.length}</div><div class="lbl">题库总量</div></div>
        <div class="card stat-tile"><div class="num">${acc}%</div><div class="lbl">累计正确率</div></div>
        <div class="card stat-tile"><div class="num">${wrong}</div><div class="lbl">错题待清</div></div>
      </div>

      <div class="card" style="margin-bottom:18px">
        <div class="section-head" style="margin:0 0 12px"><div><h2 style="font-size:21px">章节练习</h2><p>选一章，10 道题，做完立刻看解析</p></div></div>
        <div class="deck-filter">
          ${order.map(id => {
            const m = C.getModule(id);
            const ms = m.quiz.map(q => K.quizStat(q.id)).filter(x => x.attempts > 0).length;
            return `<button class="chip" data-action="start-quiz" data-module="${id}" data-count="10">${m.short} <span class="n">${ms}/${m.quiz.length}</span></button>`;
          }).join("")}
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card card--dark">
          <div class="eyebrow" style="color:var(--gold)">MIXED PRACTICE</div>
          <h3 style="font-family:var(--serif);font-size:25px;margin:4px 0 8px">交错练习</h3>
          <p class="small" style="line-height:1.8">把当前版本的主线章节混在一起出题。你会先判断“这题考哪一章”，这比按章节刷更接近考试。</p>
          <button class="btn btn--red" style="margin-top:10px" data-action="start-quiz" data-mixed="${e.main.join(",")}" data-count="14">混合 14 道 →</button>
        </div>
        <div class="card">
          <div class="eyebrow">WRONG BOOK</div>
          <h3 style="font-family:var(--serif);font-size:25px;margin:4px 0 8px">错题回炉</h3>
          <p class="small" style="line-height:1.8">只做答错过的题。答对后自动移出错题本；如果又错，会继续留着。</p>
          <button class="btn" style="margin-top:10px" data-action="start-wrong" data-count="10" ${wrong ? "" : "disabled"}>重做错题 ${wrong ? "(" + wrong + ")" : ""}</button>
        </div>
      </div>

      <div class="section-head"><div><h2>怎么用题库</h2><p>别追求“刷完”，追求“错题变少”</p></div></div>
      <div class="grid grid-3">
        <div class="card card--flat"><div class="eyebrow">STEP 1</div><b>先选，再看解析</b><p class="small">不要因为“感觉像”就选；先说出理由，再看解析。</p></div>
        <div class="card card--flat"><div class="eyebrow">STEP 2</div><b>错题当场回炉</b><p class="small">看完解析后，合上屏幕，用自己的话复述一遍错误原因。</p></div>
        <div class="card card--flat"><div class="eyebrow">STEP 3</div><b>隔天再做</b><p class="small">同一天重复做对，可能只是短期记忆；隔天再做才说明真的会。</p></div>
      </div>
    </section>`;
  };

  function startQuizSession(config) {
    const cfg = Object.assign({}, config || {});
    if (typeof cfg.mixed === "string") cfg.mixed = cfg.mixed.split(",").filter(Boolean);
    const questions = K.pickQuestions(cfg);
    if (!questions.length) { window.MS.app.toast("这个范围暂时没有题"); return; }
    S.quiz = {
      questions,
      idx: 0,
      answers: new Array(questions.length).fill(null),
      config: cfg,
      startedAt: Date.now(),
      counted: false
    };
    window.MS.app.go("#/quiz");
  }
  V.startQuizSession = startQuizSession;

  function quizSession() {
    const sess = S.quiz;
    if (!sess) return V.quiz();
    if (sess.idx >= sess.questions.length) return quizSummary();
    const q = sess.questions[sess.idx];
    const ans = sess.answers[sess.idx];
    const answered = !!ans && ans.graded !== false;
    const correctCount = sess.answers.filter(a => a && a.correct).length;
    const progress = Math.round((sess.idx / sess.questions.length) * 100);
    return `<section class="page">
      <div class="quiz-shell">
        <div class="quiz-top">
          <a class="small" href="#/quiz" data-action="end-quiz">← 退出本组</a>
          <div class="quiz-progress">
            <div class="meta"><span>第 ${sess.idx + 1} / ${sess.questions.length} 题</span><span>已对 ${correctCount}</span></div>
            <div class="progress progress--thin"><div class="progress__bar" style="width:${progress}%"></div></div>
          </div>
        </div>

        <div class="card q-card">
          <div class="q-head">
            <span class="pill pill--dark">${V.typeLabel(q.type)}</span>
            <span class="pill" style="color:${q.moduleColor};border-color:${q.moduleColor}">${q.moduleTitle}</span>
            <span class="pill">难度 ${"●".repeat(q.diff || 1)}${"○".repeat(Math.max(0, 3 - (q.diff || 1)))}</span>
            ${answered ? `<span class="pill ${ans.correct ? "pill--ok" : "pill--red"}">${ans.correct ? "答对" : "答错"}</span>` : ""}
          </div>
          <p class="q-text">${q.q}</p>
          ${renderQuestionBody(q, ans)}
          ${answered ? renderExplain(q) : ""}
          <div class="quiz-actions">
            <span class="small">${answered ? "看完解析再下一题；别急着背选项。" : "先自己判断，别靠排除法碰运气。"}</span>
            <div class="right">
              ${answered ? `<button class="btn btn--primary" data-action="next-question">${sess.idx + 1 >= sess.questions.length ? "看成绩" : "下一题"} →</button>` : ""}
            </div>
          </div>
        </div>
        <div class="small center" style="margin-top:12px">键盘：<span class="kbd">1</span>–<span class="kbd">4</span> 选项 · <span class="kbd">Enter</span> 下一题</div>
      </div>
    </section>`;
  }

  function renderQuestionBody(q, ans) {
    if (q.type === "single") {
      return `<div class="options">${q.options.map((op, i) => {
        let cls = "option";
        if (ans) {
          if (i === q.answer) cls += " is-correct";
          else if (i === ans.selected) cls += " is-wrong";
        }
        return `<button class="${cls}" data-action="select-option" data-index="${i}" ${ans ? "disabled" : ""}>
          <span class="key">${V.optionLetter(i)}</span><span>${op}</span>
        </button>`;
      }).join("")}</div>`;
    }
    if (q.type === "tf") {
      const opts = ["正确", "错误"];
      const correctIdx = q.answer ? 0 : 1;
      return `<div class="options">${opts.map((op, i) => {
        let cls = "option";
        if (ans) {
          if (i === correctIdx) cls += " is-correct";
          else if (i === ans.selected) cls += " is-wrong";
        }
        return `<button class="${cls}" data-action="select-option" data-index="${i}" ${ans ? "disabled" : ""}>
          <span class="key">${i === 0 ? "T" : "F"}</span><span>${op}</span>
        </button>`;
      }).join("")}</div>`;
    }
    if (q.type === "num") {
      return `<div class="num-answer">
        <input id="numInput" type="text" inputmode="decimal" placeholder="输入数值" value="${ans && ans.userAnswer != null ? K.esc(ans.userAnswer) : ""}" ${ans ? "disabled" : ""}>
        <span class="unit">${q.unit || ""}</span>
        ${ans ? "" : `<button class="btn btn--primary" data-action="submit-num">提交</button>`}
      </div>
      ${ans ? `<div class="small" style="margin-top:8px">你的答案：<b>${K.esc(ans.userAnswer)}</b> ${ans.correct ? "✓" : "✗ 正确答案：" + q.answer + (q.unit ? " " + q.unit : "")}</div>` : `<div class="small" style="margin-top:8px">只填数字即可；百分比题填 5 表示 5%。</div>`}`;
    }
    if (q.type === "short") {
      if (!ans) {
        return `<div class="short-self">
          <p class="small" style="margin:0 0 8px">先在纸上/心里写出关键词，再点开参考答案。不要直接读答案。</p>
          <button class="btn btn--primary" data-action="reveal-short">写好了，看参考答案</button>
        </div>`;
      }
      return `<div class="short-self">
        <div class="model"><b>参考答案：</b>${q.answer}</div>
        <div class="btn-row">
          <button class="btn btn--sm ${ans.correct ? "btn--primary" : ""}" data-action="self-grade" data-grade="1" ${ans.graded ? "disabled" : ""}>基本答对</button>
          <button class="btn btn--sm ${ans.graded && !ans.correct ? "btn--red" : ""}" data-action="self-grade" data-grade="0" ${ans.graded ? "disabled" : ""}>没答全 / 没答上</button>
        </div>
      </div>`;
    }
    return "";
  }

  function renderExplain(q) {
    return `<div class="explain"><b>解析</b>${q.explain}${q.trap ? `<div class="trap-line">陷阱：${q.trap}</div>` : ""}</div>`;
  }

  function quizSummary() {
    const sess = S.quiz;
    const total = sess.questions.length;
    const correct = sess.answers.filter(a => a && a.correct).length;
    const pctScore = Math.round(correct / total * 100);
    if (!sess.counted) {
      sess.counted = true;
      if (correct === total && total >= 10) {
        K.state.perfectQuizzes = (K.state.perfectQuizzes || 0) + 1;
        K.save();
      }
      K.checkAchievements();
      K.autoTasks();
    }
    const msg = pctScore >= 90 ? "很稳。下一步：隔天再测一次。" : pctScore >= 70 ? "基础过关，错题要回炉。" : pctScore >= 50 ? "有漏洞，先看错题解析。" : "别急，回到讲义把这一章的逻辑重读一遍。";
    const byModule = {};
    sess.questions.forEach((q, i) => {
      if (!byModule[q.moduleId]) byModule[q.moduleId] = { total: 0, correct: 0, title: q.moduleTitle };
      byModule[q.moduleId].total += 1;
      if (sess.answers[i] && sess.answers[i].correct) byModule[q.moduleId].correct += 1;
    });
    return `<section class="page">
      <div class="card result-hero">
        <div class="eyebrow">SESSION REPORT</div>
        <div class="score">${correct}<small> / ${total}</small></div>
        <h2>${pctScore} 分 · ${msg}</h2>
        <p class="muted">${sess.config && sess.config.moduleId ? "本章练习" : sess.config && sess.config.weak ? "错题回炉" : "混合练习"} · 用时 ${Math.max(1, Math.round((Date.now() - sess.startedAt) / 60000))} 分钟</p>
        <div class="btn-row" style="justify-content:center;margin-top:12px">
          <button class="btn btn--primary" data-action="restart-quiz">再来一组</button>
          <button class="btn" data-action="start-wrong" data-count="10">只练错题</button>
          <a class="btn btn--ghost" href="#/quiz" data-action="end-quiz">回题库</a>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <div class="section-head" style="margin:0 0 10px"><div><h2 style="font-size:20px">分章表现</h2><p>哪一章拖后腿，一目了然</p></div></div>
        ${Object.keys(byModule).map(id => {
          const x = byModule[id];
          const p = Math.round(x.correct / x.total * 100);
          return `<div class="mastery-row" style="grid-template-columns:1fr 1.4fr 46px;margin-bottom:9px">
            <div class="name">${x.title}</div>
            <div class="progress"><div class="progress__bar" style="width:${p}%;background:${p >= 70 ? "var(--ok)" : p >= 40 ? "var(--gold)" : "var(--bad)"}"></div></div>
            <div class="pct">${x.correct}/${x.total}</div>
          </div>`;
        }).join("")}
      </div>

      <div class="card" style="margin-top:18px">
        <div class="section-head" style="margin:0 0 8px"><div><h2 style="font-size:20px">逐题回顾</h2><p>错题点开解析，别只看答案</p></div></div>
        <div class="result-list">
          ${sess.questions.map((q, i) => {
            const a = sess.answers[i];
            return `<div class="result-row">
              <span class="mark ${a && a.correct ? "ok" : "bad"}">${a && a.correct ? "✓" : "✗"}</span>
              <span class="qtext">${q.q}</span>
              <span class="ch">${q.moduleTitle}</span>
            </div>
            ${a && !a.correct ? `<div class="small" style="padding:2px 0 10px 30px;color:var(--red-deep)">正确答案：${V.answerText(q)}</div>` : ""}`;
          }).join("")}
        </div>
      </div>
    </section>`;
  }

  /* ================= 模考 ================= */
  V.exam = function () {
    if (S.exam) return examSession();
    const s = K.state;
    const e = C.editions[s.edition];
    const main = e.main.map(id => C.getModule(id));
    const history = (s.exams || []).slice(-3).reverse();
    return `<section class="page">
      <div class="eyebrow">MOCK EXAM · 20 QUESTIONS · 25 MIN</div>
      <h1 class="display">模考</h1>
      <p class="lede">20 道混合题，25 分钟。交卷前不显示对错；交卷后给分章报告和逐题解析。建议第 6 天、第 7 天各做一次。</p>

      <div class="card exam-start">
        <div class="eyebrow">FULL MOCK</div>
        <h2 class="display" style="font-size:34px;margin-bottom:6px">${e.label} · 12–16 章</h2>
        <p class="muted">覆盖 ${main.map(m => m.short).join(" · ")}。题目从各章平均抽取，难度混合。</p>
        <div class="exam-facts">
          <div class="exam-fact"><b>20</b><span>题</span></div>
          <div class="exam-fact"><b>25</b><span>分钟</span></div>
          <div class="exam-fact"><b>60</b><span>及格分</span></div>
        </div>
        <div class="btn-row">
          <button class="btn btn--red btn--lg" data-action="start-exam">开始模考 →</button>
          <a class="btn btn--ghost" href="#/quiz">先做章节练习</a>
        </div>
        <p class="small" style="margin-top:12px">模考不是判刑。它的作用是：在考前把“以为自己会了”的地方标出来。</p>
      </div>

      ${history.length ? `<div class="section-head"><div><h2>最近成绩</h2><p>只看趋势，不跟别人比</p></div></div>
      <div class="grid grid-3">${history.map(x => `<div class="card card--flat"><div class="eyebrow">${x.date}</div><div style="font-family:var(--serif);font-size:40px;line-height:1.1">${x.score}<small style="font-size:14px;color:var(--muted)"> / ${x.total}</small></div><div class="small">${x.score >= 80 ? "稳" : x.score >= 60 ? "过线，继续收口" : "需要回炉"}</div></div>`).join("")}</div>` : ""}
    </section>`;
  };

  V.startExam = function () {
    const qs = K.buildExamQuestions(K.state.edition);
    S.exam = {
      questions: qs,
      idx: 0,
      answers: {},
      startedAt: Date.now(),
      endsAt: Date.now() + 25 * 60 * 1000,
      submitted: false,
      recorded: false,
      result: null
    };
    window.MS.app.go("#/exam");
  };

  function examSession() {
    const sess = S.exam;
    if (!S.exam) return V.exam();
    if (sess.submitted) return examResult();
    const q = sess.questions[sess.idx];
    const selected = sess.answers[q.id];
    const answeredCount = Object.keys(sess.answers).filter(k => sess.answers[k] != null && sess.answers[k] !== "").length;
    return `<section class="page">
      <div class="quiz-shell">
        <div class="quiz-top">
          <div class="btn-row"><span class="pill pill--dark">模考中</span><span class="small">已答 ${answeredCount} / ${sess.questions.length}</span></div>
          <div class="exam-timer" id="examTimer">25:00</div>
        </div>
        <div class="progress progress--thin" style="margin-bottom:14px"><div class="progress__bar" style="width:${((sess.idx + 1) / sess.questions.length) * 100}%"></div></div>

        <div class="card q-card">
          <div class="q-head">
            <span class="pill pill--dark">${V.typeLabel(q.type)}</span>
            <span class="pill">第 ${sess.idx + 1} 题</span>
            <span class="pill">难度 ${"●".repeat(q.diff || 1)}</span>
          </div>
          <p class="q-text">${q.q}</p>
          ${q.type === "single" ? `<div class="options">${q.options.map((op, i) => `<button class="option ${selected === i ? "is-selected" : ""}" data-action="exam-pick" data-index="${i}">
            <span class="key">${V.optionLetter(i)}</span><span>${op}</span>
          </button>`).join("")}</div>` : ""}
          ${q.type === "tf" ? `<div class="options">${["正确", "错误"].map((op, i) => `<button class="option ${selected === i ? "is-selected" : ""}" data-action="exam-pick" data-index="${i}">
            <span class="key">${i === 0 ? "T" : "F"}</span><span>${op}</span>
          </button>`).join("")}</div>` : ""}
          ${q.type === "num" ? `<div class="num-answer"><input id="examNumInput" type="text" inputmode="decimal" placeholder="输入数值" value="${selected != null ? K.esc(selected) : ""}"><span class="unit">${q.unit || ""}</span><button class="btn" data-action="exam-num">确认</button></div>` : ""}
          ${q.type === "short" ? `<div class="short-self"><p class="small" style="margin:0 0 8px">模考中的简答题：先写关键词，交卷后对照参考答案自评。这里不计入自动分。</p><textarea id="examShortInput" rows="4" style="width:100%;padding:10px;border:1px solid var(--line-strong);background:var(--card);font:inherit" placeholder="写下你的关键词……">${selected != null ? K.esc(selected) : ""}</textarea><button class="btn btn--sm" data-action="exam-short" style="margin-top:8px">保存要点</button></div>` : ""}
        </div>

        <div class="btn-row" style="justify-content:space-between;margin-top:14px">
          <div class="btn-row">
            <button class="btn btn--sm" data-action="exam-prev" ${sess.idx === 0 ? "disabled" : ""}>← 上一题</button>
            <button class="btn btn--sm" data-action="exam-next" ${sess.idx >= sess.questions.length - 1 ? "disabled" : ""}>下一题 →</button>
          </div>
          <button class="btn btn--red" data-action="submit-exam">交卷</button>
        </div>

        <div class="exam-nav">
          ${sess.questions.map((x, i) => `<button class="${sess.answers[x.id] != null && sess.answers[x.id] !== "" ? "answered" : ""} ${i === sess.idx ? "current" : ""}" data-action="exam-go" data-index="${i}">${i + 1}</button>`).join("")}
        </div>
        <p class="small center" style="margin-top:10px">简答题不计入自动分；交卷后按参考答案自评。</p>
      </div>
    </section>`;
  }

  V.submitExam = function (force) {
    const sess = S.exam;
    if (!sess || sess.submitted) return;
    const answered = Object.keys(sess.answers).filter(k => sess.answers[k] != null && sess.answers[k] !== "").length;
    if (!force && answered < sess.questions.length) {
      if (!confirm(`还有 ${sess.questions.length - answered} 题没答，确定交卷？`)) return;
    }
    let correct = 0;
    const byModule = {};
    sess.questions.forEach(q => {
      const raw = sess.answers[q.id];
      let ok = false;
      if (q.type === "single" || q.type === "tf") {
        if (q.type === "single") ok = raw === q.answer;
        else ok = (raw === 0) === q.answer;
      } else if (q.type === "num") {
        const v = parseFloat(String(raw).replace(/[^0-9.\-]/g, ""));
        ok = Number.isFinite(v) && Math.abs(v - q.answer) <= (q.tolerance || 0.01) + 1e-9;
      } else {
        ok = raw === "self-correct";
      }
      if (ok) correct += 1;
      if (!byModule[q.moduleId]) byModule[q.moduleId] = { total: 0, correct: 0, title: q.moduleTitle };
      byModule[q.moduleId].total += 1;
      if (ok) byModule[q.moduleId].correct += 1;
      if (!sess.recorded) K.recordQuiz(q, ok);
      q._examOk = ok;
    });
    sess.recorded = true;
    sess.submitted = true;
    sess.score = correct;
    sess.total = sess.questions.length;
    const pctScore = Math.round(correct / sess.total * 100);
    K.recordExam(pctScore, 100, byModule);
    K.checkAchievements();
    K.autoTasks();
    window.MS.app.scrollTop();
    window.MS.app.render();
  };

  function examResult() {
    const sess = S.exam;
    const pctScore = Math.round(sess.score / sess.total * 100);
    const byModule = {};
    sess.questions.forEach(q => {
      if (!byModule[q.moduleId]) byModule[q.moduleId] = { total: 0, correct: 0, title: q.moduleTitle, color: q.moduleColor };
      byModule[q.moduleId].total += 1;
      const raw = sess.answers[q.id];
      let ok = false;
      if (q.type === "single") ok = raw === q.answer;
      else if (q.type === "tf") ok = (raw === 0) === q.answer;
      else if (q.type === "num") {
        const v = parseFloat(String(raw).replace(/[^0-9.\-]/g, ""));
        ok = Number.isFinite(v) && Math.abs(v - q.answer) <= (q.tolerance || 0.01) + 1e-9;
      } else ok = raw === "self-correct";
      if (ok) byModule[q.moduleId].correct += 1;
    });
    return `<section class="page">
      <div class="card result-hero">
        <div class="eyebrow">MOCK EXAM REPORT</div>
        <div class="score">${pctScore}<small> 分</small></div>
        <h2>${pctScore >= 80 ? "很稳，可以上考场了" : pctScore >= 60 ? "过线，但还有漏洞" : "先别刷新题，回炉错题"}</h2>
        <p class="muted">答对 ${sess.score} / ${sess.total} 题 · ${pctScore >= 60 ? "达到及格线" : "未及格"} · 建议隔天再做一套</p>
        <div class="btn-row" style="justify-content:center;margin-top:12px">
          <button class="btn btn--primary" data-action="start-exam">再考一次</button>
          <button class="btn" data-action="start-wrong" data-count="10">练错题</button>
          <a class="btn btn--ghost" href="#/stats" data-action="close-exam">看战报</a>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <div class="section-head" style="margin:0 0 10px"><div><h2 style="font-size:20px">分章报告</h2><p>哪一章最需要回炉</p></div></div>
        ${Object.keys(byModule).map(id => {
          const x = byModule[id];
          const p = Math.round(x.correct / x.total * 100);
          return `<div class="mastery-row" style="grid-template-columns:1fr 1.4fr 52px;margin-bottom:9px">
            <div class="name">${x.title}</div>
            <div class="progress"><div class="progress__bar" style="width:${p}%;background:${x.color}"></div></div>
            <div class="pct">${x.correct}/${x.total}</div>
          </div>`;
        }).join("")}
      </div>

      <div class="section-head"><div><h2>逐题解析</h2><p>错题优先看；对题也要看“为什么对”</p></div></div>
      <div class="grid" style="gap:10px">
        ${sess.questions.map((q, i) => {
          const raw = sess.answers[q.id];
          let ok = false, your = "未作答";
          if (q.type === "single") { ok = raw === q.answer; if (raw != null) your = V.optionLetter(raw) + ". " + q.options[raw]; }
          else if (q.type === "tf") { ok = (raw === 0) === q.answer; if (raw != null) your = raw === 0 ? "正确" : "错误"; }
          else if (q.type === "num") {
            const v = parseFloat(String(raw).replace(/[^0-9.\-]/g, ""));
            ok = Number.isFinite(v) && Math.abs(v - q.answer) <= (q.tolerance || 0.01) + 1e-9;
            your = raw != null && raw !== "" ? String(raw) : "未作答";
          } else { ok = raw === "self-correct"; your = raw === "self-correct" ? "自评：基本答对" : raw ? "已写要点" : "未作答"; }
          return `<details class="card card--flat" style="padding:14px 16px">
            <summary style="cursor:pointer;display:flex;gap:9px;align-items:flex-start">
              <span class="result-row" style="border:0;padding:0;flex:0 0 auto"><span class="mark ${ok ? "ok" : "bad"}">${ok ? "✓" : "✗"}</span></span>
              <span style="flex:1;font-size:13.5px;line-height:1.6">${q.q}</span>
              <span class="ch">${q.moduleTitle}</span>
            </summary>
            <div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);font-size:13px;line-height:1.8">
              <div>你的答案：<b>${K.esc(your)}</b></div>
              <div style="color:var(--ok)">正确答案：<b>${V.answerText(q)}</b></div>
              <div class="small" style="margin-top:6px">${q.explain}</div>
            </div>
          </details>`;
        }).join("")}
      </div>
    </section>`;
  }

  /* 对外暴露给 app 调用 */
  window.MS.practice = {
    cardSession, quizSession, examSession, quizSummary, examResult,
    startQuizSession, startExam: V.startExam, submitExam: V.submitExam
  };
})();
