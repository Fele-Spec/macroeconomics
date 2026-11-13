/* 宏观七日 — 课程元数据
   内容按“知识模块”组织，再映射到不同版次的章号。
   这样第 7/8 版与第 5/6 版可以共用同一套讲义和题库。 */
window.COURSE = {
  meta: {
    title: "宏观七日",
    subtitle: "高鸿业《西方经济学（宏观部分）》12–16 章",
    version: "1.0",
    days: 7,
    dailyCards: 20,
    dailyQuiz: 12,
    examQuestions: 20,
    examMinutes: 25,
    passScore: 60
  },

  editions: {
    "78": {
      id: "78",
      label: "第 7/8 版",
      short: "7/8版",
      main: ["ch12", "ch13", "ch14", "ch15", "ch16"],
      bonus: ["pol1", "pol2"],
      note: "第 12 章核算 → 第 13 章收入-支出 → 第 14 章 IS-LM → 第 15 章 AD-AS → 第 16 章失业与通胀。政策两讲作为第 17 章拓展。"
    },
    "56": {
      id: "56",
      label: "第 5/6 版",
      short: "5/6版",
      main: ["ch12", "ch13", "ch14", "pol1", "pol2"],
      bonus: ["ch15", "ch16"],
      note: "第 12 章核算 → 第 13 章简单模型 → 第 14 章 IS-LM → 第 15 章政策分析 → 第 16 章政策实践。AD-AS 与失业通胀作为第 17–18 章拓展。"
    }
  },

  modules: [],

  /* 七个模块的学习顺序（不是章号顺序，是认知顺序） */
  order: ["ch12", "ch13", "ch14", "ch15", "ch16", "pol1", "pol2"],

  getModule(id) {
    return this.modules.find(m => m.id === id) || null;
  },

  moduleCode(id, edition) {
    const m = this.getModule(id);
    if (!m) return "?";
    return (m.code && m.code[edition]) || m.code["78"] || "?";
  },

  isMain(id, edition) {
    const e = this.editions[edition] || this.editions["78"];
    return e.main.includes(id);
  }
};
