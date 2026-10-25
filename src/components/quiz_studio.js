/* =========================================================
   TagSci Content Studio - Flashcards & Active Recall Studio
   (Supports Spaced Repetition Decks & Flashcard Drills)
   ========================================================= */

import { STUDIO_DATA, currentQuizSetIndex, setCurrentQuizSetIndex, getSubjectClassification } from '../data/studio_data.js';
import { renderMathInHtml } from './math_engine.js';

let testerCardIdx = 0;
let testerFlipped = false;
let testerHintRevealed = false;

// Ensure flashcardDecks array exists and sync with quizSets
export function getDecks() {
  let rawDecks = [];
  if (Array.isArray(STUDIO_DATA.flashcardDecks) && STUDIO_DATA.flashcardDecks.length > 0) {
    rawDecks = STUDIO_DATA.flashcardDecks;
  } else if (Array.isArray(STUDIO_DATA.quizSets) && STUDIO_DATA.quizSets.length > 0) {
    rawDecks = STUDIO_DATA.quizSets;
  }

  // Normalize each deck to ensure deck.cards exists with front / back
  STUDIO_DATA.flashcardDecks = rawDecks.map((d, dIdx) => {
    let cards = [];
    if (Array.isArray(d.cards)) {
      cards = d.cards.map((c, cIdx) => ({
        id: c.id || `c_${dIdx}_${cIdx}`,
        topic: c.topic || 'Concept',
        front: c.front || c.question || '',
        back: c.back || c.explanation || c.correctText || '',
        hint: c.hint || ''
      }));
    } else if (Array.isArray(d.questions)) {
      cards = d.questions.map((qu, qIdx) => ({
        id: qu.id || `c_${dIdx}_${qIdx}`,
        topic: qu.topic || qu.question || 'Concept',
        front: qu.front || qu.question || '',
        back: qu.back || qu.explanation || qu.correctText || '',
        hint: qu.hint || ''
      }));
    }

    return {
      id: d.id || `deck_${dIdx}`,
      subject: d.subject || 'Kasaysayan',
      tag: d.tag || 'Main',
      color: d.color || 'border-l-4 border-amber-600',
      title: d.title || 'Untitled Flashcard Deck',
      desc: d.desc || '',
      cards: cards
    };
  });

  // Keep quizSets synced as an alias for backwards compatibility
  STUDIO_DATA.quizSets = STUDIO_DATA.flashcardDecks;
  return STUDIO_DATA.flashcardDecks;
}

export function renderQuizSetsList() {
  const container = document.getElementById('quiz-sets-container');
  const badgeCount = document.getElementById('badge-count-quiz');
  const countLabel = document.getElementById('quiz-list-count');

  const decks = getDecks();
  let totalCardsCount = 0;
  decks.forEach(d => {
    totalCardsCount += (d.cards ? d.cards.length : 0);
  });

  if (badgeCount) badgeCount.innerText = `${decks.length} Decks`;
  if (countLabel) countLabel.innerText = `(${decks.length} decks • ${totalCardsCount} cards)`;

  if (!container) return;
  container.innerHTML = '';

  if (decks.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-400 text-xs">
        <i data-lucide="layers" class="w-7 h-7 mx-auto mb-1.5 opacity-40 text-g11pink-500"></i>
        <p class="font-medium text-slate-500 dark:text-slate-400">No Flashcard Decks drafted yet.</p>
        <p class="text-[10px] text-slate-400 mt-1">Click "+ New Deck" above or in the Hub to create one.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  decks.forEach((deck, idx) => {
    const isActive = idx === currentQuizSetIndex;
    const card = document.createElement('div');
    card.className = `p-3 rounded-xl border cursor-pointer transition-all ${
      isActive
        ? 'bg-g11pink-50/80 dark:bg-g11pink-950/70 border-g11pink-500 shadow-sm'
        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
    }`;
    const cCount = deck.cards ? deck.cards.length : 0;
    const meta = getSubjectClassification(deck.subject);

    card.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] font-black uppercase tracking-wider text-g11pink-600 dark:text-g11pink-400">${deck.subject || 'General'}</span>
        <span class="text-[9.5px] px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${cCount} Cards</span>
      </div>
      <h4 class="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">${deck.title || 'Untitled Deck'}</h4>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">${deck.desc || 'Active recall & spaced repetition deck...'}</p>
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
  const decks = getDecks();
  const deck = decks[currentQuizSetIndex];

  const subjEl = document.getElementById('quiz-input-subject');
  const titleEl = document.getElementById('quiz-input-title');
  const timeEl = document.getElementById('quiz-input-timelimit');

  if (!deck) {
    if (titleEl) titleEl.value = '';
    renderQuestionsBuilder();
    renderLiveQuizTester();
    return;
  }

  if (subjEl) subjEl.value = deck.subject || 'Kasaysayan';
  if (titleEl) titleEl.value = deck.title || '';
  if (timeEl) timeEl.value = deck.cards ? deck.cards.length : 0;

  renderQuestionsBuilder();
  renderLiveQuizTester();
}

export function renderQuestionsBuilder() {
  const decks = getDecks();
  const deck = decks[currentQuizSetIndex];
  const container = document.getElementById('questions-builder-container');
  const badge = document.getElementById('question-count-badge');
  if (!container) return;

  if (!deck || !deck.cards || deck.cards.length === 0) {
    if (badge) badge.innerText = '0 Cards';
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
        <i data-lucide="layers" class="w-8 h-8 mx-auto text-slate-400 opacity-60"></i>
        <p class="font-bold text-slate-700 dark:text-slate-200">No Cards in this Deck</p>
        <p class="text-[11px] text-slate-400 max-w-xs mx-auto">Add flashcards to empower students with active recall and spaced repetition drills.</p>
        <button onclick="window.addQuestionBlock('flashcard')" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-g11pink-600 hover:bg-g11pink-700 text-white text-xs font-bold shadow-sm transition-all">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add First Flashcard
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (badge) badge.innerText = `${deck.cards.length} Cards`;

  container.innerHTML = '';
  deck.cards.forEach((c, cIdx) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm hover:border-g11pink-300 dark:hover:border-g11pink-800 transition-all cursor-default';
    cardEl.dataset.cardIndex = cIdx;

    cardEl.innerHTML = `
      <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 text-xs">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded font-black text-[10px] bg-g11pink-100 dark:bg-g11pink-950 text-g11pink-700 dark:text-g11pink-300">
            Card #${cIdx + 1}
          </span>
          <input 
            type="text" 
            value="${c.topic || ''}" 
            oninput="window.updateQuestionField(${cIdx}, 'topic', this.value)" 
            placeholder="Topic / Category (e.g. Batayang Kahulugan)..." 
            class="px-2 py-0.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white w-48 sm:w-64"
          >
        </div>
        <div class="flex items-center gap-1">
          <button onclick="window.moveQuestion(${cIdx}, -1)" ${cIdx === 0 ? 'disabled' : ''} class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30" title="Move Up">
            <i data-lucide="chevron-up" class="w-4 h-4"></i>
          </button>
          <button onclick="window.moveQuestion(${cIdx}, 1)" ${cIdx === deck.cards.length - 1 ? 'disabled' : ''} class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30" title="Move Down">
            <i data-lucide="chevron-down" class="w-4 h-4"></i>
          </button>
          <button onclick="window.duplicateQuestion(${cIdx})" class="p-1 rounded text-slate-400 hover:text-blue-500" title="Duplicate Card">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="window.deleteQuestion(${cIdx})" class="p-1 rounded text-slate-400 hover:text-red-500" title="Delete Card">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Front Prompt -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              Front (Prompt / Question)
            </label>
            <span class="text-[9.5px] text-slate-400 font-mono">LaTeX ($$) ok</span>
          </div>
          <textarea 
            rows="3" 
            oninput="window.updateQuestionField(${cIdx}, 'front', this.value)" 
            placeholder="Question, concept prompt, or definition to recall..." 
            class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-g11pink-500 resize-y"
          >${c.front || ''}</textarea>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800">
            <span class="text-[9.5px] font-bold uppercase text-slate-400 block mb-0.5">Live Front Preview:</span>
            ${renderMathInHtml(c.front || '<span class="italic text-slate-400">Card prompt empty...</span>')}
          </div>
        </div>

        <!-- Back Recall -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Back (Recall / Solution / Answer)
            </label>
            <span class="text-[9.5px] text-slate-400 font-mono">LaTeX ($$) ok</span>
          </div>
          <textarea 
            rows="3" 
            oninput="window.updateQuestionField(${cIdx}, 'back', this.value)" 
            placeholder="Answer, detailed breakdown, or explanation to reveal..." 
            class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-g11pink-500 resize-y"
          >${c.back || ''}</textarea>
          <div class="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800">
            <span class="text-[9.5px] font-bold uppercase text-slate-400 block mb-0.5">Live Back Preview:</span>
            ${renderMathInHtml(c.back || '<span class="italic text-slate-400">Card answer empty...</span>')}
          </div>
        </div>
      </div>

      <!-- Hint Field -->
      <div class="pt-1">
        <label class="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <i data-lucide="lightbulb" class="w-3 h-3"></i>
          Optional Hint / Mnemonic
        </label>
        <input 
          type="text" 
          value="${c.hint || ''}" 
          oninput="window.updateQuestionField(${cIdx}, 'hint', this.value)" 
          placeholder="e.g. Tandaan ang dalawang salitang-ugat: Salaysay at Saysay..." 
          class="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
        >
      </div>
    `;

    container.appendChild(cardEl);
  });

  // Bottom action bar
  const bottomBar = document.createElement('div');
  bottomBar.className = 'pt-2 flex items-center justify-between';
  bottomBar.innerHTML = `
    <button onclick="window.addQuestionBlock('flashcard')" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-g11pink-600 hover:bg-g11pink-700 text-white text-xs font-bold shadow-sm transition-all">
      <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add New Flashcard
    </button>
    <span class="text-[11px] text-slate-400">Auto-saved to local draft</span>
  `;
  container.appendChild(bottomBar);

  if (window.lucide) window.lucide.createIcons();
}

export function updateQuestionField(cardIdx, field, value) {
  const decks = getDecks();
  const deck = decks[currentQuizSetIndex];
  if (!deck || !deck.cards || !deck.cards[cardIdx]) return;
  deck.cards[cardIdx][field] = value;
  renderLiveQuizTester();
}

export function addQuestionBlock(type = 'flashcard') {
  const decks = getDecks();
  if (!decks[currentQuizSetIndex]) {
    decks.push({
      id: `deck_${Date.now()}`,
      subject: 'Kasaysayan',
      tag: 'Main',
      color: 'border-l-4 border-amber-600',
      title: 'New Flashcard Deck Draft',
      desc: 'Active recall & spaced repetition deck',
      cards: []
    });
    setCurrentQuizSetIndex(decks.length - 1);
  }

  const deck = decks[currentQuizSetIndex];
  if (!deck.cards) deck.cards = [];

  deck.cards.push({
    id: `c_${Date.now()}_${deck.cards.length + 1}`,
    topic: 'Core Concept',
    front: 'Enter prompt or definition to recall...',
    back: 'Enter answer, solution, or breakdown...',
    hint: ''
  });

  renderQuestionsBuilder();
  renderLiveQuizTester();
  renderQuizSetsList();
}

export function deleteQuestion(cardIdx) {
  const decks = getDecks();
  const deck = decks[currentQuizSetIndex];
  if (!deck || !deck.cards || !deck.cards[cardIdx]) return;
  deck.cards.splice(cardIdx, 1);
  if (testerCardIdx >= deck.cards.length) {
    testerCardIdx = Math.max(0, deck.cards.length - 1);
  }
  renderQuestionsBuilder();
  renderLiveQuizTester();
  renderQuizSetsList();
}

export function duplicateQuestion(cardIdx) {
  const decks = getDecks();
  const deck = decks[currentQuizSetIndex];
  if (!deck || !deck.cards || !deck.cards[cardIdx]) return;
  const clone = JSON.parse(JSON.stringify(deck.cards[cardIdx]));
  clone.id = `c_${Date.now()}`;
  deck.cards.splice(cardIdx + 1, 0, clone);
  renderQuestionsBuilder();
  renderLiveQuizTester();
  renderQuizSetsList();
}

export function moveQuestion(cardIdx, direction) {
  const decks = getDecks();
  const deck = decks[currentQuizSetIndex];
  if (!deck || !deck.cards) return;
  const newIdx = cardIdx + direction;
  if (newIdx < 0 || newIdx >= deck.cards.length) return;
  const item = deck.cards.splice(cardIdx, 1)[0];
  deck.cards.splice(newIdx, 0, item);
  renderQuestionsBuilder();
  renderLiveQuizTester();
}

// -------------------------------------------------------------
// Interactive Live Flashcard Simulator
// -------------------------------------------------------------
export function renderLiveQuizTester() {
  const container = document.getElementById('quiz-interactive-preview');
  if (!container) return;

  const decks = getDecks();
  const deck = decks[currentQuizSetIndex];

  if (!deck || !deck.cards || deck.cards.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-400 text-xs">
        <i data-lucide="layers" class="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2"></i>
        <h4 class="font-bold text-slate-700 dark:text-slate-300">Live Simulator Empty</h4>
        <p class="text-[11px] text-slate-400 mt-1">Add cards in the builder to simulate student active recall drills.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (testerCardIdx >= deck.cards.length) testerCardIdx = 0;
  const currentCard = deck.cards[testerCardIdx];

  container.innerHTML = `
    <div class="w-full max-w-md mx-auto space-y-4">
      <!-- Tester Top Bar -->
      <div class="flex items-center justify-between text-xs pb-1 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-g11pink-100 dark:bg-g11pink-950 text-g11pink-700 dark:text-g11pink-300">
            ${deck.subject || 'STEM'}
          </span>
          <span class="font-bold text-slate-600 dark:text-slate-300">
            Card ${testerCardIdx + 1} of ${deck.cards.length}
          </span>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="window.shuffleCurrentDeckSimulator()" class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title="Shuffle Cards">
            <i data-lucide="shuffle" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="window.resetLiveTester()" class="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            Reset
          </button>
        </div>
      </div>

      <!-- 3D Flashcard Flip Card -->
      <div 
        onclick="window.revealTesterFlashcard()" 
        class="cursor-pointer select-none rounded-2xl p-6 min-h-[220px] flex flex-col justify-between transition-all duration-300 shadow-md ${
          testerFlipped
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-emerald-950/40 border-2 border-emerald-400 text-slate-900 dark:text-white'
            : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-g11pink-400'
        }"
      >
        <!-- Card Header Info -->
        <div class="flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span class="uppercase tracking-wider">${currentCard.topic || 'General Topic'}</span>
          <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
            testerFlipped 
              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300' 
              : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
          }">
            ${testerFlipped ? 'Answer Revealed' : 'Prompt / Front'}
          </span>
        </div>

        <!-- Main Card Content -->
        <div class="my-auto py-3 text-center">
          <div class="text-sm sm:text-base font-bold leading-relaxed">
            ${renderMathInHtml(testerFlipped ? currentCard.back : currentCard.front)}
          </div>
        </div>

        <!-- Card Footer Instruction -->
        <div class="text-center text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1">
          <i data-lucide="rotate-cw" class="w-3 h-3"></i>
          <span>${testerFlipped ? 'Click to flip back to question' : 'Click to flip and reveal answer'}</span>
        </div>
      </div>

      <!-- Hint Reveal Accordion -->
      ${currentCard.hint ? `
        <div class="text-left">
          <button 
            onclick="window.toggleTesterHint()" 
            class="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <i data-lucide="lightbulb" class="w-3.5 h-3.5"></i>
            <span>${testerHintRevealed ? 'Hide Hint' : 'Show Memory Hint'}</span>
          </button>
          ${testerHintRevealed ? `
            <div class="mt-1.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200">
              ${renderMathInHtml(currentCard.hint)}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Spaced Repetition Rating Buttons (Visible when flipped) -->
      ${testerFlipped ? `
        <div class="space-y-1.5 pt-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">Simulate Spaced Repetition Rating:</span>
          <div class="grid grid-cols-4 gap-1.5 text-xs font-bold">
            <button onclick="window.nextTesterQ()" class="py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition text-center">
              <div>Again</div>
              <div class="text-[9px] font-normal opacity-70">&lt;1m</div>
            </button>
            <button onclick="window.nextTesterQ()" class="py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 transition text-center">
              <div>Hard</div>
              <div class="text-[9px] font-normal opacity-70">12h</div>
            </button>
            <button onclick="window.nextTesterQ()" class="py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 transition text-center">
              <div>Good</div>
              <div class="text-[9px] font-normal opacity-70">1d</div>
            </button>
            <button onclick="window.nextTesterQ()" class="py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 transition text-center">
              <div>Easy</div>
              <div class="text-[9px] font-normal opacity-70">3d</div>
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Bottom Card Navigation Controls -->
      <div class="flex items-center justify-between pt-2">
        <button 
          onclick="window.prevTesterQ()" 
          ${testerCardIdx === 0 ? 'disabled' : ''} 
          class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 flex items-center gap-1"
        >
          <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Prev
        </button>
        <button 
          onclick="window.revealTesterFlashcard()" 
          class="px-4 py-1.5 rounded-lg bg-g11pink-600 hover:bg-g11pink-700 text-white text-xs font-bold shadow-sm transition"
        >
          ${testerFlipped ? 'Flip Front' : 'Flip Card'}
        </button>
        <button 
          onclick="window.nextTesterQ()" 
          ${testerCardIdx === deck.cards.length - 1 ? 'disabled' : ''} 
          class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 flex items-center gap-1"
        >
          Next <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

export function revealTesterFlashcard() {
  testerFlipped = !testerFlipped;
  renderLiveQuizTester();
}

export function toggleTesterHint() {
  testerHintRevealed = !testerHintRevealed;
  renderLiveQuizTester();
}

export function nextTesterQ() {
  const decks = getDecks();
  const deck = decks[currentQuizSetIndex];
  if (!deck || !deck.cards) return;
  if (testerCardIdx < deck.cards.length - 1) {
    testerCardIdx++;
    testerFlipped = false;
    testerHintRevealed = false;
    renderLiveQuizTester();
  }
}

export function prevTesterQ() {
  if (testerCardIdx > 0) {
    testerCardIdx--;
    testerFlipped = false;
    testerHintRevealed = false;
    renderLiveQuizTester();
  }
}

export function resetLiveTester() {
  testerCardIdx = 0;
  testerFlipped = false;
  testerHintRevealed = false;
  renderLiveQuizTester();
}

export function shuffleCurrentDeckSimulator() {
  const decks = getDecks();
  const deck = decks[currentQuizSetIndex];
  if (!deck || !deck.cards || deck.cards.length <= 1) return;
  // Fisher-Yates shuffle
  for (let i = deck.cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck.cards[i], deck.cards[j]] = [deck.cards[j], deck.cards[i]];
  }
  resetLiveTester();
  renderQuestionsBuilder();
  if (window.showToast) window.showToast('Shuffled flashcard deck!');
}

// -------------------------------------------------------------
// Backwards Compatibility Aliases
// -------------------------------------------------------------
export function changeQuestionType() {}
export function updateTrueFalse() {}
export function toggleMultiSelectOption() {}
export function updateCorrectMcq() {}
export function updateMcqOption() {}
export function removeMcqOption() {}
export function addMcqOption() {}
export function checkTesterAnswer() {}
export function checkTesterTrueFalse() {}
export function checkTesterIdentification() {}
export function checkTesterNumerical() {}
export function toggleTesterMultiSelectOption() {}
export function checkTesterMultiSelect() {}
