/* =========================================================
   TagSci Content Studio - Hub & Workspace Dashboard Component
   ========================================================= */

import { STUDIO_DATA, setCurrentRevIndex, setCurrentMatIndex, setCurrentQuizSetIndex } from '../data/studio_data.js';

let currentVaultFilter = 'all';
let vaultSearchQuery = '';

export function applyVaultFilter(filter) {
  currentVaultFilter = filter;
  renderHubVault();
}
export const setVaultFilter = applyVaultFilter;

export function setVaultSearchQuery(query) {
  vaultSearchQuery = (query || '').toLowerCase().trim();
  renderHubVault();
}

export function renderHubDashboard() {
  renderHubStats();
  renderHubVault();
}

export function renderHubStats() {
  const revCount = STUDIO_DATA.stemReviewers ? STUDIO_DATA.stemReviewers.length : 0;
  const matCount = STUDIO_DATA.studyMaterials ? STUDIO_DATA.studyMaterials.length : 0;
  
  let totalQuestions = 0;
  if (STUDIO_DATA.quizSets && Array.isArray(STUDIO_DATA.quizSets)) {
    STUDIO_DATA.quizSets.forEach(set => {
      if (set.questions && Array.isArray(set.questions)) {
        totalQuestions += set.questions.length;
      }
    });
  }

  const calCount = STUDIO_DATA.calendarEvents ? STUDIO_DATA.calendarEvents.length : 0;

  // Update badges & dashboard stat numbers
  const statRev = document.getElementById('hub-stat-rev-count');
  if (statRev) statRev.innerText = revCount;

  const statMat = document.getElementById('hub-stat-mat-count');
  if (statMat) statMat.innerText = matCount;

  const statQuiz = document.getElementById('hub-stat-quiz-count');
  if (statQuiz) statQuiz.innerText = totalQuestions;

  const statCal = document.getElementById('hub-stat-cal-count');
  if (statCal) statCal.innerText = calCount;

  // Update sidebar counter badges
  const badgeRev = document.getElementById('badge-count-rev');
  if (badgeRev) badgeRev.innerText = revCount;

  const badgeMat = document.getElementById('badge-count-mat');
  if (badgeMat) badgeMat.innerText = matCount;

  const badgeQuiz = document.getElementById('badge-count-quiz');
  if (badgeQuiz) badgeQuiz.innerText = `${totalQuestions} Qs`;

  const badgeCal = document.getElementById('badge-count-cal');
  if (badgeCal) badgeCal.innerText = calCount;
}

export function renderHubVault() {
  const container = document.getElementById('hub-vault-container');
  const countBadge = document.getElementById('hub-vault-count');
  if (!container) return;

  const items = [];

  // 1. Add Reviewers
  if (STUDIO_DATA.stemReviewers) {
    STUDIO_DATA.stemReviewers.forEach((rev, idx) => {
      items.push({
        type: 'reviewer',
        index: idx,
        id: rev.id,
        title: rev.title || 'Untitled Reviewer Draft',
        subject: rev.subject || 'General Math',
        tag: rev.tag || 'Main',
        summary: rev.summary || (rev.blocks ? `${rev.blocks.length} Sections / Blocks` : 'No summary'),
        meta: `${rev.blocks ? rev.blocks.length : 0} Content Blocks`
      });
    });
  }

  // 2. Add Study Materials
  if (STUDIO_DATA.studyMaterials) {
    STUDIO_DATA.studyMaterials.forEach((mat, idx) => {
      items.push({
        type: 'material',
        index: idx,
        id: mat.id,
        title: mat.title || 'Untitled Study Material',
        subject: mat.subject || 'General Science',
        tag: mat.tag || 'Study Material',
        summary: mat.summary || (mat.blocks ? `${mat.blocks.length} Sections / Blocks` : 'No summary'),
        meta: `${mat.blocks ? mat.blocks.length : 0} Content Blocks`
      });
    });
  }

  // 3. Add Quiz Sets
  if (STUDIO_DATA.quizSets) {
    STUDIO_DATA.quizSets.forEach((qSet, idx) => {
      const qCount = qSet.questions ? qSet.questions.length : 0;
      items.push({
        type: 'quiz',
        index: idx,
        id: qSet.id,
        title: qSet.title || 'Untitled Quiz Bank',
        subject: qSet.subject || 'General Math',
        tag: qSet.tag || 'Main',
        summary: qSet.desc || `${qCount} Interactive Questions • ${qSet.timeLimitMinutes || 15} mins`,
        meta: `${qCount} Questions Bank`
      });
    });
  }

  // 4. Add Calendar Deadlines
  if (STUDIO_DATA.calendarEvents) {
    STUDIO_DATA.calendarEvents.forEach((cal, idx) => {
      items.push({
        type: 'calendar',
        index: idx,
        id: cal.id,
        title: cal.title || 'Untitled Milestone',
        subject: cal.subject || 'TagSci',
        tag: cal.type || 'Deadline',
        summary: cal.desc || `Scheduled: ${cal.date}`,
        meta: `Due: ${cal.date}`
      });
    });
  }

  // Apply Filter
  let filtered = items;
  if (currentVaultFilter === 'reviewers') {
    filtered = filtered.filter(i => i.type === 'reviewer');
  } else if (currentVaultFilter === 'materials') {
    filtered = filtered.filter(i => i.type === 'material');
  } else if (currentVaultFilter === 'quizzes') {
    filtered = filtered.filter(i => i.type === 'quiz');
  } else if (currentVaultFilter === 'calendar') {
    filtered = filtered.filter(i => i.type === 'calendar');
  }

  // Apply Search
  if (vaultSearchQuery) {
    filtered = filtered.filter(i => 
      i.title.toLowerCase().includes(vaultSearchQuery) ||
      i.subject.toLowerCase().includes(vaultSearchQuery) ||
      i.summary.toLowerCase().includes(vaultSearchQuery)
    );
  }

  if (countBadge) countBadge.innerText = `${filtered.length} Items`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-xs space-y-3">
        <i data-lucide="inbox" class="w-8 h-8 mx-auto opacity-40"></i>
        <div>
          <p class="font-bold text-slate-700 dark:text-slate-200">No Materials in Session</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Start authoring materials from scratch or upload an existing updates.json dataset.</p>
        </div>
        <div class="flex items-center justify-center gap-2 pt-1 flex-wrap">
          <button onclick="window.createQuickReviewer()" class="px-3 py-1.5 rounded-lg bg-tagsci-700 hover:bg-tagsci-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> New Reviewer
          </button>
          <button onclick="window.createQuickMaterial()" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1">
            <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i> New Study Material
          </button>
          <button onclick="window.createQuickQuizSet()" class="px-3 py-1.5 rounded-lg bg-g11pink-600 hover:bg-g11pink-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1">
            <i data-lucide="brain-circuit" class="w-3.5 h-3.5"></i> New Quiz Bank
          </button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  let html = '';
  filtered.forEach(item => {
    let icon = 'file-text';
    let iconBg = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600';
    let badgeType = 'Reviewer';
    let badgeColor = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
    let clickHandler = `openVaultItem('${item.type}', ${item.index})`;

    if (item.type === 'material') {
      icon = 'folder-kanban';
      iconBg = 'bg-blue-100 dark:bg-blue-950/80 text-blue-600';
      badgeType = 'Study Material';
      badgeColor = 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300';
    } else if (item.type === 'quiz') {
      icon = 'brain-circuit';
      iconBg = 'bg-pink-100 dark:bg-pink-950/80 text-g11pink-600';
      badgeType = 'Quiz Bank';
      badgeColor = 'bg-pink-100 dark:bg-pink-950 text-g11pink-700 dark:text-pink-300';
    } else if (item.type === 'calendar') {
      icon = 'calendar';
      iconBg = 'bg-amber-100 dark:bg-amber-950/80 text-amber-600';
      badgeType = 'Calendar';
      badgeColor = 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
    }

    html += `
      <div onclick="${clickHandler}" class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-between transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0">
            <i data-lucide="${icon}" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <span>${item.title}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}">${badgeType}</span>
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5">${item.subject} • ${item.meta} • ${item.summary}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1">
            <span>Open</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400"></i>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}
