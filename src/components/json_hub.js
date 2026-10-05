/* =========================================================
   TagSci Content Studio - JSON Hub & Direct GitHub Publisher
   ========================================================= */

import { STUDIO_DATA, currentRevIndex, currentQuizSetIndex } from '../data/studio_data.js';
import { compileBlocksToMarkdown } from './reviewer_studio.js';

// UTF-8 safe Base64 encoding/decoding helpers
function utf8ToBase64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str) {
  return decodeURIComponent(escape(window.atob(str)));
}

export function generateProductionJson() {
  return {
    version: STUDIO_DATA.version || "1.4.0",
    updatedAt: new Date().toISOString(),
    announcement: `Refreshed ${STUDIO_DATA.stemReviewers.length} Reviewers, ${STUDIO_DATA.studyMaterials.length} Study Materials, ${STUDIO_DATA.calendarEvents.length} Deadlines, and ${STUDIO_DATA.quizSets.length} Quiz Banks.`,
    calendarEvents: STUDIO_DATA.calendarEvents,
    stemReviewers: STUDIO_DATA.stemReviewers.map(r => ({
      id: r.id,
      subject: r.subject,
      tag: r.tag,
      color: r.color,
      title: r.title,
      summary: r.summary,
      blocks: r.blocks || []
    })),
    studyMaterials: (STUDIO_DATA.studyMaterials || []).map(m => ({
      id: m.id,
      subject: m.subject,
      tag: m.tag,
      color: m.color,
      title: m.title,
      summary: m.summary,
      blocks: m.blocks || []
    })),
    problemSets: STUDIO_DATA.problemSets || [],
    quizSets: STUDIO_DATA.quizSets
  };
}

export function renderJsonHub() {
  const codeEl = document.getElementById('hub-json-viewer');
  if (codeEl) {
    codeEl.value = JSON.stringify(generateProductionJson(), null, 2);
  }
  loadGitHubConfig();
}

export function downloadFile(filename, text, mimeType = 'text/plain') {
  const element = document.createElement('a');
  element.setAttribute('href', `data:${mimeType};charset=utf-8,` + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function exportUpdatesJson() {
  const json = generateProductionJson();
  downloadFile('updates.json', JSON.stringify(json, null, 2), 'application/json');
  if (window.showToast) window.showToast('Downloaded updates.json!');
}

export function copyUpdatesJson() {
  const jsonStr = JSON.stringify(generateProductionJson(), null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    if (window.showToast) window.showToast('Copied updates.json to clipboard!');
  });
}

export function exportReviewerMarkdown() {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev) return;
  const mdBody = compileBlocksToMarkdown(rev.blocks || []);
  const mdContent = `---
id: ${rev.id}
subject: ${rev.subject}
tag: ${rev.tag}
title: ${rev.title}
summary: ${rev.summary}
---

${mdBody}
`;
  downloadFile(`${rev.id || 'reviewer'}.md`, mdContent, 'text/markdown');
  if (window.showToast) window.showToast(`Downloaded ${rev.id}.md!`);
}

export function exportQuizSetMarkdown() {
  const set = STUDIO_DATA.quizSets[currentQuizSetIndex];
  if (!set) return;
  let mdLines = `---
id: ${set.id}
subject: ${set.subject}
tag: ${set.tag || 'Quiz'}
title: ${set.title}
desc: ${set.desc}
timeLimitMinutes: ${set.timeLimitMinutes || 15}
---

`;
  (set.questions || []).forEach((q, i) => {
    mdLines += `### Question ${i + 1} (${q.type})\n${q.prompt}\n\n`;
    if (q.type === 'mcq') {
      (q.options || []).forEach((opt, oIdx) => {
        const isChecked = oIdx === q.answerIndex ? '[x]' : '[ ]';
        mdLines += `- ${isChecked} ${opt}\n`;
      });
    } else if (q.type === 'true_false') {
      mdLines += `answerBoolean: ${q.answerBoolean === true || q.answerBoolean === 'true'}\n`;
    } else if (q.type === 'identification') {
      mdLines += `correctText: ${q.correctText || ''}\naliases: ${q.aliases || ''}\n`;
    } else if (q.type === 'numerical') {
      mdLines += `correctValue: ${q.correctValue || ''}\ntolerance: ${q.tolerance || '0.05'}\nunit: ${q.unit || ''}\n`;
    } else if (q.type === 'multi_select') {
      (q.options || []).forEach((opt, oIdx) => {
        const isChecked = (q.answerIndices || []).includes(oIdx) ? '[x]' : '[ ]';
        mdLines += `- ${isChecked} ${opt}\n`;
      });
    } else if (q.type === 'flashcard') {
      mdLines += `front: ${q.front || q.prompt}\nback: ${q.back || ''}\n`;
    }
    if (q.explanation) {
      mdLines += `\n> **Explanation:** ${q.explanation}\n`;
    }
    mdLines += `\n---\n\n`;
  });

  downloadFile(`${set.id || 'quiz_set'}.md`, mdLines, 'text/markdown');
  if (window.showToast) window.showToast(`Downloaded ${set.id}.md!`);
}

export function handleImportJsonFile(e, onComplete) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const json = JSON.parse(event.target.result);
      if (json.stemReviewers) STUDIO_DATA.stemReviewers = json.stemReviewers;
      if (json.calendarEvents) STUDIO_DATA.calendarEvents = json.calendarEvents;
      if (json.quizSets) STUDIO_DATA.quizSets = json.quizSets;
      if (json.studyMaterials) STUDIO_DATA.studyMaterials = json.studyMaterials;
      if (json.problemSets) STUDIO_DATA.problemSets = json.problemSets;
      
      setBaselineData(json);
      if (window.forceImmediateAutosave) window.forceImmediateAutosave();
      if (typeof onComplete === 'function') onComplete();
      if (window.showToast) window.showToast('Successfully imported updates.json!');
    } catch (err) {
      alert('Invalid JSON file format.');
    }
  };
  reader.readAsText(file);
}

/* =========================================================
   SMART 3-WAY DATASET MERGE & CONFLICT RESOLVER
   ========================================================= */

const BASELINE_STORAGE_KEY = 'tagsci_cs_baseline_data';
let inMemoryBaseline = null;

export function getBaselineData() {
  if (inMemoryBaseline) return inMemoryBaseline;
  try {
    const raw = localStorage.getItem(BASELINE_STORAGE_KEY);
    if (raw) {
      inMemoryBaseline = JSON.parse(raw);
      return inMemoryBaseline;
    }
  } catch (e) {
    console.warn('Could not read baseline data from storage:', e);
  }
  return null;
}

export function setBaselineData(data) {
  if (!data) return;
  try {
    const copy = JSON.parse(JSON.stringify(data));
    inMemoryBaseline = copy;
    localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(copy));
  } catch (e) {
    console.warn('Could not save baseline data to storage:', e);
  }
}

/**
 * Item-level deterministic equality comparator
 */
function isItemEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Generic item-level 3-way merge on an array of entities
 */
function mergeItemArray(localList = [], remoteList = [], baselineList = [], getEntityId, getEntityTitle, typeLabel = 'item') {
  const localMap = new Map();
  const remoteMap = new Map();
  const baselineMap = new Map();

  (localList || []).forEach((item, idx) => {
    const id = getEntityId(item, idx);
    if (id) localMap.set(id, item);
  });

  (remoteList || []).forEach((item, idx) => {
    const id = getEntityId(item, idx);
    if (id) remoteMap.set(id, item);
  });

  (baselineList || []).forEach((item, idx) => {
    const id = getEntityId(item, idx);
    if (id) baselineMap.set(id, item);
  });

  const merged = [];
  const report = {
    addedRemote: [],
    addedLocal: [],
    updatedRemote: [],
    updatedLocal: [],
    conflicts: [],
    keptLocal: []
  };

  // 1. Process all local items (preserving local ordering)
  localMap.forEach((localItem, id) => {
    const remoteItem = remoteMap.get(id);
    const baseItem = baselineMap.get(id);
    const title = getEntityTitle(localItem) || id;

    if (!remoteItem) {
      // Exists locally, absent on remote
      if (baseItem) {
        // Was in baseline -> Deleted on remote by another editor
        const isLocallyModified = !isItemEqual(localItem, baseItem);
        if (isLocallyModified) {
          // Local user edited it while remote deleted it: preserve local work!
          merged.push(localItem);
          report.conflicts.push({ type: typeLabel, id, title, reason: 'Remote deleted, but preserved local edits' });
        } else {
          // Local user did not touch it, respect remote deletion
          // (do not push to merged)
        }
      } else {
        // Not in baseline -> Brand new item created by local editor
        merged.push(localItem);
        report.addedLocal.push({ type: typeLabel, id, title });
      }
    } else {
      // Exists in BOTH local and remote
      if (isItemEqual(localItem, remoteItem)) {
        // Identical contents -> No conflict
        merged.push(localItem);
      } else {
        // Different contents
        if (baseItem) {
          const localModified = !isItemEqual(localItem, baseItem);
          const remoteModified = !isItemEqual(remoteItem, baseItem);

          if (localModified && !remoteModified) {
            // Only local editor modified it -> Keep local
            merged.push(localItem);
            report.updatedLocal.push({ type: typeLabel, id, title });
          } else if (!localModified && remoteModified) {
            // Only remote editor modified it -> Auto-accept remote changes
            merged.push(remoteItem);
            report.updatedRemote.push({ type: typeLabel, id, title });
          } else {
            // BOTH modified the same item -> Conflict: Prioritize local active draft, flag conflict
            merged.push(localItem);
            report.conflicts.push({ type: typeLabel, id, title, reason: 'Concurrent edits detected on both sides; kept local edits' });
          }
        } else {
          // No baseline available: Keep local as active edit
          merged.push(localItem);
          report.updatedLocal.push({ type: typeLabel, id, title });
        }
      }
    }
  });

  // 2. Process remote-only items (New items authored by other editors)
  remoteMap.forEach((remoteItem, id) => {
    if (localMap.has(id)) return; // Already processed above
    const baseItem = baselineMap.get(id);
    const title = getEntityTitle(remoteItem) || id;

    if (baseItem) {
      // Was in baseline but absent locally -> Local user deleted it
      const remoteModified = !isItemEqual(remoteItem, baseItem);
      if (remoteModified) {
        // Remote modified it after local baseline -> Restore remote item to avoid data loss
        merged.push(remoteItem);
        report.addedRemote.push({ type: typeLabel, id, title, restored: true });
      } else {
        // Local explicitly deleted it without remote modification -> Respect deletion
      }
    } else {
      // Brand new item created remotely by another team member -> Auto-incorporate!
      merged.push(remoteItem);
      report.addedRemote.push({ type: typeLabel, id, title });
    }
  });

  return { merged, report };
}

/**
 * Executes a full 3-way reconciliation between Local and Remote datasets
 */
export function mergeStudioDatasets(localData, remoteData, baselineData = null) {
  if (!remoteData || typeof remoteData !== 'object') {
    return {
      mergedData: localData,
      report: { hasRemoteChanges: false, summary: 'No remote dataset found to merge with.' }
    };
  }

  const base = baselineData || {};

  // 1. Reviewers merge
  const revRes = mergeItemArray(
    localData.stemReviewers || [],
    remoteData.stemReviewers || [],
    base.stemReviewers || [],
    (item, idx) => item.id || `rev_${idx}`,
    (item) => item.title || item.subject,
    'Reviewer'
  );

  // 2. Study Materials merge
  const matRes = mergeItemArray(
    localData.studyMaterials || [],
    remoteData.studyMaterials || [],
    base.studyMaterials || [],
    (item, idx) => item.id || `mat_${idx}`,
    (item) => item.title || item.subject,
    'Study Material'
  );

  // 3. Quiz Sets merge
  const quizRes = mergeItemArray(
    localData.quizSets || [],
    remoteData.quizSets || [],
    base.quizSets || [],
    (item, idx) => item.id || `quiz_${idx}`,
    (item) => item.title || item.subject,
    'Quiz Bank'
  );

  // 4. Calendar Events merge (using ID or date+title fallback)
  const calRes = mergeItemArray(
    localData.calendarEvents || [],
    remoteData.calendarEvents || [],
    base.calendarEvents || [],
    (item, idx) => item.id || `${item.date || ''}_${(item.title || '').trim().toLowerCase()}` || `event_${idx}`,
    (item) => item.title || item.date,
    'Deadline'
  );

  // 5. Problem Sets merge
  const probRes = mergeItemArray(
    localData.problemSets || [],
    remoteData.problemSets || [],
    base.problemSets || [],
    (item, idx) => item.id || `prob_${idx}`,
    (item) => item.title || item.topic,
    'Problem Set'
  );

  // Aggregate stats
  const totalRemoteAdded = revRes.report.addedRemote.length + matRes.report.addedRemote.length + quizRes.report.addedRemote.length + calRes.report.addedRemote.length + probRes.report.addedRemote.length;
  const totalRemoteUpdated = revRes.report.updatedRemote.length + matRes.report.updatedRemote.length + quizRes.report.updatedRemote.length + calRes.report.updatedRemote.length + probRes.report.updatedRemote.length;
  const totalConflicts = revRes.report.conflicts.length + matRes.report.conflicts.length + quizRes.report.conflicts.length + calRes.report.conflicts.length + probRes.report.conflicts.length;
  const totalLocalAdded = revRes.report.addedLocal.length + matRes.report.addedLocal.length + quizRes.report.addedLocal.length + calRes.report.addedLocal.length + probRes.report.addedLocal.length;
  const totalLocalUpdated = revRes.report.updatedLocal.length + matRes.report.updatedLocal.length + quizRes.report.updatedLocal.length + calRes.report.updatedLocal.length + probRes.report.updatedLocal.length;

  const hasRemoteChanges = totalRemoteAdded > 0 || totalRemoteUpdated > 0;

  // Synthesize merged dataset
  const mergedData = {
    version: remoteData.version || localData.version || "1.4.0",
    updatedAt: new Date().toISOString(),
    announcement: `Refreshed ${revRes.merged.length} Reviewers, ${matRes.merged.length} Study Materials, ${calRes.merged.length} Deadlines, and ${quizRes.merged.length} Quiz Banks.`,
    calendarEvents: calRes.merged,
    stemReviewers: revRes.merged,
    studyMaterials: matRes.merged,
    problemSets: probRes.merged,
    quizSets: quizRes.merged
  };

  const report = {
    hasRemoteChanges,
    totalRemoteAdded,
    totalRemoteUpdated,
    totalConflicts,
    totalLocalAdded,
    totalLocalUpdated,
    details: {
      reviewers: revRes.report,
      materials: matRes.report,
      quizzes: quizRes.report,
      calendar: calRes.report,
      problems: probRes.report
    }
  };

  return { mergedData, report };
}

export async function pingOtaEndpoint() {
  const input = document.getElementById('hub-ota-endpoint-input');
  if (!input) return;
  const url = input.value.trim();
  const status = document.getElementById('hub-ota-status');
  if (!status) return;

  status.classList.remove('hidden');
  status.innerHTML = '<span class="text-blue-500">Pinging OTA endpoint...</span>';
  try {
    const cacheBustUrl = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
    const resp = await fetch(cacheBustUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    status.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-bold">✓ Connected! Version: ${data.version || 'OK'}, Announcement: "${data.announcement || 'None'}"</span>`;
  } catch (err) {
    status.innerHTML = `<span class="text-red-500 font-bold">✕ Error: ${err.message}</span>`;
  }
}

/* =========================================================
   DIRECT GITHUB API INTEGRATION FOR EDITORIAL COUNCIL
   ========================================================= */

const SEED_MASK = [0x5A, 0x9C, 0x3F, 0xE2, 0x71, 0xB8, 0x4D, 0x16, 0x85, 0x6E, 0xA3, 0xF0];
const TSKEY_PREFIX = "TSKEY_";

/**
 * Decodes an obfuscated TSKEY (XOR + circular bit rotation + positional shift) into raw GitHub PAT in memory
 */
export function decodeStudioKey(obfuscatedKey) {
  if (!obfuscatedKey || typeof obfuscatedKey !== 'string') return '';
  obfuscatedKey = obfuscatedKey.trim();

  // If already raw PAT (ghp_ or github_pat_), use directly
  if (!obfuscatedKey.startsWith(TSKEY_PREFIX)) return obfuscatedKey;

  try {
    let b64 = obfuscatedKey.substring(TSKEY_PREFIX.length)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';

    const binStr = window.atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }

    const out = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      let b = bytes[i];

      // 1. Reverse Positional shift
      b = (b - ((i * 7) % 256) + 256) & 0xFF;

      // 2. Reverse Nibble Swap
      b = ((b & 0x0F) << 4) | ((b & 0xF0) >>> 4);

      // 3. Reverse XOR with cyclic seed mask
      b = b ^ SEED_MASK[i % SEED_MASK.length];

      // 4. Reverse Bitwise Circular Rotation (ROR 3 bits)
      b = ((b >>> 3) | (b << 5)) & 0xFF;

      out[i] = b;
    }

    return new TextDecoder().decode(out);
  } catch (err) {
    console.warn("Could not decode TSKEY, falling back to raw token:", err);
    return obfuscatedKey;
  }
}

const STORAGE_KEYS = {
  TOKEN: 'tagsci_cs_gh_token',
  REPO: 'tagsci_cs_gh_repo',
  BRANCH: 'tagsci_cs_gh_branch',
  PATH: 'tagsci_cs_gh_path'
};

export function getGitHubConfig() {
  const tokenEl = document.getElementById('gh-pat-token');
  const repoEl = document.getElementById('gh-repo-name');
  const branchEl = document.getElementById('gh-branch-name');
  const pathEl = document.getElementById('gh-file-path');

  const storedOrEnteredToken = (tokenEl ? tokenEl.value.trim() : '') || (localStorage.getItem(STORAGE_KEYS.TOKEN) || '').trim();

  return {
    token: decodeStudioKey(storedOrEnteredToken),
    rawInput: storedOrEnteredToken,
    repo: (repoEl ? repoEl.value : '') || localStorage.getItem(STORAGE_KEYS.REPO) || 'OmniScripterStorm/Student-Hub',
    branch: (branchEl ? branchEl.value : '') || localStorage.getItem(STORAGE_KEYS.BRANCH) || 'main',
    path: (pathEl ? pathEl.value : '') || localStorage.getItem(STORAGE_KEYS.PATH) || 'updates.json'
  };
}

export function saveGitHubConfig() {
  const tokenEl = document.getElementById('gh-pat-token');
  const repoEl = document.getElementById('gh-repo-name');
  const branchEl = document.getElementById('gh-branch-name');
  const pathEl = document.getElementById('gh-file-path');

  const tokenVal = tokenEl ? tokenEl.value.trim() : '';
  const repoVal = repoEl ? repoEl.value.trim() : '';
  const branchVal = branchEl ? branchEl.value.trim() : '';
  const pathVal = pathEl ? pathEl.value.trim() : '';

  if (tokenVal) localStorage.setItem(STORAGE_KEYS.TOKEN, tokenVal);
  if (repoVal) localStorage.setItem(STORAGE_KEYS.REPO, repoVal);
  if (branchVal) localStorage.setItem(STORAGE_KEYS.BRANCH, branchVal);
  if (pathVal) localStorage.setItem(STORAGE_KEYS.PATH, pathVal);

  if (window.showToast) window.showToast('GitHub credentials saved locally!');
}

export function loadGitHubConfig() {
  const tokenEl = document.getElementById('gh-pat-token');
  const repoEl = document.getElementById('gh-repo-name');
  const branchEl = document.getElementById('gh-branch-name');
  const pathEl = document.getElementById('gh-file-path');

  if (tokenEl && !tokenEl.value) tokenEl.value = localStorage.getItem(STORAGE_KEYS.TOKEN) || '';
  if (repoEl && !repoEl.value) repoEl.value = localStorage.getItem(STORAGE_KEYS.REPO) || 'OmniScripterStorm/Student-Hub';
  if (branchEl && !branchEl.value) branchEl.value = localStorage.getItem(STORAGE_KEYS.BRANCH) || 'main';
  if (pathEl && !pathEl.value) pathEl.value = localStorage.getItem(STORAGE_KEYS.PATH) || 'updates.json';
}

export function clearGitHubConfig() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  const tokenEl = document.getElementById('gh-pat-token');
  if (tokenEl) tokenEl.value = '';
  setPublishStatus('Token cleared from local storage.', 'slate');
  if (window.showToast) window.showToast('Token cleared!');
}

export function toggleTokenVisibility() {
  const tokenEl = document.getElementById('gh-pat-token');
  const eyeIcon = document.getElementById('gh-eye-icon');
  if (!tokenEl) return;
  if (tokenEl.type === 'password') {
    tokenEl.type = 'text';
    if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye-off');
  } else {
    tokenEl.type = 'password';
    if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye');
  }
  if (window.lucide) window.lucide.createIcons();
}

function setPublishStatus(message, type = 'info', extraHtml = '') {
  const statusEl = document.getElementById('gh-publish-status');
  if (!statusEl) return;
  statusEl.classList.remove('hidden');

  const colorMap = {
    info: 'text-blue-500 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30',
    success: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30',
    error: 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30',
    slate: 'text-slate-500 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
  };

  statusEl.className = `p-3 rounded-xl border text-xs leading-relaxed ${colorMap[type] || colorMap.info}`;
  statusEl.innerHTML = `<div>${message}</div>${extraHtml}`;
}

// Check GitHub repo & PAT validity
export async function testGitHubAccess() {
  saveGitHubConfig();
  const { token, repo } = getGitHubConfig();

  if (!token) {
    setPublishStatus('⚠️ Please enter a GitHub Personal Access Token (PAT).', 'error');
    return;
  }

  setPublishStatus('🔄 Connecting to GitHub API...', 'info');

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('Invalid or expired Personal Access Token.');
      if (res.status === 404) throw new Error(`Repository "${repo}" not found or token lacks access.`);
      throw new Error(`GitHub API Error: HTTP ${res.status}`);
    }

    const data = await res.json();
    const canPush = data.permissions && (data.permissions.push || data.permissions.admin);
    const writeStatus = canPush 
      ? '<span class="text-emerald-500 font-bold">Write / Push: Authorized</span>' 
      : '<span class="text-amber-500 font-bold">Read-Only (Ensure token has Contents: Read and Write permission)</span>';

    setPublishStatus(
      `✓ Authenticated as repository collaborator!<br><b>Repo:</b> ${data.full_name} (${data.private ? 'Private' : 'Public'})<br><b>Permissions:</b> ${writeStatus}`,
      canPush ? 'success' : 'info'
    );
  } catch (err) {
    setPublishStatus(`✕ Access test failed: ${err.message}`, 'error');
  }
}

// Fetch latest updates.json from GitHub or local source and load into studio
export async function fetchLatestUpdatesJson(isSilent = false, onComplete = null) {
  saveGitHubConfig();
  const { token, repo, branch, path } = getGitHubConfig();

  const fetchBtn = document.getElementById('btn-gh-fetch-updates');
  if (fetchBtn) {
    fetchBtn.disabled = true;
    fetchBtn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Fetching...`;
    if (window.lucide) window.lucide.createIcons();
  }

  setPublishStatus('🔄 Fetching latest updates.json from GitHub...', 'info');

  try {
    let json = null;

    // Strategy 1: Try GitHub Contents API if repo & branch are configured
    if (repo && branch && path) {
      try {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const apiRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}&_t=${Date.now()}`, {
          headers,
          cache: 'no-store'
        });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.content) {
            const decoded = base64ToUtf8(apiData.content.replace(/\s/g, ''));
            json = JSON.parse(decoded);
          }
        }
      } catch (apiErr) {
        console.warn('GitHub API fetch failed, trying raw URL:', apiErr);
      }
    }

    // Strategy 2: Try GitHub raw URL if not already fetched
    if (!json && repo && branch && path) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${path}?_t=${Date.now()}`;
        const rawRes = await fetch(rawUrl, { cache: 'no-store' });
        if (rawRes.ok) {
          json = await rawRes.json();
        }
      } catch (rawErr) {
        console.warn('Raw GitHub fetch failed, trying relative URL:', rawErr);
      }
    }

    // Strategy 3: Try relative / local updates.json
    if (!json) {
      try {
        const localRes = await fetch(`../../updates.json?_t=${Date.now()}`, { cache: 'no-store' })
          .catch(() => fetch(`updates.json?_t=${Date.now()}`, { cache: 'no-store' }));
        if (localRes && localRes.ok) {
          json = await localRes.json();
        }
      } catch (localErr) {
        console.warn('Local fetch failed:', localErr);
      }
    }

    if (!json) {
      throw new Error('Could not fetch updates.json from GitHub or local source.');
    }

    // Check if we should reconcile with local draft or load directly
    const baseline = getBaselineData();
    const hasLocalDraft = STUDIO_DATA.stemReviewers.length > 0 || STUDIO_DATA.studyMaterials.length > 0 || STUDIO_DATA.quizSets.length > 0;

    if (baseline && hasLocalDraft) {
      const { mergedData, report } = reconcileWithRemote(json);
      if (report.hasRemoteChanges || report.totalLocalUpdated > 0 || report.totalLocalAdded > 0) {
        STUDIO_DATA.version = mergedData.version || json.version;
        STUDIO_DATA.updatedAt = json.updatedAt;
        STUDIO_DATA.announcement = mergedData.announcement || json.announcement;
        STUDIO_DATA.stemReviewers = mergedData.stemReviewers;
        STUDIO_DATA.studyMaterials = mergedData.studyMaterials;
        STUDIO_DATA.quizSets = mergedData.quizSets;
        STUDIO_DATA.calendarEvents = mergedData.calendarEvents;
        STUDIO_DATA.problemSets = mergedData.problemSets;
      } else {
        STUDIO_DATA.version = json.version;
        STUDIO_DATA.updatedAt = json.updatedAt;
        STUDIO_DATA.announcement = json.announcement;
        STUDIO_DATA.stemReviewers = json.stemReviewers || [];
        STUDIO_DATA.studyMaterials = json.studyMaterials || [];
        STUDIO_DATA.quizSets = json.quizSets || [];
        STUDIO_DATA.calendarEvents = json.calendarEvents || [];
        STUDIO_DATA.problemSets = json.problemSets || [];
      }
    } else {
      STUDIO_DATA.version = json.version;
      STUDIO_DATA.updatedAt = json.updatedAt;
      STUDIO_DATA.announcement = json.announcement;
      STUDIO_DATA.stemReviewers = json.stemReviewers || [];
      STUDIO_DATA.studyMaterials = json.studyMaterials || [];
      STUDIO_DATA.quizSets = json.quizSets || [];
      STUDIO_DATA.calendarEvents = json.calendarEvents || [];
      STUDIO_DATA.problemSets = json.problemSets || [];
    }

    // Save pristine remote baseline
    setBaselineData(json);

    // Keep local autosave storage synchronized
    if (window.forceImmediateAutosave) {
      window.forceImmediateAutosave();
    }

    // Refresh UI
    renderJsonHub();
    if (typeof onComplete === 'function') {
      onComplete(json);
    }

    setPublishStatus(
      `✓ <b>Successfully fetched latest updates.json!</b> (v${STUDIO_DATA.version})<br>
       Loaded ${STUDIO_DATA.stemReviewers.length} Reviewers, ${STUDIO_DATA.studyMaterials.length} Study Materials, ${STUDIO_DATA.quizSets.length} Quizzes, ${STUDIO_DATA.calendarEvents.length} Deadlines.<br>
       <span class="text-[10px] text-emerald-500 font-bold mt-1 block">🛡️ Smart 3-Way Multi-Editor Merge & Local Autosave Synchronized</span>`,
      'success'
    );

    if (window.showToast) {
      window.showToast(`Fetched latest updates.json (v${STUDIO_DATA.version})!`);
    }
  } catch (err) {
    setPublishStatus(`✕ Fetch Failed: ${err.message}`, 'error');
    if (!isSilent) {
      console.warn('Fetch updates.json failed:', err);
    }
  } finally {
    if (fetchBtn) {
      fetchBtn.disabled = false;
      fetchBtn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-blue-400"></i> Fetch Latest updates.json`;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

/**
 * Smart Publish to GitHub with 3-Way Reconciliation & Conflict Resolution
 * Prevents multiple council members from silently overwriting each other's work
 */
export async function pushDirectUpdatesJsonToGitHub() {
  saveGitHubConfig();
  const { token, repo, branch, path } = getGitHubConfig();

  if (!token) {
    setPublishStatus('⚠️ Please input your GitHub Personal Access Token first.', 'error');
    return;
  }

  const commitMsgInput = document.getElementById('gh-commit-msg');
  const commitMessage = (commitMsgInput && commitMsgInput.value.trim()) || `OTA Curriculum Sync (${new Date().toLocaleString()}) via TagSci Content Studio`;

  const pushBtn = document.getElementById('btn-gh-push-direct');
  if (pushBtn) {
    pushBtn.disabled = true;
    pushBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Merging & Publishing...`;
    if (window.lucide) window.lucide.createIcons();
  }

  setPublishStatus('🔄 Connecting to GitHub & checking for remote updates...', 'info');

  try {
    // Inner function with auto-retry on 409 SHA conflict
    async function attemptPush(retryCount = 0) {
      // 1. Fetch current remote file content & SHA
      let existingSha = null;
      let remoteData = null;

      const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}&_t=${Date.now()}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });

      if (getRes.ok) {
        const getData = await getRes.json();
        existingSha = getData.sha;
        if (getData.content) {
          try {
            const decoded = base64ToUtf8(getData.content.replace(/\s/g, ''));
            remoteData = JSON.parse(decoded);
          } catch (e) {
            console.warn('Could not parse remote JSON content:', e);
          }
        }
      }

      // 2. Perform Smart 3-Way Merge
      const localPayload = generateProductionJson();
      const baseline = getBaselineData();
      let finalPayload = localPayload;
      let mergeReport = null;

      if (remoteData) {
        setPublishStatus('🛡️ Reconciling local changes with remote updates...', 'info');
        const { mergedData, report } = mergeStudioDatasets(localPayload, remoteData, baseline);
        finalPayload = mergedData;
        mergeReport = report;

        // Apply merged entities back to local STUDIO_DATA
        STUDIO_DATA.stemReviewers = mergedData.stemReviewers;
        STUDIO_DATA.studyMaterials = mergedData.studyMaterials;
        STUDIO_DATA.quizSets = mergedData.quizSets;
        STUDIO_DATA.calendarEvents = mergedData.calendarEvents;
        if (mergedData.problemSets) STUDIO_DATA.problemSets = mergedData.problemSets;
      }

      const jsonString = JSON.stringify(finalPayload, null, 2);

      // 3. Commit and push merged payload to GitHub
      setPublishStatus('🚀 Pushing merged updates.json to GitHub...', 'info');
      const putBody = {
        message: commitMessage,
        content: utf8ToBase64(jsonString),
        branch: branch
      };
      if (existingSha) {
        putBody.sha = existingSha;
      }

      const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      });

      if (!putRes.ok) {
        if (putRes.status === 409 && retryCount < 2) {
          // Concurrency conflict: someone pushed right during our transaction, retry merge
          setPublishStatus('⚡ Concurrent push detected on remote. Auto-resolving and re-merging...', 'info');
          return await attemptPush(retryCount + 1);
        }
        const errData = await putRes.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${putRes.status}`);
      }

      const result = await putRes.json();
      return { result, finalPayload, mergeReport };
    }

    const { result, finalPayload, mergeReport } = await attemptPush();
    const commitUrl = result.commit ? result.commit.html_url : `https://github.com/${repo}/commits/${branch}`;

    // Update baseline to new published state
    setBaselineData(finalPayload);
    STUDIO_DATA.updatedAt = finalPayload.updatedAt;
    if (window.forceImmediateAutosave) {
      window.forceImmediateAutosave();
    }

    // Refresh all studio views so remote additions appear immediately
    renderJsonHub();
    if (window.refreshAllStudioViews) {
      window.refreshAllStudioViews();
    }

    // Build user-friendly feedback message
    let mergeNotice = '';
    if (mergeReport && mergeReport.hasRemoteChanges) {
      mergeNotice = `
        <div class="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] space-y-1">
          <div class="font-bold flex items-center gap-1">
            <span>🛡️ Multi-Editor Smart Merge:</span> Preserved ${mergeReport.totalRemoteAdded} remote items authored by teammates!
          </div>
          ${mergeReport.totalConflicts > 0 ? `<div class="text-amber-300">⚠️ ${mergeReport.totalConflicts} concurrent edit(s) detected — your active draft was safely prioritized.</div>` : ''}
          <div class="text-[10px] text-slate-300">
            Current total: ${finalPayload.stemReviewers.length} Reviewers, ${finalPayload.studyMaterials.length} Study Materials, ${finalPayload.quizSets.length} Quizzes, ${finalPayload.calendarEvents.length} Deadlines.
          </div>
        </div>
      `;
    }

    setPublishStatus(
      `🎉 <b>Successfully Published & Merged to GitHub!</b><br>
       <b>File:</b> <code>${path}</code> on <code>${branch}</code><br>
       <b>Commit:</b> <a href="${commitUrl}" target="_blank" class="underline text-tagsci-600 dark:text-tagsci-400 font-bold">${result.commit ? result.commit.sha.substring(0, 7) : 'View on GitHub'}</a><br>
       <span class="text-[10.5px] opacity-80 mt-1 block">OTA update has been published. Student Hub will automatically live sync it!</span>
       ${mergeNotice}`,
      'success'
    );

    if (window.showToast) {
      window.showToast(mergeReport && mergeReport.hasRemoteChanges 
        ? `Published! Auto-merged ${mergeReport.totalRemoteAdded} remote updates from team.` 
        : 'Published updates.json to GitHub!');
    }
  } catch (err) {
    setPublishStatus(`✕ Publish Failed: ${err.message}`, 'error');
  } finally {
    if (pushBtn) {
      pushBtn.disabled = false;
      pushBtn.innerHTML = `<i data-lucide="upload-cloud" class="w-4 h-4"></i> Publish & Smart Merge updates.json to GitHub`;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

