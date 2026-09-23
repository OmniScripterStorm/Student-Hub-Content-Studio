/* =========================================================
   TagSci Content Studio - Calendar & Deadlines Controller
   ========================================================= */

import { STUDIO_DATA } from '../data/studio_data.js';

export function renderCalendarEvents() {
  const container = document.getElementById('cal-events-list-container');
  const badgeCount = document.getElementById('badge-count-cal');
  const countLabel = document.getElementById('cal-events-count');

  if (badgeCount) badgeCount.innerText = STUDIO_DATA.calendarEvents.length;
  if (countLabel) countLabel.innerText = `${STUDIO_DATA.calendarEvents.length} events scheduled`;

  if (!container) return;
  container.innerHTML = '';
  STUDIO_DATA.calendarEvents.forEach((ev, idx) => {
    const isTagSci = ev.subject === 'TagSci' || ev.tag === 'TagSci';
    const isDepEd = ev.subject === 'DepEd' || ev.tag === 'DepEd';
    let badgeColorClass = 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300';
    let borderColorClass = 'border-slate-200 dark:border-slate-800';

    if (isTagSci) {
      badgeColorClass = 'bg-tagsci-100 dark:bg-tagsci-950/80 text-tagsci-800 dark:text-tagsci-300 font-black border border-tagsci-300 dark:border-tagsci-800';
      borderColorClass = 'border-tagsci-400 dark:border-tagsci-800';
    } else if (isDepEd) {
      badgeColorClass = 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-black border border-blue-300 dark:border-blue-800';
      borderColorClass = 'border-blue-400 dark:border-blue-800';
    }

    const card = document.createElement('div');
    card.className = `p-3.5 rounded-xl bg-white dark:bg-slate-900 border ${borderColorClass} shadow-sm flex flex-col justify-between`;
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded ${badgeColorClass}">${ev.subject}</span>
          <span class="text-[10px] font-bold text-slate-400 font-mono">${ev.date}</span>
        </div>
        <h4 class="text-xs font-black text-slate-900 dark:text-white mb-1">${ev.title}</h4>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">${ev.desc || ''}</p>
      </div>
      <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10.5px]">
        <span class="font-bold text-tagsci-700 dark:text-tagsci-400">${ev.badge || ev.type}</span>
        <button onclick="window.deleteCalendarEvent(${idx})" class="text-slate-400 hover:text-red-500 font-semibold">Remove</button>
      </div>
    `;
    container.appendChild(card);
  });
}

export function deleteCalendarEvent(idx) {
  STUDIO_DATA.calendarEvents.splice(idx, 1);
  renderCalendarEvents();
  if (window.showToast) window.showToast('Calendar event removed.');
}

export function handleAddCalendarEvent(e) {
  e.preventDefault();
  const dateInput = document.getElementById('cal-input-date');
  const subjectInput = document.getElementById('cal-input-subject');
  const titleInput = document.getElementById('cal-input-title');
  const typeInput = document.getElementById('cal-input-type');
  const badgeInput = document.getElementById('cal-input-badge');
  const descInput = document.getElementById('cal-input-desc');

  if (!dateInput || !titleInput) return;

  const newEv = {
    id: Date.now(),
    date: dateInput.value,
    subject: subjectInput ? subjectInput.value : 'General Science',
    title: titleInput.value,
    type: typeInput ? typeInput.value : 'deadline',
    badge: badgeInput && badgeInput.value ? badgeInput.value : 'Deadline',
    desc: descInput ? descInput.value : ''
  };

  STUDIO_DATA.calendarEvents.push(newEv);
  renderCalendarEvents();
  const form = document.getElementById('calendar-event-form');
  if (form) form.reset();
  if (window.showToast) window.showToast('Event added to calendar!');
}
