/* =========================================================
   TagSci Content Studio - Main Application Bootstrap (Concept 1: Document Hub)
   ========================================================= */

import { STUDIO_DATA, currentRevIndex, currentMatIndex, currentQuizSetIndex, currentEditorMode, setCurrentRevIndex, setCurrentMatIndex, setCurrentQuizSetIndex, setCurrentEditorMode, getSubjectClassification } from './data/studio_data.js';
import { parseMathSyntax, renderMathInHtml, formatRichText, parseMarkdownToHtml } from './components/math_engine.js';
import { openMathBuilderModal, openMathBuilderForBlock, closeMathBuilderModal, switchMathSubTab, insertFormulaSnippet, setFullEquation, updateMathStudioPreview, confirmMathInsert, setLastFocusedInput } from './components/equation_modal.js';
import { 
  renderMaterialsList,
  loadMaterialToEditor,
  renderMaterialBlockCanvas,
  syncMaterialBlocksToPreview,
  updateMaterialBlockField,
  moveMaterialBlock,
  duplicateMaterialBlock,
  deleteMaterialBlock,
  addMaterialBulletItem,
  updateMaterialBulletItem,
  removeMaterialBulletItem,
  addMaterialTableCol,
  removeMaterialTableCol,
  addMaterialTableRow,
  removeMaterialTableRow,
  updateMaterialTableHeader,
  updateMaterialTableCell,
  addMaterialPiecewiseSegment,
  removeMaterialPiecewiseSegment,
  updateMaterialPiecewiseSegment,
  toggleMaterialPiecewiseEndpoint,
  addMaterialContentBlock,
  createQuickMaterial,
  exportMaterialMarkdown
} from './components/material_studio.js';
import { 
  compileBlocksToMarkdown, 
  parseMarkdownIntoBlocks, 
  renderReviewersList, 
  loadReviewerToEditor, 
  renderBlockCanvas, 
  syncBlocksToPreview, 
  updateBlockField, 
  moveBlock, 
  duplicateBlock, 
  deleteBlock, 
  addBulletItem, 
  updateBulletItem, 
  removeBulletItem, 
  addContentBlock, 
  loadLessonTemplate, 
  applyTextFormatting,
  updateTableHeader,
  updateTableCell,
  addTableCol,
  removeTableCol,
  addTableRow,
  removeTableRow,
  addPiecewiseSegment,
  removePiecewiseSegment,
  updatePiecewiseSegment,
  togglePiecewiseEndpoint,
  loadPlotPreset
} from './components/reviewer_studio.js';
import { renderQuizSetsList, loadQuizSetToEditor, renderQuestionsBuilder, renderLiveQuizTester, updateQuestionField, changeQuestionType, updateTrueFalse, toggleMultiSelectOption, moveQuestion, duplicateQuestion, addQuestionBlock, updateCorrectMcq, updateMcqOption, removeMcqOption, addMcqOption, deleteQuestion, checkTesterAnswer, checkTesterTrueFalse, checkTesterIdentification, checkTesterNumerical, toggleTesterMultiSelectOption, checkTesterMultiSelect, revealTesterFlashcard, nextTesterQ, prevTesterQ, resetLiveTester } from './components/quiz_studio.js';
import { renderCalendarEvents, deleteCalendarEvent, handleAddCalendarEvent } from './components/calendar_studio.js';
import { renderHubDashboard, renderHubStats, renderSubjectPortals, renderHubVault, applyVaultFilter, setVaultSearchQuery } from './components/hub_dashboard.js';
import { 
  generateProductionJson, 
  renderJsonHub, 
  exportUpdatesJson, 
  copyUpdatesJson, 
  exportReviewerMarkdown, 
  exportQuizSetMarkdown, 
  handleImportJsonFile, 
  pingOtaEndpoint,
  testGitHubAccess,
  pushDirectUpdatesJsonToGitHub,
  appendAndPushToGitHub,
  saveGitHubConfig,
  clearGitHubConfig,
  toggleTokenVisibility
} from './components/json_hub.js';

// Global Toast Utility
window.showToast = function(message) {
  const toast = document.getElementById('toast-msg');
  const text = document.getElementById('toast-text');
  if (!toast || !text) return;
  text.innerText = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
};

// Global exports for HTML event bindings
window.openMathBuilderModal = openMathBuilderModal;
window.openMathBuilderForBlock = openMathBuilderForBlock;
window.closeMathBuilderModal = closeMathBuilderModal;
window.switchMathSubTab = switchMathSubTab;
window.insertFormulaSnippet = insertFormulaSnippet;
window.setFullEquation = setFullEquation;
window.updateMathStudioPreview = updateMathStudioPreview;
window.confirmMathInsert = confirmMathInsert;

window.updateBlockField = updateBlockField;
window.moveBlock = moveBlock;
window.duplicateBlock = duplicateBlock;
window.deleteBlock = deleteBlock;
window.addBulletItem = addBulletItem;
window.updateBulletItem = updateBulletItem;
window.removeBulletItem = removeBulletItem;
window.addContentBlock = addContentBlock;
window.loadLessonTemplate = loadLessonTemplate;
window.applyTextFormatting = applyTextFormatting;

// Table Block Bindings
window.updateTableHeader = updateTableHeader;
window.updateTableCell = updateTableCell;
window.addTableCol = addTableCol;
window.removeTableCol = removeTableCol;
window.addTableRow = addTableRow;
window.removeTableRow = removeTableRow;

// Cartesian Plot & Piecewise Bindings
window.addPiecewiseSegment = addPiecewiseSegment;
window.removePiecewiseSegment = removePiecewiseSegment;
window.updatePiecewiseSegment = updatePiecewiseSegment;
window.togglePiecewiseEndpoint = togglePiecewiseEndpoint;
window.loadPlotPreset = loadPlotPreset;

window.toggleAddBlockDropdown = function(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('add-block-menu');
  if (menu) {
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden') && window.lucide) {
      window.lucide.createIcons();
    }
  }
};

window.handleAddBlockSelect = function(type) {
  addContentBlock(type);
  const menu = document.getElementById('add-block-menu');
  if (menu) menu.classList.add('hidden');
};

// Study Materials Bindings
window.renderMaterialsList = renderMaterialsList;
window.loadMaterialToEditor = loadMaterialToEditor;
window.renderMaterialBlockCanvas = renderMaterialBlockCanvas;
window.syncMaterialBlocksToPreview = syncMaterialBlocksToPreview;
window.updateMaterialBlockField = updateMaterialBlockField;
window.moveMaterialBlock = moveMaterialBlock;
window.duplicateMaterialBlock = duplicateMaterialBlock;
window.deleteMaterialBlock = deleteMaterialBlock;
window.addMaterialBulletItem = addMaterialBulletItem;
window.updateMaterialBulletItem = updateMaterialBulletItem;
window.removeMaterialBulletItem = removeMaterialBulletItem;
window.addMaterialTableCol = addMaterialTableCol;
window.removeMaterialTableCol = removeMaterialTableCol;
window.addMaterialTableRow = addMaterialTableRow;
window.removeMaterialTableRow = removeMaterialTableRow;
window.updateMaterialTableHeader = updateMaterialTableHeader;
window.updateMaterialTableCell = updateMaterialTableCell;
window.addMaterialPiecewiseSegment = addMaterialPiecewiseSegment;
window.removeMaterialPiecewiseSegment = removeMaterialPiecewiseSegment;
window.updateMaterialPiecewiseSegment = updateMaterialPiecewiseSegment;
window.toggleMaterialPiecewiseEndpoint = toggleMaterialPiecewiseEndpoint;
window.addMaterialContentBlock = addMaterialContentBlock;
window.createQuickMaterial = createQuickMaterial;
window.exportMaterialMarkdown = exportMaterialMarkdown;

window.toggleMatAddBlockDropdown = function(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('mat-add-block-menu');
  if (menu) {
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden') && window.lucide) {
      window.lucide.createIcons();
    }
  }
};

window.handleMatAddBlockSelect = function(type) {
  addMaterialContentBlock(type);
  const menu = document.getElementById('mat-add-block-menu');
  if (menu) menu.classList.add('hidden');
};

window.updateQuestionField = updateQuestionField;
window.changeQuestionType = changeQuestionType;
window.updateTrueFalse = updateTrueFalse;
window.toggleMultiSelectOption = toggleMultiSelectOption;
window.moveQuestion = moveQuestion;
window.duplicateQuestion = duplicateQuestion;
window.addQuestionBlock = addQuestionBlock;
window.updateCorrectMcq = updateCorrectMcq;
window.updateMcqOption = updateMcqOption;
window.removeMcqOption = removeMcqOption;
window.addMcqOption = addMcqOption;
window.deleteQuestion = deleteQuestion;

window.toggleQuizAddBlockDropdown = function(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('quiz-add-block-menu');
  if (menu) {
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden') && window.lucide) {
      window.lucide.createIcons();
    }
  }
};

window.handleQuizAddBlockSelect = function(type) {
  addQuestionBlock(type);
  const menu = document.getElementById('quiz-add-block-menu');
  if (menu) menu.classList.add('hidden');
};

window.checkTesterAnswer = checkTesterAnswer;
window.checkTesterTrueFalse = checkTesterTrueFalse;
window.checkTesterIdentification = checkTesterIdentification;
window.checkTesterNumerical = checkTesterNumerical;
window.toggleTesterMultiSelectOption = toggleTesterMultiSelectOption;
window.checkTesterMultiSelect = checkTesterMultiSelect;
window.revealTesterFlashcard = revealTesterFlashcard;
window.nextTesterQ = nextTesterQ;
window.prevTesterQ = prevTesterQ;

window.deleteCalendarEvent = deleteCalendarEvent;

// GitHub Direct Publisher Bindings
window.testGitHubAccess = testGitHubAccess;
window.pushDirectUpdatesJsonToGitHub = pushDirectUpdatesJsonToGitHub;
window.appendAndPushToGitHub = appendAndPushToGitHub;
window.saveGitHubConfig = saveGitHubConfig;
window.clearGitHubConfig = clearGitHubConfig;
window.toggleTokenVisibility = toggleTokenVisibility;

// Hub & Document Portal Bindings
window.setVaultFilter = (filter) => {
  document.querySelectorAll('.vault-filter-btn').forEach(btn => {
    if (btn.dataset.filter === filter) {
      btn.classList.add('bg-tagsci-50', 'dark:bg-tagsci-950', 'text-tagsci-800', 'dark:text-tagsci-300', 'border-tagsci-200', 'dark:border-tagsci-800', 'font-bold');
      btn.classList.remove('text-slate-600', 'dark:text-slate-400');
    } else {
      btn.classList.remove('bg-tagsci-50', 'dark:bg-tagsci-950', 'text-tagsci-800', 'dark:text-tagsci-300', 'border-tagsci-200', 'dark:border-tagsci-800', 'font-bold');
      btn.classList.add('text-slate-600', 'dark:text-slate-400');
    }
  });
  applyVaultFilter(filter);
};

window.setVaultSearchQuery = setVaultSearchQuery;

window.openVaultItem = function(type, index) {
  if (type === 'reviewer') {
    setCurrentRevIndex(index);
    loadReviewerToEditor();
    renderReviewersList();
    switchTab('reviewers');
  } else if (type === 'material') {
    setCurrentMatIndex(index);
    loadMaterialToEditor();
    renderMaterialsList();
    switchTab('materials');
  } else if (type === 'quiz') {
    setCurrentQuizSetIndex(index);
    loadQuizSetToEditor();
    renderQuizSetsList();
    switchTab('quizzes');
  } else if (type === 'calendar') {
    switchTab('calendar');
  }
};

window.openSubjectEditor = function(subjectName) {
  // Find matching reviewer or create one
  const revIdx = STUDIO_DATA.stemReviewers.findIndex(r => (r.subject || '').toLowerCase() === subjectName.toLowerCase());
  if (revIdx !== -1) {
    setCurrentRevIndex(revIdx);
    loadReviewerToEditor();
    renderReviewersList();
    switchTab('reviewers');
    return;
  }

  // Else find matching quiz
  const qIdx = STUDIO_DATA.quizSets.findIndex(q => (q.subject || '').toLowerCase() === subjectName.toLowerCase());
  if (qIdx !== -1) {
    setCurrentQuizSetIndex(qIdx);
    loadQuizSetToEditor();
    renderQuizSetsList();
    switchTab('quizzes');
    return;
  }

  // Else create new reviewer under that subject
  const meta = getSubjectClassification(subjectName);
  const newRev = {
    id: `rev_${Date.now()}`,
    subject: subjectName,
    tag: meta.type || 'Main',
    color: meta.color || 'border-l-4 border-tagsci-600',
    title: `${subjectName} Study Module`,
    summary: `Curated learning notes and formulas for ${subjectName}`,
    blocks: [
      { type: 'heading', level: 'h3', text: '1. Topic Introduction' },
      { type: 'paragraph', text: `Enter core concepts, formulas, and examples for ${subjectName}.` }
    ],
    rawMarkdown: "",
    content: ""
  };
  STUDIO_DATA.stemReviewers.unshift(newRev);
  setCurrentRevIndex(0);
  renderReviewersList();
  loadReviewerToEditor();
  renderHubDashboard();
  switchTab('reviewers');
};

window.createQuickReviewer = function() {
  const newRev = {
    id: `reviewer_${Date.now()}`,
    subject: "General Math",
    tag: "Main",
    color: "border-l-4 border-tagsci-600",
    title: "New Reviewer Draft",
    summary: "Enter short summary...",
    blocks: [
      { type: 'heading', level: 'h3', text: '1. Topic Introduction' },
      { type: 'paragraph', text: 'Start typing concepts or insert a template from the toolbar.' }
    ],
    rawMarkdown: "",
    content: ""
  };
  STUDIO_DATA.stemReviewers.unshift(newRev);
  setCurrentRevIndex(0);
  renderReviewersList();
  loadReviewerToEditor();
  renderHubDashboard();
  switchTab('reviewers');
  window.showToast('New reviewer draft opened!');
};

window.createQuickQuizSet = function() {
  const newSet = {
    id: `quiz_${Date.now()}`,
    subject: 'General Math',
    tag: 'Main',
    title: 'New Quiz Bank Draft',
    desc: 'Interactive examination & drill questions',
    timeLimitMinutes: 15,
    questions: [
      {
        type: 'mcq',
        question: 'Sample Question: What is the primary characteristic of this concept?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct: 0,
        explanation: 'Explanation of why Option A is correct.'
      }
    ]
  };
  STUDIO_DATA.quizSets.unshift(newSet);
  setCurrentQuizSetIndex(0);
  renderQuizSetsList();
  loadQuizSetToEditor();
  renderHubDashboard();
  switchTab('quizzes');
  window.showToast('New quiz bank created!');
};

// Breadcrumbs Controller
export function updateBreadcrumbs(tabId) {
  const sep = document.getElementById('breadcrumb-separator');
  const curr = document.getElementById('breadcrumb-current');
  const backBtn = document.getElementById('btn-back-to-hub');
  
  if (!curr) return;

  if (tabId === 'hub') {
    curr.innerText = 'Overview & Hub Dashboard';
    if (backBtn) backBtn.classList.add('hidden');
    if (sep) sep.classList.remove('hidden');
  } else if (tabId === 'reviewers') {
    const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
    curr.innerText = rev ? `${rev.subject || 'Reviewer'} / ${rev.title || 'Untitled Draft'}` : 'Reviewers Studio';
    if (backBtn) backBtn.classList.remove('hidden');
    if (sep) sep.classList.remove('hidden');
  } else if (tabId === 'materials') {
    const mats = STUDIO_DATA.studyMaterials || [];
    const mat = mats[currentMatIndex];
    curr.innerText = mat ? `${mat.subject || 'Study Material'} / ${mat.title || 'Untitled Draft'}` : 'Study Materials';
    if (backBtn) backBtn.classList.remove('hidden');
    if (sep) sep.classList.remove('hidden');
  } else if (tabId === 'quizzes') {
    const qSet = STUDIO_DATA.quizSets[currentQuizSetIndex];
    curr.innerText = qSet ? `${qSet.subject || 'Quiz Bank'} / ${qSet.title || 'Untitled Set'}` : 'Quiz & Exam Banks';
    if (backBtn) backBtn.classList.remove('hidden');
    if (sep) sep.classList.remove('hidden');
  } else if (tabId === 'calendar') {
    curr.innerText = 'Academic Calendar & Deadlines';
    if (backBtn) backBtn.classList.remove('hidden');
  } else if (tabId === 'json-hub') {
    curr.innerText = 'JSON & Over-The-Air GitHub Sync';
    if (backBtn) backBtn.classList.remove('hidden');
  } else if (tabId === 'guide') {
    curr.innerText = 'Curriculum Taxonomy & Guidelines';
    if (backBtn) backBtn.classList.remove('hidden');
  }
}

// Tab & View Routing Controller
export function switchTab(tabId) {
  // Update sidebar active button styles
  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('bg-tagsci-50', 'dark:bg-tagsci-950/80', 'text-tagsci-800', 'dark:text-tagsci-300', 'font-bold', 'border', 'border-tagsci-200', 'dark:border-tagsci-800/80');
      btn.classList.remove('text-slate-600', 'dark:text-slate-400');
    } else {
      btn.classList.remove('bg-tagsci-50', 'dark:bg-tagsci-950/80', 'text-tagsci-800', 'dark:text-tagsci-300', 'font-bold', 'border', 'border-tagsci-200', 'dark:border-tagsci-800/80');
      btn.classList.add('text-slate-600', 'dark:text-slate-400');
    }
  });

  // Switch visible main viewport section
  document.querySelectorAll('.studio-view').forEach(view => {
    if (view.id === `view-${tabId}`) {
      view.classList.remove('hidden');
    } else {
      view.classList.add('hidden');
    }
  });

  updateBreadcrumbs(tabId);

  if (tabId === 'hub') {
    renderHubDashboard();
  } else if (tabId === 'json-hub') {
    renderJsonHub();
  }

  if (window.lucide) window.lucide.createIcons();
}
window.switchTab = switchTab;

// Bootstrap Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Focus tracking for equation modal & formatting tools
  document.addEventListener('focusin', (e) => {
    if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) {
      setLastFocusedInput(e.target);
    }
  });

  // Global Keyboard Shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+M)
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === 'b') {
      e.preventDefault();
      applyTextFormatting('bold');
    } else if (key === 'i') {
      e.preventDefault();
      applyTextFormatting('italic');
    } else if (key === 'u') {
      e.preventDefault();
      applyTextFormatting('underline');
    } else if (key === 'm') {
      e.preventDefault();
      applyTextFormatting('math');
    }
  });

  // Dropdowns close on outside click
  document.addEventListener('click', (e) => {
    // Reviewers dropdown
    const menuRev = document.getElementById('add-block-menu');
    const btnRev = document.getElementById('btn-add-block-dropdown');
    if (menuRev && !menuRev.classList.contains('hidden')) {
      if (!menuRev.contains(e.target) && !btnRev?.contains(e.target)) {
        menuRev.classList.add('hidden');
      }
    }

    // Study Materials dropdown
    const menuMat = document.getElementById('mat-add-block-menu');
    const btnMat = document.getElementById('btn-mat-add-block-dropdown');
    if (menuMat && !menuMat.classList.contains('hidden')) {
      if (!menuMat.contains(e.target) && !btnMat?.contains(e.target)) {
        menuMat.classList.add('hidden');
      }
    }

    // Quiz dropdown
    const menuQuiz = document.getElementById('quiz-add-block-menu');
    const btnQuiz = document.getElementById('btn-quiz-add-block-dropdown');
    if (menuQuiz && !menuQuiz.classList.contains('hidden')) {
      if (!menuQuiz.contains(e.target) && !btnQuiz?.contains(e.target)) {
        menuQuiz.classList.add('hidden');
      }
    }
  });

  // Header quick actions
  const btnExport = document.getElementById('btn-quick-export');
  if (btnExport) btnExport.addEventListener('click', exportUpdatesJson);

  const btnCopy = document.getElementById('btn-copy-json');
  if (btnCopy) btnCopy.addEventListener('click', copyUpdatesJson);

  // Vault search in Hub
  const vaultSearch = document.getElementById('hub-vault-search');
  if (vaultSearch) {
    vaultSearch.addEventListener('input', (e) => {
      setVaultSearchQuery(e.target.value);
    });
  }

  // Sidebar navigation listeners
  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab) switchTab(btn.dataset.tab);
    });
  });

  // Reviewer Editor Mode Switches (Visual vs Source)
  const btnVisual = document.getElementById('btn-mode-visual');
  const btnSource = document.getElementById('btn-mode-source');

  if (btnVisual) {
    btnVisual.addEventListener('click', () => {
      setCurrentEditorMode('visual');
      btnVisual.classList.add('bg-white', 'dark:bg-slate-900', 'text-tagsci-800', 'dark:text-tagsci-300', 'shadow-sm');
      btnVisual.classList.remove('font-medium', 'text-slate-600', 'dark:text-slate-400');
      btnVisual.classList.add('font-bold');

      if (btnSource) {
        btnSource.classList.remove('bg-white', 'dark:bg-slate-900', 'text-tagsci-800', 'dark:text-tagsci-300', 'shadow-sm', 'font-bold');
        btnSource.classList.add('font-medium', 'text-slate-600', 'dark:text-slate-400');
      }

      document.getElementById('pane-visual-blocks')?.classList.remove('hidden');
      document.getElementById('pane-markdown-source')?.classList.add('hidden');
      document.getElementById('visual-builder-toolbar')?.classList.remove('hidden');

      const rawMd = document.getElementById('rev-input-body')?.value || '';
      if (STUDIO_DATA.stemReviewers[currentRevIndex]) {
        STUDIO_DATA.stemReviewers[currentRevIndex].rawMarkdown = rawMd;
        STUDIO_DATA.stemReviewers[currentRevIndex].blocks = parseMarkdownIntoBlocks(rawMd);
      }
      renderBlockCanvas();
      syncBlocksToPreview();
    });
  }

  if (btnSource) {
    btnSource.addEventListener('click', () => {
      setCurrentEditorMode('source');
      btnSource.classList.add('bg-white', 'dark:bg-slate-900', 'text-tagsci-800', 'dark:text-tagsci-300', 'shadow-sm');
      btnSource.classList.remove('font-medium', 'text-slate-600', 'dark:text-slate-400');
      btnSource.classList.add('font-bold');

      if (btnVisual) {
        btnVisual.classList.remove('bg-white', 'dark:bg-slate-900', 'text-tagsci-800', 'dark:text-tagsci-300', 'shadow-sm', 'font-bold');
        btnVisual.classList.add('font-medium', 'text-slate-600', 'dark:text-slate-400');
      }

      document.getElementById('pane-markdown-source')?.classList.remove('hidden');
      document.getElementById('pane-visual-blocks')?.classList.add('hidden');
      document.getElementById('visual-builder-toolbar')?.classList.add('hidden');

      if (STUDIO_DATA.stemReviewers[currentRevIndex]) {
        const compiled = compileBlocksToMarkdown(STUDIO_DATA.stemReviewers[currentRevIndex].blocks);
        STUDIO_DATA.stemReviewers[currentRevIndex].rawMarkdown = compiled;
        const bodyInput = document.getElementById('rev-input-body');
        if (bodyInput) bodyInput.value = compiled;
      }
      syncBlocksToPreview();
    });
  }

  // Study Materials Editor Mode Switches (Visual vs Source)
  const btnMatVisual = document.getElementById('btn-mat-mode-visual');
  const btnMatSource = document.getElementById('btn-mat-mode-source');

  if (btnMatVisual) {
    btnMatVisual.addEventListener('click', () => {
      btnMatVisual.classList.add('bg-white', 'dark:bg-slate-900', 'text-blue-700', 'dark:text-blue-300', 'shadow-sm');
      btnMatVisual.classList.remove('font-medium', 'text-slate-600', 'dark:text-slate-400');
      btnMatVisual.classList.add('font-bold');

      if (btnMatSource) {
        btnMatSource.classList.remove('bg-white', 'dark:bg-slate-900', 'text-blue-700', 'dark:text-blue-300', 'shadow-sm', 'font-bold');
        btnMatSource.classList.add('font-medium', 'text-slate-600', 'dark:text-slate-400');
      }

      document.getElementById('mat-pane-visual-blocks')?.classList.remove('hidden');
      document.getElementById('mat-pane-markdown-source')?.classList.add('hidden');
      document.getElementById('mat-visual-builder-toolbar')?.classList.remove('hidden');

      const rawMd = document.getElementById('mat-input-body')?.value || '';
      const mats = STUDIO_DATA.studyMaterials || [];
      if (mats[currentMatIndex]) {
        mats[currentMatIndex].rawMarkdown = rawMd;
        mats[currentMatIndex].blocks = parseMarkdownIntoBlocks(rawMd);
      }
      renderMaterialBlockCanvas();
      syncMaterialBlocksToPreview();
    });
  }

  if (btnMatSource) {
    btnMatSource.addEventListener('click', () => {
      btnMatSource.classList.add('bg-white', 'dark:bg-slate-900', 'text-blue-700', 'dark:text-blue-300', 'shadow-sm');
      btnMatSource.classList.remove('font-medium', 'text-slate-600', 'dark:text-slate-400');
      btnMatSource.classList.add('font-bold');

      if (btnMatVisual) {
        btnMatVisual.classList.remove('bg-white', 'dark:bg-slate-900', 'text-blue-700', 'dark:text-blue-300', 'shadow-sm', 'font-bold');
        btnMatVisual.classList.add('font-medium', 'text-slate-600', 'dark:text-slate-400');
      }

      document.getElementById('mat-pane-markdown-source')?.classList.remove('hidden');
      document.getElementById('mat-pane-visual-blocks')?.classList.add('hidden');
      document.getElementById('mat-visual-builder-toolbar')?.classList.add('hidden');

      const mats = STUDIO_DATA.studyMaterials || [];
      if (mats[currentMatIndex]) {
        const compiled = compileBlocksToMarkdown(mats[currentMatIndex].blocks);
        mats[currentMatIndex].rawMarkdown = compiled;
        const bodyInput = document.getElementById('mat-input-body');
        if (bodyInput) bodyInput.value = compiled;
      }
      syncMaterialBlocksToPreview();
    });
  }

  // Reviewers inputs and actions
  document.getElementById('rev-input-body')?.addEventListener('input', () => {
    const raw = document.getElementById('rev-input-body').value;
    const revs = STUDIO_DATA.stemReviewers || [];
    if (revs[currentRevIndex]) {
      revs[currentRevIndex].rawMarkdown = raw;
    }
    syncBlocksToPreview();
  });

  document.getElementById('rev-input-title')?.addEventListener('input', () => {
    syncBlocksToPreview();
    renderReviewersList();
    updateBreadcrumbs('reviewers');
    renderHubDashboard();
  });

  document.getElementById('rev-input-summary')?.addEventListener('input', () => {
    syncBlocksToPreview();
    renderReviewersList();
    renderHubDashboard();
  });

  document.getElementById('rev-input-subject')?.addEventListener('change', () => {
    const subj = document.getElementById('rev-input-subject').value;
    const meta = getSubjectClassification(subj);
    const tagEl = document.getElementById('rev-input-tag');
    if (tagEl && !tagEl.value) tagEl.value = meta.type || 'Main';
    const revs = STUDIO_DATA.stemReviewers || [];
    if (revs[currentRevIndex]) {
      revs[currentRevIndex].color = meta.color || 'border-l-4 border-tagsci-600';
    }
    syncBlocksToPreview();
    renderReviewersList();
    updateBreadcrumbs('reviewers');
    renderHubDashboard();
  });

  document.getElementById('rev-input-tag')?.addEventListener('change', () => {
    syncBlocksToPreview();
    renderReviewersList();
  });

  document.getElementById('rev-search')?.addEventListener('input', renderReviewersList);

  document.getElementById('btn-add-reviewer')?.addEventListener('click', () => {
    window.createQuickReviewer();
  });

  document.getElementById('btn-delete-rev')?.addEventListener('click', () => {
    if (!STUDIO_DATA.stemReviewers || STUDIO_DATA.stemReviewers.length === 0) {
      window.showToast('No reviewers to delete.');
      return;
    }
    if (confirm('Are you sure you want to delete this reviewer note?')) {
      STUDIO_DATA.stemReviewers.splice(currentRevIndex, 1);
      if (currentRevIndex >= STUDIO_DATA.stemReviewers.length) {
        setCurrentRevIndex(Math.max(0, STUDIO_DATA.stemReviewers.length - 1));
      }
      renderReviewersList();
      loadReviewerToEditor();
      updateBreadcrumbs('reviewers');
      renderHubDashboard();
      window.showToast('Reviewer draft removed.');
    }
  });

  // Study Materials inputs
  document.getElementById('mat-input-body')?.addEventListener('input', () => {
    const raw = document.getElementById('mat-input-body').value;
    const mats = STUDIO_DATA.studyMaterials || [];
    if (mats[currentMatIndex]) {
      mats[currentMatIndex].rawMarkdown = raw;
    }
    syncMaterialBlocksToPreview();
  });

  document.getElementById('mat-input-title')?.addEventListener('input', () => {
    syncMaterialBlocksToPreview();
    updateBreadcrumbs('materials');
    renderHubDashboard();
  });

  document.getElementById('mat-input-summary')?.addEventListener('input', () => {
    syncMaterialBlocksToPreview();
    renderHubDashboard();
  });

  document.getElementById('mat-input-subject')?.addEventListener('change', () => {
    const subj = document.getElementById('mat-input-subject').value;
    const meta = getSubjectClassification(subj);
    const tagEl = document.getElementById('mat-input-tag');
    if (tagEl && !tagEl.value) tagEl.value = 'Study Material';
    const mats = STUDIO_DATA.studyMaterials || [];
    if (mats[currentMatIndex]) {
      mats[currentMatIndex].color = meta.color || 'border-l-4 border-blue-500';
    }
    syncMaterialBlocksToPreview();
    renderMaterialsList();
    updateBreadcrumbs('materials');
    renderHubDashboard();
  });

  document.getElementById('mat-input-tag')?.addEventListener('change', syncMaterialBlocksToPreview);
  document.getElementById('mat-search')?.addEventListener('input', renderMaterialsList);

  document.getElementById('btn-add-material')?.addEventListener('click', () => {
    createQuickMaterial();
  });

  document.getElementById('btn-delete-mat')?.addEventListener('click', () => {
    if (!STUDIO_DATA.studyMaterials || STUDIO_DATA.studyMaterials.length === 0) {
      window.showToast('No study materials to delete.');
      return;
    }
    STUDIO_DATA.studyMaterials.splice(currentMatIndex, 1);
    if (currentMatIndex >= STUDIO_DATA.studyMaterials.length) {
      setCurrentMatIndex(Math.max(0, STUDIO_DATA.studyMaterials.length - 1));
    }
    renderMaterialsList();
    loadMaterialToEditor();
    updateBreadcrumbs('materials');
    renderHubDashboard();
    window.showToast('Study material draft removed.');
  });

  // Quiz Sets Listeners
  document.getElementById('btn-add-question')?.addEventListener('click', () => {
    addQuestionBlock('mcq');
    renderHubDashboard();
  });
  document.getElementById('btn-reset-quiz-preview')?.addEventListener('click', resetLiveTester);

  document.getElementById('quiz-input-title')?.addEventListener('input', (e) => {
    if (!STUDIO_DATA.quizSets || !STUDIO_DATA.quizSets[currentQuizSetIndex]) return;
    STUDIO_DATA.quizSets[currentQuizSetIndex].title = e.target.value;
    renderQuizSetsList();
    updateBreadcrumbs('quizzes');
    renderHubDashboard();
  });

  document.getElementById('quiz-input-subject')?.addEventListener('change', (e) => {
    if (!STUDIO_DATA.quizSets || !STUDIO_DATA.quizSets[currentQuizSetIndex]) return;
    STUDIO_DATA.quizSets[currentQuizSetIndex].subject = e.target.value;
    const classification = getSubjectClassification(e.target.value);
    STUDIO_DATA.quizSets[currentQuizSetIndex].tag = classification.type;
    renderQuizSetsList();
    updateBreadcrumbs('quizzes');
    renderHubDashboard();
  });

  document.getElementById('quiz-input-timelimit')?.addEventListener('input', (e) => {
    if (!STUDIO_DATA.quizSets || !STUDIO_DATA.quizSets[currentQuizSetIndex]) return;
    STUDIO_DATA.quizSets[currentQuizSetIndex].timeLimitMinutes = parseInt(e.target.value) || 15;
  });

  document.getElementById('btn-add-quiz-set')?.addEventListener('click', () => {
    createQuickQuizSet();
  });

  document.getElementById('btn-delete-quiz-set')?.addEventListener('click', () => {
    if (!STUDIO_DATA.quizSets || STUDIO_DATA.quizSets.length === 0) {
      window.showToast('No quiz sets to delete.');
      return;
    }
    STUDIO_DATA.quizSets.splice(currentQuizSetIndex, 1);
    if (currentQuizSetIndex >= STUDIO_DATA.quizSets.length) {
      setCurrentQuizSetIndex(Math.max(0, STUDIO_DATA.quizSets.length - 1));
    }
    renderQuizSetsList();
    loadQuizSetToEditor();
    updateBreadcrumbs('quizzes');
    renderHubDashboard();
    window.showToast('Quiz bank removed.');
  });

  // Calendar Listeners
  document.getElementById('calendar-event-form')?.addEventListener('submit', (e) => {
    handleAddCalendarEvent(e);
    renderHubDashboard();
  });

  // Markdown Export & Hub Download Listeners
  document.getElementById('btn-download-md-rev')?.addEventListener('click', exportReviewerMarkdown);
  document.getElementById('btn-download-md-quiz')?.addEventListener('click', exportQuizSetMarkdown);
  document.getElementById('btn-hub-download-json')?.addEventListener('click', exportUpdatesJson);
  document.getElementById('btn-hub-copy-json')?.addEventListener('click', copyUpdatesJson);
  document.getElementById('btn-test-ota-hub')?.addEventListener('click', pingOtaEndpoint);

  // GitHub Direct Publisher Event Listeners
  document.getElementById('btn-gh-test-auth')?.addEventListener('click', testGitHubAccess);
  document.getElementById('btn-gh-push-direct')?.addEventListener('click', pushDirectUpdatesJsonToGitHub);
  document.getElementById('btn-gh-append-push')?.addEventListener('click', appendAndPushToGitHub);
  document.getElementById('btn-gh-clear-token')?.addEventListener('click', clearGitHubConfig);
  document.getElementById('btn-gh-toggle-token')?.addEventListener('click', toggleTokenVisibility);

  document.getElementById('file-import-input')?.addEventListener('change', (e) => {
    handleImportJsonFile(e, () => {
      setCurrentRevIndex(0);
      setCurrentQuizSetIndex(0);
      renderReviewersList();
      loadReviewerToEditor();
      renderQuizSetsList();
      loadQuizSetToEditor();
      renderCalendarEvents();
      renderHubDashboard();
      window.showToast('Successfully imported curriculum dataset!');
    });
  });

  // Theme Toggle
  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      }
    });
  }

  const themeBtnSidebar = document.getElementById('theme-btn-sidebar');
  if (themeBtnSidebar) {
    themeBtnSidebar.addEventListener('click', () => {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      }
    });
  }

  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Initial Rendering
  renderReviewersList();
  loadReviewerToEditor();
  renderMaterialsList();
  loadMaterialToEditor();
  renderQuizSetsList();
  loadQuizSetToEditor();
  renderCalendarEvents();
  renderHubDashboard();
  switchTab('hub'); // Start in Hub Dashboard by default
  if (window.lucide) window.lucide.createIcons();
});
