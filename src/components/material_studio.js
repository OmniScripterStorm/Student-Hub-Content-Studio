/* =========================================================
   TagSci Content Studio - Study Materials Studio & Editor
   ========================================================= */

import { STUDIO_DATA, currentMatIndex, setCurrentMatIndex, getSubjectClassification } from '../data/studio_data.js';
import { renderMathInHtml, parseMarkdownToHtml, renderBlocksToHtml } from './math_engine.js';
import { compileBlocksToMarkdown, parseMarkdownIntoBlocks } from './reviewer_studio.js';
import { getLastFocusedInput, setLastFocusedInput } from './equation_modal.js';

export function renderMaterialsList() {
  const container = document.getElementById('mat-cards-container');
  const badgeCount = document.getElementById('badge-count-mat');
  const countLabel = document.getElementById('mat-list-count');
  const searchInput = document.getElementById('mat-search');
  const search = searchInput ? searchInput.value.toLowerCase() : '';

  const mats = STUDIO_DATA.studyMaterials || [];
  if (badgeCount) badgeCount.innerText = mats.length;
  if (countLabel) countLabel.innerText = `(${mats.length} items)`;

  if (!container) return;
  container.innerHTML = '';

  if (mats.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-400 text-xs">
        <i data-lucide="folder-kanban" class="w-7 h-7 mx-auto mb-1.5 opacity-40"></i>
        <p class="font-medium text-slate-500 dark:text-slate-400">No study materials drafted yet.</p>
        <p class="text-[10px] text-slate-400 mt-1">Click "+ New Material" above to create lesson notes or study guides.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  mats.forEach((mat, idx) => {
    if (search && !mat.title.toLowerCase().includes(search) && !mat.subject.toLowerCase().includes(search)) {
      return;
    }
    const isActive = idx === currentMatIndex;
    const card = document.createElement('div');
    card.className = `p-3 rounded-xl cursor-pointer border transition-all ${
      isActive 
        ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-950 dark:text-white shadow-sm' 
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    }`;
    card.onclick = () => {
      setCurrentMatIndex(idx);
      renderMaterialsList();
      loadMaterialToEditor();
    };

    card.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">${mat.subject}</span>
        <span class="text-[10px] text-slate-400">${mat.tag || 'Study Guide'}</span>
      </div>
      <h4 class="font-bold text-xs truncate">${mat.title || 'Untitled Study Material'}</h4>
      <p class="text-[11px] text-slate-400 truncate mt-0.5">${mat.summary || 'No summary...'}</p>
    `;
    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

export function loadMaterialToEditor() {
  const mats = STUDIO_DATA.studyMaterials || [];
  const mat = mats[currentMatIndex];

  const emptyState = document.getElementById('material-editor-empty-state');
  const mainWorkspace = document.getElementById('material-editor-main-workspace');

  if (!mat) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (mainWorkspace) mainWorkspace.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (mainWorkspace) mainWorkspace.classList.remove('hidden');

  const titleInput = document.getElementById('mat-input-title');
  const subjectInput = document.getElementById('mat-input-subject');
  const tagInput = document.getElementById('mat-input-tag');
  const summaryInput = document.getElementById('mat-input-summary');
  const bodyInput = document.getElementById('mat-input-body');

  if (titleInput) titleInput.value = mat.title || '';
  if (subjectInput) subjectInput.value = mat.subject || 'General Science';
  if (tagInput) tagInput.value = mat.tag || 'Study Material';
  if (summaryInput) summaryInput.value = mat.summary || '';

  if (!mat.blocks || mat.blocks.length === 0) {
    if (mat.rawMarkdown) {
      mat.blocks = parseMarkdownIntoBlocks(mat.rawMarkdown);
    } else {
      mat.blocks = [
        { type: 'heading', level: 'h3', text: '1. Subject Overview & Core Modules' },
        { type: 'paragraph', text: 'Enter curated reference notes, visual charts, and formulas.' }
      ];
    }
  }

  const compiled = compileBlocksToMarkdown(mat.blocks);
  mat.rawMarkdown = compiled;
  if (bodyInput) bodyInput.value = compiled;

  renderMaterialBlockCanvas();
  syncMaterialBlocksToPreview();
}

export function renderMaterialBlockCanvas() {
  const container = document.getElementById('mat-blocks-container');
  if (!container) return;

  const mats = STUDIO_DATA.studyMaterials || [];
  const mat = mats[currentMatIndex];
  if (!mat || !mat.blocks) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '';

  mat.blocks.forEach((b, bIdx) => {
    const card = document.createElement('div');
    card.className = `p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 transition-all block-card cursor-default`;
    card.setAttribute('draggable', 'false');
    card.dataset.blockIndex = bIdx;

    let headerLeft = '';
    let bodyHtml = '';

    if (b.type === 'heading') {
      headerLeft = `
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
            Heading
          </span>
          <select onchange="window.updateMaterialBlockField(${bIdx}, 'level', this.value)" class="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 rounded-md px-2 py-0.5 border border-slate-200 dark:border-slate-700">
            <option value="h2" ${b.level === 'h2' ? 'selected' : ''}>H2 Section</option>
            <option value="h3" ${b.level === 'h3' ? 'selected' : ''}>H3 Sub-topic</option>
          </select>
        </div>
      `;
      bodyHtml = `
        <input type="text" value="${b.text || ''}" oninput="window.updateMaterialBlockField(${bIdx}, 'text', this.value)" placeholder="Type section title..." class="w-full px-2.5 py-1.5 text-xs font-black bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
      `;
    } else if (b.type === 'paragraph') {
      headerLeft = `
        <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          Concept Text
        </span>
      `;
      bodyHtml = `
        <textarea rows="2" oninput="window.updateMaterialBlockField(${bIdx}, 'text', this.value)" placeholder="Explain concept or rule here (use $formula$ for inline math)..." class="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">${b.text || ''}</textarea>
      `;
    } else if (b.type === 'formula') {
      headerLeft = `
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-tagsci-100 dark:bg-tagsci-950 text-tagsci-800 dark:text-tagsci-300 flex items-center gap-1">
            <i data-lucide="sigma" class="w-3 h-3"></i> Formula Card
          </span>
          <button onclick="window.openMathBuilderModal()" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-tagsci-50 dark:bg-tagsci-950/80 hover:bg-tagsci-100 text-tagsci-800 dark:text-tagsci-300 border border-tagsci-300 dark:border-tagsci-800">
            <i data-lucide="edit-2" class="w-3 h-3"></i> Equation Studio
          </button>
        </div>
      `;
      bodyHtml = `
        <div class="space-y-2">
          <input type="text" value="${b.title || ''}" oninput="window.updateMaterialBlockField(${bIdx}, 'title', this.value)" placeholder="Formula Name (e.g. Chemical Equilibrium)" class="w-full px-2.5 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <div class="p-2 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs">
            <input type="text" value="${b.formula || ''}" oninput="window.updateMaterialBlockField(${bIdx}, 'formula', this.value)" placeholder="Formula math: e.g. K_{eq} = \\frac{[C][D]}{[A][B]}" class="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-tagsci-800 dark:text-emerald-400 font-bold">
          </div>
          <input type="text" value="${b.note || ''}" oninput="window.updateMaterialBlockField(${bIdx}, 'note', this.value)" placeholder="Short note / reference context..." class="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
        </div>
      `;
    } else if (b.type === 'bullets') {
      headerLeft = `
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Bullet Points List
          </span>
          <button onclick="window.addMaterialBulletItem(${bIdx})" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950">
            + Add Point
          </button>
        </div>
      `;
      bodyHtml = `
        <div class="space-y-1.5">
          ${(b.items || []).map((it, itIdx) => `
            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-bold text-xs">&bull;</span>
              <input type="text" value="${it}" oninput="window.updateMaterialBulletItem(${bIdx}, ${itIdx}, this.value)" placeholder="Key takeaway point..." class="flex-1 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <button onclick="window.removeMaterialBulletItem(${bIdx}, ${itIdx})" class="text-slate-400 hover:text-red-500 p-1"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
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
          <button onclick="window.addMaterialTableCol(${bIdx})" class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10.5px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100">
            + Col
          </button>
          <button onclick="window.addMaterialTableRow(${bIdx})" class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10.5px] font-bold text-tagsci-700 dark:text-tagsci-400 bg-tagsci-50 dark:bg-tagsci-950/60 hover:bg-tagsci-100">
            + Row
          </button>
        </div>
      `;
      const headers = b.headers || ['Col 1', 'Col 2'];
      const rows = b.rows || [['', '']];
      bodyHtml = `
        <div class="space-y-2">
          <input type="text" value="${b.title || ''}" oninput="window.updateMaterialBlockField(${bIdx}, 'title', this.value)" placeholder="Table Title / Classification..." class="w-full px-2.5 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table class="w-full border-collapse text-xs">
              <thead>
                <tr class="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  ${headers.map((h, cIdx) => `
                    <th class="p-1.5 min-w-[120px]">
                      <div class="flex items-center gap-1">
                        <input type="text" value="${h}" oninput="window.updateMaterialTableHeader(${bIdx}, ${cIdx}, this.value)" placeholder="Header..." class="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                        ${headers.length > 1 ? `<button onclick="window.removeMaterialTableCol(${bIdx}, ${cIdx})" class="text-slate-400 hover:text-red-500 p-0.5"><i data-lucide="x" class="w-3 h-3"></i></button>` : ''}
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
                        <input type="text" value="${row[cIdx] || ''}" oninput="window.updateMaterialTableCell(${bIdx}, ${rIdx}, ${cIdx}, this.value)" placeholder="Cell data..." class="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                      </td>
                    `).join('')}
                    <td class="p-1 text-center">
                      ${rows.length > 1 ? `<button onclick="window.removeMaterialTableRow(${bIdx}, ${rIdx})" class="text-slate-400 hover:text-red-500 p-1"><i data-lucide="x" class="w-3 h-3"></i></button>` : ''}
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
          <button onclick="window.addMaterialPiecewiseSegment(${bIdx})" class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10.5px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100">
            + Add Branch
          </button>
        </div>
      `;
      const pieces = b.pieces || [];
      bodyHtml = `
        <div class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="text" value="${b.title || ''}" oninput="window.updateMaterialBlockField(${bIdx}, 'title', this.value)" placeholder="Plot Title..." class="w-full px-2.5 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <input type="text" value="${b.caption || ''}" oninput="window.updateMaterialBlockField(${bIdx}, 'caption', this.value)" placeholder="Caption..." class="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          </div>
          <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div><label class="text-[9.5px] text-slate-400 font-bold block">X Min</label><input type="number" value="${b.xMin ?? -10}" onchange="window.updateMaterialBlockField(${bIdx}, 'xMin', parseFloat(this.value))" class="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold"></div>
              <div><label class="text-[9.5px] text-slate-400 font-bold block">X Max</label><input type="number" value="${b.xMax ?? 10}" onchange="window.updateMaterialBlockField(${bIdx}, 'xMax', parseFloat(this.value))" class="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold"></div>
              <div><label class="text-[9.5px] text-slate-400 font-bold block">Y Min</label><input type="number" value="${b.yMin ?? -10}" onchange="window.updateMaterialBlockField(${bIdx}, 'yMin', parseFloat(this.value))" class="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold"></div>
              <div><label class="text-[9.5px] text-slate-400 font-bold block">Y Max</label><input type="number" value="${b.yMax ?? 10}" onchange="window.updateMaterialBlockField(${bIdx}, 'yMax', parseFloat(this.value))" class="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold"></div>
              <div><label class="text-[9.5px] text-slate-400 font-bold block">Grid Step</label><input type="number" value="${b.gridStep ?? 1}" min="0.1" step="0.5" onchange="window.updateMaterialBlockField(${bIdx}, 'gridStep', parseFloat(this.value))" class="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold"></div>
            </div>
          </div>
          <div class="space-y-2">
            ${pieces.map((piece, pIdx) => `
              <div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 text-xs">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 flex-1">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${piece.color || '#3b82f6'}"></span>
                    <span class="font-black text-[11px] text-slate-700 dark:text-slate-300">Branch ${pIdx + 1}: f(x) =</span>
                    <input type="text" value="${piece.expr || ''}" oninput="window.updateMaterialPiecewiseSegment(${bIdx}, ${pIdx}, 'expr', this.value)" placeholder="e.g. 2*x + 1" class="flex-1 px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                  </div>
                  <button onclick="window.removeMaterialPiecewiseSegment(${bIdx}, ${pIdx})" class="text-slate-400 hover:text-red-500 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                  <div>
                    <label class="block text-[9px] font-bold text-slate-400 uppercase">Domain Start</label>
                    <div class="flex items-center gap-1">
                      <input type="number" value="${piece.domainMin !== undefined && piece.domainMin !== null ? piece.domainMin : (b.xMin ?? -10)}" onchange="window.updateMaterialPiecewiseSegment(${bIdx}, ${pIdx}, 'domainMin', parseFloat(this.value))" class="w-full px-2 py-0.5 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                      <button onclick="window.toggleMaterialPiecewiseEndpoint(${bIdx}, ${pIdx}, 'minInclusive')" class="px-1.5 py-0.5 rounded text-[10px] font-bold ${piece.minInclusive !== false ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700'}">
                        ${piece.minInclusive !== false ? '●' : '○'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label class="block text-[9px] font-bold text-slate-400 uppercase">Domain End</label>
                    <div class="flex items-center gap-1">
                      <input type="number" value="${piece.domainMax !== undefined && piece.domainMax !== null ? piece.domainMax : (b.xMax ?? 10)}" onchange="window.updateMaterialPiecewiseSegment(${bIdx}, ${pIdx}, 'domainMax', parseFloat(this.value))" class="w-full px-2 py-0.5 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                      <button onclick="window.toggleMaterialPiecewiseEndpoint(${bIdx}, ${pIdx}, 'maxInclusive')" class="px-1.5 py-0.5 rounded text-[10px] font-bold ${piece.maxInclusive !== false ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700'}">
                        ${piece.maxInclusive !== false ? '●' : '○'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label class="block text-[9px] font-bold text-slate-400 uppercase">Color</label>
                    <select onchange="window.updateMaterialPiecewiseSegment(${bIdx}, ${pIdx}, 'color', this.value)" class="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-semibold">
                      <option value="#3b82f6" ${piece.color === '#3b82f6' ? 'selected' : ''}>Blue</option>
                      <option value="#10b981" ${piece.color === '#10b981' ? 'selected' : ''}>Emerald</option>
                      <option value="#ec4899" ${piece.color === '#ec4899' ? 'selected' : ''}>Pink</option>
                      <option value="#8b5cf6" ${piece.color === '#8b5cf6' ? 'selected' : ''}>Purple</option>
                      <option value="#f59e0b" ${piece.color === '#f59e0b' ? 'selected' : ''}>Amber</option>
                      <option value="#06b6d4" ${piece.color === '#06b6d4' ? 'selected' : ''}>Cyan</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[9px] font-bold text-slate-400 uppercase">Style</label>
                    <select onchange="window.updateMaterialPiecewiseSegment(${bIdx}, ${pIdx}, 'style', this.value)" class="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-semibold">
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
          <select onchange="window.updateMaterialBlockField(${bIdx}, 'size', this.value)" class="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 rounded-md px-2 py-0.5 border border-slate-200 dark:border-slate-700">
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
            <div class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-5 text-center bg-slate-50/50 dark:bg-slate-800/30 transition-all cursor-pointer group" onclick="document.getElementById('mat-file-input-${bIdx}').click()">
              <input type="file" id="mat-file-input-${bIdx}" accept="image/*" class="hidden" onchange="if(this.files && this.files[0]) window.uploadMaterialBlockImage(${bIdx}, this.files[0])">
              <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
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
                <input type="text" placeholder="https://example.com/diagram.png" onchange="window.updateMaterialBlockField(${bIdx}, 'url', this.value)" class="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                <button onclick="const inp = this.previousElementSibling; if(inp.value) window.updateMaterialBlockField(${bIdx}, 'url', inp.value);" class="px-2.5 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Set</button>
              </div>
            </div>
          ` : `
            <div class="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-2 text-center group">
              <img src="${b.url}" alt="${b.alt || 'Block preview'}" class="max-h-56 mx-auto rounded-lg object-contain shadow-sm" onerror="this.src=''; this.alt='Failed to load image';" />
              <div class="mt-2 flex items-center justify-center gap-2">
                <button onclick="document.getElementById('mat-file-input-${bIdx}').click()" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm">
                  <i data-lucide="refresh-cw" class="w-3 h-3"></i> Replace Image
                </button>
                <button onclick="window.updateMaterialBlockField(${bIdx}, 'url', '')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 shadow-sm">
                  <i data-lucide="trash" class="w-3 h-3"></i> Remove
                </button>
              </div>
              <input type="file" id="mat-file-input-${bIdx}" accept="image/*" class="hidden" onchange="if(this.files && this.files[0]) window.uploadMaterialBlockImage(${bIdx}, this.files[0])">
            </div>
          `}

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[9.5px] font-bold text-slate-400 uppercase mb-0.5">Caption (Supports $LaTeX$ & Markdown)</label>
              <input type="text" value="${b.caption || ''}" oninput="window.updateMaterialBlockField(${bIdx}, 'caption', this.value)" placeholder="e.g. Figure 1: Wave Propagation Diagram" class="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            </div>
            <div>
              <label class="block text-[9.5px] font-bold text-slate-400 uppercase mb-0.5">Alt Text / Description</label>
              <input type="text" value="${b.alt || ''}" oninput="window.updateMaterialBlockField(${bIdx}, 'alt', this.value)" placeholder="e.g. Free body diagram showing forces" class="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            </div>
          </div>
        </div>
      `;
    }

    const headerActions = `
      <div class="flex items-center gap-1 shrink-0">
        <button onclick="window.moveMaterialBlock(${bIdx}, -1)" ${bIdx === 0 ? 'disabled' : ''} title="Move Up" class="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors">
          <i data-lucide="arrow-up" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="window.moveMaterialBlock(${bIdx}, 1)" ${bIdx === mat.blocks.length - 1 ? 'disabled' : ''} title="Move Down" class="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors">
          <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="window.duplicateMaterialBlock(${bIdx})" title="Duplicate Block" class="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="window.deleteMaterialBlock(${bIdx})" title="Delete Block" class="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    card.innerHTML = `
      <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-1.5 min-w-0">
          <div class="drag-handle cursor-grab active:cursor-grabbing p-1.5 -ml-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 select-none transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Click and drag to reorder block placement">
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
      card.classList.add('opacity-40', 'scale-[0.99]', 'border-blue-500', 'ring-2', 'ring-blue-500/30');
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        card.classList.add('border-t-4', 'border-t-blue-500');
        card.classList.remove('border-b-4', 'border-b-blue-500');
      } else {
        card.classList.add('border-b-4', 'border-b-blue-500');
        card.classList.remove('border-t-4', 'border-t-blue-500');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('border-t-4', 'border-b-4', 'border-t-blue-500', 'border-b-blue-500');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('border-t-4', 'border-b-4', 'border-t-blue-500', 'border-b-blue-500');
      const fromIdxStr = e.dataTransfer.getData('text/plain');
      const fromIdx = parseInt(fromIdxStr, 10);
      if (isNaN(fromIdx) || fromIdx === bIdx) return;

      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const insertBefore = e.clientY < midY;

      const [moved] = mat.blocks.splice(fromIdx, 1);
      let targetIdx = bIdx;
      if (fromIdx < bIdx) {
        targetIdx = insertBefore ? bIdx - 1 : bIdx;
      } else {
        targetIdx = insertBefore ? bIdx : bIdx + 1;
      }
      mat.blocks.splice(targetIdx, 0, moved);

      renderMaterialBlockCanvas();
      syncMaterialBlocksToPreview();
      if (window.showToast) window.showToast('Material block position updated!');
    });

    card.addEventListener('dragend', () => {
      card.setAttribute('draggable', 'false');
      card.classList.remove('opacity-40', 'scale-[0.99]', 'border-blue-500', 'ring-2', 'ring-blue-500/30', 'border-t-4', 'border-b-4', 'border-t-blue-500', 'border-b-blue-500');
    });

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

export function syncMaterialBlocksToPreview() {
  const mats = STUDIO_DATA.studyMaterials || [];
  const mat = mats[currentMatIndex];
  const previewPane = document.getElementById('mat-live-preview');

  if (!mat) {
    if (previewPane) {
      previewPane.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs py-16">
          <i data-lucide="eye-off" class="w-8 h-8 mb-2 opacity-40"></i>
          <p class="font-medium text-slate-500 dark:text-slate-400">Live student preview will appear here.</p>
          <p class="text-[10.5px] text-slate-400 mt-1">Select or create a study material to view output.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
    return;
  }

  const subjEl = document.getElementById('mat-input-subject');
  const tagEl = document.getElementById('mat-input-tag');
  const titleEl = document.getElementById('mat-input-title');
  const sumEl = document.getElementById('mat-input-summary');
  const bodyInput = document.getElementById('mat-input-body');
  const charCount = document.getElementById('editor-char-count-mat');

  if (subjEl) mat.subject = subjEl.value;
  if (tagEl) mat.tag = tagEl.value;
  if (titleEl) mat.title = titleEl.value;
  if (sumEl) mat.summary = sumEl.value;

  const sourcePane = document.getElementById('mat-pane-markdown-source');
  const isSourceMode = sourcePane && !sourcePane.classList.contains('hidden');

  if (isSourceMode) {
    // When editing source directly, rawMarkdown is the source of truth
    const rawMd = bodyInput ? bodyInput.value : (mat.rawMarkdown || '');
    mat.rawMarkdown = rawMd;
    mat.blocks = parseMarkdownIntoBlocks(rawMd);
    if (charCount) charCount.innerText = `${rawMd.length} chars`;
  } else {
    // When editing visual blocks, blocks array is the source of truth
    const compiledMd = compileBlocksToMarkdown(mat.blocks);
    mat.rawMarkdown = compiledMd;
    if (bodyInput) bodyInput.value = compiledMd;
    if (charCount) charCount.innerText = `${compiledMd.length} chars`;
  }

  mat.content = renderBlocksToHtml(mat.blocks);

  if (previewPane) {
    previewPane.innerHTML = `
      <div class="border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">${mat.subject}</span>
          <span class="text-[10px] font-bold text-slate-400">&bull; ${mat.tag || 'Study Material'}</span>
        </div>
        <h1 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">${renderMathInHtml(mat.title || 'Untitled Study Material')}</h1>
        <p class="text-xs text-slate-500 italic mt-1">${renderMathInHtml(mat.summary || '')}</p>
      </div>
      <div class="mt-3 text-slate-800 dark:text-slate-100">${mat.content || '<span class="text-slate-400 italic">No content blocks added yet...</span>'}</div>
    `;
  }
}

export function updateMaterialBlockField(bIdx, field, val) {
  const mats = STUDIO_DATA.studyMaterials || [];
  const mat = mats[currentMatIndex];
  if (mat && mat.blocks && mat.blocks[bIdx]) {
    mat.blocks[bIdx][field] = val;
    syncMaterialBlocksToPreview();
  }
}

export function moveMaterialBlock(bIdx, dir) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks) return;
  const target = bIdx + dir;
  if (target < 0 || target >= mat.blocks.length) return;
  const temp = mat.blocks[bIdx];
  mat.blocks[bIdx] = mat.blocks[target];
  mat.blocks[target] = temp;
  renderMaterialBlockCanvas();
  syncMaterialBlocksToPreview();
}

export function duplicateMaterialBlock(bIdx) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks) return;
  const clone = JSON.parse(JSON.stringify(mat.blocks[bIdx]));
  mat.blocks.splice(bIdx + 1, 0, clone);
  renderMaterialBlockCanvas();
  syncMaterialBlocksToPreview();
  if (window.showToast) window.showToast('Block duplicated!');
}

export function deleteMaterialBlock(bIdx) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks) return;
  mat.blocks.splice(bIdx, 1);
  renderMaterialBlockCanvas();
  syncMaterialBlocksToPreview();
}

export function addMaterialBulletItem(bIdx) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks || !mat.blocks[bIdx]) return;
  if (!mat.blocks[bIdx].items) mat.blocks[bIdx].items = [];
  mat.blocks[bIdx].items.push('New key takeaway point');
  renderMaterialBlockCanvas();
  syncMaterialBlocksToPreview();
}

export function updateMaterialBulletItem(bIdx, itIdx, val) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (mat && mat.blocks && mat.blocks[bIdx] && mat.blocks[bIdx].items) {
    mat.blocks[bIdx].items[itIdx] = val;
    syncMaterialBlocksToPreview();
  }
}

export function removeMaterialBulletItem(bIdx, itIdx) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (mat && mat.blocks && mat.blocks[bIdx] && mat.blocks[bIdx].items) {
    mat.blocks[bIdx].items.splice(itIdx, 1);
    renderMaterialBlockCanvas();
    syncMaterialBlocksToPreview();
  }
}

export function updateMaterialTableHeader(bIdx, cIdx, val) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (mat && mat.blocks && mat.blocks[bIdx]) {
    if (!mat.blocks[bIdx].headers) mat.blocks[bIdx].headers = [];
    mat.blocks[bIdx].headers[cIdx] = val;
    syncMaterialBlocksToPreview();
  }
}

export function updateMaterialTableCell(bIdx, rIdx, cIdx, val) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (mat && mat.blocks && mat.blocks[bIdx]) {
    if (!mat.blocks[bIdx].rows) mat.blocks[bIdx].rows = [];
    if (!mat.blocks[bIdx].rows[rIdx]) mat.blocks[bIdx].rows[rIdx] = [];
    mat.blocks[bIdx].rows[rIdx][cIdx] = val;
    syncMaterialBlocksToPreview();
  }
}

export function addMaterialTableCol(bIdx) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks || !mat.blocks[bIdx]) return;
  const block = mat.blocks[bIdx];
  if (!block.headers) block.headers = ['Col 1'];
  block.headers.push(`Col ${block.headers.length + 1}`);
  if (block.rows) {
    block.rows.forEach(r => r.push(''));
  }
  renderMaterialBlockCanvas();
  syncMaterialBlocksToPreview();
}

export function removeMaterialTableCol(bIdx, cIdx) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks || !mat.blocks[bIdx]) return;
  const block = mat.blocks[bIdx];
  if (block.headers && block.headers.length > 1) {
    block.headers.splice(cIdx, 1);
    if (block.rows) {
      block.rows.forEach(r => r.splice(cIdx, 1));
    }
    renderMaterialBlockCanvas();
    syncMaterialBlocksToPreview();
  }
}

export function addMaterialTableRow(bIdx) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks || !mat.blocks[bIdx]) return;
  const block = mat.blocks[bIdx];
  if (!block.rows) block.rows = [];
  const colCount = block.headers ? block.headers.length : 2;
  block.rows.push(new Array(colCount).fill(''));
  renderMaterialBlockCanvas();
  syncMaterialBlocksToPreview();
}

export function removeMaterialTableRow(bIdx, rIdx) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks || !mat.blocks[bIdx]) return;
  const block = mat.blocks[bIdx];
  if (block.rows && block.rows.length > 1) {
    block.rows.splice(rIdx, 1);
    renderMaterialBlockCanvas();
    syncMaterialBlocksToPreview();
  }
}

export function addMaterialPiecewiseSegment(bIdx) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks || !mat.blocks[bIdx]) return;
  const block = mat.blocks[bIdx];
  if (!block.pieces) block.pieces = [];
  block.pieces.push({
    expr: '2*x',
    domainMin: 0,
    domainMax: 5,
    minInclusive: true,
    maxInclusive: true,
    color: '#3b82f6',
    style: 'solid'
  });
  renderMaterialBlockCanvas();
  syncMaterialBlocksToPreview();
}

export function removeMaterialPiecewiseSegment(bIdx, pIdx) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks || !mat.blocks[bIdx]) return;
  const block = mat.blocks[bIdx];
  if (block.pieces && block.pieces.length > 1) {
    block.pieces.splice(pIdx, 1);
    renderMaterialBlockCanvas();
    syncMaterialBlocksToPreview();
  }
}

export function updateMaterialPiecewiseSegment(bIdx, pIdx, field, val) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks || !mat.blocks[bIdx]) return;
  const block = mat.blocks[bIdx];
  if (block.pieces && block.pieces[pIdx]) {
    block.pieces[pIdx][field] = val;
    syncMaterialBlocksToPreview();
  }
}

export function toggleMaterialPiecewiseEndpoint(bIdx, pIdx, field) {
  const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
  if (!mat || !mat.blocks || !mat.blocks[bIdx]) return;
  const block = mat.blocks[bIdx];
  if (block.pieces && block.pieces[pIdx]) {
    block.pieces[pIdx][field] = !(block.pieces[pIdx][field] !== false);
    renderMaterialBlockCanvas();
    syncMaterialBlocksToPreview();
  }
}

export function addMaterialContentBlock(type) {
  if (!STUDIO_DATA.studyMaterials || STUDIO_DATA.studyMaterials.length === 0) {
    const newMat = {
      id: `material_${Date.now()}`,
      subject: "General Science",
      tag: "Study Material",
      color: "border-l-4 border-blue-500",
      title: "New Study Material Draft",
      summary: "Curated learning notes and formulas",
      blocks: [],
      rawMarkdown: "",
      content: ""
    };
    STUDIO_DATA.studyMaterials = [newMat];
    setCurrentMatIndex(0);
    renderMaterialsList();
    loadMaterialToEditor();
  }

  if (currentMatIndex < 0 || currentMatIndex >= STUDIO_DATA.studyMaterials.length) {
    setCurrentMatIndex(0);
  }

  const mat = STUDIO_DATA.studyMaterials[currentMatIndex];
  if (!mat) return;
  if (!mat.blocks) mat.blocks = [];

  const emptyState = document.getElementById('material-editor-empty-state');
  const mainWorkspace = document.getElementById('material-editor-main-workspace');
  if (emptyState) emptyState.classList.add('hidden');
  if (mainWorkspace) mainWorkspace.classList.remove('hidden');

  if (type === 'heading') {
    mat.blocks.push({ type: 'heading', level: 'h3', text: 'New Section Title' });
  } else if (type === 'paragraph') {
    mat.blocks.push({ type: 'paragraph', text: 'Explain concepts, definitions, and key takeaways here.' });
  } else if (type === 'formula') {
    mat.blocks.push({ type: 'formula', title: 'Formula Card', formula: 'PV = nRT', note: 'Ideal Gas Law equation.' });
  } else if (type === 'bullets') {
    mat.blocks.push({ type: 'bullets', items: ['First key point', 'Second key point'] });
  } else if (type === 'table') {
    mat.blocks.push({
      type: 'table',
      title: 'Periodic Properties Comparison',
      headers: ['Property', 'Trend across Period', 'Trend down Group'],
      rows: [
        ['Atomic Radius', 'Decreases', 'Increases'],
        ['Ionization Energy', 'Increases', 'Decreases'],
        ['Electronegativity', 'Increases', 'Decreases']
      ]
    });
  } else if (type === 'cartesian' || type === 'plot') {
    mat.blocks.push({
      type: 'cartesian',
      title: 'Piecewise Coordinate Plot',
      caption: 'Visual Cartesian coordinate plane with piecewise branches.',
      xMin: -6,
      xMax: 6,
      yMin: -6,
      yMax: 8,
      gridStep: 1,
      pieces: [
        { expr: '-x + 2', domainMin: -6, domainMax: 1, minInclusive: false, maxInclusive: true, color: '#3b82f6', style: 'solid' },
        { expr: 'x^2', domainMin: 1, domainMax: 3, minInclusive: false, maxInclusive: false, color: '#10b981', style: 'solid' }
      ]
    });
  } else if (type === 'image') {
    mat.blocks.push({
      type: 'image',
      url: '',
      caption: '',
      alt: 'Illustration diagram',
      size: 'medium'
    });
  }

  renderMaterialBlockCanvas();
  syncMaterialBlocksToPreview();
  if (window.renderHubDashboard) window.renderHubDashboard();
  if (window.showToast) window.showToast('Block added to study material!');
}

export function uploadMaterialBlockImage(bIdx, file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    if (window.showToast) window.showToast('Please select a valid image file (PNG, JPG, SVG, WebP, GIF)');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const mat = (STUDIO_DATA.studyMaterials || [])[currentMatIndex];
    if (mat && mat.blocks && mat.blocks[bIdx]) {
      mat.blocks[bIdx].url = e.target.result;
      if (!mat.blocks[bIdx].alt) {
        mat.blocks[bIdx].alt = file.name.replace(/\.[^/.]+$/, "");
      }
      renderMaterialBlockCanvas();
      syncMaterialBlocksToPreview();
      if (window.showToast) window.showToast('Image uploaded successfully!');
    }
  };
  reader.readAsDataURL(file);
}

export function createQuickMaterial() {
  const newMat = {
    id: `material_${Date.now()}`,
    subject: "General Science",
    tag: "Study Material",
    color: "border-l-4 border-blue-500",
    title: "New Study Material Draft",
    summary: "Enter short summary...",
    blocks: [
      { type: 'heading', level: 'h3', text: '1. Topic Introduction' },
      { type: 'paragraph', text: 'Start typing concepts or insert elements from the toolbar.' }
    ],
    rawMarkdown: "",
    content: ""
  };
  if (!STUDIO_DATA.studyMaterials) STUDIO_DATA.studyMaterials = [];
  STUDIO_DATA.studyMaterials.unshift(newMat);
  setCurrentMatIndex(0);
  renderMaterialsList();
  loadMaterialToEditor();
  if (window.renderHubDashboard) window.renderHubDashboard();
  if (window.switchTab) window.switchTab('materials');
  if (window.showToast) window.showToast('New study material draft opened!');
}

export function exportMaterialMarkdown() {
  const mats = STUDIO_DATA.studyMaterials || [];
  const mat = mats[currentMatIndex];
  if (!mat) return;
  const mdBody = compileBlocksToMarkdown(mat.blocks || []);
  const mdContent = `---
id: ${mat.id}
subject: ${mat.subject}
tag: ${mat.tag || 'Study Material'}
title: ${mat.title}
summary: ${mat.summary}
---

${mdBody}
`;
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(mdContent));
  element.setAttribute('download', `${mat.id || 'study_material'}.md`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  if (window.showToast) window.showToast(`Downloaded ${mat.id}.md!`);
}
