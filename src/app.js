/* =========================================================
   TagSci Content Studio - Main Application Bootstrap
   ========================================================= */

import { STUDIO_DATA, currentRevIndex, currentQuizSetIndex, currentEditorMode, setCurrentRevIndex, setCurrentQuizSetIndex, setCurrentEditorMode, getSubjectClassification } from './data/studio_data.js';
import { parseMathSyntax, renderMathInHtml, formatRichText, parseMarkdownToHtml } from './components/math_engine.js';
import { openMathBuilderModal, openMathBuilderForBlock, closeMathBuilderModal, switchMathSubTab, insertFormulaSnippet, setFullEquation, updateMathStudioPreview, confirmMathInsert, setLastFocusedInput } from './components/equation_modal.js';
import { compileBlocksToMarkdown, parseMarkdownIntoBlocks, renderReviewersList, loadReviewerToEditor, renderBlockCanvas, syncBlocksToPreview, updateBlockField, moveBlock, duplicateBlock, deleteBlock, addBulletItem, updateBulletItem, removeBulletItem, addContentBlock, loadLessonTemplate, applyTextFormatting } from './components/reviewer_studio.js';
import { renderQuizSetsList, loadQuizSetToEditor, renderQuestionsBuilder, renderLiveQuizTester, updateQuestionField, changeQuestionType, updateTrueFalse, toggleMultiSelectOption, moveQuestion, duplicateQuestion, addQuestionBlock, updateCorrectMcq, updateMcqOption, removeMcqOption, addMcqOption, deleteQuestion, checkTesterAnswer, checkTesterTrueFalse, checkTesterIdentification, checkTesterNumerical, toggleTesterMultiSelectOption, checkTesterMultiSelect, revealTesterFlashcard, nextTesterQ, prevTesterQ, resetLiveTester } from './components/quiz_studio.js';
import { renderCalendarEvents, deleteCalendarEvent, handleAddCalendarEvent } from './components/calendar_studio.js';
import { generateProductionJson, renderJsonHub, exportUpdatesJson, copyUpdatesJson, exportReviewerMarkdown, exportQuizSetMarkdown, handleImportJsonFile, pingOtaEndpoint } from './components/json_hub.js';

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
window.confirmMathInsert = (mode) => confirmMathInsert(mode, () => {
  renderBlockCanvas();
  syncBlocksToPreview();
});

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

// Tab Routing Controller
export function switchTab(tabId) {
  document.querySelectorAll('.studio-tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active', 'bg-tagsci-50', 'dark:bg-tagsci-950/80', 'text-tagsci-800', 'dark:text-tagsci-300', 'border', 'border-tagsci-200', 'dark:border-tagsci-800', 'shadow-sm');
      btn.classList.remove('text-slate-600', 'dark:text-slate-400');
    } else {
      btn.classList.remove('active', 'bg-tagsci-50', 'dark:bg-tagsci-950/80', 'text-tagsci-800', 'dark:text-tagsci-300', 'border', 'border-tagsci-200', 'dark:border-tagsci-800', 'shadow-sm');
      btn.classList.add('text-slate-600', 'dark:text-slate-400');
    }
  });

  document.querySelectorAll('.studio-view').forEach(view => {
    if (view.id === `view-${tabId}`) {
      view.classList.remove('hidden');
    } else {
      view.classList.add('hidden');
    }
  });

  if (tabId === 'json-hub') {
    renderJsonHub();
  }
}

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

  // Dropdown close on outside click
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('add-block-menu');
    const btn = document.getElementById('btn-add-block-dropdown');
    if (menu && !menu.classList.contains('hidden')) {
      if (!menu.contains(e.target) && !btn?.contains(e.target)) {
        menu.classList.add('hidden');
      }
    }
  });

  // Header quick actions
  const btnExport = document.getElementById('btn-quick-export');
  if (btnExport) btnExport.addEventListener('click', exportUpdatesJson);

  const btnCopy = document.getElementById('btn-copy-json');
  if (btnCopy) btnCopy.addEventListener('click', copyUpdatesJson);

  // Tabs routing
  const tabsContainer = document.getElementById('studio-tabs');
  if (tabsContainer) {
    tabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.studio-tab-btn');
      if (btn) switchTab(btn.dataset.tab);
    });
  }

  // Reviewer Editor Mode Switches (Visual vs Source)
  const btnVisual = document.getElementById('btn-mode-visual');
  const btnSource = document.getElementById('btn-mode-source');

  if (btnVisual) {
    btnVisual.addEventListener('click', () => {
      setCurrentEditorMode('visual');
      btnVisual.classList.add('bg-white', 'dark:bg-slate-900', 'text-tagsci-800', 'dark:text-tagsci-300', 'shadow-sm');
      if (btnSource) btnSource.classList.remove('bg-white', 'dark:bg-slate-900', 'text-tagsci-800', 'dark:text-tagsci-300', 'shadow-sm');
      document.getElementById('pane-visual-blocks')?.classList.remove('hidden');
      document.getElementById('pane-markdown-source')?.classList.add('hidden');
      document.getElementById('visual-builder-toolbar')?.classList.remove('hidden');

      const rawMd = document.getElementById('rev-input-body')?.value || '';
      STUDIO_DATA.stemReviewers[currentRevIndex].blocks = parseMarkdownIntoBlocks(rawMd);
      renderBlockCanvas();
    });
  }

  if (btnSource) {
    btnSource.addEventListener('click', () => {
      setCurrentEditorMode('source');
      btnSource.classList.add('bg-white', 'dark:bg-slate-900', 'text-tagsci-800', 'dark:text-tagsci-300', 'shadow-sm');
      if (btnVisual) btnVisual.classList.remove('bg-white', 'dark:bg-slate-900', 'text-tagsci-800', 'dark:text-tagsci-300', 'shadow-sm');
      document.getElementById('pane-markdown-source')?.classList.remove('hidden');
      document.getElementById('pane-visual-blocks')?.classList.add('hidden');
      document.getElementById('visual-builder-toolbar')?.classList.add('hidden');
    });
  }

  // Reviewer inputs
  document.getElementById('rev-input-body')?.addEventListener('input', () => {
    const raw = document.getElementById('rev-input-body').value;
    STUDIO_DATA.stemReviewers[currentRevIndex].rawMarkdown = raw;
    syncBlocksToPreview();
  });

  document.getElementById('rev-input-title')?.addEventListener('input', syncBlocksToPreview);
  document.getElementById('rev-input-summary')?.addEventListener('input', syncBlocksToPreview);
  document.getElementById('rev-input-subject')?.addEventListener('change', () => {
    const subj = document.getElementById('rev-input-subject').value;
    const meta = getSubjectClassification(subj);
    const tagEl = document.getElementById('rev-input-tag');
    if (tagEl) tagEl.value = meta.type;
    if (STUDIO_DATA.stemReviewers[currentRevIndex]) {
      STUDIO_DATA.stemReviewers[currentRevIndex].color = meta.color;
    }
    syncBlocksToPreview();
    renderReviewersList();
  });
  document.getElementById('rev-input-tag')?.addEventListener('change', syncBlocksToPreview);
  document.getElementById('rev-search')?.addEventListener('input', renderReviewersList);

  document.getElementById('btn-add-reviewer')?.addEventListener('click', () => {
    const newRev = {
      id: `reviewer_${Date.now()}`,
      subject: "Physics",
      tag: "Elective",
      color: "border-l-4 border-tagsci-600",
      title: "New Reviewer Draft",
      summary: "Enter short summary...",
      blocks: [
        { type: 'heading', level: 'h3', text: 'Topic Introduction' },
        { type: 'paragraph', text: 'Start typing concepts or insert a template from the toolbar.' }
      ],
      rawMarkdown: "",
      content: ""
    };
    STUDIO_DATA.stemReviewers.unshift(newRev);
    setCurrentRevIndex(0);
    renderReviewersList();
    loadReviewerToEditor();
    window.showToast('New reviewer draft created!');
  });

  document.getElementById('btn-delete-rev')?.addEventListener('click', () => {
    if (STUDIO_DATA.stemReviewers.length <= 1) {
      window.showToast('At least 1 reviewer must remain in session.');
      return;
    }
    STUDIO_DATA.stemReviewers.splice(currentRevIndex, 1);
    setCurrentRevIndex(0);
    renderReviewersList();
    loadReviewerToEditor();
    window.showToast('Reviewer draft removed.');
  });

  // Quiz Sets Listeners
  document.getElementById('btn-add-question')?.addEventListener('click', () => addQuestionBlock('mcq'));
  document.getElementById('btn-reset-quiz-preview')?.addEventListener('click', resetLiveTester);

  document.getElementById('quiz-input-title')?.addEventListener('input', (e) => {
    if (!STUDIO_DATA.quizSets[currentQuizSetIndex]) return;
    STUDIO_DATA.quizSets[currentQuizSetIndex].title = e.target.value;
    renderQuizSetsList();
  });

  document.getElementById('quiz-input-subject')?.addEventListener('change', (e) => {
    if (!STUDIO_DATA.quizSets[currentQuizSetIndex]) return;
    STUDIO_DATA.quizSets[currentQuizSetIndex].subject = e.target.value;
    const classification = getSubjectClassification(e.target.value);
    STUDIO_DATA.quizSets[currentQuizSetIndex].tag = classification.type;
    renderQuizSetsList();
  });

  document.getElementById('quiz-input-timelimit')?.addEventListener('input', (e) => {
    if (!STUDIO_DATA.quizSets[currentQuizSetIndex]) return;
    STUDIO_DATA.quizSets[currentQuizSetIndex].timeLimitMinutes = parseInt(e.target.value) || 15;
  });

  document.getElementById('btn-add-quiz-set')?.addEventListener('click', () => {
    const newSet = {
      id: `quiz_${Date.now()}`,
      subject: 'Effective Communications',
      tag: 'Main',
      title: '',
      desc: '',
      timeLimitMinutes: 15,
      questions: []
    };
    STUDIO_DATA.quizSets.push(newSet);
    setCurrentQuizSetIndex(STUDIO_DATA.quizSets.length - 1);
    renderQuizSetsList();
    loadQuizSetToEditor();
    window.showToast('New quiz set created!');
  });

  document.getElementById('btn-delete-quiz-set')?.addEventListener('click', () => {
    if (STUDIO_DATA.quizSets.length <= 1) {
      STUDIO_DATA.quizSets = [{
        id: `quiz_${Date.now()}`,
        subject: 'Effective Communications',
        tag: 'Main',
        title: '',
        desc: '',
        timeLimitMinutes: 15,
        questions: []
      }];
      setCurrentQuizSetIndex(0);
      renderQuizSetsList();
      loadQuizSetToEditor();
      window.showToast('Quiz set reset.');
      return;
    }
    STUDIO_DATA.quizSets.splice(currentQuizSetIndex, 1);
    if (currentQuizSetIndex >= STUDIO_DATA.quizSets.length) {
      setCurrentQuizSetIndex(STUDIO_DATA.quizSets.length - 1);
    }
    renderQuizSetsList();
    loadQuizSetToEditor();
    window.showToast('Quiz set deleted.');
  });

  // Calendar Listeners
  document.getElementById('calendar-event-form')?.addEventListener('submit', handleAddCalendarEvent);

  // Markdown Export & Hub Download Listeners
  document.getElementById('btn-download-md-rev')?.addEventListener('click', exportReviewerMarkdown);
  document.getElementById('btn-download-md-quiz')?.addEventListener('click', exportQuizSetMarkdown);
  document.getElementById('btn-export-json-hub')?.addEventListener('click', exportUpdatesJson);
  document.getElementById('btn-copy-json-hub')?.addEventListener('click', copyUpdatesJson);
  document.getElementById('btn-test-ota-hub')?.addEventListener('click', pingOtaEndpoint);

  document.getElementById('file-import-input')?.addEventListener('change', (e) => {
    handleImportJsonFile(e, () => {
      setCurrentRevIndex(0);
      setCurrentQuizSetIndex(0);
      renderReviewersList();
      loadReviewerToEditor();
      renderQuizSetsList();
      loadQuizSetToEditor();
      renderCalendarEvents();
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

  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Initial Rendering
  renderReviewersList();
  loadReviewerToEditor();
  renderQuizSetsList();
  loadQuizSetToEditor();
  renderCalendarEvents();
  if (window.lucide) window.lucide.createIcons();
});
