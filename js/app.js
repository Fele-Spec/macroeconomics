/* 宏观七日 — 路由与交互 */
(function () {
  const C = window.COURSE;
  const K = window.MS.core;
  const V = window.MS.views;
  const P = window.MS.practice;
  const S = window.MS.session = window.MS.session || { cards: null, quiz: null, exam: null };
  const app = window.MS.app = {};
  let examTimer = null;
  let toastTimer = null;
  let readerObserver = null;
  let lastPath = null;

  function main() { return document.getElementById("main"); }
  function parseHash() {
    const raw = (location.hash || "#/today").replace(/^#\/?/, "");
    const [pathPart, query] = raw.split("?");
    return {
      path: pathPart,
      parts: pathPart.split("/").filter(Boolean),
      params: new URLSearchParams(query || "")
    };
  }

  function go(hash) {
    if (location.hash === hash) { render(); return; }
    location.hash = hash;
  }
  app.go = go;

  app.toast = function (msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  };

  function sound(ok) {
    if (!K.state.settings.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = ok ? 660 : 220;
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.17);
      setTimeout(() => ctx.close(), 300);
    } catch (e) { /* 忽略音频失败 */ }
  }

  function confetti() {
    if (K.state.settings.motion === false) return;
    const canvas = document.getElementById("confetti");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = ["#c4452c", "#c39335", "#4f6b49", "#335f76", "#1e1d1a"];
    const parts = Array.from({ length: 70 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: innerHeight * 0.42,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 7 - 2,
      s: 3 + Math.random() * 5,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      c: colors[Math.floor(Math.random() * colors.length)]
    }));
    let start = null;
    function frame(t) {
      if (!start) start = t;
      const dt = (t - start) / 1000;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(p => {
        p.vy += 0.18;
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - dt / 1.6);
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.55);
        ctx.restore();
      });
      if (dt < 1.7) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
    requestAnimationFrame(frame);
  }

  function updateChrome(view) {
    const s = K.state;
    document.querySelectorAll("[data-nav]").forEach(a => {
      const key = a.dataset.nav;
      const active = key === view || (view === "learn" && key === "learn") ||
        ((view === "lab" || view === "formulas" || view === "about") && key === "learn");
      a.classList.toggle("active", active);
    });
    const st = document.getElementById("streakStat");
    if (st) st.innerHTML = "🔥 <b>" + (s.streak || 0) + "</b>";
    const xp = document.getElementById("xpStat");
    if (xp) xp.innerHTML = (s.xp || 0) + " <small>XP</small>";
    const titles = { today: "今日", learn: "讲义", cards: "闪卡", quiz: "题库", exam: "模考", stats: "战报", lab: "图形实验室", formulas: "公式墙", about: "关于" };
    document.title = (titles[view] || "宏观七日") + " · 宏观七日";
  }

  function startExamTimer() {
    stopExamTimer();
    const sess = S.exam;
    if (!sess || sess.submitted) return;
    const tick = () => {
      const el = document.getElementById("examTimer");
      if (!el || !S.exam || S.exam.submitted) { stopExamTimer(); return; }
      const left = Math.max(0, S.exam.endsAt - Date.now());
      const m = Math.floor(left / 60000);
      const sec = Math.floor((left % 60000) / 1000);
      el.textContent = m + ":" + String(sec).padStart(2, "0");
      el.classList.toggle("warn", left <= 5 * 60000);
      if (left <= 0) {
        stopExamTimer();
        app.toast("时间到，自动交卷");
        P.submitExam(true);
      }
    };
    tick();
    examTimer = setInterval(tick, 1000);
  }
  function stopExamTimer() {
    if (examTimer) { clearInterval(examTimer); examTimer = null; }
  }

  function bindReaderSpy() {
    if (readerObserver) { readerObserver.disconnect(); readerObserver = null; }
    const links = Array.from(document.querySelectorAll("[data-toc]"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = {};
    links.forEach(a => { map[a.dataset.toc] = a; });
    readerObserver = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(a => a.classList.remove("active"));
          const a = map[en.target.id];
          if (a) a.classList.add("active");
        }
      });
    }, { rootMargin: "-90px 0px -65% 0px", threshold: 0 });
    document.querySelectorAll(".reader-section").forEach(sec => readerObserver.observe(sec));
  }

  function render() {
    const r = parseHash();
    const view = r.parts[0] || "today";
    let html = "";
    try {
      if (view === "today") html = V.today();
      else if (view === "learn") html = r.parts[1] ? V.reader(r.parts[1]) : V.learn();
      else if (view === "cards") html = V.cards();
      else if (view === "quiz") html = V.quiz();
      else if (view === "exam") html = V.exam();
      else if (view === "stats") html = V.stats();
      else if (view === "lab") html = V.lab();
      else if (view === "formulas") html = V.formulas();
      else if (view === "about") html = V.about();
      else html = V.notFound();
    } catch (e) {
      console.error(e);
      html = `<section class="page empty"><div class="glyph">!</div><h2>页面出错了</h2><p>${K.esc(e.message)}</p><a class="btn" href="#/today">回今日</a></section>`;
    }
    main().innerHTML = html;
    updateChrome(view);
    bindReaderSpy();
    if (view === "exam") startExamTimer(); else stopExamTimer();
    if (lastPath !== r.path || app._scrollNext) window.scrollTo(0, 0);
    app._scrollNext = false;
    lastPath = r.path;
  }
  app.render = render;
  app.scrollTop = function () {
    app._scrollNext = true;
    window.scrollTo(0, 0);
  };

  function refreshAfter(action) {
    K.checkAchievements();
    K.autoTasks();
    if (action) action();
    render();
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  function importFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";
    document.body.appendChild(input);
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (!f) { input.remove(); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          K.importJSON(String(reader.result));
          V.closeModal();
          app.toast("导入成功");
          go("#/today");
          render();
        } catch (e) {
          app.toast("导入失败：文件格式不对");
        }
        input.remove();
      };
      reader.readAsText(f);
    };
    input.click();
  }

  function startCards(moduleId, count) {
    const mid = !moduleId || moduleId === "all" ? null : moduleId;
    const limit = count || 20;
    const queue = K.buildCardQueue(mid, limit);
    if (!queue.length) { app.toast("这个范围没有可复习的卡"); return; }
    S.cards = { queue, idx: 0, revealed: false, moduleId: mid || "all", done: 0, again: 0, repeats: {} };
    app.scrollTop();
    go("#/cards");
  }

  function handleAction(action, el, e) {
    const ds = el.dataset;
    switch (action) {
      case "scroll-section": {
        e.preventDefault();
        const target = document.getElementById(ds.section);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
      case "toggle-task": {
        e.preventDefault();
        const id = ds.task;
        K.setTask(id, !K.planDone(id));
        render();
        break;
      }
      case "mark-read": {
        e.preventDefault();
        const id = ds.module;
        const first = K.markRead(id);
        if (first) {
          app.toast("已标记读完，+20 XP");
          confetti();
        }
        refreshAfter();
        break;
      }
      case "start-cards": {
        e.preventDefault();
        startCards(ds.module, Number(ds.count || 20));
        break;
      }
      case "card-filter": {
        e.preventDefault();
        window.MS.ui.cardFilter = ds.module;
        render();
        break;
      }
      case "reveal-card": {
        e.preventDefault();
        if (S.cards) { S.cards.revealed = true; render(); }
        break;
      }
      case "rate-card": {
        e.preventDefault();
        if (!S.cards) break;
        const id = S.cards.queue[S.cards.idx];
        const rating = ds.rating;
        K.rateCard(id, rating);
        S.cards.done = (S.cards.done || 0) + 1;
        if (rating === "again") {
          S.cards.again = (S.cards.again || 0) + 1;
          const n = S.cards.repeats[id] || 0;
          if (n < 2) {
            S.cards.repeats[id] = n + 1;
            S.cards.queue.push(id);
          }
        }
        S.cards.idx += 1;
        S.cards.revealed = false;
        sound(rating === "good" || rating === "easy");
        K.checkAchievements();
        K.autoTasks();
        app.scrollTop();
        render();
        break;
      }
      case "skip-card": {
        e.preventDefault();
        if (!S.cards) break;
        S.cards.idx += 1;
        S.cards.revealed = false;
        render();
        break;
      }
      case "end-cards": {
        e.preventDefault();
        S.cards = null;
        if (location.hash.startsWith("#/cards")) render();
        else go("#/cards");
        break;
      }
      case "start-quiz": {
        e.preventDefault();
        const config = { count: Number(ds.count || 10) };
        if (ds.module) config.moduleId = ds.module;
        if (ds.mixed) config.mixed = ds.mixed.split(",").filter(Boolean);
        app.scrollTop();
        P.startQuizSession(config);
        break;
      }
      case "start-wrong": {
        e.preventDefault();
        app.scrollTop();
        P.startQuizSession({ weak: true, count: Number(ds.count || 10), edition: K.state.edition });
        break;
      }
      case "select-option": {
        e.preventDefault();
        if (!S.quiz) break;
        const q = S.quiz.questions[S.quiz.idx];
        if (!q || S.quiz.answers[S.quiz.idx]) break;
        const idx = Number(ds.index);
        const correct = q.type === "single" ? idx === q.answer : (idx === 0) === q.answer;
        S.quiz.answers[S.quiz.idx] = { selected: idx, userAnswer: idx, correct, graded: true };
        K.recordQuiz(q, correct);
        sound(correct);
        if (correct) confetti();
        K.checkAchievements();
        K.autoTasks();
        render();
        break;
      }
      case "submit-num": {
        e.preventDefault();
        if (!S.quiz) break;
        const q = S.quiz.questions[S.quiz.idx];
        if (!q || S.quiz.answers[S.quiz.idx]) break;
        const input = document.getElementById("numInput");
        const raw = input ? input.value : "";
        const v = parseFloat(String(raw).replace(/[^0-9.\-]/g, ""));
        const correct = Number.isFinite(v) && Math.abs(v - q.answer) <= (q.tolerance || 0.01) + 1e-9;
        S.quiz.answers[S.quiz.idx] = { selected: null, userAnswer: raw, correct, graded: true };
        K.recordQuiz(q, correct);
        sound(correct);
        if (correct) confetti();
        K.checkAchievements();
        K.autoTasks();
        render();
        break;
      }
      case "reveal-short": {
        e.preventDefault();
        if (!S.quiz) break;
        if (!S.quiz.answers[S.quiz.idx]) {
          S.quiz.answers[S.quiz.idx] = { selected: null, userAnswer: "", correct: false, graded: false, revealed: true };
        }
        render();
        break;
      }
      case "self-grade": {
        e.preventDefault();
        if (!S.quiz) break;
        const q = S.quiz.questions[S.quiz.idx];
        const ans = S.quiz.answers[S.quiz.idx];
        if (!q || !ans || ans.graded) break;
        const correct = ds.grade === "1";
        ans.correct = correct;
        ans.graded = true;
        K.recordQuiz(q, correct);
        sound(correct);
        if (correct) confetti();
        K.checkAchievements();
        K.autoTasks();
        render();
        break;
      }
      case "next-question": {
        e.preventDefault();
        if (!S.quiz) break;
        S.quiz.idx += 1;
        app.scrollTop();
        render();
        break;
      }
      case "restart-quiz": {
        e.preventDefault();
        if (!S.quiz) break;
        const cfg = Object.assign({}, S.quiz.config);
        S.quiz = null;
        P.startQuizSession(cfg);
        break;
      }
      case "end-quiz": {
        e.preventDefault();
        S.quiz = null;
        if (location.hash.startsWith("#/quiz")) render(); else go("#/quiz");
        break;
      }
      case "start-exam": {
        e.preventDefault();
        app.scrollTop();
        P.startExam();
        break;
      }
      case "exam-pick": {
        e.preventDefault();
        if (!S.exam || S.exam.submitted) break;
        const q = S.exam.questions[S.exam.idx];
        S.exam.answers[q.id] = Number(ds.index);
        render();
        break;
      }
      case "exam-num": {
        e.preventDefault();
        if (!S.exam || S.exam.submitted) break;
        const q = S.exam.questions[S.exam.idx];
        const input = document.getElementById("examNumInput");
        S.exam.answers[q.id] = input ? input.value : "";
        render();
        break;
      }
      case "exam-short": {
        e.preventDefault();
        if (!S.exam || S.exam.submitted) break;
        const q = S.exam.questions[S.exam.idx];
        const input = document.getElementById("examShortInput");
        S.exam.answers[q.id] = input ? input.value : "";
        app.toast("已保存要点");
        render();
        break;
      }
      case "exam-prev": {
        e.preventDefault();
        if (S.exam && S.exam.idx > 0) { S.exam.idx -= 1; app.scrollTop(); render(); }
        break;
      }
      case "exam-next": {
        e.preventDefault();
        if (S.exam && S.exam.idx < S.exam.questions.length - 1) { S.exam.idx += 1; app.scrollTop(); render(); }
        break;
      }
      case "exam-go": {
        e.preventDefault();
        if (S.exam) { S.exam.idx = Number(ds.index); app.scrollTop(); render(); }
        break;
      }
      case "submit-exam": {
        e.preventDefault();
        P.submitExam(false);
        break;
      }
      case "close-exam": {
        e.preventDefault();
        S.exam = null;
        go("#/stats");
        break;
      }
      case "lab-tab": {
        e.preventDefault();
        window.MS.ui.labTab = ds.tab;
        window.MS.ui.scenario = "base";
        render();
        break;
      }
      case "lab-scenario": {
        e.preventDefault();
        window.MS.ui.labTab = ds.tab;
        window.MS.ui.scenario = ds.scenario;
        render();
        break;
      }
      case "toggle-formula": {
        e.preventDefault();
        window.MS.ui.formulaHidden = !window.MS.ui.formulaHidden;
        render();
        break;
      }
      case "peek-formula": {
        e.preventDefault();
        if (window.MS.ui.formulaHidden) el.classList.remove("is-hidden");
        break;
      }
      case "open-settings": {
        e.preventDefault();
        V.openModal(V.settingsModal());
        break;
      }
      case "close-modal": {
        if (el.classList.contains("modal-backdrop") && e.target.closest(".modal")) return;
        V.closeModal();
        break;
      }
      case "set-edition": {
        e.preventDefault();
        K.state.edition = ds.edition;
        K.save(true);
        V.closeModal();
        app.toast("已切换到" + C.editions[ds.edition].label);
        render();
        break;
      }
      case "toggle-sound": {
        e.preventDefault();
        K.state.settings.sound = !K.state.settings.sound;
        K.save(true);
        V.openModal(V.settingsModal());
        break;
      }
      case "toggle-motion": {
        e.preventDefault();
        K.state.settings.motion = K.state.settings.motion === false;
        K.save(true);
        V.openModal(V.settingsModal());
        break;
      }
      case "export": {
        e.preventDefault();
        download("macro-sprint-backup-" + K.today() + ".json", K.exportJSON());
        app.toast("备份已导出");
        break;
      }
      case "import": {
        e.preventDefault();
        importFile();
        break;
      }
      case "restart-week": {
        e.preventDefault();
        if (!confirm("把七天计划的起始日改成今天？已学记录不会丢。")) break;
        K.state.startDate = K.today();
        K.state.planDone = {};
        K.save(true);
        V.closeModal();
        app.toast("七天计划已重新计时");
        go("#/today");
        render();
        break;
      }
      case "reset-all": {
        e.preventDefault();
        if (!confirm("确定清空全部学习数据？闪卡、错题、模考、进度都会删除，无法撤销。")) break;
        if (!confirm("再确认一次：真的要清空吗？")) break;
        K.resetAll();
        V.closeModal();
        S.cards = S.quiz = S.exam = null;
        location.hash = "#/today";
        render();
        app.toast("已清空");
        break;
      }
      case "clear-wrong": {
        e.preventDefault();
        if (!confirm("清空错题本？题目记录还在，只是不再标记为错题。")) break;
        K.state.wrong = {};
        K.save(true);
        render();
        break;
      }
      default:
        break;
    }
  }

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const a = el.dataset.action;
    if (a === "close-modal" && el.classList.contains("modal-backdrop") && e.target.closest(".modal")) return;
    handleAction(a, el, e);
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      const modal = document.querySelector(".modal-backdrop");
      if (modal) { V.closeModal(); return; }
    }
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") {
      if (e.key === "Enter" && e.target.id === "numInput") {
        const btn = document.querySelector('[data-action="submit-num"]');
        if (btn) btn.click();
      }
      return;
    }
    if (S.cards) {
      if (e.code === "Space") { e.preventDefault(); if (!S.cards.revealed) { S.cards.revealed = true; render(); } return; }
      if (S.cards.revealed && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        const map = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
        const btn = document.querySelector('[data-action="rate-card"][data-rating="' + map[e.key] + '"]');
        if (btn) btn.click();
      }
      return;
    }
    if (S.quiz) {
      if (!S.quiz.answers[S.quiz.idx] && ["1", "2", "3", "4"].includes(e.key)) {
        const btn = document.querySelector('[data-action="select-option"][data-index="' + (Number(e.key) - 1) + '"]');
        if (btn) { e.preventDefault(); btn.click(); }
      }
      if (e.key === "Enter" && S.quiz.answers[S.quiz.idx]) {
        const btn = document.querySelector('[data-action="next-question"]');
        if (btn) { e.preventDefault(); btn.click(); }
      }
      return;
    }
    if (S.exam && !S.exam.submitted) {
      if (["1", "2", "3", "4"].includes(e.key)) {
        const btn = document.querySelector('[data-action="exam-pick"][data-index="' + (Number(e.key) - 1) + '"]');
        if (btn) { e.preventDefault(); btn.click(); }
      }
      if (e.key === "ArrowLeft") { const b = document.querySelector('[data-action="exam-prev"]'); if (b && !b.disabled) b.click(); }
      if (e.key === "ArrowRight") { const b = document.querySelector('[data-action="exam-next"]'); if (b && !b.disabled) b.click(); }
    }
  });

  document.getElementById("settingsBtn").addEventListener("click", () => {
    V.openModal(V.settingsModal());
  });

  window.addEventListener("hashchange", render);

  window.addEventListener("beforeunload", () => {
    K.save(true);
    stopExamTimer();
  });

  // 首次进入
  if (!location.hash) {
    try { history.replaceState(null, "", "#/today"); } catch (e) { location.hash = "#/today"; }
  }
  K.autoTasks();
  render();
})();
