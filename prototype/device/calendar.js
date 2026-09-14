(function () {
  "use strict";

  const i18n = window.LuckyI18n;
  const t = i18n.t;
  const views = { year: "年", month: "月", week: "週", day: "日" };
  const previousLabels = { year: "上一年", month: "上一月", week: "上一週", day: "上一日" };
  const nextLabels = { year: "下一年", month: "下一月", week: "下一週", day: "下一日" };
  let voiceDraft = null;

  function fromKey(key) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
    return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
  }

  function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function addMonths(date, amount) {
    const next = new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
    const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(date.getDate(), last));
    return next;
  }

  function weekStart(date) {
    return addDays(date, -date.getDay());
  }

  function member(ctx, id) {
    return ctx.state.members.find(item => item.id === id) || { id: "family", name: t("全家"), initial: t("家|family-initial"), color: "#3f8069" };
  }

  function getEvents(ctx, key) {
    return ctx.state.events.filter(event => (!key || event.date === key) && (ctx.state.calendar.member === "all" || event.memberId === ctx.state.calendar.member || event.memberId === "family"))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
  }

  function colorStyle(ctx, id) {
    return `--cal-member:${ctx.escape(member(ctx, id).color)}`;
  }

  function formatDay(date) {
    return i18n.monthDay(date);
  }

  function update(ctx) {
    ctx.emit();
    ctx.render();
  }

  function renderEvent(event, ctx, compact) {
    const owner = member(ctx, event.memberId);
    return `<button class="cal-event${event.done ? " is-done" : ""}${compact ? " is-compact" : ""}" type="button" data-action="cal-detail" data-id="${ctx.escape(event.id)}" style="${colorStyle(ctx, owner.id)}">
      <span class="cal-event-time">${ctx.escape(event.time || t("全天"))}${event.done ? ctx.icon("check") : ""}</span>
      <strong>${ctx.escape(t(event.title))}</strong>
      ${compact ? "" : `<span class="cal-event-owner">${ctx.escape(owner.name)}${event.location ? ` · ${ctx.escape(t(event.location))}` : ""}</span>`}
    </button>`;
  }

  function renderMonth(ctx, date) {
    const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
    const start = weekStart(first);
    const today = ctx.dateKey(ctx.today);
    const rows = Math.ceil((first.getDay() + new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()) / 7);
    const visibleCount = rows > 5 ? 1 : 2;
    return `<div class="cal-month-scroll"><div class="cal-month" role="grid" style="--cal-weeks:${rows}" aria-label="${ctx.escape(i18n.monthYear(date))}">
      ${[0, 1, 2, 3, 4, 5, 6].map(day => `<div class="cal-weekday" role="columnheader">${ctx.escape(i18n.weekday(day, "short"))}</div>`).join("")}
      ${Array.from({ length: rows * 7 }, (_, index) => {
        const day = addDays(start, index);
        const key = ctx.dateKey(day);
        const events = getEvents(ctx, key);
        return `<div class="cal-month-cell${day.getMonth() !== date.getMonth() ? " is-outside" : ""}${key === today ? " is-today" : ""}" role="gridcell">
          <button type="button" class="cal-date-number" data-action="cal-date" data-date="${key}" aria-label="${ctx.escape(t("{date}，{n}個行程", { date: formatDay(day), n: events.length }))}"${key === today ? ' aria-current="date"' : ""}>${day.getDate()}</button>
          <div class="cal-cell-events">${events.slice(0, visibleCount).map(event => renderEvent(event, ctx, true)).join("")}</div>
          ${events.length > visibleCount ? `<button type="button" class="cal-more" data-action="cal-date" data-date="${key}">${ctx.escape(t("還有 {n} 個行程", { n: events.length - visibleCount }))}</button>` : ""}
        </div>`;
      }).join("")}
    </div></div>`;
  }

  function miniMonth(ctx, date, month, compact = false) {
      const first = new Date(date.getFullYear(), month, 1, 12);
      const count = new Date(date.getFullYear(), month + 1, 0).getDate();
      const offset = first.getDay();
      return `<section class="cal-mini-month${month === ctx.today.getMonth() && date.getFullYear() === ctx.today.getFullYear() ? " is-current" : ""}"><h2>${compact ? `<button class="icon-btn" type="button" data-action="cal-mini-prev" title="${ctx.escape(t("上一個月"))}" aria-label="${ctx.escape(t("上一個月"))}">${ctx.icon("chevron-left")}</button>` : ""}<button type="button" data-action="cal-month" data-date="${ctx.dateKey(first)}">${ctx.escape(compact ? i18n.monthYear(first) : i18n.monthName(month))}</button>${compact ? `<button class="icon-btn" type="button" data-action="cal-mini-next" title="${ctx.escape(t("下一個月"))}" aria-label="${ctx.escape(t("下一個月"))}">${ctx.icon("chevron-right")}</button>` : ""}</h2><div class="cal-mini-grid">
        ${[0, 1, 2, 3, 4, 5, 6].map(day => `<span class="cal-mini-weekday">${ctx.escape(i18n.weekday(day, "short"))}</span>`).join("")}
        ${Array.from({ length: offset }, () => '<span aria-hidden="true"></span>').join("")}
        ${Array.from({ length: count }, (_, index) => {
          const day = new Date(date.getFullYear(), month, index + 1, 12);
          const key = ctx.dateKey(day);
          const events = getEvents(ctx, key);
          return `<button type="button" class="cal-mini-day${key === ctx.dateKey(ctx.today) ? " is-today" : ""}${events.length ? " has-events" : ""}" data-action="cal-date" data-date="${key}" aria-label="${ctx.escape(t("{date}，{n}個行程", { date: formatDay(day), n: events.length }))}">${index + 1}</button>`;
        }).join("")}
      </div></section>`;
  }

  function renderYear(ctx, date) {
    return `<div class="cal-year">${Array.from({ length: 12 }, (_, month) => miniMonth(ctx, date, month)).join("")}</div>`;
  }

  function periodEvents(ctx, date, unfiltered = false) {
    const view = ctx.state.calendar.view;
    const start = view === "week" ? ctx.dateKey(weekStart(date)) : view === "year" ? `${date.getFullYear()}-01-01` : view === "month" ? ctx.dateKey(new Date(date.getFullYear(), date.getMonth(), 1)) : ctx.dateKey(date);
    const end = view === "week" ? ctx.dateKey(addDays(weekStart(date), 6)) : view === "year" ? `${date.getFullYear()}-12-31` : view === "month" ? ctx.dateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)) : start;
    const events = unfiltered ? ctx.state.events : getEvents(ctx);
    return events.filter(event => event.date >= start && event.date <= end);
  }

  function renderMembers(ctx, date, horizontal = false) {
    const cal = ctx.state.calendar;
    const events = periodEvents(ctx, date, true);
    const people = [{ id: "all", name: t("全家"), color: "#2c7864", initial: "" }, ...ctx.state.members];
    return `<div class="cal-member-bar${horizontal ? " is-horizontal" : ""}" aria-label="${ctx.escape(t("篩選家庭成員"))}"><span class="cal-member-heading">${ctx.escape(horizontal ? t("顯示：") : t("家庭成員"))}</span>${people.map(person => {
      const count = person.id === "all" ? events.length : events.filter(event => event.memberId === person.id || event.memberId === "family").length;
      return `<button type="button" class="cal-person${cal.member === person.id ? " is-active" : ""}" data-action="cal-member" data-member="${ctx.escape(person.id)}" aria-pressed="${cal.member === person.id}" style="--cal-member:${ctx.escape(person.color)}"><span class="cal-person-avatar">${person.id === "all" ? ctx.icon("users") : ctx.escape(person.initial || person.initials || person.name.slice(0, 1))}</span><span class="cal-person-name"><strong>${ctx.escape(person.name)}</strong>${horizontal ? "" : `<small>${ctx.escape(t("{n} 個行程", { n: count }))}</small>`}</span>${cal.member === person.id ? ctx.icon("check") : ""}</button>`;
    }).join("")}</div>`;
  }

  function renderUpcoming(ctx, date) {
    const upcoming = getEvents(ctx).filter(event => event.date >= ctx.dateKey(date)).slice(0, 3);
    return `<div class="cal-upcoming"><h2>${ctx.escape(t("接下來"))}</h2>${upcoming.length ? upcoming.map(event => `<button type="button" data-action="cal-detail" data-id="${ctx.escape(event.id)}"><time>${ctx.escape(event.time || t("全天"))}</time><span><strong>${ctx.escape(t(event.title))}</strong><small>${ctx.escape(event.date.slice(5).replace("-", " / "))} · ${ctx.escape(member(ctx, event.memberId).name)}</small></span></button>`).join("") : `<p class="cal-no-event">${ctx.escape(t("暫無近期安排"))}</p>`}</div>`;
  }

  function renderWeek(ctx, date) {
    const start = weekStart(date);
    const eventsInWeek = periodEvents(ctx, date);
    const total = eventsInWeek.length;
    const activeDays = new Set(eventsInWeek.map(event => event.date)).size;
    return `<div class="cal-week-workspace"><div class="cal-week-scroll"><div class="cal-week">${Array.from({ length: 7 }, (_, index) => {
      const day = addDays(start, index);
      const key = ctx.dateKey(day);
      const events = getEvents(ctx, key);
      const today = key === ctx.dateKey(ctx.today);
      return `<section class="cal-week-column${today ? " is-today" : ""}">
        <button class="cal-week-date" type="button" data-action="cal-date" data-date="${key}" aria-label="${ctx.escape(t("查看{date}行程", { date: formatDay(day) }))}"${today ? ' aria-current="date"' : ""}><span>${ctx.escape(i18n.weekday(index))}</span><strong>${day.getDate()}</strong></button>
        <div class="cal-week-events">${events.map(event => renderEvent(event, ctx, false)).join("")}</div>
        <button class="cal-add-day" type="button" data-action="cal-add" data-date="${key}" title="${ctx.escape(t("新增{date}行程", { date: formatDay(day) }))}" aria-label="${ctx.escape(t("新增{date}行程", { date: formatDay(day) }))}">${ctx.icon("plus")}</button>
      </section>`;
    }).join("")}</div></div><section class="cal-week-summary"><div class="cal-summary-metrics"><h2>${ctx.escape(t("本週摘要"))}</h2><div><span><strong>${total}</strong><small>${ctx.escape(t("件家庭行程"))}</small></span><span><strong>${ctx.escape(t("{n} 天", { n: activeDays }))}</strong><small>${ctx.escape(t("有安排"))}</small></span><span><strong>${ctx.escape(t("{n} 天", { n: 7 - activeDays }))}</strong><small>${ctx.escape(t("可休息"))}</small></span></div></div><div class="cal-summary-members"><h2>${ctx.escape(t("家庭成員"))} <small>${ctx.escape(t("目前顯示{name}行程", { name: ctx.state.calendar.member === "all" ? t("全家") : member(ctx, ctx.state.calendar.member).name }))}</small></h2><div>${ctx.state.members.map(person => `<button type="button" data-action="cal-member" data-member="${ctx.escape(person.id)}" style="${colorStyle(ctx, person.id)}"><span class="cal-member-avatar">${ctx.escape(person.initial || person.name.slice(0, 1))}</span><span>${ctx.escape(person.name)}</span></button>`).join("")}</div></div></section></div>`;
  }

  function renderDay(ctx, date) {
    const key = ctx.dateKey(date);
    const events = getEvents(ctx, key);
    const timeline = ctx.state.calendar.dayMode === "timeline";
    const eventRow = event => {
        const owner = member(ctx, event.memberId);
        const doneLabel = event.done ? t("標記未完成") : t("標記完成");
        return `<article class="cal-agenda-row${event.done ? " is-done" : ""}" data-id="${ctx.escape(event.id)}" style="${colorStyle(ctx, owner.id)}">
          <button class="cal-agenda-time" type="button" data-action="cal-detail" data-id="${ctx.escape(event.id)}" aria-label="${ctx.escape(t("查看{title}", { title: t(event.title) }))}"><strong>${ctx.escape(event.time || t("全天"))}</strong>${event.endTime ? `<span>${ctx.escape(event.endTime)}</span>` : ""}</button>
          <button class="cal-agenda-main" type="button" data-action="cal-detail" data-id="${ctx.escape(event.id)}"><strong>${ctx.escape(t(event.title))}</strong><span><i class="cal-dot" style="${colorStyle(ctx, owner.id)}"></i>${ctx.escape(owner.name)}${event.location ? ` <span class="cal-agenda-location">${ctx.icon("map-pin")}${ctx.escape(t(event.location))}</span>` : ""}${event.source === "voice" ? `<span class="cal-source">${ctx.escape(t("語音"))}</span>` : ""}</span>${event.note ? `<p>${ctx.escape(event.note)}</p>` : ""}</button>
          <button class="icon-btn cal-check${event.done ? " is-checked" : ""}" type="button" data-action="cal-toggle-done" data-id="${ctx.escape(event.id)}" aria-label="${ctx.escape(doneLabel)}：${ctx.escape(t(event.title))}" title="${ctx.escape(doneLabel)}" aria-pressed="${Boolean(event.done)}">${ctx.icon("check")}</button>
        </article>`;
      };
    setTimeout(() => {
      const scroller = document.querySelector(".cal-day-timeline");
      if (scroller?.dataset.date !== key) return;
      if (events.some(event => !event.time)) { scroller.scrollTop = 0; return; }
      const first = events.find(event => event.time);
      const slot = scroller.querySelector(`[data-hour="${first ? Number(first.time.slice(0, 2)) : 7}"]`);
      if (slot) scroller.scrollTop = slot.offsetTop - 20;
    }, 0);
    const timelineContent = `<div class="cal-day-timeline" data-date="${key}">${events.some(event => !event.time) ? `<section class="cal-hour-row"><span class="cal-hour-label">${ctx.escape(t("全天"))}</span><div class="cal-hour-events">${events.filter(event => !event.time).map(eventRow).join("")}</div></section>` : ""}${Array.from({ length: 24 }, (_, hour) => `<section class="cal-hour-row" data-hour="${hour}"><span class="cal-hour-label">${String(hour).padStart(2, "0")}:00</span><div class="cal-hour-events">${events.filter(event => event.time && Number(event.time.slice(0, 2)) === hour).map(eventRow).join("")}<button class="cal-hour-add" type="button" data-action="cal-add" data-date="${key}" data-time="${String(hour).padStart(2, "0")}:00" aria-label="${ctx.escape(t("新增{hour}點的行程", { hour }))}" title="${ctx.escape(t("新增{hour}點的行程", { hour }))}">${ctx.icon("plus")}</button></div></section>`).join("")}</div>`;
    const agendaContent = events.length ? `<div class="cal-day-agenda">${events.map(eventRow).join("")}</div>` : `<div class="empty-state cal-day-empty">${ctx.icon("calendar-days")}<h3>${ctx.escape(t("這一天還沒有安排"))}</h3><button class="btn primary" type="button" data-action="cal-add" data-date="${key}">${ctx.icon("plus")}${ctx.escape(t("新增行程"))}</button></div>`;
    return `<div class="cal-day"><div class="cal-day-schedule"><header class="section-heading"><h2>${ctx.escape(key === ctx.dateKey(ctx.today) ? t("今天的安排") : t("當天安排"))}<span>${ctx.escape(t("{n} 件行程 · {done} 件完成", { n: events.length, done: events.filter(event => event.done).length }))}</span></h2><div class="segmented cal-day-modes" role="group" aria-label="${ctx.escape(t("當天安排顯示方式"))}"><button type="button" class="${timeline ? "" : "is-active"}" data-action="cal-day-mode" data-mode="agenda" aria-pressed="${!timeline}">${ctx.icon("list")}${ctx.escape(t("清單"))}</button><button type="button" class="${timeline ? "is-active" : ""}" data-action="cal-day-mode" data-mode="timeline" aria-pressed="${timeline}">${ctx.icon("clock")}${ctx.escape(t("時間軸"))}</button></div></header>${timeline ? timelineContent : agendaContent}</div></div>`;
  }

  function render(ctx) {
    const cal = ctx.state.calendar;
    const date = fromKey(cal.date) || ctx.today;
    const start = weekStart(date);
    const title = cal.view === "year" ? i18n.yearLabel(date.getFullYear()) : cal.view === "week" ? `${formatDay(start)} - ${formatDay(addDays(start, 6))}` : cal.view === "day" ? i18n.dayTitle(date) : i18n.monthYear(date);
    const owner = cal.member === "all" ? t("全家") : member(ctx, cal.member).name;
    return `<section class="calendar-page cal-view-${cal.view}" aria-label="${ctx.escape(t("行事曆"))}"><header class="cal-page-toolbar"><div><h1>${ctx.escape(t("家庭行事曆"))}</h1><span>${ctx.escape(owner)} · ${ctx.escape(t("{n} 個行程", { n: periodEvents(ctx, date).length }))}</span></div><div class="cal-page-actions"><button class="btn quiet cal-sync-button" type="button" data-action="cal-sync" title="${ctx.escape(t("家庭同步（本地演示）"))}">${ctx.icon("cloud")}${ctx.escape(t("同步"))}</button><button class="btn cal-voice-button" type="button" data-action="cal-voice">${ctx.icon("mic")}${ctx.escape(t("語音新增"))}</button><button class="btn primary cal-floating-add" type="button" data-action="cal-add">${ctx.icon("plus")}${ctx.escape(t("新增行程"))}</button></div></header><aside class="cal-sidebar">${renderMembers(ctx, date)}${cal.view === "week" ? `<div class="cal-week-sidebar">${miniMonth(ctx, date, date.getMonth(), true)}${renderUpcoming(ctx, date)}</div>` : renderUpcoming(ctx, date)}<div class="cal-weather">${ctx.icon("cloud-sun")}<div><strong>24°</strong><span>${ctx.escape(t(ctx.state.settings?.city || "台北"))} · ${ctx.escape(t("局部多雲"))}</span></div></div></aside><div class="cal-main"><div class="cal-navigation"><div class="cal-period"><button class="icon-btn cal-period-arrow" type="button" data-action="cal-prev" title="${ctx.escape(t(previousLabels[cal.view]))}" aria-label="${ctx.escape(t(previousLabels[cal.view]))}">${ctx.icon("chevron-left")}</button><button class="icon-btn cal-period-arrow" type="button" data-action="cal-next" title="${ctx.escape(t(nextLabels[cal.view]))}" aria-label="${ctx.escape(t(nextLabels[cal.view]))}">${ctx.icon("chevron-right")}</button><button class="cal-period-title" type="button" data-action="cal-jump" title="${ctx.escape(t("跳轉日期"))}"><strong>${ctx.escape(title)}</strong>${ctx.icon("chevron-down")}</button><button class="btn cal-today" type="button" data-action="cal-today">${ctx.escape(t("今天"))}</button></div><div class="segmented cal-views" role="group" aria-label="${ctx.escape(t("日曆檢視"))}">${Object.entries(views).map(([key, label]) => `<button type="button" class="${cal.view === key ? "is-active" : ""}" data-action="cal-view" data-view="${key}" aria-pressed="${cal.view === key}">${ctx.escape(t(label))}</button>`).join("")}</div></div><div class="cal-content">${cal.view === "year" ? renderYear(ctx, date) : cal.view === "month" ? renderMonth(ctx, date) : cal.view === "day" ? renderDay(ctx, date) : renderWeek(ctx, date)}</div></div></section>`;
  }

  function eventForm(ctx, event, fromVoice) {
    const escape = ctx.escape;
    const item = event || {};
    const date = item.date ?? ctx.state.calendar.date ?? ctx.dateKey(ctx.today);
    const selected = item.memberId || (ctx.state.calendar.member !== "all" ? ctx.state.calendar.member : ctx.state.members[0]?.id);
    const owner = member(ctx, selected);
    const source = fromVoice ? "voice" : item.source || "manual";
    const allDay = item.time === "" && !item.needsTime;
    ctx.dialog(fromVoice ? t("核對語音行程") : item.id ? t("編輯行程") : t("新增行程"), `<form id="cal-event-form" class="cal-form"><input type="hidden" name="id" value="${escape(item.id || "")}"><input type="hidden" name="source" value="${escape(source)}">
      ${fromVoice ? `<div class="cal-voice-context"><span class="badge">${escape(t("語音流程演示"))}</span><p>${escape(voiceDraft?.transcript || "")}</p></div>` : ""}
      <label class="field"><span>${escape(t("行程名稱"))}</span><input name="title" value="${escape(item.title ? t(item.title) : "")}" placeholder="${escape(t("例如：接孩子放學"))}" maxlength="60" required autofocus></label>
      <div class="form-grid"><label class="field"><span>${escape(t("日期"))}</span><input type="date" name="date" value="${escape(date)}" min="1900-01-01" max="2100-12-31" required></label><label class="field"><span>${escape(t("所屬成員"))}</span>${fromVoice ? `<input value="${escape(owner.name)}" readonly><input type="hidden" name="memberId" value="${escape(selected)}">` : `<select name="memberId" required>${ctx.state.members.map(person => `<option value="${escape(person.id)}"${person.id === selected ? " selected" : ""}>${escape(person.name)}</option>`).join("")}<option value="family"${selected === "family" ? " selected" : ""}>${escape(t("全家"))}</option></select>`}</label></div>
      <label class="cal-checkbox"><input type="checkbox" name="allDay" data-cal-all-day${allDay ? " checked" : ""}>${escape(t("全天"))}</label><div class="form-grid cal-time-fields"><label class="field"><span>${escape(t("開始時間"))}${item.needsTime ? escape(t("（待補充）")) : ""}</span><input type="time" name="time" value="${escape(item.time ?? "09:00")}"${allDay ? " disabled" : " required"}></label><label class="field"><span>${escape(t("結束時間（選填）"))}</span><input type="time" name="endTime" value="${escape(item.endTime || "")}"${allDay ? " disabled" : ""}></label></div>
      <label class="field"><span>${escape(t("地點（選填）"))}</span><input name="location" maxlength="100" value="${escape(item.location ? t(item.location) : "")}" placeholder="${escape(t("添加地點"))}"></label><label class="field"><span>${escape(t("備註（選填）"))}</span><textarea name="note" rows="2" maxlength="500" placeholder="${escape(t("添加行程備註"))}">${escape(item.note || "")}</textarea></label>
      <p class="cal-form-error" id="cal-form-error" role="alert"></p><div class="cal-dialog-actions">${fromVoice ? `<button class="btn quiet" type="button" data-action="cal-voice-input">${escape(t("返回修改"))}</button>` : `<button class="btn quiet" type="button" data-action="cal-close">${escape(t("取消"))}</button>`}<button class="btn primary" type="submit">${ctx.icon("check")}${escape(fromVoice ? t("確認加入行事曆") : t("儲存行程"))}</button></div></form>`);
  }

  function detail(ctx, id) {
    const event = ctx.state.events.find(item => item.id === id);
    if (!event) return ctx.toast(t("此行程已不存在"));
    const owner = member(ctx, event.memberId);
    ctx.dialog(t(event.title), `<div class="cal-detail"><span class="member-chip"><i class="cal-dot" style="${colorStyle(ctx, owner.id)}"></i>${ctx.escape(owner.name)}</span><dl><div><dt>${ctx.icon("calendar-days")}${ctx.escape(t("日期"))}</dt><dd>${ctx.escape(event.date)}</dd></div><div><dt>${ctx.icon("clock")}${ctx.escape(t("時間"))}</dt><dd>${ctx.escape(event.time || t("全天"))}${event.endTime ? ` - ${ctx.escape(event.endTime)}` : ""}</dd></div>${event.location ? `<div><dt>${ctx.icon("map-pin")}${ctx.escape(t("地點"))}</dt><dd>${ctx.escape(t(event.location))}</dd></div>` : ""}${event.note ? `<div><dt>${ctx.escape(t("備註"))}</dt><dd>${ctx.escape(event.note)}</dd></div>` : ""}<div><dt>${ctx.escape(t("狀態"))}</dt><dd>${ctx.escape(event.done ? t("已完成") : t("未完成"))}${event.source === "voice" ? ctx.escape(t(" · 語音錄入")) : ""}</dd></div></dl><div class="cal-dialog-actions"><button class="btn danger" type="button" data-action="cal-delete" data-id="${ctx.escape(id)}">${ctx.icon("trash-2")}${ctx.escape(t("刪除"))}</button><button class="btn primary" type="button" data-action="cal-edit" data-id="${ctx.escape(id)}">${ctx.icon("pencil")}${ctx.escape(t("編輯行程"))}</button></div></div>`);
  }

  function voiceMember(ctx) {
    voiceDraft = { memberId: "", transcript: "" };
    ctx.dialog(t("為誰添加行程？"), `<div class="cal-voice-context"><span class="badge">${ctx.escape(t("App 語音流程演示"))}</span><span class="muted">1 / 3</span></div><div class="cal-voice-members">${ctx.state.members.map(person => `<button class="cal-voice-member" type="button" data-action="cal-voice-member" data-member="${ctx.escape(person.id)}"><span class="cal-member-avatar" style="${colorStyle(ctx, person.id)}">${ctx.escape(person.initial || person.name.slice(0, 1))}</span><strong>${ctx.escape(person.name)}</strong>${ctx.icon("chevron-right")}</button>`).join("")}</div>`);
  }

  function voiceInput(ctx) {
    if (!voiceDraft?.memberId) return voiceMember(ctx);
    const person = member(ctx, voiceDraft.memberId);
    ctx.dialog(t("錄入人物行程"), `<form id="cal-voice-form" class="cal-form"><div class="cal-voice-context"><span class="badge">${ctx.escape(t("App 語音流程演示"))}</span><span class="muted">2 / 3</span></div><button class="member-chip" type="button" data-action="cal-voice">${ctx.icon("user")} ${ctx.escape(person.name)} ${ctx.icon("chevron-left")}</button><label class="field"><span>${ctx.escape(t("語音轉寫內容"))}</span><textarea name="transcript" rows="4" maxlength="300" required placeholder="${ctx.escape(t("例如：今天 16:30 帶孩子去籃球訓練"))}">${ctx.escape(voiceDraft.transcript)}</textarea></label><p class="cal-prototype-note">${ctx.escape(t("本地演示，尚未連接語音服務。"))}</p><p class="cal-form-error" id="cal-form-error" role="alert"></p><div class="cal-dialog-actions"><button class="btn quiet" type="button" data-action="cal-voice-example">${ctx.escape(t("填入範例"))}</button><button class="btn primary" type="submit">${ctx.icon("arrow-right")}${ctx.escape(t("核對行程"))}</button></div></form>`);
  }

  const dayAfterWords = /后天|後天|day after tomorrow|übermorgen|pasado mañana/i;
  const tomorrowWords = /明天|tomorrow|morgen|mañana/i;
  const relativeWords = /後天|后天|今天|明天|day after tomorrow|tomorrow|today|übermorgen|morgen|heute|pasado mañana|mañana|hoy/gi;

  function parseVoice(ctx, transcript) {
    const dateMatch = transcript.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    let date = dateMatch ? (fromKey(dateMatch[1]) ? dateMatch[1] : "") : ctx.dateKey(ctx.today);
    if (!dateMatch && dayAfterWords.test(transcript)) date = ctx.dateKey(addDays(ctx.today, 2));
    else if (!dateMatch && tomorrowWords.test(transcript)) date = ctx.dateKey(addDays(ctx.today, 1));
    const clock = transcript.match(/(?:^|\s)(?:(?:a las?|um|at|alle)\s+)?([01]?\d|2[0-3]):([0-5]\d)(?=\s|$)/i);
    const time = clock ? `${clock[1].padStart(2, "0")}:${clock[2]}` : "";
    let title = transcript.replace(dateMatch?.[0] || /$^/, "").replace(clock?.[0] || /$^/, "").replace(relativeWords, "").replace(/\s{2,}/g, " ").trim();
    const person = member(ctx, voiceDraft.memberId);
    if (title.startsWith(person.name)) title = title.slice(person.name.length).trim();
    return { title: title || transcript, date, time, needsTime: !time, memberId: voiceDraft.memberId, note: "", source: "voice" };
  }

  function click(action, element, ctx) {
    const cal = ctx.state.calendar;
    const date = fromKey(cal.date) || ctx.today;
    const data = element.dataset;
    if (action === "cal-close") return ctx.closeDialog();
    if (action === "cal-sync") return ctx.dialog(t("家庭同步"), `<div class="cal-voice-context"><span class="badge">${ctx.escape(t("本地演示"))}</span></div><p class="cal-sync-count">${t("本機共有 <strong>{n}</strong> 個家庭行程", { n: ctx.state.events.length })}</p><p class="muted cal-sync-note">${ctx.escape(t("尚未連接家庭同步服務，本次確認僅儲存本機資料。"))}</p><div class="cal-dialog-actions"><button class="btn quiet" type="button" data-action="cal-close">${ctx.escape(t("取消"))}</button><button class="btn primary" type="button" data-action="cal-sync-confirm">${ctx.icon("check")}${ctx.escape(t("確認本機資料"))}</button></div>`);
    if (action === "cal-sync-confirm") { ctx.emit(); ctx.closeDialog(); return ctx.toast(t("已確認本次頁面行程，未傳送至伺服器")); }
    if (action === "cal-view") { cal.view = views[data.view] ? data.view : "week"; return update(ctx); }
    if (action === "cal-day-mode") { cal.dayMode = data.mode === "timeline" ? "timeline" : "agenda"; return update(ctx); }
    if (action === "cal-member") { cal.member = data.member; return update(ctx); }
    if (action === "cal-today") { cal.date = ctx.dateKey(ctx.today); return update(ctx); }
    if (action === "cal-prev" || action === "cal-next") {
      const amount = action === "cal-prev" ? -1 : 1;
      const next = cal.view === "year" ? addMonths(date, amount * 12) : cal.view === "month" ? addMonths(date, amount) : addDays(date, amount * (cal.view === "week" ? 7 : 1));
      if (next.getFullYear() < 1900 || next.getFullYear() > 2100) return ctx.toast(t("日期範圍為 1900 至 2100 年"));
      cal.date = ctx.dateKey(next); return update(ctx);
    }
    if (action === "cal-date" || action === "cal-month") { cal.date = data.date; cal.view = action === "cal-month" ? "month" : "day"; return update(ctx); }
    if (action === "cal-mini-prev" || action === "cal-mini-next") {
      const next = addMonths(date, action === "cal-mini-prev" ? -1 : 1);
      if (next.getFullYear() < 1900 || next.getFullYear() > 2100) return ctx.toast(t("日期範圍為 1900 至 2100 年"));
      cal.date = ctx.dateKey(next); return update(ctx);
    }
    if (action === "cal-add") return eventForm(ctx, { date: data.date || cal.date, ...(data.time ? { time: data.time } : {}) });
    if (action === "cal-detail") return detail(ctx, data.id);
    if (action === "cal-edit") { const event = ctx.state.events.find(item => item.id === data.id); if (event) eventForm(ctx, event); return; }
    if (action === "cal-toggle-done") { const event = ctx.state.events.find(item => item.id === data.id); if (event) { event.done = !event.done; update(ctx); } return; }
    if (action === "cal-delete") {
      const event = ctx.state.events.find(item => item.id === data.id);
      if (event) ctx.dialog(t("刪除這條行程？"), `<p class="cal-delete-title">${ctx.escape(t(event.title))}</p><p class="muted">${ctx.escape(event.date)} · ${ctx.escape(member(ctx, event.memberId).name)}</p><div class="cal-dialog-actions"><button class="btn quiet" type="button" data-action="cal-detail" data-id="${ctx.escape(event.id)}">${ctx.escape(t("保留行程"))}</button><button class="btn danger" type="button" data-action="cal-confirm-delete" data-id="${ctx.escape(event.id)}">${ctx.icon("trash-2")}${ctx.escape(t("刪除行程"))}</button></div>`);
      return;
    }
    if (action === "cal-confirm-delete") { ctx.state.events = ctx.state.events.filter(item => item.id !== data.id); ctx.closeDialog(); update(ctx); return ctx.toast(t("已刪除行程")); }
    if (action === "cal-jump") return ctx.dialog(t("跳轉日期"), `<form id="cal-jump-form" class="cal-form"><label class="field"><span>${ctx.escape(t("選擇日期"))}</span><input type="date" name="date" value="${ctx.escape(cal.date)}" min="1900-01-01" max="2100-12-31" required autofocus></label><div class="cal-dialog-actions"><button class="btn quiet" type="button" data-action="cal-close">${ctx.escape(t("取消"))}</button><button class="btn primary" type="submit">${ctx.escape(t("前往"))}</button></div></form>`);
    if (action === "cal-voice") return voiceMember(ctx);
    if (action === "cal-voice-member") { voiceDraft = { memberId: data.member, transcript: "" }; return voiceInput(ctx); }
    if (action === "cal-voice-input") return voiceInput(ctx);
    if (action === "cal-voice-example") { voiceDraft.transcript = t("{name} 今天 16:30 帶孩子去籃球訓練", { name: member(ctx, voiceDraft.memberId).name }); return voiceInput(ctx); }
  }

  function submit(form, ctx) {
    const values = new FormData(form);
    const formId = form.getAttribute("id");
    if (formId === "cal-jump-form") {
      const key = values.get("date");
      if (!fromKey(key)) return;
      ctx.state.calendar.date = key; ctx.closeDialog(); return update(ctx);
    }
    if (formId === "cal-voice-form") {
      const transcript = String(values.get("transcript") || "").trim();
      if (!transcript) { form.querySelector("#cal-form-error").textContent = t("請輸入語音轉寫內容。"); return; }
      voiceDraft.transcript = transcript;
      return eventForm(ctx, parseVoice(ctx, transcript), true);
    }
    if (formId !== "cal-event-form") return;
    const title = String(values.get("title") || "").trim();
    const date = String(values.get("date") || "");
    const allDay = values.get("allDay") === "on";
    const time = allDay ? "" : String(values.get("time") || "");
    const endTime = allDay ? "" : String(values.get("endTime") || "");
    const memberId = String(values.get("memberId") || "");
    const error = form.querySelector("#cal-form-error");
    if (!title) { error.textContent = t("請填寫行程名稱。"); return; }
    if (title.length > 60) { error.textContent = t("行程名稱最多 60 個字，請精簡後儲存。"); return; }
    if (!fromKey(date) || date < "1900-01-01" || date > "2100-12-31") { error.textContent = t("請選擇有效日期。"); return; }
    if (memberId !== "family" && !ctx.state.members.some(item => item.id === memberId)) { error.textContent = t("請選擇有效的家庭成員。"); return; }
    if (!allDay && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { error.textContent = t("請選擇開始時間。"); return; }
    if (endTime && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || endTime <= time)) { error.textContent = t("結束時間需要晚於開始時間。"); return; }
    const id = String(values.get("id") || "");
    const previous = ctx.state.events.find(item => item.id === id);
    if (id && !previous) { error.textContent = t("此行程已不存在，請關閉後重新添加。"); return; }
    const event = { ...previous, id: id || `event-${globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`, title, date, time, endTime, memberId, location: String(values.get("location") || "").trim(), note: String(values.get("note") || "").trim(), source: String(values.get("source") || "manual"), done: previous?.done || false };
    if (previous) Object.assign(previous, event); else ctx.state.events.push(event);
    ctx.state.calendar.date = date; ctx.state.calendar.view = "day"; ctx.state.calendar.dayMode = "agenda";
    if (ctx.state.calendar.member !== "all" && ctx.state.calendar.member !== memberId && memberId !== "family") ctx.state.calendar.member = memberId;
    ctx.closeDialog(); update(ctx); ctx.toast(previous ? t("已更新行程") : t("已加入{name}的行程", { name: member(ctx, memberId).name }));
    requestAnimationFrame(() => document.querySelector(`.cal-day-agenda .cal-agenda-row[data-id="${CSS.escape(event.id)}"]`)?.scrollIntoView({ block: "nearest", behavior: "auto" }));
  }

  function change(target) {
    if (!target.matches("[data-cal-all-day]")) return;
    const form = target.closest("form");
    for (const name of ["time", "endTime"]) form.elements[name].disabled = target.checked;
    form.elements.time.required = !target.checked;
  }

  window.DeviceModules = window.DeviceModules || {};
  window.DeviceModules.calendar = { render, click, submit, change };
})();
