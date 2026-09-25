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
      
      if (typeof onComplete === 'function') onComplete();
      if (window.showToast) window.showToast('Successfully imported updates.json!');
    } catch (err) {
      alert('Invalid JSON file format.');
    }
  };
  reader.readAsText(file);
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

  return {
    token: (tokenEl ? tokenEl.value : '') || localStorage.getItem(STORAGE_KEYS.TOKEN) || '',
    repo: (repoEl ? repoEl.value : '') || localStorage.getItem(STORAGE_KEYS.REPO) || 'OmniScripterStorm/Student-Hub',
    branch: (branchEl ? branchEl.value : '') || localStorage.getItem(STORAGE_KEYS.BRANCH) || 'main',
    path: (pathEl ? pathEl.value : '') || localStorage.getItem(STORAGE_KEYS.PATH) || 'updates.json'
  };
}

export function saveGitHubConfig() {
  const config = getGitHubConfig();
  if (config.token) localStorage.setItem(STORAGE_KEYS.TOKEN, config.token.trim());
  if (config.repo) localStorage.setItem(STORAGE_KEYS.REPO, config.repo.trim());
  if (config.branch) localStorage.setItem(STORAGE_KEYS.BRANCH, config.branch.trim());
  if (config.path) localStorage.setItem(STORAGE_KEYS.PATH, config.path.trim());

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

// Direct Overwrite / Upload of updates.json
export async function pushDirectUpdatesJsonToGitHub() {
  saveGitHubConfig();
  const { token, repo, branch, path } = getGitHubConfig();

  if (!token) {
    setPublishStatus('⚠️ Please input your GitHub Personal Access Token first.', 'error');
    return;
  }

  const payload = generateProductionJson();
  const jsonString = JSON.stringify(payload, null, 2);
  const commitMsgInput = document.getElementById('gh-commit-msg');
  const commitMessage = (commitMsgInput && commitMsgInput.value.trim()) || `OTA Curriculum Sync (${new Date().toLocaleString()}) via TagSci Content Studio`;

  setPublishStatus('🔄 Fetching current file SHA from GitHub...', 'info');

  try {
    // 1. Get current file SHA if exists
    let existingSha = null;
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (getRes.ok) {
      const getData = await getRes.json();
      existingSha = getData.sha;
    }

    // 2. Commit and upload to GitHub
    setPublishStatus('🚀 Uploading and committing to GitHub...', 'info');
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
      const errData = await putRes.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP ${putRes.status}`);
    }

    const result = await putRes.json();
    const commitUrl = result.commit ? result.commit.html_url : `https://github.com/${repo}/commits/${branch}`;

    setPublishStatus(
      `🎉 <b>Successfully published updates.json directly to GitHub!</b><br>
       <b>File:</b> <code>${path}</code> on <code>${branch}</code><br>
       <b>Commit:</b> <a href="${commitUrl}" target="_blank" class="underline text-tagsci-600 dark:text-tagsci-400 font-bold">${result.commit ? result.commit.sha.substring(0, 7) : 'View on GitHub'}</a><br>
       <span class="text-[10.5px] opacity-80 mt-1 block">GitHub Pages is building the OTA update. Students will receive it on their next sync!</span>`,
      'success'
    );

    if (window.showToast) window.showToast('Published updates.json to GitHub!');
  } catch (err) {
    setPublishStatus(`✕ Direct Push Failed: ${err.message}`, 'error');
  }
}

// Smart Append: Reads remote updates.json from GitHub, merges studio data, and commits back
export async function appendAndPushToGitHub() {
  saveGitHubConfig();
  const { token, repo, branch, path } = getGitHubConfig();

  if (!token) {
    setPublishStatus('⚠️ Please input your GitHub Personal Access Token first.', 'error');
    return;
  }

  setPublishStatus('🔄 Fetching remote updates.json from GitHub...', 'info');

  try {
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`
      }
    });

    let remoteJson = {
      version: "1.4.0",
      calendarEvents: [],
      stemReviewers: [],
      studyMaterials: [],
      problemSets: [],
      quizSets: []
    };
    let fileSha = null;

    if (getRes.ok) {
      const getData = await getRes.json();
      fileSha = getData.sha;
      const decodedContent = base64ToUtf8(getData.content.replace(/\s/g, ''));
      remoteJson = JSON.parse(decodedContent);
    }

    // Merge stemReviewers (match by id)
    STUDIO_DATA.stemReviewers.forEach(localRev => {
      const existingIdx = (remoteJson.stemReviewers || []).findIndex(r => r.id === localRev.id);
      if (existingIdx >= 0) {
        remoteJson.stemReviewers[existingIdx] = localRev;
      } else {
        if (!remoteJson.stemReviewers) remoteJson.stemReviewers = [];
        remoteJson.stemReviewers.push(localRev);
      }
    });

    // Merge quizSets (match by id)
    STUDIO_DATA.quizSets.forEach(localQuiz => {
      const existingIdx = (remoteJson.quizSets || []).findIndex(q => q.id === localQuiz.id);
      if (existingIdx >= 0) {
        remoteJson.quizSets[existingIdx] = localQuiz;
      } else {
        if (!remoteJson.quizSets) remoteJson.quizSets = [];
        remoteJson.quizSets.push(localQuiz);
      }
    });

    // Merge calendarEvents (match by id)
    STUDIO_DATA.calendarEvents.forEach(localEvent => {
      const existingIdx = (remoteJson.calendarEvents || []).findIndex(e => e.id === localEvent.id);
      if (existingIdx >= 0) {
        remoteJson.calendarEvents[existingIdx] = localEvent;
      } else {
        if (!remoteJson.calendarEvents) remoteJson.calendarEvents = [];
        remoteJson.calendarEvents.push(localEvent);
      }
    });

    // Update metadata
    remoteJson.updatedAt = new Date().toISOString();
    remoteJson.announcement = `Merged updates: ${remoteJson.stemReviewers.length} Reviewers, ${remoteJson.calendarEvents.length} Deadlines, ${remoteJson.quizSets.length} Quizzes.`;

    // Commit back
    const jsonString = JSON.stringify(remoteJson, null, 2);
    const commitMessage = `OTA Append: Merged materials into ${path} via TagSci Content Studio`;

    setPublishStatus('🚀 Merging and committing to GitHub...', 'info');

    const putBody = {
      message: commitMessage,
      content: utf8ToBase64(jsonString),
      branch: branch
    };
    if (fileSha) putBody.sha = fileSha;

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
      const errData = await putRes.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP ${putRes.status}`);
    }

    const result = await putRes.json();
    const commitUrl = result.commit ? result.commit.html_url : `https://github.com/${repo}/commits/${branch}`;

    setPublishStatus(
      `🎉 <b>Appended and merged successfully!</b><br>
       Total Reviewers: ${remoteJson.stemReviewers.length} | Quiz Banks: ${remoteJson.quizSets.length}<br>
       <b>Commit:</b> <a href="${commitUrl}" target="_blank" class="underline text-tagsci-600 dark:text-tagsci-400 font-bold">${result.commit ? result.commit.sha.substring(0, 7) : 'View on GitHub'}</a>`,
      'success'
    );

    if (window.showToast) window.showToast('Appended and synced to GitHub!');
  } catch (err) {
    setPublishStatus(`✕ Append Failed: ${err.message}`, 'error');
  }
}
