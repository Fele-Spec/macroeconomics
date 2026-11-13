/* 宏观七日 — 应用内核：存储、调度、统计 */
(function () {
  const C = window.COURSE;
  const KEY = "macro-sprint-v1";
  const INTERVALS = [0, 1, 2, 4, 7, 14];
  const BOX_LABELS = ["今天", "明天", "2 天后", "4 天后", "7 天后", "14 天后"];
  const LEVELS = [
    { min: 0, name: "见习观察员" },
    { min: 150, name: "核算员" },
    { min: 400, name: "乘数学徒" },
    { min: 800, name: "IS-LM 画手" },
    { min: 1300, name: "政策顾问" },
    { min: 2000, name: "宏观通关" }
  ];

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function today() { return dateStr(new Date()); }
  function parseDate(s) {
    const p = String(s).split("-").map(Number);
    return new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
  }
  function addDays(s, n) {
    const d = parseDate(s);
    d.setDate(d.getDate() + n);
    return dateStr(d);
  }
  function daysBetween(a, b) {
    const ms = parseDate(b).getTime() - parseDate(a).getTime();
    return Math.round(ms / 86400000);
  }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function sample(arr, n) { return shuffle(arr).slice(0, n); }
  function uniq(arr) { return Array.from(new Set(arr)); }

  function deepMerge(base, extra) {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (!extra || typeof extra !== "object") return out;
    Object.keys(extra).forEach(k => {
      const b = out[k], e = extra[k];
      if (b && e && typeof b === "object" && !Array.isArray(b) && typeof e === "object" && !Array.isArray(e)) {
        out[k] = deepMerge(b, e);
      } else {
        out[k] = e;
      }
    });
    return out;
  }

  function defaultState() {
    const t = today();
    return {
      v: 1,
      createdAt: t,
      startDate: t,
      edition: "78",
      settings: { sound: false, motion: true },
      xp: 0,
      streak: 0,
      bestStreak: 0,
      lastActive: null,
      days: {},
      cards: {},
      quiz: {},
      wrong: {},
      readings: {},
      exams: [],
      planDone: {},
      achievements: {},
      perfectQuizzes: 0,
      calcCorrect: 0,
      totalCards: 0,
      totalQuiz: 0,
      totalCorrect: 0,
      totalRead: 0
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const data = JSON.parse(raw);
      return deepMerge(defaultState(), data);
    } catch (e) {
      console.warn("读取本地记录失败", e);
      return defaultState();
    }
  }

  const state = load();
  let saveTimer = null;
  function save(immediate) {
    if (saveTimer) clearTimeout(saveTimer);
    const doSave = () => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { console.warn("保存失败", e); }
      saveTimer = null;
    };
    if (immediate) doSave();
    else saveTimer = setTimeout(doSave, 120);
  }

  function ensureDay(d) {
    if (!state.days[d]) state.days[d] = { cards: 0, quiz: 0, correct: 0, exams: 0, read: 0 };
    return state.days[d];
  }

  function touchDay() {
    const t = today();
    ensureDay(t);
    if (state.lastActive === t) return;
    if (state.lastActive && daysBetween(state.lastActive, t) === 1) state.streak += 1;
    else state.streak = 1;
    state.lastActive = t;
    state.bestStreak = Math.max(state.bestStreak || 0, state.streak);
    save();
  }

  /* ---------- 卡片调度 ---------- */
  function allCards() {
    const out = [];
    C.modules.forEach(m => {
      m.cards.forEach(c => out.push(Object.assign({}, c, { moduleId: m.id, moduleTitle: m.short, moduleColor: m.color })));
    });
    return out;
  }

  function cardState(id) {
    return state.cards[id] || { box: 0, due: today(), reps: 0, lapses: 0, last: null };
  }

  function dueCount(moduleId) {
    const t = today();
    return allCards().filter(c => (!moduleId || c.moduleId === moduleId) && state.cards[c.id] && state.cards[c.id].due <= t).length;
  }

  function newCount(moduleId) {
    return allCards().filter(c => (!moduleId || c.moduleId === moduleId) && !state.cards[c.id]).length;
  }

  function buildCardQueue(moduleId, limit) {
    const t = today();
    const pool = allCards().filter(c => !moduleId || c.moduleId === moduleId);
    const due = pool.filter(c => state.cards[c.id] && state.cards[c.id].due <= t);
    const fresh = pool.filter(c => !state.cards[c.id]);
    const later = pool.filter(c => state.cards[c.id] && state.cards[c.id].due > t)
      .sort((a, b) => String(state.cards[a.id].due).localeCompare(String(state.cards[b.id].due)));
    let picked = [];
    const seen = new Set();
    const push = arr => arr.forEach(c => { if (!seen.has(c.id)) { seen.add(c.id); picked.push(c); } });
    push(shuffle(due));
    push(shuffle(fresh));
    if (picked.length < limit) push(later);
    picked = picked.slice(0, limit);
    return shuffle(picked).map(c => c.id);
  }

  function rateCard(id, rating) {
    const s = cardState(id);
    let box = s.box || 0;
    if (rating === "again") { box = 0; s.lapses = (s.lapses || 0) + 1; }
    else if (rating === "hard") { box = Math.max(1, box); }
    else if (rating === "good") { box = Math.min(5, box + 1); }
    else if (rating === "easy") { box = Math.min(5, box + 2); }
    s.box = box;
    s.reps = (s.reps || 0) + 1;
    s.due = addDays(today(), INTERVALS[box]);
    s.last = today();
    state.cards[id] = s;
    state.totalCards = (state.totalCards || 0) + 1;
    const xpMap = { again: 2, hard: 4, good: 6, easy: 8 };
    state.xp = (state.xp || 0) + (xpMap[rating] || 3);
    ensureDay(today()).cards += 1;
    touchDay();
    save();
    return s;
  }

  /* ---------- 题目 ---------- */
  function allQuiz() {
    const out = [];
    C.modules.forEach(m => {
      m.quiz.forEach(q => out.push(Object.assign({}, q, { moduleId: m.id, moduleTitle: m.short, moduleColor: m.color })));
    });
    return out;
  }

  function quizStat(id) {
    return state.quiz[id] || { attempts: 0, correct: 0, lastCorrect: null, lastSeen: null };
  }

  function moduleAccuracy(moduleId) {
    const qs = allQuiz().filter(q => q.moduleId === moduleId);
    let attempts = 0, correct = 0;
    qs.forEach(q => {
      const s = quizStat(q.id);
      attempts += s.attempts || 0;
      correct += s.correct || 0;
    });
    return attempts ? correct / attempts : 0;
  }

  function recordQuiz(q, correct) {
    const s = quizStat(q.id);
    s.attempts = (s.attempts || 0) + 1;
    if (correct) s.correct = (s.correct || 0) + 1;
    s.lastCorrect = !!correct;
    s.lastSeen = today();
    state.quiz[q.id] = s;
    state.totalQuiz = (state.totalQuiz || 0) + 1;
    if (correct) {
      state.totalCorrect = (state.totalCorrect || 0) + 1;
      state.xp = (state.xp || 0) + 12;
      if (q.type === "num") state.calcCorrect = (state.calcCorrect || 0) + 1;
    }
    if (correct) delete state.wrong[q.id];
    else state.wrong[q.id] = today();
    const d = ensureDay(today());
    d.quiz += 1;
    if (correct) d.correct += 1;
    touchDay();
    save();
  }

  function recordExam(score, total, moduleStats) {
    state.exams.push({ date: today(), score, total, moduleStats: moduleStats || {} });
    state.exams = state.exams.slice(-30);
    state.xp = (state.xp || 0) + 30;
    ensureDay(today()).exams += 1;
    touchDay();
    save();
  }

  function markRead(moduleId) {
    if (state.readings[moduleId]) return false;
    state.readings[moduleId] = today();
    state.totalRead = (state.totalRead || 0) + 1;
    state.xp = (state.xp || 0) + 20;
    ensureDay(today()).read += 1;
    touchDay();
    save();
    return true;
  }

  /* ---------- 组卷 ---------- */
  function accuracyOf(id) {
    const s = quizStat(id);
    return s.attempts ? s.correct / s.attempts : -1;
  }

  function pickQuestions(opts) {
    opts = opts || {};
    let pool = allQuiz();
    if (opts.moduleId) pool = pool.filter(q => q.moduleId === opts.moduleId);
    if (opts.mixed && opts.mixed.length) pool = pool.filter(q => opts.mixed.includes(q.moduleId));
    if (opts.edition) {
      const e = C.editions[opts.edition];
      if (e) pool = pool.filter(q => e.main.includes(q.moduleId) || e.bonus.includes(q.moduleId));
    }
    if (opts.weak) {
      pool = pool.slice().sort((a, b) => {
        const aa = accuracyOf(a.id), bb = accuracyOf(b.id);
        const wa = aa < 0 ? 0.45 : aa;
        const wb = bb < 0 ? 0.45 : bb;
        return wa - wb;
      });
      const cut = Math.max(1, Math.ceil(pool.length * 0.55));
      pool = pool.slice(0, cut);
    }
    return sample(pool, Math.min(opts.count || 10, pool.length));
  }

  function buildExamQuestions(edition) {
    const e = C.editions[edition] || C.editions["78"];
    const per = Math.floor(20 / e.main.length);
    let picked = [];
    e.main.forEach(id => {
      const pool = allQuiz().filter(q => q.moduleId === id && q.type !== "short");
      picked = picked.concat(sample(pool, per));
    });
    const used = new Set(picked.map(q => q.id));
    const rest = allQuiz().filter(q => e.main.includes(q.moduleId) && q.type !== "short" && !used.has(q.id));
    picked = picked.concat(sample(rest, 20 - picked.length));
    return shuffle(picked).slice(0, 20);
  }

  /* ---------- 计划 ---------- */
  function sprintDay() {
    const n = daysBetween(state.startDate, today()) + 1;
    return n;
  }
  function planDay() {
    const n = clamp(sprintDay(), 1, 7);
    return C.planFor(state.edition)[n - 1];
  }
  function planDone(taskId) {
    const d = state.planDone[today()] || {};
    return !!d[taskId];
  }
  function setTask(taskId, done) {
    if (!state.planDone[today()]) state.planDone[today()] = {};
    if (done) state.planDone[today()][taskId] = true;
    else delete state.planDone[today()][taskId];
    save();
  }
  function autoTasks() {
    const day = planDay();
    if (!day) return;
    const d = ensureDay(today());
    day.tasks.forEach(t => {
      if (t.kind === "learn" && t.module && state.readings[t.module]) setTask(t.id, true);
      if (t.kind === "cards" && d.cards >= (t.count || 20)) setTask(t.id, true);
      if (t.kind === "quiz" && d.quiz >= (t.count || 12)) setTask(t.id, true);
      if (t.kind === "exam" && d.exams >= 1) setTask(t.id, true);
    });
  }

  /* ---------- 掌握度 ---------- */
  function mastery(moduleId) {
    const m = C.getModule(moduleId);
    if (!m) return 0;
    const readScore = state.readings[moduleId] ? 25 : 0;
    const reviewed = m.cards.filter(c => state.cards[c.id]);
    const avgBox = reviewed.length ? reviewed.reduce((s, c) => s + (state.cards[c.id].box || 0), 0) / reviewed.length : 0;
    const cardScore = Math.min(35, (reviewed.length / m.cards.length) * 20 + (avgBox / 5) * 15);
    const attempts = m.quiz.reduce((s, q) => s + (quizStat(q.id).attempts || 0), 0);
    const correct = m.quiz.reduce((s, q) => s + (quizStat(q.id).correct || 0), 0);
    const acc = attempts ? correct / attempts : 0;
    const conf = Math.min(1, attempts / 12);
    const quizScore = acc * 40 * conf;
    return Math.round(clamp(readScore + cardScore + quizScore, 0, 100));
  }

  function level() {
    let idx = 0;
    for (let i = 0; i < LEVELS.length; i++) if (state.xp >= LEVELS[i].min) idx = i;
    const next = LEVELS[idx + 1];
    const prev = LEVELS[idx].min;
    const span = next ? next.min - prev : 1;
    const pct = next ? Math.round(((state.xp - prev) / span) * 100) : 100;
    return { index: idx + 1, name: LEVELS[idx].name, next: next ? next.name : null, nextAt: next ? next.min : null, pct };
  }

  function metrics() {
    const e = C.editions[state.edition] || C.editions["78"];
    const mainRead = e.main.filter(id => state.readings[id]).length;
    const totalAttempts = state.totalQuiz || 0;
    return {
      cardsReviewed: state.totalCards || 0,
      quizAnswered: totalAttempts,
      quizCorrect: state.totalCorrect || 0,
      perfectQuizzes: state.perfectQuizzes || 0,
      calcCorrect: state.calcCorrect || 0,
      streak: state.streak || 0,
      bestStreak: state.bestStreak || 0,
      exams: (state.exams || []).length,
      bestExam: (state.exams || []).reduce((m, x) => Math.max(m, x.score), 0),
      mainRead,
      wrongCount: Object.keys(state.wrong || {}).length,
      wrongClear: Object.keys(state.wrong || {}).length === 0 && totalAttempts >= 20 ? 1 : 0
    };
  }

  function checkAchievements() {
    const met = metrics();
    const unlocked = [];
    C.achievements.forEach(a => {
      if (!state.achievements[a.id] && (met[a.metric] || 0) >= a.threshold) {
        state.achievements[a.id] = today();
        unlocked.push(a);
      }
    });
    if (unlocked.length) save();
    return unlocked;
  }

  /* ---------- 导入导出 ---------- */
  function exportJSON() {
    return JSON.stringify({
      app: "macro-sprint",
      version: 1,
      exportedAt: new Date().toISOString(),
      state
    }, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    const incoming = parsed && parsed.state ? parsed.state : parsed;
    if (!incoming || typeof incoming !== "object" || !incoming.cards) throw new Error("格式不对");
    const merged = deepMerge(defaultState(), incoming);
    Object.keys(state).forEach(k => delete state[k]);
    Object.assign(state, merged);
    save(true);
  }

  function resetAll() {
    const fresh = defaultState();
    Object.keys(state).forEach(k => delete state[k]);
    Object.assign(state, fresh);
    localStorage.removeItem(KEY);
    save(true);
  }

  window.MS = window.MS || {};
  window.MS.core = {
    KEY, INTERVALS, BOX_LABELS, LEVELS,
    state, save, today, addDays, daysBetween, clamp, esc, shuffle, sample, uniq,
    allCards, allQuiz, cardState, dueCount, newCount, buildCardQueue, rateCard,
    quizStat, moduleAccuracy, recordQuiz, recordExam, markRead,
    pickQuestions, buildExamQuestions,
    sprintDay, planDay, planDone, setTask, autoTasks,
    mastery, level, metrics, checkAchievements,
    exportJSON, importJSON, resetAll,
    ensureDay, touchDay
  };
})();
