/* =========================================================
   TagSci Content Studio - Visual Equation Studio Modal
   ========================================================= */

import { renderMathInHtml } from './math_engine.js';
import { STUDIO_DATA, currentRevIndex } from '../data/studio_data.js';

let activeMathTargetBlockIdx = null;
let lastFocusedInput = null;

export function setLastFocusedInput(elem) {
  lastFocusedInput = elem;
}

export function getLastFocusedInput() {
  return lastFocusedInput;
}

export function openMathBuilderModal() {
  activeMathTargetBlockIdx = null;
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

  if (mode === 'inline' || (lastFocusedInput && document.body.contains(lastFocusedInput) && mode !== 'card')) {
    if (lastFocusedInput) {
      const start = lastFocusedInput.selectionStart ?? lastFocusedInput.value.length;
      const end = lastFocusedInput.selectionEnd ?? lastFocusedInput.value.length;
      const snippet = `$${tex}$`;
      lastFocusedInput.value = lastFocusedInput.value.substring(0, start) + snippet + lastFocusedInput.value.substring(end);
      lastFocusedInput.focus();
      lastFocusedInput.setSelectionRange(start + snippet.length, start + snippet.length);
      lastFocusedInput.dispatchEvent(new Event('input', { bubbles: true }));
      closeMathBuilderModal();
      if (window.showToast) window.showToast('Equation inserted into active field!');
      return;
    }
  }

  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (activeMathTargetBlockIdx !== null && rev && rev.blocks && rev.blocks[activeMathTargetBlockIdx]) {
    rev.blocks[activeMathTargetBlockIdx].formula = tex;
  } else if (rev) {
    if (!rev.blocks) rev.blocks = [];
    rev.blocks.push({
      type: 'formula',
      title: 'Formula Card',
      formula: tex,
      note: ''
    });
  }

  closeMathBuilderModal();
  if (typeof onComplete === 'function') onComplete();
  if (window.showToast) window.showToast('Formula card added to reviewer!');
}
