/* =========================================================
   TagSci Content Studio - Hub & Workspace Dashboard Component
   ========================================================= */

import { STUDIO_DATA, setCurrentRevIndex, setCurrentQuizSetIndex } from '../data/studio_data.js';

let currentVaultFilter = 'all';
let vaultSearchQuery = '';

export function setVaultFilter(filter) {
  currentVaultFilter = filter;
  renderHubVault();
}

export function setVaultSearchQuery(query) {
  vaultSearchQuery = (query || '').toLowerCase().trim();
  renderHubVault();
}

export function renderHubDashboard() {
  renderHubStats();
  renderSubjectPortals();
  renderHubVault();
}

export function renderHubStats() {
  const revCount = STUDIO_DATA.stemReviewers ? STUDIO_DATA.stemReviewers.length : 0;
  
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

  const statQuiz = document.getElementById('hub-stat-quiz-count');
  if (statQuiz) statQuiz.innerText = totalQuestions;

  const statCal = document.getElementById('hub-stat-cal-count');
  if (statCal) statCal.innerText = calCount;

  // Update sidebar counter badges
  const badgeRev = document.getElementById('badge-count-rev');
  if (badgeRev) badgeRev.innerText = revCount;

  const badgeQuiz = document.getElementById('badge-count-quiz');
  if (badgeQuiz) badgeQuiz.innerText = `${totalQuestions} Qs`;

  const badgeCal = document.getElementById('badge-count-cal');
  if (badgeCal) badgeCal.innerText = calCount;
}

export function renderSubjectPortals() {
  const container = document.getElementById('hub-subjects-grid');
  if (!container) return;

  // Aggregate counts per subject
  const subjectMap = {};

  if (STUDIO_DATA.stemReviewers) {
    STUDIO_DATA.stemReviewers.forEach(rev => {
      const subj = rev.subject || 'General Math';
      if (!subjectMap[subj]) {
        subjectMap[subj] = { reviewers: 0, quizzes: 0, questions: 0 };
      }
      subjectMap[subj].reviewers++;
    });
  }

  if (STUDIO_DATA.quizSets) {
    STUDIO_DATA.quizSets.forEach(qSet => {
      const subj = qSet.subject || 'General Math';
      if (!subjectMap[subj]) {
        subjectMap[subj] = { reviewers: 0, quizzes: 0, questions: 0 };
      }
      subjectMap[subj].quizzes++;
      subjectMap[subj].questions += (qSet.questions ? qSet.questions.length : 0);
    });
  }

  // Ensure primary STEM subjects exist
  const coreSubjects = [
    { name: 'General Math', desc: 'Rational Functions, Inverse Functions & Summative Exams', icon: 'f(x)', color: 'blue' },
    { name: 'Effective Communications', desc: 'Communication Models & Speech Context Drills', icon: 'message-square', color: 'emerald' },
    { name: 'Physics', desc: '1D/2D Kinematics, Projectile Motion & Dynamics', icon: 'zap', color: 'amber' },
    { name: 'Finite Math', desc: 'Matrix operations & Mathematical Modeling', icon: 'grid', color: 'purple' }
  ];

  let html = '';
  coreSubjects.forEach(s => {
    const stats = subjectMap[s.name] || { reviewers: 0, quizzes: 0, questions: 0 };
    const isLive = stats.reviewers > 0 || stats.quizzes > 0;
    
    html += `
      <div onclick="openSubjectEditor('${s.name}')" class="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-tagsci-500 dark:hover:border-tagsci-500 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-950/80 text-${s.color}-600 dark:text-${s.color}-400 flex items-center justify-center font-bold text-xs shadow-sm">
            ${s.icon.length <= 4 ? s.icon : `<i data-lucide="${s.icon}" class="w-4 h-4"></i>`}
          </div>
          <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isLive ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
            ${isLive ? 'Active' : 'Draft'}
          </span>
        </div>
        <h4 class="font-bold text-sm text-slate-900 dark:text-white group-hover:text-tagsci-600 dark:group-hover:text-tagsci-400 transition-colors">${s.name}</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${s.desc}</p>
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>${stats.reviewers} Notes • ${stats.questions} Qs</span>
          <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-tagsci-600"></i>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
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

  // 2. Add Quiz Sets
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

  // 3. Add Calendar Deadlines
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
          <p class="text-[11px] text-slate-400 mt-0.5">Start authoring materials from scratch or import an existing updates.json dataset.</p>
        </div>
        <div class="flex items-center justify-center gap-2 pt-1">
          <button onclick="window.createQuickReviewer()" class="px-3 py-1.5 rounded-lg bg-tagsci-700 hover:bg-tagsci-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> New Reviewer
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
    let iconBg = 'bg-blue-100 dark:bg-blue-950/80 text-blue-600';
    let badgeType = 'Reviewer';
    let badgeColor = 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300';
    let clickHandler = `openVaultItem('${item.type}', ${item.index})`;

    if (item.type === 'quiz') {
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
