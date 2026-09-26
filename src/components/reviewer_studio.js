/* =========================================================
   TagSci Content Studio - Reviewer Visual Canvas & Editor
   ========================================================= */

import { STUDIO_DATA, currentRevIndex, setCurrentRevIndex, getSubjectClassification } from '../data/studio_data.js';
import { renderMathInHtml, parseMarkdownToHtml, renderBlocksToHtml, renderCartesianPlaneSvg, renderTableToHtml } from './math_engine.js';
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
    } else if (b.type === 'table') {
      if (b.title) md += `**${b.title}**\n\n`;
      const headers = b.headers && b.headers.length > 0 ? b.headers : ['Col 1', 'Col 2'];
      md += `| ${headers.join(' | ')} |\n`;
      md += `| ${headers.map(() => '---').join(' | ')} |\n`;
      (b.rows || []).forEach(row => {
        md += `| ${(row || []).join(' | ')} |\n`;
      });
      md += '\n';
    } else if (b.type === 'cartesian' || b.type === 'plot') {
      md += `\`\`\`plot\n${JSON.stringify(b, null, 2)}\n\`\`\`\n\n`;
    } else if (b.type === 'image') {
      const alt = b.alt || 'Figure diagram';
      md += `![${alt}](${b.url || ''})\n`;
      if (b.caption) md += `*${b.caption}*\n`;
      md += '\n';
    }
  });
  return md.trim();
}

export function parseMarkdownIntoBlocks(md) {
  if (!md) return [];
  const lines = md.split('\n');
  const blocks = [];
  let currentBulletBlock = null;
  let inPlotBlock = false;
  let plotJsonAccumulator = '';
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Plot codeblock detection
    if (line.startsWith('```plot')) {
      if (currentBulletBlock) { blocks.push(currentBulletBlock); currentBulletBlock = null; }
      inPlotBlock = true;
      plotJsonAccumulator = '';
      continue;
    }
    if (inPlotBlock) {
      if (line.startsWith('```')) {
        inPlotBlock = false;
        try {
          const plotObj = JSON.parse(plotJsonAccumulator);
          blocks.push(plotObj);
        } catch (e) {
          blocks.push({
            type: 'cartesian',
            title: 'Cartesian Plot',
            xMin: -10, xMax: 10, yMin: -10, yMax: 10, gridStep: 1,
            pieces: [{ expr: 'x', domainMin: -10, domainMax: 10, minInclusive: true, maxInclusive: true, color: '#10b981', style: 'solid' }]
          });
        }
      } else {
        plotJsonAccumulator += rawLine + '\n';
      }
      continue;
    }

    // Table detection: line with pipes |
    if (line.startsWith('|') && line.endsWith('|')) {
      if (currentBulletBlock) { blocks.push(currentBulletBlock); currentBulletBlock = null; }
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        // Divider row: skip
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
        tableRows = [];
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      blocks.push({
        type: 'table',
        title: '',
        headers: tableHeaders,
        rows: tableRows
      });
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }

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
      blocks.push({ type: 'formula', title: 'Formula Card', formula: line.replace(/\$\$/g, '').trim(), note: '' });
    } else if (/^!\[(.*?)\]\((.*?)\)$/.test(line)) {
      if (currentBulletBlock) { blocks.push(currentBulletBlock); currentBulletBlock = null; }
      const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      let caption = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const capMatch = nextLine.match(/^\*([^*]+)\*$|^_([^_]+)_$/);
        if (capMatch) {
          caption = capMatch[1] || capMatch[2] || '';
          i++;
        }
      }
      blocks.push({
        type: 'image',
        url: imgMatch[2] || '',
        alt: imgMatch[1] || 'Figure diagram',
        caption: caption,
        size: 'medium'
      });
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
  if (inTable && tableHeaders.length > 0) {
    blocks.push({ type: 'table', title: '', headers: tableHeaders, rows: tableRows });
  }

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
    card.className = `p-3 rounded-xl cursor-pointer border transition-all ${
      isActive 
        ? 'bg-tagsci-50 dark:bg-tagsci-950/80 border-tagsci-500 text-tagsci-950 dark:text-white shadow-sm' 
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    }`;
    card.onclick = () => {
      setCurrentRevIndex(idx);
      renderReviewersList();
      loadReviewerToEditor();
    };

    card.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-tagsci-100 dark:bg-tagsci-900 text-tagsci-800 dark:text-tagsci-300">${rev.subject}</span>
        <span class="text-[10px] text-slate-400">${rev.tag || 'Main'}</span>
      </div>
      <h4 class="font-bold text-xs truncate">${rev.title || 'Untitled Article'}</h4>
      <p class="text-[11px] text-slate-400 truncate mt-0.5">${rev.summary || 'No summary...'}</p>
    `;
    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

export function loadReviewerToEditor() {
  const revs = STUDIO_DATA.stemReviewers || [];
  const rev = revs[currentRevIndex];

  const emptyState = document.getElementById('reviewer-editor-empty-state');
  const mainWorkspace = document.getElementById('reviewer-editor-main-workspace');

  if (!rev) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (mainWorkspace) mainWorkspace.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (mainWorkspace) mainWorkspace.classList.remove('hidden');

  const titleInput = document.getElementById('rev-input-title');
  const subjectInput = document.getElementById('rev-input-subject');
  const tagInput = document.getElementById('rev-input-tag');
  const summaryInput = document.getElementById('rev-input-summary');
  const bodyInput = document.getElementById('rev-input-body');

  if (titleInput) titleInput.value = rev.title || '';
  if (subjectInput) subjectInput.value = rev.subject || 'General Math';
  if (tagInput) tagInput.value = rev.tag || 'Main';
  if (summaryInput) summaryInput.value = rev.summary || '';

  if (!rev.blocks || rev.blocks.length === 0) {
    if (rev.rawMarkdown) {
      rev.blocks = parseMarkdownIntoBlocks(rev.rawMarkdown);
    } else {
      rev.blocks = [
        { type: 'heading', level: 'h3', text: '1. Topic Introduction' },
        { type: 'paragraph', text: 'Enter core concepts, formulas, and examples.' }
      ];
    }
  }

  const compiled = compileBlocksToMarkdown(rev.blocks);
  rev.rawMarkdown = compiled;
  if (bodyInput) bodyInput.value = compiled;

  renderBlockCanvas();
  syncBlocksToPreview();
}

export function renderBlockCanvas() {
  const container = document.getElementById('blocks-container');
  if (!container) return;

  const revs = STUDIO_DATA.stemReviewers || [];
  const rev = revs[currentRevIndex];
  if (!rev || !rev.blocks) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '';

  rev.blocks.forEach((b, bIdx) => {
    const card = document.createElement('div');
    card.className = `p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 transition-all block-card cursor-default`;
    card.setAttribute('draggable', 'true');
    card.dataset.blockIndex = bIdx;

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
    } else if (b.type === 'table') {
      headerLeft = `
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center gap-1">
            <i data-lucide="table" class="w-3 h-3"></i> Structured Table
          </span>
          <button onclick="window.addTableCol(${bIdx})" class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10.5px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100">
            + Col
          </button>
          <button onclick="window.addTableRow(${bIdx})" class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10.5px] font-bold text-tagsci-700 dark:text-tagsci-400 bg-tagsci-50 dark:bg-tagsci-950/60 hover:bg-tagsci-100">
            + Row
          </button>
        </div>
      `;

      const headers = b.headers || ['Col 1', 'Col 2'];
      const rows = b.rows || [['', '']];

      bodyHtml = `
        <div class="space-y-2">
          <input type="text" value="${b.title || ''}" oninput="window.updateBlockField(${bIdx}, 'title', this.value)" placeholder="Table Title / Comparison (optional)..." class="w-full px-2.5 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          
          <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table class="w-full border-collapse text-xs">
              <thead>
                <tr class="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  ${headers.map((h, cIdx) => `
                    <th class="p-1.5 min-w-[120px]">
                      <div class="flex items-center gap-1">
                        <input type="text" value="${h}" oninput="window.updateTableHeader(${bIdx}, ${cIdx}, this.value)" placeholder="Header..." class="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                        ${headers.length > 1 ? `<button onclick="window.removeTableCol(${bIdx}, ${cIdx})" title="Delete Column" class="text-slate-400 hover:text-red-500 p-0.5"><i data-lucide="x" class="w-3 h-3"></i></button>` : ''}
                      </div>
                    </th>
                  `).join('')}
                  <th class="w-8 p-1"></th>
                </tr>
              </thead>
              <tbody>
                ${rows.map((row, rIdx) => `
                  <tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    ${headers.map((_, cIdx) => `
                      <td class="p-1.5 min-w-[120px]">
                        <input type="text" value="${row[cIdx] || ''}" oninput="window.updateTableCell(${bIdx}, ${rIdx}, ${cIdx}, this.value)" placeholder="Cell data..." class="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                      </td>
                    `).join('')}
                    <td class="p-1 text-center">
                      ${rows.length > 1 ? `<button onclick="window.removeTableRow(${bIdx}, ${rIdx})" title="Delete Row" class="text-slate-400 hover:text-red-500 p-1"><i data-lucide="x" class="w-3 h-3"></i></button>` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (b.type === 'cartesian' || b.type === 'plot') {
      headerLeft = `
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 flex items-center gap-1">
            <i data-lucide="line-chart" class="w-3 h-3"></i> Cartesian Plane & Piecewise Plot
          </span>
          <button onclick="window.addPiecewiseSegment(${bIdx})" class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10.5px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100">
            + Add Piecewise Branch
          </button>
        </div>
      `;

      const pieces = b.pieces || [];

      bodyHtml = `
        <div class="space-y-3">
          <!-- Meta titles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="text" value="${b.title || ''}" oninput="window.updateBlockField(${bIdx}, 'title', this.value)" placeholder="Plot Title (e.g. Piecewise Function f(x))" class="w-full px-2.5 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <input type="text" value="${b.caption || ''}" oninput="window.updateBlockField(${bIdx}, 'caption', this.value)" placeholder="Caption / Description..." class="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          </div>

          <!-- Coordinate Bounds -->
          <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <span class="text-[10px] font-black uppercase text-slate-400 block mb-1">Axis Window & Grid Bounds:</span>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <label class="text-[9.5px] text-slate-400 font-bold block">X Min</label>
                <input type="number" value="${b.xMin ?? -10}" onchange="window.updateBlockField(${bIdx}, 'xMin', parseFloat(this.value))" class="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold">
              </div>
              <div>
                <label class="text-[9.5px] text-slate-400 font-bold block">X Max</label>
                <input type="number" value="${b.xMax ?? 10}" onchange="window.updateBlockField(${bIdx}, 'xMax', parseFloat(this.value))" class="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold">
              </div>
              <div>
                <label class="text-[9.5px] text-slate-400 font-bold block">Y Min</label>
                <input type="number" value="${b.yMin ?? -10}" onchange="window.updateBlockField(${bIdx}, 'yMin', parseFloat(this.value))" class="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold">
              </div>
              <div>
                <label class="text-[9.5px] text-slate-400 font-bold block">Y Max</label>
                <input type="number" value="${b.yMax ?? 10}" onchange="window.updateBlockField(${bIdx}, 'yMax', parseFloat(this.value))" class="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold">
              </div>
              <div>
                <label class="text-[9.5px] text-slate-400 font-bold block">Grid Step</label>
                <input type="number" value="${b.gridStep ?? 1}" min="0.1" step="0.5" onchange="window.updateBlockField(${bIdx}, 'gridStep', parseFloat(this.value))" class="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold">
              </div>
            </div>
          </div>

          <!-- Piecewise Function Segments -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase text-slate-500 tracking-wider">Piecewise Function Branches (${pieces.length}):</span>
              <div class="flex items-center gap-1 text-[10px]">
                <button onclick="window.loadPlotPreset(${bIdx}, 'piecewise_standard')" class="text-tagsci-700 dark:text-tagsci-400 hover:underline font-bold">Preset: Split Line & Parabola</button>
                <span class="text-slate-300">&bull;</span>
                <button onclick="window.loadPlotPreset(${bIdx}, 'step_function')" class="text-tagsci-700 dark:text-tagsci-400 hover:underline font-bold">Preset: Step Function</button>
              </div>
            </div>

            ${pieces.map((piece, pIdx) => `
              <div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 text-xs">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 flex-1">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${piece.color || '#10b981'}"></span>
                    <span class="font-black text-[11px] text-slate-700 dark:text-slate-300">Branch ${pIdx + 1}: f(x) =</span>
                    <input type="text" value="${piece.expr || ''}" oninput="window.updatePiecewiseSegment(${bIdx}, ${pIdx}, 'expr', this.value)" placeholder="e.g. 2*x + 1, x^2 - 4, 3" class="flex-1 px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                  </div>
                  <button onclick="window.removePiecewiseSegment(${bIdx}, ${pIdx})" class="text-slate-400 hover:text-red-500 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                  <div>
                    <label class="block text-[9px] font-bold text-slate-400 uppercase">Domain Start (x ≥ / >)</label>
                    <div class="flex items-center gap-1">
                      <input type="number" value="${piece.domainMin !== undefined && piece.domainMin !== null ? piece.domainMin : (b.xMin ?? -10)}" onchange="window.updatePiecewiseSegment(${bIdx}, ${pIdx}, 'domainMin', parseFloat(this.value))" class="w-full px-2 py-0.5 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                      <button onclick="window.togglePiecewiseEndpoint(${bIdx}, ${pIdx}, 'minInclusive')" title="Toggle Open/Closed Endpoint" class="px-1.5 py-0.5 rounded text-[10px] font-bold ${piece.minInclusive !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}">
                        ${piece.minInclusive !== false ? '● [Closed]' : '○ (Open)'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[9px] font-bold text-slate-400 uppercase">Domain End (x ≤ / <)</label>
                    <div class="flex items-center gap-1">
                      <input type="number" value="${piece.domainMax !== undefined && piece.domainMax !== null ? piece.domainMax : (b.xMax ?? 10)}" onchange="window.updatePiecewiseSegment(${bIdx}, ${pIdx}, 'domainMax', parseFloat(this.value))" class="w-full px-2 py-0.5 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                      <button onclick="window.togglePiecewiseEndpoint(${bIdx}, ${pIdx}, 'maxInclusive')" title="Toggle Open/Closed Endpoint" class="px-1.5 py-0.5 rounded text-[10px] font-bold ${piece.maxInclusive !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}">
                        ${piece.maxInclusive !== false ? '● [Closed]' : '○ (Open)'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[9px] font-bold text-slate-400 uppercase">Stroke Color</label>
                    <select onchange="window.updatePiecewiseSegment(${bIdx}, ${pIdx}, 'color', this.value)" class="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-semibold">
                      <option value="#10b981" ${piece.color === '#10b981' ? 'selected' : ''}>Emerald (#10b981)</option>
                      <option value="#3b82f6" ${piece.color === '#3b82f6' ? 'selected' : ''}>Blue (#3b82f6)</option>
                      <option value="#ec4899" ${piece.color === '#ec4899' ? 'selected' : ''}>Pink (#ec4899)</option>
                      <option value="#8b5cf6" ${piece.color === '#8b5cf6' ? 'selected' : ''}>Purple (#8b5cf6)</option>
                      <option value="#f59e0b" ${piece.color === '#f59e0b' ? 'selected' : ''}>Amber (#f59e0b)</option>
                      <option value="#06b6d4" ${piece.color === '#06b6d4' ? 'selected' : ''}>Cyan (#06b6d4)</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-[9px] font-bold text-slate-400 uppercase">Line Style</label>
                    <select onchange="window.updatePiecewiseSegment(${bIdx}, ${pIdx}, 'style', this.value)" class="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-semibold">
                      <option value="solid" ${piece.style === 'solid' ? 'selected' : ''}>Solid</option>
                      <option value="dashed" ${piece.style === 'dashed' ? 'selected' : ''}>Dashed</option>
                      <option value="dotted" ${piece.style === 'dotted' ? 'selected' : ''}>Dotted</option>
                    </select>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (b.type === 'image') {
      headerLeft = `
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
            <i data-lucide="image" class="w-3 h-3"></i> Image & Diagram
          </span>
          <select onchange="window.updateBlockField(${bIdx}, 'size', this.value)" class="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 rounded-md px-2 py-0.5 border border-slate-200 dark:border-slate-700">
            <option value="medium" ${b.size === 'medium' || !b.size ? 'selected' : ''}>Medium (500px)</option>
            <option value="full" ${b.size === 'full' ? 'selected' : ''}>Full Width (100%)</option>
            <option value="small" ${b.size === 'small' ? 'selected' : ''}>Compact (300px)</option>
          </select>
        </div>
      `;

      const hasImage = !!b.url;

      bodyHtml = `
        <div class="space-y-3">
          ${!hasImage ? `
            <div class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-tagsci-500 dark:hover:border-tagsci-500 rounded-2xl p-5 text-center bg-slate-50/50 dark:bg-slate-800/30 transition-all cursor-pointer group" onclick="document.getElementById('rev-file-input-${bIdx}').click()">
              <input type="file" id="rev-file-input-${bIdx}" accept="image/*" class="hidden" onchange="if(this.files && this.files[0]) window.uploadBlockImage(${bIdx}, this.files[0])">
              <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-tagsci-50 dark:bg-tagsci-950/80 text-tagsci-600 dark:text-tagsci-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i data-lucide="upload-cloud" class="w-5 h-5"></i>
              </div>
              <p class="text-xs font-bold text-slate-700 dark:text-slate-200">Click to upload or drag & drop image file</p>
              <p class="text-[10.5px] text-slate-400 mt-0.5">PNG, JPG, SVG, WebP, GIF (Max 5MB)</p>
              
              <div class="my-2.5 flex items-center justify-center gap-2">
                <div class="h-px bg-slate-200 dark:bg-slate-700 w-16"></div>
                <span class="text-[10px] uppercase font-bold text-slate-400">or paste URL</span>
                <div class="h-px bg-slate-200 dark:bg-slate-700 w-16"></div>
              </div>
              
              <div class="max-w-sm mx-auto flex items-center gap-1.5" onclick="event.stopPropagation()">
                <input type="text" placeholder="https://example.com/diagram.png" onchange="window.updateBlockField(${bIdx}, 'url', this.value)" class="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                <button onclick="const inp = this.previousElementSibling; if(inp.value) window.updateBlockField(${bIdx}, 'url', inp.value);" class="px-2.5 py-1 text-xs font-bold bg-tagsci-700 text-white rounded-lg hover:bg-tagsci-800">Set</button>
              </div>
            </div>
          ` : `
            <div class="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-2 text-center group">
              <img src="${b.url}" alt="${b.alt || 'Block preview'}" class="max-h-56 mx-auto rounded-lg object-contain shadow-sm" onerror="this.src=''; this.alt='Failed to load image';" />
              <div class="mt-2 flex items-center justify-center gap-2">
                <button onclick="document.getElementById('rev-file-input-${bIdx}').click()" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm">
                  <i data-lucide="refresh-cw" class="w-3 h-3"></i> Replace Image
                </button>
                <button onclick="window.updateBlockField(${bIdx}, 'url', '')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 shadow-sm">
                  <i data-lucide="trash" class="w-3 h-3"></i> Remove
                </button>
              </div>
              <input type="file" id="rev-file-input-${bIdx}" accept="image/*" class="hidden" onchange="if(this.files && this.files[0]) window.uploadBlockImage(${bIdx}, this.files[0])">
            </div>
          `}

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[9.5px] font-bold text-slate-400 uppercase mb-0.5">Caption (Supports $LaTeX$ & Markdown)</label>
              <input type="text" value="${b.caption || ''}" oninput="window.updateBlockField(${bIdx}, 'caption', this.value)" placeholder="e.g. Figure 1: Wave Propagation Diagram" class="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            </div>
            <div>
              <label class="block text-[9.5px] font-bold text-slate-400 uppercase mb-0.5">Alt Text / Description</label>
              <input type="text" value="${b.alt || ''}" oninput="window.updateBlockField(${bIdx}, 'alt', this.value)" placeholder="e.g. Free body diagram showing forces" class="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            </div>
          </div>
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
        <div class="flex items-center gap-1.5 min-w-0">
          <div class="drag-handle cursor-grab active:cursor-grabbing p-1.5 -ml-1 text-slate-400 hover:text-tagsci-600 dark:hover:text-tagsci-400 select-none transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Click and drag to reorder block placement">
            <i data-lucide="grip-vertical" class="w-4 h-4"></i>
          </div>
          <div class="min-w-0">${headerLeft}</div>
        </div>
        ${headerActions}
      </div>
      ${bodyHtml}
    `;

    // Only allow dragging via the drag-handle
    const handle = card.querySelector('.drag-handle');
    if (handle) {
      handle.addEventListener('mousedown', () => {
        card.setAttribute('draggable', 'true');
      });
      handle.addEventListener('mouseup', () => {
        card.setAttribute('draggable', 'false');
      });
      handle.addEventListener('touchstart', () => {
        card.setAttribute('draggable', 'true');
      }, { passive: true });
    }

    card.addEventListener('dragstart', (e) => {
      if (card.getAttribute('draggable') !== 'true') {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(bIdx));
      card.classList.add('opacity-40', 'scale-[0.99]', 'border-tagsci-500', 'ring-2', 'ring-tagsci-500/30');
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        card.classList.add('border-t-4', 'border-t-tagsci-500');
        card.classList.remove('border-b-4', 'border-b-tagsci-500');
      } else {
        card.classList.add('border-b-4', 'border-b-tagsci-500');
        card.classList.remove('border-t-4', 'border-t-tagsci-500');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('border-t-4', 'border-b-4', 'border-t-tagsci-500', 'border-b-tagsci-500');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('border-t-4', 'border-b-4', 'border-t-tagsci-500', 'border-b-tagsci-500');
      const fromIdxStr = e.dataTransfer.getData('text/plain');
      const fromIdx = parseInt(fromIdxStr, 10);
      if (isNaN(fromIdx) || fromIdx === bIdx) return;

      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const insertBefore = e.clientY < midY;

      const [moved] = rev.blocks.splice(fromIdx, 1);
      let targetIdx = bIdx;
      if (fromIdx < bIdx) {
        targetIdx = insertBefore ? bIdx - 1 : bIdx;
      } else {
        targetIdx = insertBefore ? bIdx : bIdx + 1;
      }
      rev.blocks.splice(targetIdx, 0, moved);

      renderBlockCanvas();
      syncBlocksToPreview();
      if (window.showToast) window.showToast('Block placement reordered!');
    });

    card.addEventListener('dragend', () => {
      card.setAttribute('draggable', 'false');
      card.classList.remove('opacity-40', 'scale-[0.99]', 'border-tagsci-500', 'ring-2', 'ring-tagsci-500/30', 'border-t-4', 'border-b-4', 'border-t-tagsci-500', 'border-b-tagsci-500');
    });

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

  const subjEl = document.getElementById('rev-input-subject');
  const tagEl = document.getElementById('rev-input-tag');
  const titleEl = document.getElementById('rev-input-title');
  const sumEl = document.getElementById('rev-input-summary');
  const bodyInput = document.getElementById('rev-input-body');
  const charCount = document.getElementById('editor-char-count');

  if (subjEl) rev.subject = subjEl.value;
  if (tagEl) rev.tag = tagEl.value;
  if (titleEl) rev.title = titleEl.value;
  if (sumEl) rev.summary = sumEl.value;

  const isSourceMode = currentEditorMode === 'source';

  if (isSourceMode) {
    // When editing source directly, rawMarkdown is the source of truth
    const rawMd = bodyInput ? bodyInput.value : (rev.rawMarkdown || '');
    rev.rawMarkdown = rawMd;
    rev.blocks = parseMarkdownIntoBlocks(rawMd);
    if (charCount) charCount.innerText = `${rawMd.length} chars`;
  } else {
    // When editing visual blocks, blocks array is the source of truth
    const compiledMd = compileBlocksToMarkdown(rev.blocks);
    rev.rawMarkdown = compiledMd;
    if (bodyInput) bodyInput.value = compiledMd;
    if (charCount) charCount.innerText = `${compiledMd.length} chars`;
  }

  rev.content = renderBlocksToHtml(rev.blocks);

  if (previewPane) {
    previewPane.innerHTML = `
      <div class="border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-tagsci-100 dark:bg-tagsci-950 text-tagsci-800 dark:text-tagsci-300">${rev.subject}</span>
          <span class="text-[10px] font-bold text-slate-400">&bull; ${rev.tag}</span>
        </div>
        <h1 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">${renderMathInHtml(rev.title || 'Untitled Article')}</h1>
        <p class="text-xs text-slate-500 italic mt-1">${renderMathInHtml(rev.summary || '')}</p>
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
  if (!rev || !rev.blocks || !rev.blocks[bIdx]) return;
  if (!rev.blocks[bIdx].items) rev.blocks[bIdx].items = [];
  rev.blocks[bIdx].items.push('New key takeaway point');
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

/* =========================================================
   Table Block Manipulation Functions
   ========================================================= */
export function updateTableHeader(bIdx, cIdx, val) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (rev && rev.blocks && rev.blocks[bIdx]) {
    if (!rev.blocks[bIdx].headers) rev.blocks[bIdx].headers = [];
    rev.blocks[bIdx].headers[cIdx] = val;
    syncBlocksToPreview();
  }
}

export function updateTableCell(bIdx, rIdx, cIdx, val) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (rev && rev.blocks && rev.blocks[bIdx]) {
    if (!rev.blocks[bIdx].rows) rev.blocks[bIdx].rows = [];
    if (!rev.blocks[bIdx].rows[rIdx]) rev.blocks[bIdx].rows[rIdx] = [];
    rev.blocks[bIdx].rows[rIdx][cIdx] = val;
    syncBlocksToPreview();
  }
}

export function addTableCol(bIdx) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks || !rev.blocks[bIdx]) return;
  const block = rev.blocks[bIdx];
  if (!block.headers) block.headers = ['Col 1'];
  block.headers.push(`Col ${block.headers.length + 1}`);
  if (block.rows) {
    block.rows.forEach(r => r.push(''));
  }
  renderBlockCanvas();
  syncBlocksToPreview();
}

export function removeTableCol(bIdx, cIdx) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks || !rev.blocks[bIdx]) return;
  const block = rev.blocks[bIdx];
  if (block.headers && block.headers.length > 1) {
    block.headers.splice(cIdx, 1);
    if (block.rows) {
      block.rows.forEach(r => r.splice(cIdx, 1));
    }
    renderBlockCanvas();
    syncBlocksToPreview();
  }
}

export function addTableRow(bIdx) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks || !rev.blocks[bIdx]) return;
  const block = rev.blocks[bIdx];
  if (!block.rows) block.rows = [];
  const colCount = block.headers ? block.headers.length : 2;
  const newRow = new Array(colCount).fill('');
  block.rows.push(newRow);
  renderBlockCanvas();
  syncBlocksToPreview();
}

export function removeTableRow(bIdx, rIdx) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks || !rev.blocks[bIdx]) return;
  const block = rev.blocks[bIdx];
  if (block.rows && block.rows.length > 1) {
    block.rows.splice(rIdx, 1);
    renderBlockCanvas();
    syncBlocksToPreview();
  }
}

/* =========================================================
   Cartesian Plot Manipulation Functions
   ========================================================= */
export function addPiecewiseSegment(bIdx) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks || !rev.blocks[bIdx]) return;
  const block = rev.blocks[bIdx];
  if (!block.pieces) block.pieces = [];
  const colors = ['#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#06b6d4'];
  const nextColor = colors[block.pieces.length % colors.length];

  block.pieces.push({
    expr: '2*x',
    domainMin: 0,
    domainMax: 5,
    minInclusive: true,
    maxInclusive: true,
    color: nextColor,
    style: 'solid'
  });
  renderBlockCanvas();
  syncBlocksToPreview();
}

export function removePiecewiseSegment(bIdx, pIdx) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks || !rev.blocks[bIdx]) return;
  const block = rev.blocks[bIdx];
  if (block.pieces && block.pieces.length > 1) {
    block.pieces.splice(pIdx, 1);
    renderBlockCanvas();
    syncBlocksToPreview();
  }
}

export function updatePiecewiseSegment(bIdx, pIdx, field, val) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks || !rev.blocks[bIdx]) return;
  const block = rev.blocks[bIdx];
  if (block.pieces && block.pieces[pIdx]) {
    block.pieces[pIdx][field] = val;
    syncBlocksToPreview();
  }
}

export function togglePiecewiseEndpoint(bIdx, pIdx, field) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks || !rev.blocks[bIdx]) return;
  const block = rev.blocks[bIdx];
  if (block.pieces && block.pieces[pIdx]) {
    block.pieces[pIdx][field] = !(block.pieces[pIdx][field] !== false);
    renderBlockCanvas();
    syncBlocksToPreview();
  }
}

export function loadPlotPreset(bIdx, presetType) {
  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !rev.blocks || !rev.blocks[bIdx]) return;
  const block = rev.blocks[bIdx];

  if (presetType === 'piecewise_standard') {
    block.title = 'Piecewise Function: Linear & Parabolic Branch';
    block.caption = 'f(x) with open circle at x = 0 on the linear branch and closed circle on the quadratic branch.';
    block.xMin = -6;
    block.xMax = 6;
    block.yMin = -6;
    block.yMax = 8;
    block.gridStep = 1;
    block.pieces = [
      { expr: '-x - 2', domainMin: -6, domainMax: 0, minInclusive: false, maxInclusive: false, color: '#3b82f6', style: 'solid' },
      { expr: 'x^2 - 1', domainMin: 0, domainMax: 3, minInclusive: true, maxInclusive: true, color: '#10b981', style: 'solid' },
      { expr: '4', domainMin: 3, domainMax: 6, minInclusive: false, maxInclusive: false, color: '#ec4899', style: 'solid' }
    ];
  } else if (presetType === 'step_function') {
    block.title = 'Greatest Integer Step Function';
    block.caption = 'Unit steps with closed left endpoints and open right endpoints.';
    block.xMin = -4;
    block.xMax = 5;
    block.yMin = -4;
    block.yMax = 5;
    block.gridStep = 1;
    block.pieces = [
      { expr: '-2', domainMin: -2, domainMax: -1, minInclusive: true, maxInclusive: false, color: '#8b5cf6', style: 'solid' },
      { expr: '-1', domainMin: -1, domainMax: 0, minInclusive: true, maxInclusive: false, color: '#8b5cf6', style: 'solid' },
      { expr: '0', domainMin: 0, domainMax: 1, minInclusive: true, maxInclusive: false, color: '#8b5cf6', style: 'solid' },
      { expr: '1', domainMin: 1, domainMax: 2, minInclusive: true, maxInclusive: false, color: '#8b5cf6', style: 'solid' },
      { expr: '2', domainMin: 2, domainMax: 3, minInclusive: true, maxInclusive: false, color: '#8b5cf6', style: 'solid' },
      { expr: '3', domainMin: 3, domainMax: 4, minInclusive: true, maxInclusive: false, color: '#8b5cf6', style: 'solid' }
    ];
  }

  renderBlockCanvas();
  syncBlocksToPreview();
  if (window.showToast) window.showToast('Applied piecewise plot preset!');
}

/* =========================================================
   Add Content Block Controller (Zero-state Resilient)
   ========================================================= */
export function addContentBlock(type) {
  // Ensure a reviewer draft exists if zero state
  if (!STUDIO_DATA.stemReviewers || STUDIO_DATA.stemReviewers.length === 0) {
    const newRev = {
      id: `reviewer_${Date.now()}`,
      subject: "General Math",
      tag: "Main",
      color: "border-l-4 border-tagsci-600",
      title: "New Reviewer Draft",
      summary: "Curated learning notes and formulas",
      blocks: [],
      rawMarkdown: "",
      content: ""
    };
    STUDIO_DATA.stemReviewers = [newRev];
    setCurrentRevIndex(0);
    renderReviewersList();
    loadReviewerToEditor();
  }

  if (currentRevIndex < 0 || currentRevIndex >= STUDIO_DATA.stemReviewers.length) {
    setCurrentRevIndex(0);
  }

  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev) return;
  if (!rev.blocks) rev.blocks = [];

  // Reveal workspace if it was hidden in empty state
  const emptyState = document.getElementById('reviewer-editor-empty-state');
  const mainWorkspace = document.getElementById('reviewer-editor-main-workspace');
  if (emptyState) emptyState.classList.add('hidden');
  if (mainWorkspace) mainWorkspace.classList.remove('hidden');

  if (type === 'heading') {
    rev.blocks.push({ type: 'heading', level: 'h3', text: 'New Topic Title' });
  } else if (type === 'paragraph') {
    rev.blocks.push({ type: 'paragraph', text: 'Explain concepts, definitions, and key takeaways here.' });
  } else if (type === 'formula') {
    rev.blocks.push({ type: 'formula', title: 'Formula Card', formula: 'v = \\frac{d}{t}', note: 'Standard constant velocity equation.' });
  } else if (type === 'bullets') {
    rev.blocks.push({ type: 'bullets', items: ['First key point', 'Second key point'] });
  } else if (type === 'table') {
    rev.blocks.push({
      type: 'table',
      title: 'Kinematics Formulas Comparison',
      headers: ['Equation Name', 'Formula', 'Unknown / Missing'],
      rows: [
        ['Velocity Relation', '$v_f = v_0 + at$', 'Displacement ($\\Delta x$)'],
        ['Position Relation', '$\\Delta x = v_0 t + \\frac{1}{2}at^2$', 'Final Velocity ($v_f$)'],
        ['Torricelli Theorem', '$v_f^2 = v_0^2 + 2a\\Delta x$', 'Time ($t$)']
      ]
    });
  } else if (type === 'cartesian' || type === 'plot') {
    rev.blocks.push({
      type: 'cartesian',
      title: 'Piecewise Function Graph',
      caption: 'Visual Cartesian coordinate plane with piecewise branches and open/closed boundary circles.',
      xMin: -6,
      xMax: 6,
      yMin: -6,
      yMax: 8,
      gridStep: 1,
      pieces: [
        {
          expr: '-2*x - 1',
          domainMin: -6,
          domainMax: -1,
          minInclusive: false,
          maxInclusive: true,
          color: '#3b82f6',
          style: 'solid'
        },
        {
          expr: 'x^2 - 2',
          domainMin: -1,
          domainMax: 2.5,
          minInclusive: false,
          maxInclusive: false,
          color: '#10b981',
          style: 'solid'
        },
        {
          expr: '4',
          domainMin: 2.5,
          domainMax: 6,
          minInclusive: true,
          maxInclusive: false,
          color: '#ec4899',
          style: 'solid'
        }
      ]
    });
  } else if (type === 'image') {
    rev.blocks.push({
      type: 'image',
      url: '',
      caption: '',
      alt: 'Illustration diagram',
      size: 'medium'
    });
  }

  renderBlockCanvas();
  syncBlocksToPreview();
  if (window.renderHubDashboard) window.renderHubDashboard();
  if (window.showToast) window.showToast('Block added to canvas!');
}

export function uploadBlockImage(bIdx, file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    if (window.showToast) window.showToast('Please select a valid image file (PNG, JPG, SVG, WebP, GIF)');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const rev = (STUDIO_DATA.stemReviewers || [])[currentRevIndex];
    if (rev && rev.blocks && rev.blocks[bIdx]) {
      rev.blocks[bIdx].url = e.target.result;
      if (!rev.blocks[bIdx].alt) {
        rev.blocks[bIdx].alt = file.name.replace(/\.[^/.]+$/, "");
      }
      renderBlockCanvas();
      syncBlocksToPreview();
      if (window.showToast) window.showToast('Image uploaded successfully!');
    }
  };
  reader.readAsDataURL(file);
}

export function loadLessonTemplate(templateType) {
  if (!STUDIO_DATA.stemReviewers || STUDIO_DATA.stemReviewers.length === 0) {
    const newRev = {
      id: `reviewer_${Date.now()}`,
      subject: "General Math",
      tag: "Main",
      color: "border-l-4 border-tagsci-600",
      title: "New Reviewer Draft",
      summary: "Curated learning notes and formulas",
      blocks: [],
      rawMarkdown: "",
      content: ""
    };
    STUDIO_DATA.stemReviewers = [newRev];
    setCurrentRevIndex(0);
    renderReviewersList();
    loadReviewerToEditor();
  }

  const rev = STUDIO_DATA.stemReviewers[currentRevIndex];
  if (!rev || !templateType) return;

  const emptyState = document.getElementById('reviewer-editor-empty-state');
  const mainWorkspace = document.getElementById('reviewer-editor-main-workspace');
  if (emptyState) emptyState.classList.add('hidden');
  if (mainWorkspace) mainWorkspace.classList.remove('hidden');

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
  if (window.renderHubDashboard) window.renderHubDashboard();
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
