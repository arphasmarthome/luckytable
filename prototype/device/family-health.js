(function () {
  "use strict";

  const modules = window.DeviceModules = window.DeviceModules || {};
  const i18n = window.LuckyI18n;
  const t = i18n.t;
  const activityNames = { "1.2": "較少活動", "1.4": "輕度活動", "1.55": "中度活動", "1.725": "高活動量" };
  const goalNames = { maintain: "保持體重", lose: "控制體重", gain: "增加體重" };

  function member(ctx, id) { return ctx.state.members.find(item => item.id === id) || ctx.state.members[0]; }
  function esc(ctx, value) { return ctx.escape(String(value == null ? "" : value)); }
  function currentDay(ctx) { return ctx.dateKey(ctx.today); }
  function uid(prefix) { return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6); }
  function fmt(value) { return i18n.number(value); }
  function persist(ctx) { ctx.emit(); ctx.render(); }
  function fieldError(form, message) { const node = form.querySelector(".fh-form-error"); if (node) node.textContent = message; }
  function formFooter(ctx, label, prefix) { return `<p class="fh-form-error" role="alert"></p><div class="fh-dialog-actions"><button type="button" class="btn quiet" data-action="${prefix || "fam"}-close">${esc(ctx, t("取消"))}</button><button type="submit" class="btn primary">${ctx.icon("check")}${esc(ctx, label || t("儲存"))}</button></div>`; }
  function memberOptions(ctx, id) { return ctx.state.members.map(item => `<option value="${esc(ctx, item.id)}" ${item.id === id ? "selected" : ""}>${esc(ctx, item.name)}</option>`).join(""); }
  function memberTabs(ctx, selected, prefix, withPoints) {
    return `<div class="fh-members" aria-label="${esc(ctx, t("選擇家庭成員"))}">${ctx.state.members.map(item => `<button class="member-chip fh-member ${item.id === selected ? "active is-active" : ""}" data-action="${prefix}-member" data-member="${esc(ctx, item.id)}" aria-pressed="${item.id === selected}"><span class="fh-avatar" style="--member-color:${esc(ctx, item.color)}">${esc(ctx, item.initial || item.name.slice(0, 1))}</span><span>${esc(ctx, item.name)}${withPoints ? `<small>${esc(ctx, t("{n} 點", { n: fmt(item.points) }))}</small>` : ""}</span>${item.id === selected ? ctx.icon("circle-check") : ""}</button>`).join("")}</div>`;
  }
  function week(ctx) {
    const start = new Date(ctx.today); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return { date, key: ctx.dateKey(date), label: i18n.weekday(date.getDay(), i18n.isZh ? "long" : "short"), longLabel: i18n.weekday(date.getDay()) }; });
  }
  function addLog(ctx, person, amount, title, type) {
    ctx.state.pointsLog.unshift({ id: uid("points"), memberId: person.id, amount, title, type, at: new Date().toISOString(), date: currentDay(ctx) });
  }
  function taskForm(ctx, task) {
    const owner = task ? task.memberId : ctx.state.family.member;
    ctx.dialog(task ? t("編輯任務") : t("新增家庭任務"), `<form id="fam-task-form" data-id="${task ? esc(ctx, task.id) : ""}"><div class="form-grid"><label class="field fh-full">${esc(ctx, t("任務名稱"))}<input name="title" maxlength="40" required placeholder="${esc(ctx, t("例如：整理書包"))}" value="${task ? esc(ctx, t(task.title)) : ""}"></label><label class="field">${esc(ctx, t("家庭成員"))}<select name="memberId" ${task ? "disabled" : ""}>${memberOptions(ctx, owner)}</select></label><label class="field">${esc(ctx, t("每次積分"))}<input name="points" type="number" min="1" max="100" step="1" required value="${task ? task.points : 5}"></label></div><p class="muted fh-form-note">${esc(ctx, t("每天一次"))}${task ? esc(ctx, t(" · 已完成任務的積分保持不變")) : ""}</p>${formFooter(ctx)}</form>`);
  }
  function rewardForm(ctx) {
    ctx.dialog(t("新增獎勵目標"), `<form id="fam-reward-form"><div class="form-grid"><label class="field fh-full">${esc(ctx, t("獎勵名稱"))}<input name="title" maxlength="40" required placeholder="${esc(ctx, t("例如：週末去看電影"))}"></label><label class="field">${esc(ctx, t("家庭成員"))}<select name="memberId">${memberOptions(ctx, ctx.state.family.member)}</select></label><label class="field">${esc(ctx, t("兌換積分"))}<input name="cost" type="number" min="1" max="10000" step="1" value="50" required></label></div>${formFooter(ctx, t("建立目標"))}</form>`);
  }
  function renderTasks(ctx, person) {
    const days = week(ctx), todayKey = currentDay(ctx);
    const tasks = ctx.state.tasks.filter(task => task.memberId === person.id);
    const stars = tasks.reduce((total, task) => total + (task.completions || []).filter(key => days.some(day => day.key === key)).length, 0);
    const completed = tasks.filter(task => (task.completions || []).includes(todayKey)).length;
    return `<header class="fh-board-heading"><div><h2>${esc(ctx, t("本週任務"))}</h2><p class="muted">${esc(ctx, i18n.monthDay(days[0].date))} - ${esc(ctx, i18n.monthDay(days[6].date))}</p></div><dl><div><dt>${esc(ctx, t("今日完成"))}</dt><dd>${completed}<small> / ${tasks.length}</small></dd></div><div><dt>${esc(ctx, t("本週星星"))}</dt><dd>${stars}</dd></div><div><dt>${esc(ctx, t("可用積分"))}</dt><dd>${fmt(person.points)}</dd></div></dl><button class="btn primary" data-action="fam-add-task">${ctx.icon("plus")}${esc(ctx, t("新增任務"))}</button></header>
      ${tasks.length ? `<div class="fh-week-scroll"><table class="fh-week-table"><thead><tr><th scope="col">${esc(ctx, t("家庭任務"))}</th>${days.map(day => `<th scope="col" class="${day.key === todayKey ? "fh-today" : ""}"><span>${esc(ctx, day.label)}</span><small>${String(day.date.getMonth() + 1).padStart(2, "0")}/${String(day.date.getDate()).padStart(2, "0")}${day.key === todayKey ? esc(ctx, t(" · 今天")) : ""}</small></th>`).join("")}<th scope="col">${esc(ctx, t("本週"))}</th><th scope="col">${esc(ctx, t("管理"))}</th></tr></thead><tbody>${tasks.map(task => `<tr><th scope="row"><span>${esc(ctx, t(task.title))}</span><small>${esc(ctx, t("每天 +{n} 積分", { n: task.points }))}</small></th>${days.map(day => { const done = (task.completions || []).includes(day.key); return `<td><button type="button" class="fh-completion ${done ? "is-complete" : ""} ${day.key === todayKey ? "is-today" : ""}" data-action="fam-complete" data-id="${esc(ctx, task.id)}" data-date="${day.key}" ${day.key !== todayKey ? "disabled" : ""} aria-label="${esc(ctx, t(task.title))}，${esc(ctx, day.longLabel)}，${esc(ctx, done ? t("已完成") : t("未完成"))}${esc(ctx, day.key === todayKey ? (done ? t("，取消完成") : t("，完成任務")) : t("，歷史記錄"))}" aria-pressed="${done}">${ctx.icon("star")}</button></td>`; }).join("")}<td><b class="fh-task-stars">${(task.completions || []).filter(key => days.some(day => day.key === key)).length}</b></td><td class="fh-task-actions"><button class="icon-btn" data-action="fam-edit-task" data-id="${esc(ctx, task.id)}" title="${esc(ctx, t("編輯任務"))}" aria-label="${esc(ctx, t("編輯{title}", { title: t(task.title) }))}">${ctx.icon("pencil")}</button><button class="icon-btn" data-action="fam-delete-task" data-id="${esc(ctx, task.id)}" title="${esc(ctx, t("刪除任務"))}" aria-label="${esc(ctx, t("刪除{title}", { title: t(task.title) }))}">${ctx.icon("trash-2")}</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">${ctx.icon("check-check")}<h3>${esc(ctx, t("還沒有家庭任務"))}</h3><button class="btn primary" data-action="fam-add-task">${ctx.icon("plus")}${esc(ctx, t("新增任務"))}</button></div>`}`;
  }

  function renderGrowth(ctx, person) {
    const ui = ctx.state.family, selected = ui.growthMonth || currentDay(ctx).slice(0, 7), [year, month] = selected.split("-").map(Number);
    const yearly = ui.growthMode === "year", prefix = yearly ? String(year) : selected;
    const tasks = [...ctx.state.tasks, ...(ctx.state.archivedTasks || [])].filter(task => task.memberId === person.id);
    const dates = tasks.flatMap(task => task.completions || []).filter(date => date.startsWith(prefix));
    const earned = tasks.reduce((sum, task) => sum + (task.completions || []).filter(date => date.startsWith(prefix)).reduce((points, date) => points + (task.completionPoints?.[date] ?? task.points), 0), 0);
    const lastDay = new Date(year, month, 0).getDate(), offset = new Date(year, month - 1, 1).getDay();
    const calendar = yearly ? `<div class="fh-growth-year">${Array.from({ length: 12 }, (_, i) => { const key = `${year}-${String(i + 1).padStart(2, "0")}`, count = dates.filter(date => date.startsWith(key)).length; return `<button data-action="fam-growth-month" data-month="${key}"><span>${esc(ctx, i18n.monthName(i, "short"))}</span><strong>${count}</strong><small>${esc(ctx, t("完成星星"))}</small></button>`; }).join("")}</div>` : `<div class="fh-growth-calendar">${[0, 1, 2, 3, 4, 5, 6].map(day => `<span class="fh-growth-weekday">${esc(ctx, i18n.weekday(day, "short"))}</span>`).join("")}${Array.from({ length: offset }, () => "<span></span>").join("")}${Array.from({ length: lastDay }, (_, i) => { const key = `${selected}-${String(i + 1).padStart(2, "0")}`, count = dates.filter(date => date === key).length; return `<span class="fh-growth-date ${count ? "has-stars" : ""} ${key === currentDay(ctx) ? "is-today" : ""}" title="${esc(ctx, t("{date} · 完成 {n} 次", { date: key, n: count }))}"><b>${i + 1}</b>${count ? `<small>${esc(ctx, t("{n} 星", { n: count }))}</small>` : ""}</span>`; }).join("")}</div>`;
    return `<header class="fh-growth-heading"><h2>${esc(ctx, t("成長足跡"))}</h2><div class="fh-segment"><button class="${!yearly ? "active" : ""}" data-action="fam-growth-mode" data-mode="month">${esc(ctx, t("月度"))}</button><button class="${yearly ? "active" : ""}" data-action="fam-growth-mode" data-mode="year">${esc(ctx, t("年度"))}</button></div><div class="fh-growth-period"><button class="icon-btn" data-action="fam-growth-period" data-step="-1" title="${esc(ctx, t("上一期"))}" aria-label="${esc(ctx, t("上一期"))}">${ctx.icon("chevron-left")}</button><strong>${esc(ctx, yearly ? i18n.yearLabel(year) : i18n.monthYear(new Date(year, month - 1, 1)))}</strong><button class="icon-btn" data-action="fam-growth-period" data-step="1" title="${esc(ctx, t("下一期"))}" aria-label="${esc(ctx, t("下一期"))}">${ctx.icon("chevron-right")}</button></div></header><div class="fh-growth-metrics"><div>${ctx.icon("trophy")}<strong>${fmt(person.points)}</strong><span>${esc(ctx, t("可用積分"))}<small>${esc(ctx, t("跨月、跨年不清零"))}</small></span></div><div>${ctx.icon("star")}<strong>${dates.length}</strong><span>${esc(ctx, t("完成星星"))}<small>${esc(ctx, yearly ? t("本年度紀錄") : t("本月紀錄"))}</small></span></div><div>${ctx.icon("circle-check")}<strong>${earned}</strong><span>${esc(ctx, t("獲得點數"))}<small>${esc(ctx, t("完成任務所得"))}</small></span></div></div><div class="fh-growth-layout"><section class="fh-growth-main">${calendar}</section><section class="fh-growth-tasks"><h2>${esc(ctx, t("任務紀錄"))}</h2><p class="muted">${esc(ctx, t("進行中與已封存任務"))}</p>${tasks.length ? tasks.map(task => { const count = (task.completions || []).filter(date => date.startsWith(prefix)).length; return `<article><b>${count}</b><div><strong>${esc(ctx, t(task.title))}</strong><small>${esc(ctx, t("每天 +{n} 積分", { n: task.points }))}</small></div><span>${esc(ctx, task.archived ? t("已封存") : t("進行中"))}<small>${esc(ctx, t("完成 {n} 次", { n: count }))}</small></span></article>`; }).join("") : `<p class="muted">${esc(ctx, t("尚無任務紀錄"))}</p>`}</section></div>`;
  }

  function parentManagement(ctx, person) {
    const tasks = ctx.state.tasks.filter(task => task.memberId === person.id);
    ctx.dialog(t("家長管理 · {name}", { name: person.name }), `<div class="fh-manager-actions"><button class="btn primary" data-action="fam-add-task">${ctx.icon("plus")}${esc(ctx, t("新增任務"))}</button><button class="btn quiet" data-action="fam-add-reward">${ctx.icon("gift")}${esc(ctx, t("新增獎勵"))}</button><button class="btn quiet" data-action="fam-edit-diet">${ctx.icon("utensils")}${esc(ctx, t("餐食設定"))}</button></div><div class="fh-manager-list">${tasks.length ? tasks.map(task => `<article><div><strong>${esc(ctx, t(task.title))}</strong><small>${esc(ctx, t("每天 +{n} 積分", { n: task.points }))}</small></div><button class="icon-btn" data-action="fam-edit-task" data-id="${esc(ctx, task.id)}" title="${esc(ctx, t("編輯任務"))}" aria-label="${esc(ctx, t("編輯{title}", { title: t(task.title) }))}">${ctx.icon("pencil")}</button><button class="icon-btn" data-action="fam-delete-task" data-id="${esc(ctx, task.id)}" title="${esc(ctx, t("刪除任務"))}" aria-label="${esc(ctx, t("刪除{title}", { title: t(task.title) }))}">${ctx.icon("trash-2")}</button></article>`).join("") : `<p class="muted">${esc(ctx, t("尚無家庭任務"))}</p>`}</div>`);
  }
  function renderRewards(ctx, person) {
    const rewards = ctx.state.rewards.filter(reward => reward.memberId === person.id);
    return `<div class="section-heading fh-subheading"><div><h2>${esc(ctx, t("期待的小獎勵"))}</h2><span class="muted">${esc(ctx, t("可用 {n} 積分", { n: fmt(person.points) }))}</span></div><button class="btn quiet" data-action="fam-add-reward">${ctx.icon("plus")}${esc(ctx, t("新增獎勵"))}</button></div>${rewards.length ? `<div class="fh-rewards">${rewards.map(reward => `<article class="fh-reward ${reward.redeemed ? "is-redeemed" : ""}"><div class="fh-reward-icon">${ctx.icon(reward.redeemed ? "check" : "gift")}</div><div class="fh-reward-copy"><h3>${esc(ctx, t(reward.title))}</h3><span class="muted">${esc(ctx, t("{n} 積分", { n: fmt(reward.cost) }))}</span><div class="fh-progress" aria-label="${esc(ctx, t("獎勵進度 {n}%", { n: Math.min(100, Math.floor(person.points / reward.cost * 100)) }))}"><i style="width:${reward.redeemed ? 100 : Math.min(100, person.points / reward.cost * 100)}%"></i></div><small>${esc(ctx, reward.redeemed ? t("獎勵已兌換") : person.points >= reward.cost ? t("已達成，隨時兌換") : t("還差 {n} 積分", { n: fmt(reward.cost - person.points) }))}</small></div><button class="btn ${!reward.redeemed && person.points >= reward.cost ? "primary" : "quiet"}" data-action="fam-redeem" data-id="${esc(ctx, reward.id)}" ${reward.redeemed || person.points < reward.cost ? "disabled" : ""}>${esc(ctx, reward.redeemed ? t("已兌換") : t("兌換"))}</button>${!reward.redeemed ? `<button class="icon-btn fh-delete" data-action="fam-delete-reward" data-id="${esc(ctx, reward.id)}" title="${esc(ctx, t("移除獎勵"))}" aria-label="${esc(ctx, t("移除{title}", { title: t(reward.title) }))}">${ctx.icon("trash-2")}</button>` : ""}</article>`).join("")}</div>` : `<div class="empty-state">${ctx.icon("gift")}<h3>${esc(ctx, t("還沒有獎勵目標"))}</h3><button class="btn primary" data-action="fam-add-reward">${ctx.icon("plus")}${esc(ctx, t("新增獎勵"))}</button></div>`}`;
  }
  function renderLog(ctx, person) {
    const rows = ctx.state.pointsLog.filter(item => item.memberId === person.id);
    return `<div class="section-heading fh-subheading"><h2>${esc(ctx, t("積分記錄"))}</h2><span class="badge">${esc(ctx, t("餘額 {n}", { n: fmt(person.points) }))}</span></div>${rows.length ? `<div class="fh-ledger">${rows.map(row => `<article><span class="fh-ledger-icon ${row.amount < 0 ? "is-negative" : ""}">${ctx.icon(row.amount < 0 ? "minus" : "plus")}</span><div><strong>${esc(ctx, row.title)}</strong><small>${esc(ctx, row.at ? new Date(row.at).toLocaleString(i18n.tag, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : row.date)}</small></div><b class="${row.amount < 0 ? "is-negative" : ""}">${row.amount > 0 ? "+" : ""}${row.amount}</b></article>`).join("")}</div>` : `<div class="empty-state">${ctx.icon("list")}<h3>${esc(ctx, t("暫無新的積分記錄"))}</h3><p>${esc(ctx, t("目前餘額 {n} 積分", { n: fmt(person.points) }))}</p></div>`}`;
  }
  function renderDiet(ctx, person) {
    return `<div class="section-heading fh-subheading"><h2>${esc(ctx, t("{name} 的飲食資訊", { name: person.name }))}</h2><button class="btn quiet" data-action="fam-edit-diet">${ctx.icon("pencil")}${esc(ctx, t("編輯"))}</button></div><dl class="fh-diet"><div><dt>${ctx.icon("shield-alert")}${esc(ctx, t("過敏與忌口"))}</dt><dd>${esc(ctx, person.allergy ? t(person.allergy) : t("尚未填寫"))}</dd></div><div><dt>${ctx.icon("utensils")}${esc(ctx, t("飲食偏好"))}</dt><dd>${esc(ctx, person.preference ? t(person.preference) : t("尚未填寫"))}</dd></div></dl><div class="fh-inline-actions"><button class="btn quiet" data-action="fam-recipes">${ctx.icon("utensils")}${esc(ctx, t("查看家庭食譜"))}${ctx.icon("arrow-right")}</button><button class="btn quiet" data-action="fam-schedule">${ctx.icon("calendar-days")}${esc(ctx, t("查看 {name} 的行程", { name: person.name }))}${ctx.icon("arrow-right")}</button></div>`;
  }

  modules.family = {
    render(ctx) {
      ctx.state.family ||= { member: ctx.state.members[0].id, tab: "tasks" };
      ctx.state.tasks ||= []; ctx.state.rewards ||= []; ctx.state.pointsLog ||= [];
      const ui = ctx.state.family, person = member(ctx, ui.member); ui.member = person.id;
      const tab = ["tasks", "rewards", "history", "diet", "growth"].includes(ui.tab) ? ui.tab : "tasks";
      const content = tab === "tasks" ? renderTasks(ctx, person) : tab === "rewards" ? renderRewards(ctx, person) : tab === "history" ? renderLog(ctx, person) : tab === "growth" ? renderGrowth(ctx, person) : renderDiet(ctx, person);
      return `<section class="fh-page fh-family-page"><header class="fh-page-heading"><h1>${esc(ctx, t("家庭積分"))}</h1><div class="fh-heading-actions"><button class="btn quiet" data-action="fam-schedule">${ctx.icon("calendar-days")}${esc(ctx, t("個人行程"))}</button><button class="btn quiet" data-action="fam-manage">${ctx.icon("user-cog")}${esc(ctx, t("家長管理"))}</button></div></header>${memberTabs(ctx, person.id, "fam", true)}<nav class="fh-tabs" aria-label="${esc(ctx, t("積分視圖"))}">${[["tasks", "任務與習慣", "list-checks"], ["rewards", "獎勵目標", "gift"], ["growth", "成長足跡", "chart-no-axes-column"], ["history", "積分帳本", "history"], ["diet", "飲食資訊", "utensils"]].map(([id, label, glyph]) => `<button class="${tab === id ? "active" : ""}" data-action="fam-tab" data-tab="${id}" aria-pressed="${tab === id}">${ctx.icon(glyph)}${esc(ctx, t(label))}</button>`).join("")}</nav><section class="fh-family-board fh-view-${tab}">${content}</section></section>`;
    },
    click(action, element, ctx) {
      const ui = ctx.state.family, person = member(ctx, ui.member), id = element.dataset.id;
      if (action === "fam-close") { ctx.closeDialog(); return true; }
      if (action === "fam-member") { ui.member = element.dataset.member; ctx.render(); return true; }
      if (action === "fam-tab") { ui.tab = element.dataset.tab; ctx.render(); return true; }
      if (action === "fam-manage") { parentManagement(ctx, person); return true; }
      if (action === "fam-growth-mode") { ui.growthMode = element.dataset.mode; ctx.render(); return true; }
      if (action === "fam-growth-month") { ui.growthMonth = element.dataset.month; ui.growthMode = "month"; ctx.render(); return true; }
      if (action === "fam-growth-period") {
        const [year, month] = (ui.growthMonth || currentDay(ctx).slice(0, 7)).split("-").map(Number), step = Number(element.dataset.step);
        const next = new Date(year + (ui.growthMode === "year" ? step : 0), month - 1 + (ui.growthMode === "year" ? 0 : step), 1);
        ui.growthMonth = ctx.dateKey(next).slice(0, 7); ctx.render(); return true;
      }
      if (action === "fam-add-task") { taskForm(ctx); return true; }
      if (action === "fam-edit-task") { const task = ctx.state.tasks.find(item => item.id === id); if (task) taskForm(ctx, task); return true; }
      if (action === "fam-complete") {
        const task = ctx.state.tasks.find(item => item.id === id);
        if (!task || element.dataset.date !== currentDay(ctx)) return true;
        const owner = member(ctx, task.memberId), day = currentDay(ctx); task.completions ||= []; task.completionPoints ||= {};
        if (task.completions.includes(day)) {
          const credit = task.completionPoints[day] == null ? task.points : task.completionPoints[day];
          if (owner.points < credit) { ctx.toast(t("積分已用於兌換，目前餘額不足以撤銷本次打卡")); return true; }
          task.completions = task.completions.filter(key => key !== day); delete task.completionPoints[day]; owner.points -= credit;
          addLog(ctx, owner, -credit, t("取消完成：{title}", { title: t(task.title) }), "undo"); ctx.toast(t("已取消完成，扣回 {n} 積分", { n: credit }));
        } else {
          task.completions.push(day); task.completionPoints[day] = task.points; owner.points += task.points;
          addLog(ctx, owner, task.points, t("完成：{title}", { title: t(task.title) }), "task"); ctx.toast(t("已完成，獲得 {n} 積分", { n: task.points }));
        }
        persist(ctx); return true;
      }
      if (action === "fam-delete-task") {
        const task = ctx.state.tasks.find(item => item.id === id);
        if (task) ctx.dialog(t("刪除任務"), `<p>${esc(ctx, t("刪除“{title}”？已獲得的積分與積分記錄會保留。", { title: t(task.title) }))}</p><div class="fh-dialog-actions"><button class="btn quiet" data-action="fam-close">${esc(ctx, t("取消"))}</button><button class="btn danger" data-action="fam-confirm-delete-task" data-id="${esc(ctx, id)}">${ctx.icon("trash-2")}${esc(ctx, t("刪除任務"))}</button></div>`);
        return true;
      }
      if (action === "fam-confirm-delete-task") {
        const task = ctx.state.tasks.find(item => item.id === id);
        if (task) { ctx.state.archivedTasks ||= []; ctx.state.archivedTasks.push({ ...task, archived: true }); }
        ctx.state.tasks = ctx.state.tasks.filter(item => item.id !== id); ctx.closeDialog(); persist(ctx); ctx.toast(t("任務已刪除，成長足跡已保留")); return true;
      }
      if (action === "fam-add-reward") { rewardForm(ctx); return true; }
      if (action === "fam-redeem") {
        const reward = ctx.state.rewards.find(item => item.id === id);
        if (!reward || reward.redeemed) return true;
        const owner = member(ctx, reward.memberId);
        if (owner.points < reward.cost) { ctx.toast(t("積分還差 {n}", { n: reward.cost - owner.points })); return true; }
        ctx.dialog(t("兌換獎勵"), `<p>${esc(ctx, t("使用 {n} 積分兌換“{title}”。", { n: reward.cost, title: t(reward.title) }))}</p><p class="muted">${esc(ctx, t("兌換後剩餘 {n} 積分", { n: owner.points - reward.cost }))}</p><div class="fh-dialog-actions"><button class="btn quiet" data-action="fam-close">${esc(ctx, t("取消"))}</button><button class="btn primary" data-action="fam-confirm-redeem" data-id="${esc(ctx, id)}">${ctx.icon("gift")}${esc(ctx, t("確認兌換"))}</button></div>`); return true;
      }
      if (action === "fam-confirm-redeem") {
        const reward = ctx.state.rewards.find(item => item.id === id);
        if (!reward || reward.redeemed) return true;
        const owner = member(ctx, reward.memberId);
        if (owner.points < reward.cost) { ctx.closeDialog(); ctx.toast(t("積分不足，未兌換獎勵")); return true; }
        reward.redeemed = true; reward.redeemedAt = new Date().toISOString(); owner.points -= reward.cost;
        addLog(ctx, owner, -reward.cost, t("兌換：{title}", { title: t(reward.title) }), "reward"); ctx.closeDialog(); persist(ctx); ctx.toast(t("獎勵已兌換")); return true;
      }
      if (action === "fam-delete-reward") {
        const reward = ctx.state.rewards.find(item => item.id === id);
        if (reward && !reward.redeemed) ctx.dialog(t("移除獎勵"), `<p>${esc(ctx, t("移除“{title}”？不會扣除積分。", { title: t(reward.title) }))}</p><div class="fh-dialog-actions"><button class="btn quiet" data-action="fam-close">${esc(ctx, t("取消"))}</button><button class="btn danger" data-action="fam-confirm-delete-reward" data-id="${esc(ctx, id)}">${esc(ctx, t("移除"))}</button></div>`); return true;
      }
      if (action === "fam-confirm-delete-reward") { ctx.state.rewards = ctx.state.rewards.filter(item => item.id !== id || item.redeemed); ctx.closeDialog(); persist(ctx); ctx.toast(t("獎勵已移除")); return true; }
      if (action === "fam-edit-diet") { ctx.dialog(t("編輯飲食資訊"), `<form id="fam-diet-form" data-member="${esc(ctx, person.id)}"><label class="field">${esc(ctx, t("過敏與忌口"))}<textarea name="allergy" rows="3" maxlength="200" placeholder="${esc(ctx, t("例如：花生過敏、不吃香菜"))}">${esc(ctx, person.allergy ? t(person.allergy) : "")}</textarea></label><label class="field">${esc(ctx, t("飲食偏好"))}<textarea name="preference" rows="3" maxlength="200" placeholder="${esc(ctx, t("例如：清淡、喜歡蔬菜"))}">${esc(ctx, person.preference ? t(person.preference) : "")}</textarea></label>${formFooter(ctx)}</form>`); return true; }
      if (action === "fam-recipes") { ctx.navigate("make", { screen: "recipes" }); return true; }
      if (action === "fam-schedule") { ctx.navigate("calendar", { member: person.id, view: "day" }); return true; }
      return false;
    },
    submit(form, ctx) {
      const data = new FormData(form);
      if (form.id === "fam-task-form") {
        const title = String(data.get("title") || "").trim(), points = Number(data.get("points"));
        if (!title || title.length > 40 || !Number.isInteger(points) || points < 1 || points > 100) { fieldError(form, t("請填寫任務名稱，積分須為 1 至 100 的整數。")); return true; }
        const task = ctx.state.tasks.find(item => item.id === form.dataset.id);
        if (task) {
          task.completionPoints ||= {}; (task.completions || []).forEach(day => { if (task.completionPoints[day] == null) task.completionPoints[day] = task.points; });
          task.title = title; task.points = points;
        } else ctx.state.tasks.push({ id: uid("task"), title, points, memberId: member(ctx, data.get("memberId")).id, completions: [], completionPoints: {} });
        ctx.closeDialog(); persist(ctx); ctx.toast(task ? t("任務已更新") : t("任務已新增")); return true;
      }
      if (form.id === "fam-reward-form") {
        const title = String(data.get("title") || "").trim(), cost = Number(data.get("cost"));
        if (!title || title.length > 40 || !Number.isInteger(cost) || cost < 1 || cost > 10000) { fieldError(form, t("請填寫獎勵名稱，積分須為 1 至 10000 的整數。")); return true; }
        const owner = member(ctx, data.get("memberId"));
        ctx.state.rewards.push({ id: uid("reward"), title, memberId: owner.id, cost, redeemed: false });
        ctx.state.family.member = owner.id; ctx.state.family.tab = "rewards";
        ctx.closeDialog(); persist(ctx); ctx.toast(t("獎勵目標已建立")); return true;
      }
      if (form.id === "fam-diet-form") {
        const person = member(ctx, form.dataset.member);
        person.allergy = String(data.get("allergy") || "").trim().slice(0, 200); person.preference = String(data.get("preference") || "").trim().slice(0, 200);
        ctx.closeDialog(); persist(ctx); ctx.toast(t("飲食資訊已更新")); return true;
      }
      return false;
    },
    change(target, ctx) {
      if (target.dataset.fhMember === "family") { ctx.state.family.member = target.value; ctx.render(); return true; }
      return false;
    }
  };

  function healthEstimate(profile) {
    if (!profile || !profile.height || !profile.weight || profile.age < 18 || profile.age > 100) return null;
    const bmi = profile.weight / Math.pow(profile.height / 100, 2);
    const bmr = Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age + (profile.sex === "female" ? -161 : 5));
    const maintenance = Math.round(bmr * profile.activity);
    const target = Math.max(profile.sex === "female" ? 1200 : 1500, maintenance + (profile.goal === "lose" ? -300 : profile.goal === "gain" ? 250 : 0));
    return { bmi, bmr, maintenance, target, label: bmi < 18.5 ? t("偏低") : bmi < 25 ? t("正常範圍") : bmi < 30 ? t("偏高") : t("較高"), marker: Math.max(1, Math.min(99, (bmi - 12) / 28 * 100)) };
  }
  function syncHealthGoal(form) {
    const age = Number(form.elements.namedItem("age").value);
    const goal = form.elements.namedItem("goal");
    const adult = Number.isInteger(age) && age >= 18 && age <= 100;
    const mode = adult ? "adult" : "growth";
    if (form.dataset.goalMode !== mode) {
      const value = adult && goalNames[goal.value] ? goal.value : "maintain";
      goal.innerHTML = adult
        ? Object.entries(goalNames).map(([key, title]) => `<option value="${key}">${t(title)}</option>`).join("")
        : `<option value="maintain">${t("成長記錄")}</option>`;
      goal.value = value;
      goal.disabled = !adult;
      form.dataset.goalMode = mode;
    }
    form.querySelector("#healthAgeNote").textContent = age >= 1 && age <= 100
      ? t("未滿 18 歲僅記錄成長資料，不計算成人 BMI 與熱量目標。")
      : t("請先填寫 1 至 100 歲的有效年齡；未滿 18 歲僅記錄成長資料。");
  }
  function healthForm(ctx, person) {
    const p = person.health || {};
    const dialog = ctx.dialog(t("編輯 {name} 的健康資料", { name: person.name }), `<form id="health-profile-form" data-member="${esc(ctx, person.id)}"><div class="form-grid"><label class="field">${esc(ctx, t("身高 · cm"))}<input name="height" type="number" min="50" max="250" step="0.1" value="${p.height || ""}" required></label><label class="field">${esc(ctx, t("體重 · kg"))}<input name="weight" type="number" min="5" max="300" step="0.1" value="${p.weight || ""}" required></label><label class="field">${esc(ctx, t("年齡 · 歲"))}<input name="age" type="number" min="1" max="100" step="1" value="${p.age || ""}" required></label><label class="field">${esc(ctx, t("生理性別"))}<select name="sex"><option value="male" ${p.sex !== "female" ? "selected" : ""}>${esc(ctx, t("男"))}</option><option value="female" ${p.sex === "female" ? "selected" : ""}>${esc(ctx, t("女"))}</option></select></label><label class="field">${esc(ctx, t("活動程度"))}<select name="activity">${Object.entries(activityNames).map(([value, title]) => `<option value="${value}" ${Number(value) === Number(p.activity || 1.4) ? "selected" : ""}>${esc(ctx, t(title))}</option>`).join("")}</select></label><label class="field">${esc(ctx, t("健康目標"))}<select name="goal" aria-describedby="healthAgeNote">${Object.entries(goalNames).map(([value, title]) => `<option value="${value}" ${(p.goal || "maintain") === value ? "selected" : ""}>${esc(ctx, t(title))}</option>`).join("")}</select></label></div><p id="healthAgeNote" class="muted fh-form-note" aria-live="polite">${esc(ctx, t("未滿 18 歲僅記錄成長資料，不計算成人 BMI 與熱量目標。"))}</p>${formFooter(ctx, t("儲存"), "health")}</form>`);
    const form = dialog?.querySelector("#health-profile-form");
    if (form) {
      syncHealthGoal(form);
      form.addEventListener("input", event => { if (event.target.name === "age") syncHealthGoal(form); });
    }
  }
  function renderFoodSuggestions(ctx, person) {
    const profile = person.health, child = profile.age < 18;
    const allergy = String(person.allergy || "");
    const vegetarian = /素|vegetarian|vegetarisch|vegan/i.test(String(person.preference || ""));
    const avoidsSoy = /豆|soy|soja|tofu/i.test(allergy);
    const avoidsPoultry = /雞|鸡|禽|肉|chicken|meat|poultry|huhn|hähnchen|fleisch|geflügel|pollo|carne|ave/i.test(allergy);
    const protein = !avoidsSoy && vegetarian ? "板豆腐" : !avoidsPoultry && !vegetarian ? "雞胸肉" : !avoidsSoy ? "板豆腐" : "合適的蛋白質食物";
    const vegetables = /青花菜|花椰菜|西蘭花|西兰花|broccoli|brokkoli|brócoli/i.test(allergy) ? "合適的時令蔬菜" : "青花菜";
    const grain = /米|稻|rice|reis|arroz/i.test(allergy) ? "合適的全穀主食" : "糙米飯";
    const foods = [
      { name: vegetables, group: "蔬菜", amount: child ? "依年齡調整" : "約 1 碗" },
      { name: protein, group: "蛋白質", amount: child ? "依年齡調整" : "約 1 掌心" },
      { name: grain, group: "全穀主食", amount: child ? "依成長需求" : profile.goal === "lose" ? "約 1/2 碗" : profile.goal === "gain" ? "約 1.5 碗" : "約 1 碗" }
    ];
    return `<section class="fh-food-suggestions"><div class="section-heading"><h3>${esc(ctx, t("餐盤搭配"))}</h3><span class="muted">${esc(ctx, child ? t("成長飲食參考") : t("每餐份量參考"))}</span></div><dl>${foods.map(food => `<div><dt><small>${esc(ctx, t(food.group))}</small>${esc(ctx, t(food.name))}</dt><dd>${esc(ctx, t(food.amount))}</dd></div>`).join("")}</dl></section>`;
  }
  function renderHealthProfile(ctx, person) {
    const p = person.health;
    if (!p || !p.height || !p.weight) return `<div class="empty-state">${ctx.icon("heart-pulse")}<h3>${esc(ctx, t("新增 {name} 的健康資料", { name: person.name }))}</h3><button class="btn primary" data-action="health-edit">${ctx.icon("plus")}${esc(ctx, t("新增資料"))}</button></div>`;
    const estimate = healthEstimate(p), records = (p.records || []).slice(-7);
    return `<div class="fh-health-layout"><section class="fh-profile-basics"><header><h2>${esc(ctx, t("基本資料"))}</h2><span class="fh-saved">${esc(ctx, t("已儲存"))}</span></header><dl class="fh-health-basics"><div><dt>${esc(ctx, t("身高"))}</dt><dd>${p.height}<small> cm</small></dd></div><div><dt>${esc(ctx, t("體重"))}</dt><dd>${p.weight}<small> kg</small></dd></div><div><dt>${esc(ctx, t("年齡"))}</dt><dd>${p.age}<small> ${esc(ctx, t("歲"))}</small></dd></div><div><dt>${esc(ctx, t("性別"))}</dt><dd>${esc(ctx, p.sex === "female" ? t("女性") : t("男性"))}</dd></div><div class="fh-basic-wide"><dt>${esc(ctx, t("健康目標"))}</dt><dd>${esc(ctx, p.age < 18 ? t("成長記錄") : t(goalNames[p.goal] || goalNames.maintain))}</dd></div><div class="fh-basic-wide"><dt>${esc(ctx, t("活動程度"))}</dt><dd class="fh-text-metric">${esc(ctx, t(activityNames[p.activity] || "輕度活動"))}</dd></div></dl><p class="fh-local-label">${ctx.icon("lock-keyhole")}${esc(ctx, t("本次原型資料"))}</p></section><section class="fh-profile-summary"><h2>${esc(ctx, t("健康摘要"))}</h2>
      ${estimate ? `<div class="fh-health-estimates"><div class="fh-summary-highlight"><span>${esc(ctx, t(goalNames[p.goal] || goalNames.maintain))}</span><div><strong>${estimate.bmi.toFixed(1)} <small>BMI</small></strong><b>${esc(ctx, estimate.label)}</b></div><p>${esc(ctx, t("每日目標 {n} kcal", { n: fmt(estimate.target) }))}</p></div><div class="fh-bmi-labels"><span>${esc(ctx, t("偏低"))}</span><span>${esc(ctx, t("正常範圍"))}</span><span>${esc(ctx, t("偏高"))}</span><span>${esc(ctx, t("較高"))}</span></div><div class="fh-bmi-scale" role="img" aria-label="${esc(ctx, t("成人 BMI {bmi}，{label}", { bmi: estimate.bmi.toFixed(1), label: estimate.label }))}"><span></span><span></span><span></span><span></span><i style="left:${estimate.marker}%"></i></div><dl class="fh-calorie-metrics"><div><dt>${esc(ctx, t("基礎代謝"))}</dt><dd>${fmt(estimate.bmr)}</dd><small>${esc(ctx, t("kcal/日"))}</small></div><div><dt>${esc(ctx, t("維持"))}</dt><dd>${fmt(estimate.maintenance)}</dd><small>${esc(ctx, t("kcal/日"))}</small></div><div><dt>${esc(ctx, t("目標"))}</dt><dd>${fmt(estimate.target)}</dd><small>${esc(ctx, t("kcal/日"))}</small></div></dl><p class="muted fh-fine-print">${esc(ctx, t("成人參考區間 18.5-24.9；估算僅供參考，不用於醫療診斷。"))}</p></div>` : `<section class="fh-growth-note">${ctx.icon("heart")}<div><h3>${esc(ctx, t("關注成長，均衡飲食"))}</h3><p>${esc(ctx, t("兒童與青少年的生長情況需結合年齡和生長曲線評估，不套用成人 BMI 與熱量目標。"))}</p></div></section>`}
      ${renderFoodSuggestions(ctx, person)}<h3 class="fh-recipe-title">${esc(ctx, t("料理推薦"))}</h3><section class="fh-food-band"><img src="../lucky-table-style-refresh/recipe-hub/choose.webp" alt="${esc(ctx, t("豆腐、蔬菜與均衡搭配的家庭料理"))}"><div><h3>${esc(ctx, t("均衡家常料理"))}</h3><p class="muted">${esc(ctx, t("蔬菜 · 優質蛋白 · 全穀物"))}</p>${person.allergy ? `<p class="fh-food-allergy">${ctx.icon("shield-alert")}${esc(ctx, t("忌口：{allergy}", { allergy: t(person.allergy) }))}</p>` : ""}<button class="btn quiet" data-action="health-recipes">${esc(ctx, t("查看健康料理"))}${ctx.icon("arrow-right")}</button></div></section>
      ${records.length ? `<section class="fh-weight-history"><div class="section-heading"><h3>${esc(ctx, t("最近體重記錄"))}</h3><span class="muted">kg</span></div><div class="fh-weight-bars">${records.map(record => `<div><b>${record.weight}</b><span style="height:${Math.max(8, Number(record.weight) / Math.max(...records.map(item => Number(item.weight))) * 64)}px"></span><small>${esc(ctx, record.date.slice(5).replace("-", "/"))}</small></div>`).join("")}</div></section>` : ""}</section></div>`;
  }
  function renderHealthFamily(ctx) {
    const connected = ctx.state.members.filter(person => ctx.state.health.wearables[person.id]);
    const selected = member(ctx, ctx.state.health.member), selectedData = ctx.state.health.wearables[selected.id];
    return `<div class="fh-health-family-scroll"><section class="fh-wearable-bar"><div class="fh-wearable-name">${ctx.icon("watch")}<div><strong>${esc(ctx, t("手環"))}</strong><span>${esc(ctx, selectedData ? t("示範設備已連線") : t("未連線"))}</span></div></div><dl>${[[t("電量"), selectedData ? "86%" : "--"], [t("步數"), selectedData ? fmt(selectedData.steps) : "--"], [t("心率"), selectedData?.heartRate || "--"], [t("睡眠"), "--"], [t("血氧"), "--"], ["HRV", "--"]].map(([title, value]) => `<div><dt>${esc(ctx, title)}</dt><dd>${value}</dd></div>`).join("")}</dl><div class="fh-wearable-controls"><label>${esc(ctx, t("資料成員"))}<select data-fh-member="health">${memberOptions(ctx, selected.id)}</select></label><button class="btn quiet" data-action="health-wearable">${ctx.icon("link")}${esc(ctx, t("綁定手環"))}</button><label class="fh-auto-connect"><input type="checkbox" data-fh-auto-connect ${ctx.state.health.autoConnect !== false ? "checked" : ""}>${esc(ctx, t("自動連接"))}</label></div></section><section class="fh-activity-overview">${ctx.icon("watch")}<div><h2>${esc(ctx, t("家庭活動總覽"))}</h2><p class="muted">${esc(ctx, connected.length ? t("示範設備 · 範例活動數據") : t("家庭成員已就緒，等待手環資料"))}</p></div><dl><div><dt>${esc(ctx, t("家庭成員"))}</dt><dd>${ctx.state.members.length}</dd></div><div><dt>${esc(ctx, t("已同步手環"))}</dt><dd>${connected.length}</dd></div></dl></section><div class="fh-activity-list">${ctx.state.members.map(person => { const data = ctx.state.health.wearables[person.id]; return `<article class="fh-activity-member"><header><span class="fh-avatar" style="--member-color:${esc(ctx, person.color)}">${esc(ctx, person.initial || person.name.slice(0, 1))}</span><div><h3>${esc(ctx, person.name)}</h3><small class="muted">${esc(ctx, person.role ? t(person.role) : t("家庭成員"))}</small></div><button class="btn quiet fh-device-status" data-action="${data ? "health-detail" : "health-wearable"}" data-member="${esc(ctx, person.id)}">${esc(ctx, data ? t("範例活動數據") : t("等待手環資料"))}</button><button class="icon-btn" data-action="health-detail" data-member="${esc(ctx, person.id)}" title="${esc(ctx, t("查看個人健康"))}" aria-label="${esc(ctx, t("查看{name}的健康資料", { name: person.name }))}">${ctx.icon("chevron-right")}</button></header><div class="fh-activity-body"><div class="fh-step-ring" style="--step-progress:${data ? Math.min(100, data.steps / 8000 * 100) : 0}%"><div><strong>${data ? fmt(data.steps) : "--"}</strong><span>${esc(ctx, t("步"))}</span></div></div><dl class="fh-activity-details"><div><dt>${ctx.icon("heart")}${esc(ctx, t("心率"))}</dt><dd>${data?.heartRate || "--"}<small> bpm</small></dd></div><div><dt>${ctx.icon("timer")}${esc(ctx, t("活動時間"))}</dt><dd>${data?.minutes || "--"}<small>${data ? ` ${esc(ctx, t("分鐘"))}` : ""}</small></dd></div><div><dt>${ctx.icon("footprints")}${esc(ctx, t("距離"))}</dt><dd>${data?.distance || "--"}<small> km</small></dd></div><div><dt>${ctx.icon("flame")}${esc(ctx, t("活動熱量"))}</dt><dd>${data?.calories || "--"}<small> kcal</small></dd></div></dl></div><footer><span>${esc(ctx, t("每日步數目標"))}</span><b>${esc(ctx, t("{steps} / 8,000 步", { steps: data ? fmt(data.steps) : "--" }))}</b></footer>${data ? `<button class="btn quiet fh-disconnect" data-action="health-disconnect" data-member="${esc(ctx, person.id)}">${esc(ctx, t("中斷示範設備"))}</button>` : ""}</article>`; }).join("")}</div></div>`;
  }
  function wearableDialog(ctx, personId) {
    ctx.dialog(t("連線穿戴設備"), `<form id="health-wearable-form"><p class="fh-demo-note">${esc(ctx, t("原型示範：連線後展示固定的範例活動數據，不會訪問真實設備。"))}</p><label class="field">${esc(ctx, t("所屬成員"))}<select name="memberId">${memberOptions(ctx, personId || ctx.state.health.member)}</select></label><div class="fh-device-option">${ctx.icon("watch")}<div><strong>${esc(ctx, t("Lucky Band · 示範設備"))}</strong><span class="muted">${esc(ctx, t("步數、活動時長、心率"))}</span></div><span class="badge">${esc(ctx, t("示範"))}</span></div>${formFooter(ctx, t("連線示範設備"), "health")}</form>`);
  }
  modules.health = {
    render(ctx) {
      ctx.state.health ||= { member: ctx.state.members[0].id, tab: "profile" };
      ctx.state.health.wearables ||= {};
      const ui = ctx.state.health, person = member(ctx, ui.member); ui.member = person.id;
      return `<section class="fh-page fh-health-page"><header class="fh-page-heading fh-health-heading"><h1>${esc(ctx, t("家庭健康"))}</h1><div class="fh-heading-actions"><span class="fh-local-label">${ctx.icon("lock-keyhole")}${esc(ctx, t("僅存本機"))}</span><button class="btn primary" data-action="${ui.tab === "family" ? "health-wearable" : "health-edit"}">${ctx.icon(ui.tab === "family" ? "watch" : "pencil")}${esc(ctx, ui.tab === "family" ? t("連線手環") : t("編輯資料"))}</button></div></header><div class="fh-health-toolbar"><nav class="fh-tabs" aria-label="${esc(ctx, t("健康視圖"))}">${[["profile", "個人健康", "user"], ["family", "家庭活動", "users"]].map(([tab, title, glyph]) => `<button class="${ui.tab === tab ? "active" : ""}" data-action="health-tab" data-tab="${tab}" aria-pressed="${ui.tab === tab}">${ctx.icon(glyph)}${esc(ctx, t(title))}</button>`).join("")}</nav>${ui.tab !== "family" ? `<label class="fh-health-member-select"><span>${esc(ctx, t("家庭成員"))}</span><select data-fh-member="health" aria-label="${esc(ctx, t("選擇健康資料成員"))}">${memberOptions(ctx, person.id)}</select></label>` : ""}</div>${ui.tab === "family" ? renderHealthFamily(ctx) : renderHealthProfile(ctx, person)}</section>`;
    },
    click(action, element, ctx) {
      const ui = ctx.state.health;
      if (action === "health-close") { ctx.closeDialog(); return true; }
      if (action === "health-member") { ui.member = element.dataset.member; ctx.render(); return true; }
      if (action === "health-tab") { ui.tab = element.dataset.tab; ctx.render(); return true; }
      if (action === "health-edit") { healthForm(ctx, member(ctx, ui.member)); return true; }
      if (action === "health-recipes") { ctx.navigate("make", { screen: "recipes", filter: "healthy" }); return true; }
      if (action === "health-detail") { ui.member = element.dataset.member; ui.tab = "profile"; ctx.render(); return true; }
      if (action === "health-wearable") { wearableDialog(ctx, element.dataset.member); return true; }
      if (action === "health-disconnect") { delete ui.wearables[element.dataset.member]; persist(ctx); ctx.toast(t("示範設備已中斷連線")); return true; }
      return false;
    },
    submit(form, ctx) {
      const data = new FormData(form);
      if (form.id === "health-profile-form") {
        const person = member(ctx, form.dataset.member), height = Number(data.get("height")), weight = Number(data.get("weight")), age = Number(data.get("age"));
        const sex = String(data.get("sex")), activity = Number(data.get("activity")), goal = age < 18 ? "maintain" : String(data.get("goal"));
        if (!Number.isFinite(height) || height < 50 || height > 250 || !Number.isFinite(weight) || weight < 5 || weight > 300 || !Number.isInteger(age) || age < 1 || age > 100 || !["male", "female"].includes(sex) || !activityNames[activity] || !goalNames[goal]) { fieldError(form, t("請檢查資料：身高 50-250 cm，體重 5-300 kg，年齡 1-100 歲。")); return true; }
        const records = person.health && person.health.records ? person.health.records.slice() : [];
        const prior = records.find(record => record.date === currentDay(ctx));
        if (prior) prior.weight = weight; else records.push({ date: currentDay(ctx), weight });
        person.health = { height, weight, age, sex, activity, goal, records };
        ctx.closeDialog(); persist(ctx); ctx.toast(t("健康資料已更新")); return true;
      }
      if (form.id === "health-wearable-form") {
        const person = member(ctx, data.get("memberId"));
        const index = ctx.state.members.findIndex(item => item.id === person.id);
        const samples = [{ steps: 6429, heartRate: 76, minutes: 48, distance: 4.6, calories: 318 }, { steps: 8250, heartRate: 82, minutes: 65, distance: 5.4, calories: 372 }, { steps: 4310, heartRate: 72, minutes: 32, distance: 3.1, calories: 206 }];
        ctx.state.health.wearables[person.id] = { ...samples[index % samples.length] };
        ctx.state.health.tab = "family"; ctx.closeDialog(); persist(ctx); ctx.toast(t("已連線示範設備，顯示範例數據")); return true;
      }
      return false;
    },
    change(target, ctx) {
      if (target.dataset.fhMember === "health") { ctx.state.health.member = target.value; ctx.render(); return true; }
      if (target.hasAttribute("data-fh-auto-connect")) { ctx.state.health.autoConnect = target.checked; ctx.toast(target.checked ? t("已開啟示範設備自動連接") : t("已關閉示範設備自動連接")); return true; }
      if (target.name === "age" && target.form?.id === "health-profile-form") { syncHealthGoal(target.form); return true; }
      return false;
    }
  };
}());
