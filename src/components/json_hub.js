/* =========================================================
   TagSci Content Studio - JSON Hub & Export Pipeline
   ========================================================= */

import { STUDIO_DATA, currentRevIndex, currentQuizSetIndex } from '../data/studio_data.js';
import { compileBlocksToMarkdown } from './reviewer_studio.js';

export function generateProductionJson() {
  return {
    version: STUDIO_DATA.version || "1.4.0",
    updatedAt: new Date().toISOString(),
    announcement: `Refreshed ${STUDIO_DATA.stemReviewers.length} Reviewers, ${STUDIO_DATA.calendarEvents.length} Deadlines, and ${STUDIO_DATA.quizSets.length} Quiz Banks.`,
    calendarEvents: STUDIO_DATA.calendarEvents,
    stemReviewers: STUDIO_DATA.stemReviewers.map(r => ({
      id: r.id,
      subject: r.subject,
      tag: r.tag,
      color: r.color,
      title: r.title,
      summary: r.summary,
      content: r.content
    })),
    studyMaterials: STUDIO_DATA.studyMaterials || [],
    problemSets: STUDIO_DATA.problemSets || [],
    quizSets: STUDIO_DATA.quizSets
  };
}

export function renderJsonHub() {
  const codeEl = document.getElementById('raw-json-output');
  if (codeEl) {
    codeEl.innerText = JSON.stringify(generateProductionJson(), null, 2);
  }
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
  set.questions.forEach((q, i) => {
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
    status.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-bold">✓ Connected! Version: ${data.version || 'OK'}, Announcements: "${data.announcement || 'None'}"</span>`;
  } catch (err) {
    status.innerHTML = `<span class="text-red-500 font-bold">✕ Error: ${err.message}</span>`;
  }
}
