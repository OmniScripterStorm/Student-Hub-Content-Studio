/* =========================================================
   TagSci Content Studio - Visual Equation Studio Modal
   ========================================================= */

import { renderMathInHtml } from './math_engine.js';
import { STUDIO_DATA, currentRevIndex, setCurrentRevIndex } from '../data/studio_data.js';

let activeMathTargetBlockIdx = null;
let lastFocusedInput = null;
let lastSelectionStart = null;
let lastSelectionEnd = null;

export function setLastFocusedInput(elem) {
  if (elem && (elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA') && !elem.closest('#modal-math-builder')) {
    lastFocusedInput = elem;
    try {
      lastSelectionStart = elem.selectionStart;
      lastSelectionEnd = elem.selectionEnd;
    } catch (e) {
      lastSelectionStart = elem.value ? elem.value.length : 0;
      lastSelectionEnd = lastSelectionStart;
    }
  }
}

export function getLastFocusedInput() {
  return lastFocusedInput;
}

// Global focus and selection tracking
if (typeof document !== 'undefined') {
  const recordFocus = (e) => {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      if (!target.closest('#modal-math-builder')) {
        lastFocusedInput = target;
        try {
          lastSelectionStart = target.selectionStart;
          lastSelectionEnd = target.selectionEnd;
        } catch (err) {}
      }
    }
  };

  document.addEventListener('focusin', recordFocus, true);
  document.addEventListener('keyup', recordFocus, true);
  document.addEventListener('mouseup', recordFocus, true);
  document.addEventListener('select', recordFocus, true);
}

export function openMathBuilderModal() {
  activeMathTargetBlockIdx = null;
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && !active.closest('#modal-math-builder')) {
    setLastFocusedInput(active);
  }

  const modal = document.getElementById('modal-math-builder');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
  const input = document.getElementById('math-studio-input');
  if (input) input.value = 'v_f^2 = v_0^2 + 2a\\Delta x';
  updateMathStudioPreview();
  switchMathSubTab('templates');
}

export function openMathBuilderForBlock(bIdx) {
  activeMathTargetBlockIdx = bIdx;
  const modal = document.getElementById('modal-math-builder');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
  const currentFormula = STUDIO_DATA.stemReviewers[currentRevIndex]?.blocks?.[bIdx]?.formula || 'v = \\frac{d}{t}';
  const input = document.getElementById('math-studio-input');
  if (input) input.value = currentFormula;
  updateMathStudioPreview();
  switchMathSubTab('templates');
}

export function closeMathBuilderModal() {
  const modal = document.getElementById('modal-math-builder');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  activeMathTargetBlockIdx = null;
}

export function switchMathSubTab(subtab) {
  ['templates', 'symbols', 'presets'].forEach(t => {
    const pane = document.getElementById(`math-subtab-${t}`);
    const btn = document.getElementById(`tab-math-${t}`);
    if (pane && btn) {
      if (t === subtab) {
        pane.classList.remove('hidden');
        btn.classList.add('bg-tagsci-50', 'dark:bg-tagsci-950', 'text-tagsci-800', 'dark:text-tagsci-300', 'border', 'border-tagsci-200', 'dark:border-tagsci-800', 'font-bold');
        btn.classList.remove('text-slate-600', 'dark:text-slate-400');
      } else {
        pane.classList.add('hidden');
        btn.classList.remove('bg-tagsci-50', 'dark:bg-tagsci-950', 'text-tagsci-800', 'dark:text-tagsci-300', 'border', 'border-tagsci-200', 'dark:border-tagsci-800', 'font-bold');
        btn.classList.add('text-slate-600', 'dark:text-slate-400');
      }
    }
  });
}

export function insertFormulaSnippet(snippet) {
  const input = document.getElementById('math-studio-input');
  if (!input) return;
  const start = input.selectionStart || input.value.length;
  const end = input.selectionEnd || input.value.length;
  input.value = input.value.substring(0, start) + snippet + input.value.substring(end);
  input.focus();
  input.selectionStart = input.selectionEnd = start + snippet.length;
  updateMathStudioPreview();
}

export function setFullEquation(eq) {
  const input = document.getElementById('math-studio-input');
  if (!input) return;
  input.value = eq;
  updateMathStudioPreview();
}

export function updateMathStudioPreview() {
  const input = document.getElementById('math-studio-input');
  const preview = document.getElementById('math-studio-preview');
  if (!input || !preview) return;
  const tex = input.value.trim() || '...';
  preview.innerHTML = renderMathInHtml(`$$ ${tex} $$`);
}

export function confirmMathInsert(mode, onComplete) {
  const input = document.getElementById('math-studio-input');
  if (!input) return;
  const tex = input.value.trim();
  if (!tex) {
    if (window.showToast) window.showToast('Please enter a formula.');
    return;
  }

  if (mode === 'inline') {
    let target = lastFocusedInput;
    if (!target || !document.body.contains(target) || target.closest('#modal-math-builder')) {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && !active.closest('#modal-math-builder')) {
        target = active;
      } else {
        target = document.querySelector('#rev-input-body:not(.hidden), #pane-visual-blocks textarea, #pane-visual-blocks input[type="text"], #q-input-question');
      }
    }

    if (target) {
      const start = (target === lastFocusedInput && typeof lastSelectionStart === 'number') 
        ? lastSelectionStart 
        : (target.selectionStart ?? target.value.length);
      const end = (target === lastFocusedInput && typeof lastSelectionEnd === 'number') 
        ? lastSelectionEnd 
        : (target.selectionEnd ?? target.value.length);
      const snippet = `$${tex}$`;
      target.value = target.value.substring(0, start) + snippet + target.value.substring(end);
      target.focus();
      try {
        target.setSelectionRange(start + snippet.length, start + snippet.length);
      } catch (e) {}
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      closeMathBuilderModal();
      if (typeof onComplete === 'function') onComplete();
      if (window.showToast) window.showToast('Equation inserted inline ($...$)');
      return;
    }

    // If no target input exists, create or append an inline concept block
    let rev = STUDIO_DATA.stemReviewers[currentRevIndex];
    if (!rev) {
      rev = {
        id: `reviewer_${Date.now()}`,
        subject: "General Science",
        tag: "Main",
        color: "border-l-4 border-tagsci-600",
        title: "New Reviewer Draft",
        summary: "Curated learning notes and formulas",
        blocks: [
          { type: 'paragraph', text: `Key formula: $${tex}$` }
        ],
        rawMarkdown: "",
        content: ""
      };
      STUDIO_DATA.stemReviewers = [rev];
      setCurrentRevIndex(0);
      if (typeof renderReviewersList === 'function') renderReviewersList();
      if (typeof loadReviewerToEditor === 'function') loadReviewerToEditor();
      if (window.renderReviewersList) window.renderReviewersList();
      if (window.loadReviewerToEditor) window.loadReviewerToEditor();
    } else {
      if (!rev.blocks) rev.blocks = [];
      rev.blocks.push({
        type: 'paragraph',
        text: `Formula: $${tex}$`
      });
      if (typeof renderBlockCanvas === 'function') renderBlockCanvas();
      if (typeof syncBlocksToPreview === 'function') syncBlocksToPreview();
      if (window.renderBlockCanvas) window.renderBlockCanvas();
      if (window.syncBlocksToPreview) window.syncBlocksToPreview();
    }

    closeMathBuilderModal();
    if (typeof onComplete === 'function') onComplete();
    if (window.showToast) window.showToast('Equation inserted inline!');
    return;
  }

  // mode === 'card'
  if (activeMathTargetBlockIdx !== null) {
    const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
    if (rev && rev.blocks && rev.blocks[activeMathTargetBlockIdx]) {
      rev.blocks[activeMathTargetBlockIdx].formula = tex;
      rev.blocks[activeMathTargetBlockIdx].type = 'formula';
      if (!rev.blocks[activeMathTargetBlockIdx].title) {
        rev.blocks[activeMathTargetBlockIdx].title = 'Formula Card';
      }
    }
  } else {
    let rev = STUDIO_DATA.stemReviewers[currentRevIndex];
    if (!rev) {
      rev = {
        id: `reviewer_${Date.now()}`,
        subject: "General Science",
        tag: "Main",
        color: "border-l-4 border-tagsci-600",
        title: "New Reviewer Draft",
        summary: "Curated learning notes and formulas",
        blocks: [
          {
            type: 'formula',
            title: 'Formula Card',
            formula: tex,
            note: ''
          }
        ],
        rawMarkdown: "",
        content: ""
      };
      STUDIO_DATA.stemReviewers = [rev];
      setCurrentRevIndex(0);
      if (typeof renderReviewersList === 'function') renderReviewersList();
      if (typeof loadReviewerToEditor === 'function') loadReviewerToEditor();
      if (window.renderReviewersList) window.renderReviewersList();
      if (window.loadReviewerToEditor) window.loadReviewerToEditor();
    } else {
      if (!rev.blocks) rev.blocks = [];
      rev.blocks.push({
        type: 'formula',
        title: 'Formula Card',
        formula: tex,
        note: ''
      });

      const rawBody = document.getElementById('rev-input-body');
      if (rawBody && !document.getElementById('pane-markdown-source')?.classList.contains('hidden')) {
        const start = rawBody.selectionStart ?? rawBody.value.length;
        const cardMd = `\n\n**Formula Card**\n$$ ${tex} $$\n`;
        rawBody.value = rawBody.value.substring(0, start) + cardMd + rawBody.value.substring(start);
        rawBody.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  if (typeof renderBlockCanvas === 'function') renderBlockCanvas();
  if (typeof syncBlocksToPreview === 'function') syncBlocksToPreview();
  if (window.renderBlockCanvas) window.renderBlockCanvas();
  if (window.syncBlocksToPreview) window.syncBlocksToPreview();
  if (window.renderHubDashboard) window.renderHubDashboard();

  closeMathBuilderModal();
  if (typeof onComplete === 'function') onComplete();
  if (window.showToast) window.showToast('Formula card added to reviewer!');
}

/**
 * Applies Markdown/HTML formatting (Bold, Italic, Underline, Strikethrough, Code, Inline Math)
 * to the currently focused input/textarea or selection.
 */
export function applyRichTextFormatting(formatType) {
  let target = lastFocusedInput;
  if (!target || !document.body.contains(target) || target.closest('#modal-math-builder')) {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && !active.closest('#modal-math-builder')) {
      target = active;
    } else {
      target = document.querySelector('#rev-input-body:not(.hidden), #mat-input-body:not(.hidden), #pane-visual-blocks textarea:focus, #pane-visual-blocks input[type="text"]:focus, #pane-visual-blocks textarea, #pane-visual-blocks input[type="text"]');
    }
  }

  if (!target) return;

  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  const selectedText = target.value.substring(start, end);

  let before = '';
  let after = '';
  let defaultPlaceholder = '';

  switch (formatType) {
    case 'bold':
      before = '**';
      after = '**';
      defaultPlaceholder = 'bold text';
      break;
    case 'italic':
      before = '*';
      after = '*';
      defaultPlaceholder = 'italic text';
      break;
    case 'underline':
      before = '<u>';
      after = '</u>';
      defaultPlaceholder = 'underlined text';
      break;
    case 'strike':
      before = '~~';
      after = '~~';
      defaultPlaceholder = 'strikethrough text';
      break;
    case 'code':
      before = '`';
      after = '`';
      defaultPlaceholder = 'code';
      break;
    case 'math':
      before = '$';
      after = '$';
      defaultPlaceholder = 'x';
      break;
    default:
      return;
  }

  // Toggle unwrapping if already wrapped with before/after
  if (selectedText.startsWith(before) && selectedText.endsWith(after) && selectedText.length >= (before.length + after.length)) {
    const unwrapped = selectedText.substring(before.length, selectedText.length - after.length);
    target.value = target.value.substring(0, start) + unwrapped + target.value.substring(end);
    target.focus();
    target.setSelectionRange(start, start + unwrapped.length);
  } else {
    const innerText = selectedText || defaultPlaceholder;
    const insertion = before + innerText + after;
    
    target.value = target.value.substring(0, start) + insertion + target.value.substring(end);
    target.focus();

    if (selectedText) {
      target.setSelectionRange(start, start + insertion.length);
    } else {
      target.setSelectionRange(start + before.length, start + before.length + defaultPlaceholder.length);
    }
  }

  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));
}

// Global hotkeys for formatting (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+M)
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    if (modKey && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && !active.closest('#modal-math-builder')) {
          e.preventDefault();
          applyRichTextFormatting('bold');
        }
      } else if (key === 'i') {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && !active.closest('#modal-math-builder')) {
          e.preventDefault();
          applyRichTextFormatting('italic');
        }
      } else if (key === 'u') {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && !active.closest('#modal-math-builder')) {
          e.preventDefault();
          applyRichTextFormatting('underline');
        }
      } else if (key === 'm') {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          e.preventDefault();
          openMathBuilderModal();
        }
      }
    }
  });
}
