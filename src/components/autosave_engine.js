/* =========================================================
   TagSci Content Studio - Local Autosave Engine
   ========================================================= */

import { 
  STUDIO_DATA, 
  currentRevIndex, 
  currentMatIndex, 
  currentQuizSetIndex, 
  currentEditorMode,
  setCurrentRevIndex,
  setCurrentMatIndex,
  setCurrentQuizSetIndex,
  setCurrentEditorMode
} from '../data/studio_data.js';

export const AUTOSAVE_STORAGE_KEY = 'tagsci_cs_autosave_data';
export const AUTOSAVE_META_KEY = 'tagsci_cs_autosave_meta';

let autosaveTimeout = null;
let lastSaveTime = null;
let isDirty = false;
let editCounter = 0;

/**
 * Initialize the Local Autosave Engine.
 * Restores any previous unpushed draft from localStorage and hooks save listeners.
 */
export function initAutosaveEngine() {
  // 1. Try restoring from local storage
  const restored = restoreAutosavedData();

  // 2. Attach global DOM change and input listeners
  document.addEventListener('input', (e) => {
    // Exclude GitHub token inputs or search inputs from dirtying curriculum dataset
    if (e.target && (e.target.id === 'gh-auth-token' || e.target.id === 'vault-search-input' || e.target.classList.contains('no-autosave'))) {
      return;
    }
    scheduleAutosave();
  }, { passive: true });

  document.addEventListener('change', (e) => {
    if (e.target && (e.target.id === 'gh-auth-token' || e.target.id === 'vault-search-input' || e.target.classList.contains('no-autosave'))) {
      return;
    }
    scheduleAutosave();
  }, { passive: true });

  // 3. Flush on window unload / visibility change
  window.addEventListener('beforeunload', () => {
    forceImmediateAutosave();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      forceImmediateAutosave();
    }
  });

  // 4. Update initial UI indicator
  const meta = getAutosaveMetadata();
  if (meta && meta.lastSavedAt) {
    lastSaveTime = new Date(meta.lastSavedAt);
    updateAutosaveIndicator('saved', `Saved ${formatTimeRelative(lastSaveTime)}`);
  } else {
    updateAutosaveIndicator('saved', 'Autosave ready');
  }

  return restored;
}

/**
 * Schedule a debounced autosave write (default 600ms).
 */
export function scheduleAutosave(delayMs = 600) {
  isDirty = true;
  editCounter++;
  updateAutosaveIndicator('saving', 'Saving draft...');

  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
  }

  autosaveTimeout = setTimeout(() => {
    forceImmediateAutosave();
  }, delayMs);
}

/**
 * Synchronously write current STUDIO_DATA and state indices to localStorage.
 */
export function forceImmediateAutosave() {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
    autosaveTimeout = null;
  }

  try {
    const payload = {
      version: STUDIO_DATA.version || "1.4.0",
      updatedAt: new Date().toISOString(),
      announcement: STUDIO_DATA.announcement || "Authored via TagSci Content Studio",
      calendarEvents: STUDIO_DATA.calendarEvents || [],
      stemReviewers: STUDIO_DATA.stemReviewers || [],
      studyMaterials: STUDIO_DATA.studyMaterials || [],
      problemSets: STUDIO_DATA.problemSets || [],
      quizSets: STUDIO_DATA.quizSets || [],
      // Active state snapshot
      _uiState: {
        currentRevIndex,
        currentMatIndex,
        currentQuizSetIndex,
        currentEditorMode,
        savedAt: Date.now()
      }
    };

    const serialized = JSON.stringify(payload);
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, serialized);

    lastSaveTime = new Date();
    isDirty = false;

    const meta = {
      lastSavedAt: lastSaveTime.toISOString(),
      editCount: editCounter,
      sizeBytes: serialized.length,
      itemsCount: {
        reviewers: payload.stemReviewers.length,
        materials: payload.studyMaterials.length,
        quizzes: payload.quizSets.length,
        events: payload.calendarEvents.length
      }
    };
    localStorage.setItem(AUTOSAVE_META_KEY, JSON.stringify(meta));

    updateAutosaveIndicator('saved', `Saved ${formatTimeShort(lastSaveTime)}`);
    return true;
  } catch (err) {
    console.error('Failed to autosave locally:', err);
    updateAutosaveIndicator('error', 'Autosave failed (storage full?)');
    return false;
  }
}

/**
 * Attempt to restore autosaved data from localStorage.
 */
export function restoreAutosavedData() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return false;

    // Populate STUDIO_DATA properties
    if (parsed.version) STUDIO_DATA.version = parsed.version;
    if (parsed.announcement) STUDIO_DATA.announcement = parsed.announcement;
    if (Array.isArray(parsed.calendarEvents)) STUDIO_DATA.calendarEvents = parsed.calendarEvents;
    if (Array.isArray(parsed.stemReviewers)) STUDIO_DATA.stemReviewers = parsed.stemReviewers;
    if (Array.isArray(parsed.studyMaterials)) STUDIO_DATA.studyMaterials = parsed.studyMaterials;
    if (Array.isArray(parsed.problemSets)) STUDIO_DATA.problemSets = parsed.problemSets;
    if (Array.isArray(parsed.quizSets)) STUDIO_DATA.quizSets = parsed.quizSets;

    // Restore UI state if available
    if (parsed._uiState) {
      if (typeof parsed._uiState.currentRevIndex === 'number' && parsed._uiState.currentRevIndex >= 0) {
        setCurrentRevIndex(parsed._uiState.currentRevIndex);
      }
      if (typeof parsed._uiState.currentMatIndex === 'number' && parsed._uiState.currentMatIndex >= 0) {
        setCurrentMatIndex(parsed._uiState.currentMatIndex);
      }
      if (typeof parsed._uiState.currentQuizSetIndex === 'number' && parsed._uiState.currentQuizSetIndex >= 0) {
        setCurrentQuizSetIndex(parsed._uiState.currentQuizSetIndex);
      }
      if (parsed._uiState.currentEditorMode) {
        setCurrentEditorMode(parsed._uiState.currentEditorMode);
      }
    }

    console.log('Restored local autosaved draft into Content Studio.');
    return true;
  } catch (err) {
    console.warn('Could not parse autosaved data:', err);
    return false;
  }
}

/**
 * Clear local autosaved data from localStorage.
 */
export function clearAutosavedData() {
  localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
  localStorage.removeItem(AUTOSAVE_META_KEY);
  lastSaveTime = null;
  isDirty = false;
  updateAutosaveIndicator('saved', 'Autosave reset');
  if (window.showToast) window.showToast('Local autosaved draft cleared.');
}

/**
 * Retrieve metadata about the current autosaved draft.
 */
export function getAutosaveMetadata() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Update the UI autosave badge in the top navigation bar.
 */
export function updateAutosaveIndicator(status, message) {
  const container = document.getElementById('autosave-indicator');
  const icon = document.getElementById('autosave-icon');
  const text = document.getElementById('autosave-text');
  if (!container || !text) return;

  text.innerText = message || 'Saved locally';

  // Clear styling classes
  container.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all select-none cursor-pointer shadow-sm';

  if (status === 'saving') {
    container.classList.add('bg-amber-50', 'dark:bg-amber-950/60', 'text-amber-700', 'dark:text-amber-300', 'border-amber-200', 'dark:border-amber-800/80');
    if (icon) {
      icon.outerHTML = '<i data-lucide="loader-2" id="autosave-icon" class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin"></i>';
    }
  } else if (status === 'error') {
    container.classList.add('bg-rose-50', 'dark:bg-rose-950/60', 'text-rose-700', 'dark:text-rose-300', 'border-rose-200', 'dark:border-rose-800/80');
    if (icon) {
      icon.outerHTML = '<i data-lucide="alert-circle" id="autosave-icon" class="w-3.5 h-3.5 text-rose-600 dark:text-rose-400"></i>';
    }
  } else {
    // 'saved'
    container.classList.add('bg-emerald-50', 'dark:bg-emerald-950/60', 'text-emerald-700', 'dark:text-emerald-300', 'border-emerald-200', 'dark:border-emerald-800/80');
    if (icon) {
      icon.outerHTML = '<i data-lucide="check-circle-2" id="autosave-icon" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"></i>';
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Open the Local Autosave Details & Management Modal.
 */
export function openAutosaveModal() {
  const existing = document.getElementById('autosave-mgmt-modal');
  if (existing) existing.remove();

  const meta = getAutosaveMetadata();
  const rawData = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
  const sizeKb = rawData ? (rawData.length / 1024).toFixed(1) : '0';

  const modal = document.createElement('div');
  modal.id = 'autosave-mgmt-modal';
  modal.className = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4';
  
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
            <i data-lucide="hard-drive" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Local Autosave Status</h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Automatic browser-level draft preservation</p>
          </div>
        </div>
        <button onclick="document.getElementById('autosave-mgmt-modal').remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-lg font-bold">
          &times;
        </button>
      </div>

      <div class="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
        <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-400">Autosave Engine:</span>
          <span class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active & Real-Time
          </span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-400">Last Local Save:</span>
          <span class="font-bold">${meta && meta.lastSavedAt ? new Date(meta.lastSavedAt).toLocaleString() : 'Not saved yet'}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-400">Draft Storage Footprint:</span>
          <span class="font-bold font-mono-math">${sizeKb} KB</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-400">Authored Draft Summary:</span>
          <span class="font-bold font-mono-math">
            ${meta && meta.itemsCount ? `${meta.itemsCount.reviewers} Revs / ${meta.itemsCount.materials} Mats / ${meta.itemsCount.quizzes} Quizzes` : 'Active'}
          </span>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <p class="font-bold text-slate-700 dark:text-slate-200">💡 How it works:</p>
        <p>Every keystroke, block reorder, and image addition is debounced and cached instantly into your browser's private storage. If your browser closes or reloads, your entire draft is automatically recovered.</p>
      </div>

      <div class="flex items-center gap-2 pt-2">
        <button onclick="window.forceImmediateAutosave(); window.showToast('Draft force-saved locally!'); document.getElementById('autosave-mgmt-modal').remove();" class="flex-1 py-2.5 rounded-xl bg-tagsci-800 hover:bg-tagsci-700 active:scale-95 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5">
          <i data-lucide="save" class="w-3.5 h-3.5"></i>
          <span>Save Draft Now</span>
        </button>
        <button onclick="if(confirm('Are you sure you want to clear your local draft? (Unsaved local changes will revert to remote baseline)')) { window.clearAutosavedData(); window.refreshAllStudioViews(); document.getElementById('autosave-mgmt-modal').remove(); }" class="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-900 transition">
          Reset Draft
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();
}

// Helpers
function formatTimeShort(d) {
  if (!d) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatTimeRelative(d) {
  if (!d) return 'just now';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return formatTimeShort(d);
}
