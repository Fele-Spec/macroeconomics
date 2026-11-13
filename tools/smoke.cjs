/* 浏览器冒烟测试：node tools/smoke.cjs
   需要本机安装 playwright，并通过 NODE_PATH 指向其 node_modules。 */
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://127.0.0.1:8765/index.html";
const errors = [];
const logs = [];

function ok(label) { logs.push("✓ " + label); }
function fail(label) { errors.push("✗ " + label); }

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  page.on("console", msg => {
    if (msg.type() === "error") errors.push("console: " + msg.text());
  });
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("dialog", d => d.accept());

  try {
    // 今日
    await page.goto(BASE + "#/today", { waitUntil: "networkidle" });
    await page.waitForSelector(".hero");
    const todayText = await page.locator("body").innerText();
    if (!todayText.includes("七天，把宏观")) fail("今日页标题缺失");
    else ok("今日页渲染");

    // 题库：完整做一组 10 题
    await page.goto(BASE + "#/quiz", { waitUntil: "networkidle" });
    await page.click('[data-action="start-quiz"][data-module="ch12"]');
    await page.waitForSelector(".q-card");
    for (let i = 0; i < 10; i++) {
      const option = page.locator(".option").first();
      if (await option.count()) {
        await option.click();
      } else if (await page.locator("#numInput").count()) {
        await page.locator("#numInput").fill("0");
        await page.click('[data-action="submit-num"]');
      } else {
        await page.click('[data-action="reveal-short"]');
        await page.click('[data-action="self-grade"][data-grade="1"]');
      }
      await page.waitForSelector(".explain");
      await page.click('[data-action="next-question"]');
      await page.waitForTimeout(120);
    }
    await page.waitForSelector(".result-hero");
    await page.waitForTimeout(500);
    ok("刷题 10 题并出成绩");
    await page.screenshot({ path: "shots/quiz-result.png", fullPage: false });

    // 闪卡
    await page.goto(BASE + "#/cards", { waitUntil: "networkidle" });
    await page.click('[data-action="start-cards"]');
    await page.waitForSelector(".flashcard");
    await page.click('[data-action="reveal-card"]');
    await page.waitForSelector(".flashcard__a");
    await page.click('[data-action="rate-card"][data-rating="good"]');
    await page.waitForTimeout(250);
    if (!(await page.locator(".flashcard").count())) fail("闪卡评分后没有下一张");
    else ok("闪卡翻面与评分");

    // 模考
    await page.goto(BASE + "#/exam", { waitUntil: "networkidle" });
    await page.click('[data-action="start-exam"]');
    await page.waitForSelector("#examTimer");
    const navCount = await page.locator(".exam-nav button").count();
    for (let i = 0; i < navCount; i++) {
      await page.locator(".exam-nav button").nth(i).click();
      const opt = page.locator('[data-action="exam-pick"]').first();
      if (await opt.count()) await opt.click();
      else if (await page.locator("#examNumInput").count()) {
        await page.locator("#examNumInput").fill("0");
        await page.click('[data-action="exam-num"]');
      }
      await page.waitForTimeout(40);
    }
    await page.click('[data-action="submit-exam"]');
    await page.waitForSelector(".result-hero");
    await page.waitForTimeout(500);
    ok("模考 20 题并交卷");
    await page.screenshot({ path: "shots/exam-result.png", fullPage: false });

    // 战报
    await page.goto(BASE + "#/stats", { waitUntil: "networkidle" });
    await page.waitForSelector(".heatmap");
    await page.waitForTimeout(400);
    ok("战报页渲染");
    await page.screenshot({ path: "shots/stats.png", fullPage: false });

    // 讲义标记已读
    await page.goto(BASE + "#/learn/ch13", { waitUntil: "networkidle" });
    await page.click('[data-action="mark-read"]');
    await page.waitForTimeout(350);
    const readerText = await page.locator("body").innerText();
    if (!readerText.includes("已读完")) fail("讲义标记已读失败");
    else ok("讲义标记已读");

    // 公式墙遮罩
    await page.goto(BASE + "#/formulas", { waitUntil: "networkidle" });
    await page.click('[data-action="toggle-formula"]');
    await page.waitForTimeout(200);
    if (!(await page.locator(".formula-card.is-hidden").count())) fail("公式遮罩未生效");
    else ok("公式墙遮罩");

    // 图形实验室
    await page.goto(BASE + "#/lab", { waitUntil: "networkidle" });
    await page.click('[data-action="lab-scenario"][data-scenario="G"]');
    await page.waitForTimeout(200);
    const labText = await page.locator(".lab-readout").innerText();
    if (!labText.includes("IS 右移")) fail("IS-LM 情景切换失败");
    else ok("图形实验室 G↑ 情景");

    // 设置切换版本
    await page.goto(BASE + "#/today", { waitUntil: "networkidle" });
    await page.click("#settingsBtn");
    await page.waitForSelector(".modal");
    await page.click('[data-action="set-edition"][data-edition="56"]');
    await page.waitForTimeout(350);
    const afterEdition = await page.locator("body").innerText();
    if (!afterEdition.includes("第 5/6 版")) fail("版本切换失败");
    else ok("版本切换 7/8 → 5/6");

    // 移动端
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mp = await mobile.newPage();
    const mobileErrors = [];
    mp.on("pageerror", e => mobileErrors.push(e.message));
    await mp.goto(BASE + "#/today", { waitUntil: "networkidle" });
    await mp.waitForSelector(".hero");
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 2) fail("移动端横向溢出 " + overflow + "px");
    else ok("移动端无横向溢出");
    await mp.screenshot({ path: "shots/mobile.png", fullPage: false });
    if (mobileErrors.length) errors.push("mobile pageerror: " + mobileErrors.join(" | "));

    // 刷新后持久化
    await page.reload({ waitUntil: "networkidle" });
    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem("macro-sprint-v1");
      return raw ? JSON.parse(raw) : null;
    });
    if (!persisted || !persisted.xp) fail("刷新后学习记录丢失");
    else ok("localStorage 持久化，XP=" + persisted.xp);

    console.log(logs.join("\n"));
    if (errors.length) {
      console.error("\n发现 " + errors.length + " 个问题：");
      errors.forEach(e => console.error(e));
      process.exitCode = 1;
    } else {
      console.log("\n✓ 浏览器冒烟测试全部通过");
    }
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error("测试崩溃：", e);
  process.exit(1);
});
