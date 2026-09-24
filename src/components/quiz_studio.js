/* =========================================================
   TagSci Content Studio - Quiz & Drill Studio
   ========================================================= */

import { STUDIO_DATA, currentQuizSetIndex, setCurrentQuizSetIndex, getSubjectClassification } from '../data/studio_data.js';
import { renderMathInHtml } from './math_engine.js';

let testerQuestionIdx = 0;
let testerRevealed = false;
let testerSelectedMulti = [];

export function renderQuizSetsList() {
  const container = document.getElementById('quiz-sets-container');
  const badgeCount = document.getElementById('badge-count-quiz');
  const countLabel = document.getElementById('quiz-list-count');

  const sets = STUDIO_DATA.quizSets || [];
  if (badgeCount) badgeCount.innerText = sets.length;
  if (countLabel) countLabel.innerText = `(${sets.length} sets)`;

  if (!container) return;
  container.innerHTML = '';

  if (sets.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-400 text-xs">
        <i data-lucide="brain-circuit" class="w-7 h-7 mx-auto mb-1.5 opacity-40"></i>
        <p class="font-medium text-slate-500 dark:text-slate-400">No quiz banks drafted yet.</p>
        <p class="text-[10px] text-slate-400 mt-1">Click "+ New Quiz Set" above or in the Hub to create one.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  sets.forEach((set, idx) => {
    const isActive = idx === currentQuizSetIndex;
    const card = document.createElement('div');
    card.className = `p-3 rounded-xl border cursor-pointer transition-all ${
      isActive
        ? 'bg-g11pink-50/80 dark:bg-g11pink-950/70 border-g11pink-500 shadow-sm'
        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
    }`;
    const qCount = set.questions ? set.questions.length : 0;
    card.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] font-black uppercase tracking-wider text-g11pink-600 dark:text-g11pink-400">${set.subject || 'General Math'}</span>
        <span class="text-[9.5px] px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${qCount} Qs</span>
      </div>
      <h4 class="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">${set.title || 'Untitled Quiz'}</h4>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">${set.desc || 'No description...'}</p>
    `;
    card.onclick = () => {
      setCurrentQuizSetIndex(idx);
      loadQuizSetToEditor();
      renderQuizSetsList();
    };
    container.appendChild(card);
  });
  if (window.lucide) window.lucide.createIcons();
}

export function loadQuizSetToEditor() {
  const sets = STUDIO_DATA.quizSets || [];
  const set = sets[currentQuizSetIndex];

  const subjEl = document.getElementById('quiz-input-subject');
  const titleEl = document.getElementById('quiz-input-title');
  const timeEl = document.getElementById('quiz-input-timelimit');

  if (!set) {
    if (titleEl) titleEl.value = '';
    if (timeEl) timeEl.value = 15;
    renderQuestionsBuilder();
    renderLiveQuizTester();
    return;
  }

  if (subjEl) subjEl.value = set.subject || 'Effective Communications';
  if (titleEl) titleEl.value = set.title || '';
  if (timeEl) timeEl.value = set.timeLimitMinutes || 15;

  renderQuestionsBuilder();
  renderLiveQuizTester();
}

export function renderQuestionsBuilder() {
  const sets = STUDIO_DATA.quizSets || [];
  const set = sets[currentQuizSetIndex];
  const container = document.getElementById('questions-builder-container');
  const badge = document.getElementById('question-count-badge');
  if (!container) return;

  if (!set || !set.questions || set.questions.length === 0) {
    if (badge) badge.innerText = '0 Questions';
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
        <i data-lucide="help-circle" class="w-8 h-8 mx-auto text-slate-400 opacity-60"></i>
        <p class="font-bold text-slate-700 dark:text-slate-200">No Questions in this Bank</p>
        <p class="text-[11px] text-slate-400 max-w-xs mx-auto">Click any question type button above to add Multiple Choice, True/False, Identification, Numerical, Multi-Select, or Flashcards.</p>
        <button onclick="window.addQuestionBlock('mcq')" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-g11pink-600 hover:bg-g11pink-700 text-white text-xs font-bold shadow-sm transition-all">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Multiple Choice
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (badge) badge.innerText = `${set.questions.length} Questions`;

  container.innerHTML = '';
  set.questions.forEach((q, qIdx) => {
    const qCard = document.createElement('div');
    qCard.className = 'p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm hover:border-g11pink-300 dark:hover:border-g11pink-800 transition-all';
    
    let typeSpecificHtml = '';
    if (q.type === 'mcq') {
      typeSpecificHtml = `
        <div class="space-y-2">
          <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Choices (Select correct answer radio):</label>
          ${(q.options || []).map((opt, oIdx) => `
            <div class="flex items-center gap-2">
              <input type="radio" name="q_correct_${qIdx}" ${q.answerIndex === oIdx ? 'checked' : ''} onchange="window.updateCorrectMcq(${qIdx}, ${oIdx})" class="text-g11pink-600 focus:ring-g11pink-500">
              <input type="text" value="${opt}" oninput="window.updateMcqOption(${qIdx}, ${oIdx}, this.value)" placeholder="Option ${oIdx + 1}" class="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
              <button onclick="window.removeMcqOption(${qIdx}, ${oIdx})" class="text-slate-400 hover:text-red-500 p-1"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
            </div>
          `).join('')}
          <button onclick="window.addMcqOption(${qIdx})" class="text-[11px] font-bold text-g11pink-600 dark:text-g11pink-400 hover:underline inline-flex items-center gap-1 mt-1">
            + Add Option
          </button>
        </div>
      `;
    } else if (q.type === 'true_false') {
      typeSpecificHtml = `
        <div class="space-y-2">
          <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Correct Answer:</label>
          <div class="flex items-center gap-3">
            <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <input type="radio" name="tf_${qIdx}" ${q.answerBoolean === true || q.answerBoolean === 'true' ? 'checked' : ''} onchange="window.updateTrueFalse(${qIdx}, true)" class="text-emerald-600">
              True
            </label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-rose-600 dark:text-rose-400">
              <input type="radio" name="tf_${qIdx}" ${q.answerBoolean === false || q.answerBoolean === 'false' ? 'checked' : ''} onchange="window.updateTrueFalse(${qIdx}, false)" class="text-rose-600">
              False
            </label>
          </div>
        </div>
      `;
    } else if (q.type === 'identification') {
      typeSpecificHtml = `
        <div class="space-y-2">
          <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Correct Answer Text (Case-insensitive):</label>
          <input type="text" value="${q.correctText || ''}" oninput="window.updateQuestionField(${qIdx}, 'correctText', this.value)" placeholder="Primary exact answer..." class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white">
          <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Accepted Aliases (Comma-separated):</label>
          <input type="text" value="${q.aliases || ''}" oninput="window.updateQuestionField(${qIdx}, 'aliases', this.value)" placeholder="Alternative spellings or aliases (e.g. dna, deoxyribonucleic acid)" class="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
        </div>
      `;
    } else if (q.type === 'numerical') {
      typeSpecificHtml = `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Value</label>
            <input type="text" value="${q.correctValue || ''}" oninput="window.updateQuestionField(${qIdx}, 'correctValue', this.value)" placeholder="e.g. 9.8" class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold">
          </div>
          <div>
            <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tolerance (&plusmn;)</label>
            <input type="text" value="${q.tolerance || '0.05'}" oninput="window.updateQuestionField(${qIdx}, 'tolerance', this.value)" placeholder="0.05" class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
          </div>
          <div>
            <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unit (Optional)</label>
            <input type="text" value="${q.unit || ''}" oninput="window.updateQuestionField(${qIdx}, 'unit', this.value)" placeholder="m/s^2" class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono">
          </div>
        </div>
      `;
    } else if (q.type === 'multi_select') {
      typeSpecificHtml = `
        <div class="space-y-2">
          <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Options (Check all correct answers):</label>
          ${(q.options || []).map((opt, oIdx) => {
            const isChecked = (q.answerIndices || []).includes(oIdx);
            return `
              <div class="flex items-center gap-2">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="window.toggleMultiSelectOption(${qIdx}, ${oIdx})" class="rounded text-g11pink-600 focus:ring-g11pink-500">
                <input type="text" value="${opt}" oninput="window.updateMcqOption(${qIdx}, ${oIdx}, this.value)" placeholder="Option ${oIdx + 1}" class="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                <button onclick="window.removeMcqOption(${qIdx}, ${oIdx})" class="text-slate-400 hover:text-red-500 p-1"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
              </div>
            `;
          }).join('')}
          <button onclick="window.addMcqOption(${qIdx})" class="text-[11px] font-bold text-g11pink-600 dark:text-g11pink-400 hover:underline inline-flex items-center gap-1 mt-1">
            + Add Option
          </button>
        </div>
      `;
    } else if (q.type === 'flashcard') {
      typeSpecificHtml = `
        <div class="space-y-2">
          <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Flashcard Prompt / Front Text:</label>
          <textarea rows="2" oninput="window.updateQuestionField(${qIdx}, 'front', this.value); window.updateQuestionField(${qIdx}, 'prompt', this.value)" placeholder="Front side question or term..." class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">${q.front || q.prompt || ''}</textarea>
          <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Flashcard Back / Definition / Formula:</label>
          <textarea rows="2" oninput="window.updateQuestionField(${qIdx}, 'back', this.value)" placeholder="Back side answer, formula or definition..." class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">${q.back || ''}</textarea>
        </div>
      `;
    }

    qCard.innerHTML = `
      <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700">
        <div class="flex items-center gap-2">
          <span class="text-xs font-black text-slate-700 dark:text-slate-300">Q${qIdx + 1}</span>
          <select onchange="window.changeQuestionType(${qIdx}, this.value)" class="text-xs font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-g11pink-600 dark:text-g11pink-400">
            <option value="mcq" ${q.type === 'mcq' ? 'selected' : ''}>Multiple Choice</option>
            <option value="true_false" ${q.type === 'true_false' ? 'selected' : ''}>True / False</option>
            <option value="identification" ${q.type === 'identification' ? 'selected' : ''}>Identification</option>
            <option value="numerical" ${q.type === 'numerical' ? 'selected' : ''}>Numerical</option>
            <option value="multi_select" ${q.type === 'multi_select' ? 'selected' : ''}>Multi-Select</option>
            <option value="flashcard" ${q.type === 'flashcard' ? 'selected' : ''}>Flashcard</option>
          </select>
          <input type="text" value="${q.topic || ''}" oninput="window.updateQuestionField(${qIdx}, 'topic', this.value)" placeholder="Topic label..." class="px-2 py-0.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md w-36">
        </div>

        <div class="flex items-center gap-1">
          <button onclick="window.moveQuestion(${qIdx}, -1)" ${qIdx === 0 ? 'disabled' : ''} title="Move Up" class="p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors">
            <i data-lucide="arrow-up" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="window.moveQuestion(${qIdx}, 1)" ${qIdx === set.questions.length - 1 ? 'disabled' : ''} title="Move Down" class="p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors">
            <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="window.duplicateQuestion(${qIdx})" title="Duplicate Question" class="p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="window.deleteQuestion(${qIdx})" title="Delete Question" class="p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Question Prompt (Supports $LaTeX$):</label>
          <button onclick="window.openMathBuilderModal()" class="text-[10px] text-tagsci-700 dark:text-tagsci-400 hover:underline inline-flex items-center gap-0.5 font-bold">
            <i data-lucide="function-square" class="w-3 h-3"></i> Insert Math
          </button>
        </div>
        <textarea rows="2" oninput="window.updateQuestionField(${qIdx}, 'prompt', this.value)" placeholder="Enter question..." class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">${q.prompt || ''}</textarea>
      </div>

      ${typeSpecificHtml}

      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Solution / Step-by-Step Explanation:</label>
          <button onclick="window.openMathBuilderModal()" class="text-[10px] text-tagsci-700 dark:text-tagsci-400 hover:underline inline-flex items-center gap-0.5 font-bold">
            <i data-lucide="function-square" class="w-3 h-3"></i> Insert Math
          </button>
        </div>
        <textarea rows="2" oninput="window.updateQuestionField(${qIdx}, 'explanation', this.value)" placeholder="Explanation shown to student after answering..." class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">${q.explanation || ''}</textarea>
      </div>
    `;
    container.appendChild(qCard);
  });
  if (window.lucide) window.lucide.createIcons();
}

export function updateQuestionField(qIdx, field, val) {
  const set = STUDIO_DATA.quizSets[currentQuizSetIndex];
  if (set && set.questions && set.questions[qIdx]) {
    set.questions[qIdx][field] = val;
    renderLiveQuizTester();
  }
}

export function changeQuestionType(qIdx, type) {
  const q = STUDIO_DATA.quizSets[currentQuizSetIndex].questions[qIdx];
  if (!q) return;
  q.type = type;
  if ((type === 'mcq' || type === 'multi_select') && (!q.options || q.options.length === 0)) {
    q.options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
    q.answerIndex = 0;
    q.answerIndices = [0];
  }
  if (type === 'true_false' && q.answerBoolean === undefined) {
    q.answerBoolean = true;
  }
  renderQuestionsBuilder();
  renderLiveQuizTester();
}

export function updateTrueFalse(qIdx, boolVal) {
  STUDIO_DATA.quizSets[currentQuizSetIndex].questions[qIdx].answerBoolean = boolVal;
  renderQuestionsBuilder();
  renderLiveQuizTester();
}

export function toggleMultiSelectOption(qIdx, oIdx) {
  const q = STUDIO_DATA.quizSets[currentQuizSetIndex].questions[qIdx];
  if (!q) return;
  if (!q.answerIndices) q.answerIndices = [];
  const pos = q.answerIndices.indexOf(oIdx);
  if (pos > -1) q.answerIndices.splice(pos, 1);
  else q.answerIndices.push(oIdx);
  renderQuestionsBuilder();
  renderLiveQuizTester();
}

export function moveQuestion(qIdx, dir) {
  const set = STUDIO_DATA.quizSets[currentQuizSetIndex];
  if (!set) return;
  const target = qIdx + dir;
  if (target < 0 || target >= set.questions.length) return;
  const temp = set.questions[qIdx];
  set.questions[qIdx] = set.questions[target];
  set.questions[target] = temp;
  renderQuestionsBuilder();
  renderLiveQuizTester();
}

export function duplicateQuestion(qIdx) {
  const set = STUDIO_DATA.quizSets[currentQuizSetIndex];
  if (!set) return;
  const clone = JSON.parse(JSON.stringify(set.questions[qIdx]));
  set.questions.splice(qIdx + 1, 0, clone);
  renderQuestionsBuilder();
  renderLiveQuizTester();
  renderQuizSetsList();
  if (window.showToast) window.showToast('Question duplicated!');
}

export function addQuestionBlock(type) {
  let newQ = null;
  if (type === 'mcq') {
    newQ = {
      type: 'mcq',
      topic: 'Multiple Choice',
      prompt: '',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      answerIndex: 0,
      correctValue: '',
      tolerance: '0.05',
      front: '',
      back: '',
      explanation: ''
    };
  } else if (type === 'true_false') {
    newQ = {
      type: 'true_false',
      topic: 'True or False',
      prompt: '',
      answerBoolean: true,
      explanation: ''
    };
  } else if (type === 'identification') {
    newQ = {
      type: 'identification',
      topic: 'Identification',
      prompt: '',
      correctText: '',
      aliases: '',
      explanation: ''
    };
  } else if (type === 'numerical') {
    newQ = {
      type: 'numerical',
      topic: 'Numerical Calculation',
      prompt: '',
      options: [],
      answerIndex: 0,
      correctValue: '',
      tolerance: '0.05',
      unit: '',
      front: '',
      back: '',
      explanation: ''
    };
  } else if (type === 'multi_select') {
    newQ = {
      type: 'multi_select',
      topic: 'Multi-Select',
      prompt: '',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      answerIndices: [0],
      explanation: ''
    };
  } else if (type === 'flashcard') {
    newQ = {
      type: 'flashcard',
      topic: 'Flashcard',
      prompt: '',
      options: [],
      answerIndex: 0,
      correctValue: '',
      tolerance: '0.05',
      front: '',
      back: '',
      explanation: ''
    };
  }
  if (newQ) {
    if (!STUDIO_DATA.quizSets[currentQuizSetIndex]) {
      STUDIO_DATA.quizSets.push({
        id: `quiz_${Date.now()}`,
        subject: 'Effective Communications',
        tag: 'Main',
        title: '',
        desc: '',
        timeLimitMinutes: 15,
        questions: []
      });
      setCurrentQuizSetIndex(0);
    }
    STUDIO_DATA.quizSets[currentQuizSetIndex].questions.push(newQ);
    renderQuestionsBuilder();
    renderLiveQuizTester();
    renderQuizSetsList();
    if (window.showToast) window.showToast(`Added ${type.toUpperCase().replace('_', ' ')} question!`);
  }
}

export function updateCorrectMcq(qIdx, oIdx) {
  STUDIO_DATA.quizSets[currentQuizSetIndex].questions[qIdx].answerIndex = oIdx;
  renderLiveQuizTester();
}

export function updateMcqOption(qIdx, oIdx, val) {
  STUDIO_DATA.quizSets[currentQuizSetIndex].questions[qIdx].options[oIdx] = val;
  renderLiveQuizTester();
}

export function removeMcqOption(qIdx, oIdx) {
  const q = STUDIO_DATA.quizSets[currentQuizSetIndex].questions[qIdx];
  if (!q) return;
  if (q.options.length <= 2) {
    if (window.showToast) window.showToast('At least 2 options required.');
    return;
  }
  q.options.splice(oIdx, 1);
  if (q.answerIndex >= q.options.length) q.answerIndex = 0;
  if (q.answerIndices) {
    q.answerIndices = q.answerIndices.filter(i => i !== oIdx).map(i => i > oIdx ? i - 1 : i);
  }
  renderQuestionsBuilder();
  renderLiveQuizTester();
}

export function addMcqOption(qIdx) {
  const q = STUDIO_DATA.quizSets[currentQuizSetIndex].questions[qIdx];
  if (!q) return;
  q.options.push(`Option ${q.options.length + 1}`);
  renderQuestionsBuilder();
  renderLiveQuizTester();
}

export function deleteQuestion(qIdx) {
  const set = (STUDIO_DATA.quizSets || [])[currentQuizSetIndex];
  if (!set || !set.questions) return;
  set.questions.splice(qIdx, 1);
  renderQuestionsBuilder();
  renderLiveQuizTester();
  renderQuizSetsList();
}

export function renderLiveQuizTester() {
  const set = STUDIO_DATA.quizSets[currentQuizSetIndex];
  const container = document.getElementById('quiz-interactive-preview');
  if (!container) return;

  if (!set || set.questions.length === 0) {
    container.innerHTML = `
      <div class="text-slate-400 text-xs">
        <i data-lucide="help-circle" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
        Add questions on the left to test the interactive drill here!
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (testerQuestionIdx >= set.questions.length) testerQuestionIdx = 0;
  const q = set.questions[testerQuestionIdx];

  let testerBodyHtml = '';

  if (q.type === 'mcq') {
    testerBodyHtml = `
      <div class="space-y-1.5 mb-3">
        ${(q.options || []).map((opt, i) => `
          <button onclick="window.checkTesterAnswer(${i})" class="w-full text-left p-2 rounded-lg text-xs font-semibold border transition-all ${
            testerRevealed
              ? (i === q.answerIndex
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500')
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-g11pink-400 text-slate-800 dark:text-slate-200'
          }">
            <span class="font-mono mr-1">${String.fromCharCode(65 + i)}.</span> ${renderMathInHtml(opt)}
          </button>
        `).join('')}
      </div>
    `;
  } else if (q.type === 'true_false') {
    const isTrueCorrect = q.answerBoolean === true || q.answerBoolean === 'true';
    testerBodyHtml = `
      <div class="grid grid-cols-2 gap-2 mb-3">
        <button onclick="window.checkTesterTrueFalse(true)" class="p-2.5 rounded-xl font-bold text-xs border transition-all ${
          testerRevealed
            ? (isTrueCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400')
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200'
        }">
          ✓ TRUE
        </button>
        <button onclick="window.checkTesterTrueFalse(false)" class="p-2.5 rounded-xl font-bold text-xs border transition-all ${
          testerRevealed
            ? (!isTrueCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400')
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-red-500 text-slate-800 dark:text-slate-200'
        }">
          ✕ FALSE
        </button>
      </div>
    `;
  } else if (q.type === 'identification') {
    testerBodyHtml = `
      <div class="space-y-2 mb-3">
        <input type="text" id="tester-ident-input" placeholder="Type your answer here..." class="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
        <button onclick="window.checkTesterIdentification()" class="w-full py-1.5 rounded-lg bg-g11pink-600 hover:bg-g11pink-700 text-white font-bold text-xs">Submit Answer</button>
        ${testerRevealed ? `
          <div class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
            <span class="font-bold text-tagsci-700 dark:text-tagsci-400">Accepted Answer:</span> ${q.correctText || ''}
            ${q.aliases ? `<span class="text-slate-400 text-[10px] block">Aliases: ${q.aliases}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  } else if (q.type === 'numerical') {
    testerBodyHtml = `
      <div class="space-y-2 mb-3">
        <div class="flex items-center gap-1.5">
          <input type="text" id="tester-num-input" placeholder="Type numerical value..." class="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          ${q.unit ? `<span class="text-xs font-mono text-slate-400">${q.unit}</span>` : ''}
        </div>
        <button onclick="window.checkTesterNumerical()" class="w-full py-1.5 rounded-lg bg-g11pink-600 hover:bg-g11pink-700 text-white font-bold text-xs">Check Value</button>
        ${testerRevealed ? `
          <div class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
            <span class="font-bold text-emerald-600 dark:text-emerald-400">Target Value:</span> ${q.correctValue} ± ${q.tolerance || '0.05'} ${q.unit || ''}
          </div>
        ` : ''}
      </div>
    `;
  } else if (q.type === 'multi_select') {
    testerBodyHtml = `
      <div class="space-y-1.5 mb-3">
        ${(q.options || []).map((opt, i) => {
          const isSelected = testerSelectedMulti.includes(i);
          const isActuallyCorrect = (q.answerIndices || []).includes(i);
          return `
            <div onclick="window.toggleTesterMultiSelectOption(${i})" class="flex items-center gap-2 p-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
              testerRevealed
                ? (isActuallyCorrect
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                    : (isSelected ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-600' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'))
                : (isSelected
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-teal-400')
            }">
              <input type="checkbox" ${isSelected ? 'checked' : ''} class="rounded text-teal-600 pointer-events-none">
              <span class="flex-1">${renderMathInHtml(opt)}</span>
            </div>
          `;
        }).join('')}
        <button onclick="window.checkTesterMultiSelect()" class="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs mt-2">Submit Selections</button>
      </div>
    `;
  } else if (q.type === 'flashcard') {
    testerBodyHtml = `
      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 mb-3 space-y-2">
        <div class="text-xs font-bold text-slate-900 dark:text-white">
          ${renderMathInHtml(q.front || q.prompt || 'Untitled Card Front')}
        </div>
        ${testerRevealed ? `
          <div class="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-emerald-700 dark:text-emerald-400 font-mono-math">
            ${renderMathInHtml(q.back || 'No definition back provided')}
          </div>
        ` : `
          <button onclick="window.revealTesterFlashcard()" class="w-full py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-bold text-slate-800 dark:text-slate-200">
            Reveal Answer
          </button>
        `}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="w-full max-w-sm text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-black uppercase text-g11pink-600 dark:text-g11pink-400">${q.topic || q.type}</span>
        <span class="text-[10px] font-bold text-slate-400">Q ${testerQuestionIdx + 1} of ${set.questions.length}</span>
      </div>

      <div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-3">
        ${renderMathInHtml(q.prompt || 'Untitled Prompt')}
      </div>

      ${testerBodyHtml}

      ${testerRevealed && q.explanation ? `
        <div class="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 border-l-2 border-tagsci-500 mb-2">
          <strong class="text-tagsci-700 dark:text-tagsci-400">Explanation:</strong> ${renderMathInHtml(q.explanation)}
        </div>
      ` : ''}

      <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
        <button onclick="window.prevTesterQ()" ${testerQuestionIdx === 0 ? 'disabled' : ''} class="text-xs text-slate-400 hover:text-slate-700 disabled:opacity-30 font-semibold">Previous</button>
        <button onclick="window.nextTesterQ()" class="text-xs font-bold text-g11pink-600 dark:text-g11pink-400 hover:underline">Next Question &rarr;</button>
      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

export function checkTesterAnswer(idx) {
  testerRevealed = true;
  renderLiveQuizTester();
}

export function checkTesterTrueFalse(boolVal) {
  testerRevealed = true;
  renderLiveQuizTester();
}

export function checkTesterIdentification() {
  testerRevealed = true;
  renderLiveQuizTester();
}

export function checkTesterNumerical() {
  testerRevealed = true;
  renderLiveQuizTester();
}

export function toggleTesterMultiSelectOption(oIdx) {
  const pos = testerSelectedMulti.indexOf(oIdx);
  if (pos > -1) testerSelectedMulti.splice(pos, 1);
  else testerSelectedMulti.push(oIdx);
  renderLiveQuizTester();
}

export function checkTesterMultiSelect() {
  testerRevealed = true;
  renderLiveQuizTester();
}

export function revealTesterFlashcard() {
  testerRevealed = true;
  renderLiveQuizTester();
}

export function nextTesterQ() {
  testerRevealed = false;
  testerSelectedMulti = [];
  const set = STUDIO_DATA.quizSets[currentQuizSetIndex];
  if (!set || set.questions.length === 0) return;
  testerQuestionIdx = (testerQuestionIdx + 1) % set.questions.length;
  renderLiveQuizTester();
}

export function prevTesterQ() {
  testerRevealed = false;
  testerSelectedMulti = [];
  if (testerQuestionIdx > 0) testerQuestionIdx--;
  renderLiveQuizTester();
}

export function resetLiveTester() {
  testerQuestionIdx = 0;
  testerRevealed = false;
  testerSelectedMulti = [];
  renderLiveQuizTester();
}
