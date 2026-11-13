/* 七日计划、成就与方法论 */
(function () {
  const C = window.COURSE;

  C.planFor = function (edition) {
    const e = C.editions[edition] || C.editions["78"];
    const is56 = edition === "56";
    const m = e.main.map(id => C.getModule(id));
    return [
      {
        day: 1,
        title: "造一把尺子",
        subtitle: "先把 GDP、收入口径和恒等式弄准，后面才不会算错账。",
        focus: m[0].id,
        tasks: [
          { id: "d1-learn", kind: "learn", label: "精读第 12 章", detail: "讲义 + 3 分钟合上书复述", module: m[0].id },
          { id: "d1-cards", kind: "cards", label: "闪卡 20 张", detail: "先回忆，再翻面；不会的选“忘记”", count: 20 },
          { id: "d1-quiz", kind: "quiz", label: "选择题 12 道", detail: "重点练 GDP 边界与收入链条", count: 12, module: m[0].id }
        ]
      },
      {
        day: 2,
        title: "让乘数转起来",
        subtitle: "消费函数、均衡收入、各类乘数，今天要把公式用熟。",
        focus: m[1].id,
        tasks: [
          { id: "d2-learn", kind: "learn", label: "精读第 13 章", detail: "自己推一遍两部门均衡", module: m[1].id },
          { id: "d2-cards", kind: "cards", label: "闪卡 20 张", detail: "混入昨天的到期卡", count: 20 },
          { id: "d2-quiz", kind: "quiz", label: "计算题 12 道", detail: "乘数、定量税、比例税", count: 12, module: m[1].id },
          { id: "d2-review", kind: "review", label: "回炉第 12 章", detail: "重做昨天的错题", count: 5 }
        ]
      },
      {
        day: 3,
        title: "画出 IS-LM",
        subtitle: "不要背图：从 r↓→I↑→Y↑ 推一遍 IS，从 Y↑→L₁↑→r↑ 推一遍 LM。",
        focus: m[2].id,
        tasks: [
          { id: "d3-learn", kind: "learn", label: "精读第 14 章", detail: "手画 IS、LM 各一遍", module: m[2].id },
          { id: "d3-lab", kind: "lab", label: "图形实验室 5 分钟", detail: "试 G↑、M↑、P↑ 三种冲击", count: 3 },
          { id: "d3-cards", kind: "cards", label: "闪卡 20 张", detail: "到期卡优先", count: 20 },
          { id: "d3-quiz", kind: "quiz", label: "选择题 14 道", detail: "斜率、移动、挤出", count: 14, module: m[2].id }
        ]
      },
      {
        day: 4,
        title: is56 ? "政策分析：财政与货币的力度" : "把价格请进来",
        subtitle: is56 ? "财政/货币政策的传导、效果与搭配；用 IS-LM 判断谁更有效。" : "AD 由 IS-LM 推出，AS 背后是劳动市场；分清沿曲线移动与曲线平移。",
        focus: m[3].id,
        tasks: [
          { id: "d4-learn", kind: "learn", label: "精读 " + m[3].short, detail: is56 ? "画出财政/货币政策的传导链" : "画出三种 AS 曲线", module: m[3].id },
          { id: "d4-lab", kind: "lab", label: is56 ? "IS-LM 政策实验" : "AD-AS 实验室", detail: is56 ? "试 G↑、M↑，比较财政/货币效果" : "试 AD↑、AS← 两种冲击", count: 2 },
          { id: "d4-cards", kind: "cards", label: "闪卡 20 张", detail: "混入第 13 章到期卡", count: 20 },
          { id: "d4-quiz", kind: "quiz", label: "交错练习 14 道", detail: "12–15 章混合，防止“章节提示”", count: 14, mixed: [m[0].id, m[1].id, m[2].id, m[3].id] }
        ]
      },
      {
        day: 5,
        title: is56 ? "政策实践：稳定器与乘数" : "失业与通胀",
        subtitle: is56 ? "自动稳定器、斟酌使用、货币乘数与政策时滞；把制度工具和理论对上。" : "奥肯定律、通胀成本、菲利普斯曲线，今天把“短期 vs 长期”彻底分开。",
        focus: m[4].id,
        tasks: [
          { id: "d5-learn", kind: "learn", label: "精读 " + m[4].short, detail: is56 ? "梳理自动稳定器与三大货币政策工具" : "画短期/长期菲利普斯曲线", module: m[4].id },
          { id: "d5-cards", kind: "cards", label: "闪卡 20 张", detail: "到期卡优先", count: 20 },
          { id: "d5-quiz", kind: "quiz", label: "选择题 14 道", detail: is56 ? "政策工具、自动稳定器、货币乘数" : "失业分类、通胀成因、菲利普斯", count: 14, module: m[4].id },
          { id: "d5-review", kind: "review", label: "错题回炉", detail: "把本周错题重做 8 道", count: 8 }
        ]
      },
      {
        day: 6,
        title: "整合与第一次模考",
        subtitle: "今天不学新章：把五章串成一条线，用模考找漏洞。",
        focus: null,
        tasks: [
          { id: "d6-map", kind: "map", label: "画一张总图", detail: is56 ? "核算 → 简单模型 → IS-LM → 政策分析 → 政策实践" : "核算 → 收入-支出 → IS-LM → AD-AS → 失业通胀", count: 1 },
          { id: "d6-cards", kind: "cards", label: "闪卡 30 张", detail: "只刷到期卡，不再加新卡", count: 30 },
          { id: "d6-exam", kind: "exam", label: "第一次模考", detail: "20 题 / 25 分钟 / 混合出题", count: 1 }
        ]
      },
      {
        day: 7,
        title: "考前日：只做三件事",
        subtitle: "错题、公式、第二次模考。不要再开新知识点了。",
        focus: null,
        tasks: [
          { id: "d7-wrong", kind: "wrong", label: "错题本清零", detail: "只看错题和解析，不做新题", count: 10 },
          { id: "d7-formula", kind: "formula", label: "公式墙自测", detail: "遮住公式，自己默写一遍", count: 1 },
          { id: "d7-exam", kind: "exam", label: "第二次模考", detail: "目标 80 分以上", count: 1 }
        ]
      }
    ];
  };

  C.achievements = [
    { id: "first-card", icon: "◉", name: "开张", desc: "完成第一张闪卡", metric: "cardsReviewed", threshold: 1 },
    { id: "cards-50", icon: "▭", name: "记忆热身", desc: "累计复习 50 张闪卡", metric: "cardsReviewed", threshold: 50 },
    { id: "cards-150", icon: "▤", name: "卡片墙", desc: "累计复习 150 张闪卡", metric: "cardsReviewed", threshold: 150 },
    { id: "first-quiz", icon: "✎", name: "第一题", desc: "完成第一道题", metric: "quizAnswered", threshold: 1 },
    { id: "quiz-50", icon: "✍", name: "刷题上手", desc: "累计答题 50 道", metric: "quizAnswered", threshold: 50 },
    { id: "quiz-150", icon: "◆", name: "题海一小勺", desc: "累计答题 150 道", metric: "quizAnswered", threshold: 150 },
    { id: "perfect-10", icon: "★", name: "十全十美", desc: "单次测验 10 题全对", metric: "perfectQuizzes", threshold: 1 },
    { id: "calc-10", icon: "∑", name: "计算器", desc: "计算题累计答对 10 道", metric: "calcCorrect", threshold: 10 },
    { id: "streak-3", icon: "🔥", name: "三日不断", desc: "连续学习 3 天", metric: "streak", threshold: 3 },
    { id: "streak-7", icon: "☀", name: "七日全勤", desc: "连续学习 7 天", metric: "streak", threshold: 7 },
    { id: "exam-first", icon: "◷", name: "上考场", desc: "完成第一次模考", metric: "exams", threshold: 1 },
    { id: "exam-80", icon: "⛳", name: "八十俱乐部", desc: "模考达到 80 分", metric: "bestExam", threshold: 80 },
    { id: "all-main", icon: "▥", name: "主线通关", desc: "读完当前版本主线五章讲义", metric: "mainRead", threshold: 5 },
    { id: "wrong-clear", icon: "✓", name: "错题清零", desc: "错题本清空（至少做过 20 题）", metric: "wrongClear", threshold: 1 }
  ];

  C.research = [
    {
      title: "测试效应：考自己，比反复读更有效",
      finding: "Roediger 与 Karpicke 让学生读一段材料后，要么反复阅读，要么做一次回忆测试。一周后，做过测试的学生记得更多——尽管他们自己预测“重读”会更有效。这就是“测试效应”。",
      source: "Roediger & Karpicke (2006), Psychological Science",
      url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x"
    },
    {
      title: "检索练习：把“再看一遍”换成“先回忆”",
      finding: "Dunlosky 等对 10 种学习法做系统评估，练习测试（practice testing）与分散练习（distributed practice）获得最高效用评级；重读、划线、摘要的效用较低。",
      source: "Dunlosky et al. (2013), Psychological Science in the Public Interest",
      url: "https://www.psychologicalscience.org/observer/which-study-strategies-make-the-grade-2"
    },
    {
      title: "间隔重复：复习间隔约为“保留期”的 10–20%",
      finding: "Cepeda 等发现，两次学习之间的最佳间隔约为最终保留间隔的 10–20%。准备一周后的考试，间隔 1 天左右最合适；本平台用 0/1/2/4/7 天的盒子模拟这一节奏。",
      source: "Cepeda et al. (2006), Psychological Bulletin；APS Observer 2006",
      url: "https://www.psychologicalscience.org/observer/temporal-spacing-and-learning"
    },
    {
      title: "别把学习都堆在一天：集中学习短期好看，长期漏得快",
      finding: "Rohrer 与 Pashler 的实验显示，过度学习（overlearning）在 1 周后还有点用，但 4 周后优势消失；把同样时间分散到多天，长期保留更好。",
      source: "APS (2007) 报道 Rohrer & Pashler 的过度学习实验",
      url: "https://www.psychologicalscience.org/news/releases/back-to-school-cramming-doesnt-work-in-the-long-run.html"
    },
    {
      title: "交错练习：数学题混着做，比一题型刷到底更有效",
      finding: "Rohrer 与 Taylor 发现，把不同题型混排的练习，在一周后的测试中显著优于按题型集中练习；教科书“一节一练”反而鼓励了最无效的 massing。",
      source: "Rohrer & Taylor (2007), Instructional Science",
      url: "https://doi.org/10.1007/s11251-007-9019-4"
    },
    {
      title: "游戏化要绑在“回忆”上，而不是“登录”上",
      finding: "Sailer 与 Homner 的元分析发现游戏化对认知学习有中小幅正向效应（g≈0.49），但对动机的效应更小、更不稳定；机制应服务于检索与反馈，而不是用积分替代学习。",
      source: "Sailer & Homner (2020), Educational Psychology Review",
      url: "https://doi.org/10.1007/s10648-019-09498-w"
    },
    {
      title: "外部奖励可能挤出内在动机",
      finding: "Deci、Koestner 与 Ryan 对 128 个实验的元分析发现，可预期、与任务绑定的物质奖励可能削弱后续的内在动机。所以本平台的 XP 只做“进度信息”，不做排名压迫，也不奖励“打开 App”。",
      source: "Deci, Koestner & Ryan (1999), Psychological Bulletin",
      url: "https://doi.org/10.1037/0033-2909.125.6.627"
    }
  ];

  C.about = {
    editionNote: "第 7/8 版主线为 12 核算、13 收入-支出、14 IS-LM、15 AD-AS、16 失业与通胀；第 5/6 版主线为 12 核算、13 简单模型、14 IS-LM、15 政策分析、16 政策实践。两套主线共用同一套知识模块，可在设置里切换。",
    methodNote: "每天先读一章，但读完必须合上书用 3 分钟复述；闪卡先回忆再翻面；刷题立即看解析；第 4 天起混合出题；第 6/7 天用模考和错题收口。不要用“再看一遍”替代“回忆一次”。",
    dataNote: "所有学习记录保存在浏览器 localStorage，不上传服务器。换浏览器/清理缓存会丢失，建议在设置里导出 JSON 备份。"
  };
})();
