/* =========================================================
   TagSci Content Studio - Reviewer Visual Canvas & Editor
   ========================================================= */

import { STUDIO_DATA, currentRevIndex, setCurrentRevIndex, getSubjectClassification } from '../data/studio_data.js';
import { renderMathInHtml, parseMarkdownToHtml } from './math_engine.js';
import { getLastFocusedInput, setLastFocusedInput } from './equation_modal.js';

export function compileBlocksToMarkdown(blocks) {
  if (!blocks || blocks.length === 0) return '';
  let md = '';
  blocks.forEach(b => {
    if (b.type === 'heading') {
      const prefix = b.level === 'h2' ? '## ' : '### ';
      md += `${prefix}${b.text || 'Heading'}\n\n`;
    } else if (b.type === 'paragraph') {
      md += `${b.text || ''}\n\n`;
    } else if (b.type === 'formula') {
      if (b.title) md += `**${b.title}**\n`;
      md += `$$ ${b.formula || ''} $$\n`;
      if (b.note) md += `> *Note: ${b.note}*\n\n`;
    } else if (b.type === 'bullets') {
      if (b.items && b.items.length > 0) {
        b.items.forEach(it => { md += `- ${it}\n`; });
        md += '\n';
      }
    }
  });
  return md.trim();
}

export function parseMarkdownIntoBlocks(md) {
  if (!md) return [];
  const lines = md.split('\n');
  const blocks = [];
  let currentBulletBlock = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentBulletBlock) {
        blocks.push(currentBulletBlock);
        currentBulletBlock = null;
      }
      continue;
    }

    if (line.startsWith('### ') || line.startsWith('## ')) {
      if (currentBulletBlock) { blocks.push(currentBulletBlock); currentBulletBlock = null; }
      const level = line.startsWith('## ') ? 'h2' : 'h3';
      blocks.push({ type: 'heading', level, text: line.replace(/^#+\s*/, '') });
    } else if (line.startsWith('$$') && line.endsWith('$$')) {
      if (currentBulletBlock) { blocks.push(currentBulletBlock); currentBulletBlock = null; }
      blocks.push({ type: 'formula', title: 'Formula', formula: line.replace(/\$\$/g, '').trim(), note: '' });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!currentBulletBlock) {
        currentBulletBlock = { type: 'bullets', items: [] };
      }
      currentBulletBlock.items.push(line.substring(2));
    } else {
      if (currentBulletBlock) { blocks.push(currentBulletBlock); currentBulletBlock = null; }
      blocks.push({ type: 'paragraph', text: line });
    }
  }
  if (currentBulletBlock) blocks.push(currentBulletBlock);
  return blocks;
}

export function renderReviewersList() {
  const container = document.getElementById('rev-cards-container');
  const badgeCount = document.getElementById('badge-count-rev');
  const countLabel = document.getElementById('rev-list-count');
  const searchInput = document.getElementById('rev-search');
  const search = searchInput ? searchInput.value.toLowerCase() : '';

  const revs = STUDIO_DATA.stemReviewers || [];
  if (badgeCount) badgeCount.innerText = revs.length;
  if (countLabel) countLabel.innerText = `(${revs.length} items)`;

  if (!container) return;
  container.innerHTML = '';

  if (revs.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-400 text-xs">
        <i data-lucide="book-open" class="w-7 h-7 mx-auto mb-1.5 opacity-40"></i>
        <p class="font-medium text-slate-500 dark:text-slate-400">No notes drafted yet.</p>
        <p class="text-[10px] text-slate-400 mt-1">Click "+ New Note" above or in the Hub to create one.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  revs.forEach((rev, idx) => {
    if (search && !rev.title.toLowerCase().includes(search) && !rev.subject.toLowerCase().includes(search)) {
      return;
    }
    const isActive = idx === currentRevIndex;
    const card = document.createElement('div');
    card.className = `p-3 rounded-xl border cursor-pointer transition-all ${
      isActive
        ? 'bg-tagsci-50/80 dark:bg-tagsci-950/70 border-tagsci-500 shadow-sm'
        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
    }`;
    card.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] font-black uppercase tracking-wider text-tagsci-700 dark:text-tagsci-400">${rev.subject || 'General Math'}</span>
        <span class="text-[9.5px] px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${rev.tag || 'Main'}</span>
      </div>
      <h4 class="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">${rev.title || 'Untitled'}</h4>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">${rev.summary || 'No summary provided...'}</p>
    `;
    card.onclick = () => {
      setCurrentRevIndex(idx);
      loadReviewerToEditor();
      renderReviewersList();
    };
    container.appendChild(card);
  });
  if (window.lucide) window.lucide.createIcons();
}

export function loadReviewerToEditor() {
  const revs = STUDIO_DATA.stemReviewers || [];
  const rev = revs[currentRevIndex];

  const subjEl = document.getElementById('rev-input-subject');
  const tagEl = document.getElementById('rev-input-tag');
  const titleEl = document.getElementById('rev-input-title');
  const sumEl = document.getElementById('rev-input-summary');
  const bodyInput = document.getElementById('rev-input-body');

  if (!rev) {
    if (titleEl) titleEl.value = '';
    if (sumEl) sumEl.value = '';
    if (bodyInput) bodyInput.value = '';
    renderBlockCanvas();
    syncBlocksToPreview();
    return;
  }

  if (subjEl) subjEl.value = rev.subject || 'General Math';
  if (tagEl) tagEl.value = rev.tag || 'Main';
  if (titleEl) titleEl.value = rev.title || '';
  if (sumEl) sumEl.value = rev.summary || '';

  if (!rev.blocks || rev.blocks.length === 0) {
    rev.blocks = parseMarkdownIntoBlocks(rev.rawMarkdown || '');
  }

  renderBlockCanvas();
  syncBlocksToPreview();
}

export function renderBlockCanvas() {
  const revs = STUDIO_DATA.stemReviewers || [];
  const rev = revs[currentRevIndex];
  const container = document.getElementById('blocks-container');
  if (!container) return;

  if (!rev) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
        <i data-lucide="file-plus" class="w-8 h-8 mx-auto text-slate-400 opacity-60"></i>
        <p class="font-bold text-slate-700 dark:text-slate-200">No Reviewer Draft Selected</p>
        <p class="text-[11px] text-slate-400 max-w-xs mx-auto">Create a new reviewer draft to begin authoring concepts, formulas, and notes.</p>
        <button onclick="window.createQuickReviewer()" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-tagsci-700 hover:bg-tagsci-800 text-white text-xs font-bold shadow-sm transition-all">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i> Create New Reviewer
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (!rev.blocks) {
    rev.blocks = parseMarkdownIntoBlocks(rev.rawMarkdown || '');
  }

  container.innerHTML = '';
  rev.blocks.forEach((b, bIdx) => {
    const card = document.createElement('div');
    card.className = 'block-card p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-tagsci-400 dark:hover:border-tagsci-700 space-y-2.5';

    let headerLeft = '';
    let bodyHtml = '';

    if (b.type === 'heading') {
      headerLeft = `
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
            Heading
          </span>
          <select onchange="window.updateBlockField(${bIdx}, 'level', this.value)" class="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 rounded-md px-2 py-0.5 border border-slate-200 dark:border-slate-700">
            <option value="h2" ${b.level === 'h2' ? 'selected' : ''}>H2 Section</option>
            <option value="h3" ${b.level === 'h3' ? 'selected' : ''}>H3 Sub-topic</option>
          </select>
        </div>
      `;
      bodyHtml = `
        <input type="text" value="${b.text || ''}" oninput="window.updateBlockField(${bIdx}, 'text', this.value)" placeholder="Type section title..." class="w-full px-2.5 py-1.5 text-xs font-black bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
      `;
    } else if (b.type === 'paragraph') {
      headerLeft = `
        <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          Concept Text
        </span>
      `;
      bodyHtml = `
        <textarea rows="2" oninput="window.updateBlockField(${bIdx}, 'text', this.value)" placeholder="Explain concept or rule here (use $formula$ for inline math)..." class="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">${b.text || ''}</textarea>
      `;
    } else if (b.type === 'formula') {
      headerLeft = `
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-tagsci-100 dark:bg-tagsci-950 text-tagsci-800 dark:text-tagsci-300 flex items-center gap-1">
            <i data-lucide="sigma" class="w-3 h-3"></i> Formula Card
          </span>
          <button onclick="window.openMathBuilderForBlock(${bIdx})" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-tagsci-50 dark:bg-tagsci-950/80 hover:bg-tagsci-100 text-tagsci-800 dark:text-tagsci-300 border border-tagsci-300 dark:border-tagsci-800">
            <i data-lucide="edit-2" class="w-3 h-3"></i> Open Equation Studio
          </button>
        </div>
      `;
      bodyHtml = `
        <div class="space-y-2">
          <input type="text" value="${b.title || ''}" oninput="window.updateBlockField(${bIdx}, 'title', this.value)" placeholder="Formula Name (e.g. Velocity Equation)" class="w-full px-2.5 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <div class="p-2 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs">
            <input type="text" value="${b.formula || ''}" oninput="window.updateBlockField(${bIdx}, 'formula', this.value)" placeholder="Formula math: e.g. v_f = v_0 + at" class="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-tagsci-800 dark:text-emerald-400 font-bold">
          </div>
          <input type="text" value="${b.note || ''}" oninput="window.updateBlockField(${bIdx}, 'note', this.value)" placeholder="Short note / when to use this formula..." class="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
        </div>
      `;
    } else if (b.type === 'bullets') {
      headerLeft = `
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Bullet Points List
          </span>
          <button onclick="window.addBulletItem(${bIdx})" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold text-tagsci-700 dark:text-tagsci-400 hover:bg-tagsci-50 dark:hover:bg-tagsci-950">
            + Add Point
          </button>
        </div>
      `;
      bodyHtml = `
        <div class="space-y-1.5">
          ${(b.items || []).map((it, itIdx) => `
            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-bold text-xs">&bull;</span>
              <input type="text" value="${it}" oninput="window.updateBulletItem(${bIdx}, ${itIdx}, this.value)" placeholder="Key takeaway point..." class="flex-1 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <button onclick="window.removeBulletItem(${bIdx}, ${itIdx})" class="text-slate-400 hover:text-red-500 p-1"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
            </div>
          `).join('')}
        </div>
      `;
    }

    const headerActions = `
      <div class="flex items-center gap-1 shrink-0">
        <button onclick="window.moveBlock(${bIdx}, -1)" ${bIdx === 0 ? 'disabled' : ''} title="Move Up" class="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors">
          <i data-lucide="arrow-up" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="window.moveBlock(${bIdx}, 1)" ${bIdx === rev.blocks.length - 1 ? 'disabled' : ''} title="Move Down" class="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors">
          <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="window.duplicateBlock(${bIdx})" title="Duplicate Block" class="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="window.deleteBlock(${bIdx})" title="Delete Block" class="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    card.innerHTML = `
      <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="min-w-0">${headerLeft}</div>
        ${headerActions}
      </div>
      ${bodyHtml}
    `;
    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

export function syncBlocksToPreview() {
  const revs = STUDIO_DATA.stemReviewers || [];
  const rev = revs[currentRevIndex];
  const previewPane = document.getElementById('rev-live-preview');

  if (!rev) {
    if (previewPane) {
      previewPane.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs py-16">
          <i data-lucide="eye-off" class="w-8 h-8 mb-2 opacity-40"></i>
          <p class="font-medium text-slate-500 dark:text-slate-400">Live student preview will appear here.</p>
          <p class="text-[10.5px] text-slate-400 mt-1">Select or create a reviewer draft to view output.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
    return;
  }

  const compiledMd = compileBlocksToMarkdown(rev.blocks);
  rev.rawMarkdown = compiledMd;

  const bodyInput = document.getElementById('rev-input-body');
  const charCount = document.getElementById('editor-char-count');
  if (bodyInput) bodyInput.value = compiledMd;
  if (charCount) charCount.innerText = `${compiledMd.length} chars`;

  const subjEl = document.getElementById('rev-input-subject');
  const tagEl = document.getElementById('rev-input-tag');
  const titleEl = document.getElementById('rev-input-title');
  const sumEl = document.getElementById('rev-input-summary');

  if (subjEl) rev.subject = subjEl.value;
  if (tagEl) rev.tag = tagEl.value;
  if (titleEl) rev.title = titleEl.value;
  if (sumEl) rev.summary = sumEl.value;
  rev.content = parseMarkdownToHtml(compiledMd);

  if (previewPane) {
    previewPane.innerHTML = `
      <div class="border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-tagsci-100 dark:bg-tagsci-950 text-tagsci-800 dark:text-tagsci-300">${rev.subject}</span>
          <span class="text-[10px] font-bold text-slate-400">&bull; ${rev.tag}</span>
        </div>
        <h1 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">${rev.title || 'Untitled Article'}</h1>
        <p class="text-xs text-slate-500 italic mt-1">${rev.summary || ''}</p>
      </div>
      <div class="mt-3 text-slate-800 dark:text-slate-100">${rev.content || '<span class="text-slate-400 italic">No content blocks added yet...</span>'}</div>
    `;
  }
}

export function updateBlockField(bIdx, field, val) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (rev && rev.blocks && rev.blocks[bIdx]) {
    rev.blocks[bIdx][field] = val;
    syncBlocksToPreview();
  }
}

export function moveBlock(bIdx, dir) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks) return;
  const target = bIdx + dir;
  if (target < 0 || target >= rev.blocks.length) return;
  const temp = rev.blocks[bIdx];
  rev.blocks[bIdx] = rev.blocks[target];
  rev.blocks[target] = temp;
  renderBlockCanvas();
  syncBlocksToPreview();
}

export function duplicateBlock(bIdx) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks) return;
  const clone = JSON.parse(JSON.stringify(rev.blocks[bIdx]));
  rev.blocks.splice(bIdx + 1, 0, clone);
  renderBlockCanvas();
  syncBlocksToPreview();
  if (window.showToast) window.showToast('Block duplicated!');
}

export function deleteBlock(bIdx) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks) return;
  rev.blocks.splice(bIdx, 1);
  renderBlockCanvas();
  syncBlocksToPreview();
}

export function addBulletItem(bIdx) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks) return;
  if (!rev.blocks[bIdx].items) rev.blocks[bIdx].items = [];
  rev.blocks[bIdx].items.push('New key point');
  renderBlockCanvas();
  syncBlocksToPreview();
}

export function updateBulletItem(bIdx, itIdx, val) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (rev && rev.blocks && rev.blocks[bIdx] && rev.blocks[bIdx].items) {
    rev.blocks[bIdx].items[itIdx] = val;
    syncBlocksToPreview();
  }
}

export function removeBulletItem(bIdx, itIdx) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (rev && rev.blocks && rev.blocks[bIdx] && rev.blocks[bIdx].items) {
    rev.blocks[bIdx].items.splice(itIdx, 1);
    renderBlockCanvas();
    syncBlocksToPreview();
  }
}

export function addContentBlock(type) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev) return;
  if (!rev.blocks) rev.blocks = [];
  if (type === 'heading') {
    rev.blocks.push({ type: 'heading', level: 'h3', text: 'New Topic Title' });
  } else if (type === 'paragraph') {
    rev.blocks.push({ type: 'paragraph', text: 'Explain concepts, definitions, and key takeaways here.' });
  } else if (type === 'formula') {
    rev.blocks.push({ type: 'formula', title: 'Formula Card', formula: 'v = \\frac{d}{t}', note: 'Standard constant velocity equation.' });
  } else if (type === 'bullets') {
    rev.blocks.push({ type: 'bullets', items: ['First key point', 'Second key point'] });
  }
  renderBlockCanvas();
  syncBlocksToPreview();
  if (window.showToast) window.showToast('Block added to canvas!');
}

export function loadLessonTemplate(templateType) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !templateType) return;
  if (templateType === 'stem_law') {
    rev.blocks = [
      { type: 'heading', level: 'h3', text: 'Theoretical Principle' },
      { type: 'paragraph', text: 'State the formal definition or physical law clearly here.' },
      { type: 'formula', title: 'Governing Formula', formula: 'F_{net} = ma', note: 'Applies to all classical mechanics systems.' },
      { type: 'bullets', items: ['Force and acceleration are directly proportional.', 'Mass is the measure of inertia in kilograms.'] }
    ];
  } else if (templateType === 'derivation') {
    rev.blocks = [
      { type: 'heading', level: 'h3', text: 'Mathematical Derivation Walkthrough' },
      { type: 'paragraph', text: 'Starting from initial fundamental relations:' },
      { type: 'formula', title: 'Step 1: Base Equation', formula: 'v_f = v_0 + at', note: 'Isolate time variable t.' },
      { type: 'formula', title: 'Step 2: Substitution & Expansion', formula: '\\Delta x = v_0\\left(\\frac{v_f - v_0}{a}\\right) + \\frac{1}{2}a\\left(\\frac{v_f - v_0}{a}\\right)^2', note: 'Expand and multiply through by 2a.' },
      { type: 'formula', title: 'Final Result', formula: 'v_f^2 = v_0^2 + 2a\\Delta x', note: 'Torricelli relation achieved.' }
    ];
  } else if (templateType === 'key_takeaways') {
    rev.blocks = [
      { type: 'heading', level: 'h3', text: 'Summary & Core Takeaways' },
      { type: 'bullets', items: ['Know standard SI units (meters, seconds, kilograms)', 'Sign conventions: upwards is positive, downwards is negative', 'Free fall acceleration g = 9.8 m/s^2'] }
    ];
  }
  renderBlockCanvas();
  syncBlocksToPreview();
  if (window.showToast) window.showToast('Loaded starter template!');
}

export function applyTextFormatting(type) {
  let activeElem = document.activeElement;
  const lastInput = getLastFocusedInput();
  if (!activeElem || (activeElem.tagName !== 'TEXTAREA' && activeElem.tagName !== 'INPUT')) {
    if (lastInput && document.body.contains(lastInput)) {
      activeElem = lastInput;
    } else {
      const firstArea = document.querySelector('#pane-visual-blocks textarea, #pane-visual-blocks input[type="text"], #rev-input-body');
      if (firstArea) activeElem = firstArea;
    }
  }

  if (!activeElem) return;

  const start = activeElem.selectionStart ?? activeElem.value.length;
  const end = activeElem.selectionEnd ?? activeElem.value.length;
  const selected = activeElem.value.substring(start, end);
  const fullVal = activeElem.value;

  let prefix = '';
  let suffix = '';
  let defaultText = '';

  if (type === 'bold') {
    prefix = '**';
    suffix = '**';
    defaultText = 'bold text';
  } else if (type === 'italic') {
    prefix = '*';
    suffix = '*';
    defaultText = 'italic text';
  } else if (type === 'underline') {
    prefix = '<u>';
    suffix = '</u>';
    defaultText = 'underlined text';
  } else if (type === 'math') {
    prefix = '$';
    suffix = '$';
    defaultText = 'x';
  }

  let newText = '';
  let newSelectionStart = start;
  let newSelectionEnd = end;

  if (selected.length > 0) {
    if (selected.startsWith(prefix) && selected.endsWith(suffix) && selected.length >= (prefix.length + suffix.length)) {
      const unwrapped = selected.substring(prefix.length, selected.length - suffix.length);
      newText = fullVal.substring(0, start) + unwrapped + fullVal.substring(end);
      newSelectionStart = start;
      newSelectionEnd = start + unwrapped.length;
    } else {
      newText = fullVal.substring(0, start) + prefix + selected + suffix + fullVal.substring(end);
      newSelectionStart = start + prefix.length;
      newSelectionEnd = start + prefix.length + selected.length;
    }
  } else {
    newText = fullVal.substring(0, start) + prefix + defaultText + suffix + fullVal.substring(end);
    newSelectionStart = start + prefix.length;
    newSelectionEnd = start + prefix.length + defaultText.length;
  }

  activeElem.value = newText;
  activeElem.focus();
  activeElem.setSelectionRange(newSelectionStart, newSelectionEnd);
  activeElem.dispatchEvent(new Event('input', { bubbles: true }));
}
