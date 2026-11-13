/* 题库与课程数据静态校验：node tools/validate.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const files = [
  "data/core.js",
  "data/ch12.js",
  "data/ch13.js",
  "data/ch14.js",
  "data/ch15.js",
  "data/ch16.js",
  "data/pol1.js",
  "data/pol2.js",
  "data/plan.js"
];

const sandbox = { window: {}, console };
vm.createContext(sandbox);
for (const f of files) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), sandbox, { filename: f });
}
const C = sandbox.window.COURSE;
const errors = [];
const warnings = [];
const ids = { card: new Set(), quiz: new Set(), module: new Set() };

if (!C) errors.push("COURSE 未定义");
if (C.modules.length !== 7) errors.push(`模块数应为 7，实际 ${C.modules.length}`);

for (const m of C.modules) {
  if (ids.module.has(m.id)) errors.push(`模块 id 重复：${m.id}`);
  ids.module.add(m.id);
  for (const key of ["title", "short", "tagline", "color"]) {
    if (!m[key]) errors.push(`${m.id} 缺少 ${key}`);
  }
  if (!m.sections || !m.sections.length) errors.push(`${m.id} 没有 sections`);
  if (!m.cards || !m.cards.length) errors.push(`${m.id} 没有 cards`);
  if (!m.quiz || !m.quiz.length) errors.push(`${m.id} 没有 quiz`);

  for (const sec of m.sections || []) {
    if (!sec.h || !sec.body) errors.push(`${m.id} 有 section 缺 h/body`);
    if (sec.formula && !sec.formula.fx) errors.push(`${m.id}/${sec.h} formula 缺 fx`);
  }
  for (const f of m.formulas || []) {
    if (!f.name || !f.fx) errors.push(`${m.id} 有公式缺 name/fx`);
  }
  for (const c of m.cards || []) {
    if (ids.card.has(c.id)) errors.push(`卡片 id 重复：${c.id}`);
    ids.card.add(c.id);
    if (!c.front || !c.back) errors.push(`${c.id} 缺 front/back`);
  }
  for (const q of m.quiz || []) {
    if (ids.quiz.has(q.id)) errors.push(`题目 id 重复：${q.id}`);
    ids.quiz.add(q.id);
    if (!["single", "tf", "num", "short"].includes(q.type)) errors.push(`${q.id} 类型非法：${q.type}`);
    if (!q.q || !q.explain) errors.push(`${q.id} 缺题干/解析`);
    if (!q.topic) warnings.push(`${q.id} 缺 topic`);
    if (!q.diff || q.diff < 1 || q.diff > 3) warnings.push(`${q.id} 难度异常`);
    if (q.type === "single") {
      if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`${q.id} 选项不足`);
      if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= q.options.length) errors.push(`${q.id} 答案下标越界`);
      if (new Set(q.options).size !== q.options.length) errors.push(`${q.id} 选项重复`);
    }
    if (q.type === "tf" && typeof q.answer !== "boolean") errors.push(`${q.id} 判断题答案非布尔`);
    if (q.type === "num") {
      if (typeof q.answer !== "number" || !Number.isFinite(q.answer)) errors.push(`${q.id} 计算题答案非数字`);
      if (q.tolerance != null && (typeof q.tolerance !== "number" || q.tolerance < 0)) errors.push(`${q.id} tolerance 非法`);
    }
    if (q.type === "short" && (!q.answer || !q.keywords)) errors.push(`${q.id} 简答题缺答案/关键词`);
  }
}

const totalQ = C.modules.reduce((n, m) => n + m.quiz.length, 0);
const totalC = C.modules.reduce((n, m) => n + m.cards.length, 0);
console.log(`模块：${C.modules.length}，闪卡：${totalC}，题目：${totalQ}`);

for (const edition of ["78", "56"]) {
  const e = C.editions[edition];
  const main = e.main.map(id => C.getModule(id));
  const pool = main.flatMap(m => m.quiz.filter(q => q.type !== "short"));
  console.log(`${edition} 主线：${main.map(m => m.short).join(" / ")}；可机考题目：${pool.length}`);
  if (pool.length < 20) errors.push(`${edition} 可机考题目不足 20（${pool.length}）`);
  for (const m of main) {
    const n = m.quiz.filter(q => q.type !== "short").length;
    if (n < 4) errors.push(`${edition}/${m.id} 机考题目不足 4（${n}）`);
  }
  const plan = C.planFor(edition);
  if (plan.length !== 7) errors.push(`${edition} 计划不是 7 天`);
  plan.forEach(d => {
    if (!d.tasks || !d.tasks.length) errors.push(`${edition} 第 ${d.day} 天没任务`);
    if (d.focus && !C.getModule(d.focus)) errors.push(`${edition} 第 ${d.day} 天 focus 非法`);
  });
}

for (const a of C.achievements) {
  if (!a.id || !a.metric || typeof a.threshold !== "number") errors.push(`成就定义异常：${a.id}`);
}
for (const r of C.research) {
  if (!r.title || !r.finding || !r.url) errors.push(`研究条目异常：${r.title}`);
}

if (warnings.length) {
  console.log(`\n${warnings.length} 条提醒：`);
  warnings.slice(0, 30).forEach(w => console.log("  - " + w));
}
if (errors.length) {
  console.error(`\n${errors.length} 个错误：`);
  errors.forEach(e => console.error("  ✗ " + e));
  process.exit(1);
}
console.log("\n✓ 数据校验通过");
