/* =========================================================
   TagSci Content Studio - Offline Math, Markdown & Plotting Engine
   ========================================================= */

export const GREEK_SYMBOLS = {
  '\\alpha': '&alpha;', '\\beta': '&beta;', '\\gamma': '&gamma;', '\\delta': '&delta;',
  '\\Delta': '&Delta;', '\\epsilon': '&epsilon;', '\\varepsilon': '&#x03B5;', '\\theta': '&theta;',
  '\\Theta': '&Theta;', '\\lambda': '&lambda;', '\\Lambda': '&Lambda;', '\\mu': '&mu;',
  '\\pi': '&pi;', '\\Pi': '&Pi;', '\\rho': '&rho;', '\\sigma': '&sigma;', '\\Sigma': '&Sigma;',
  '\\tau': '&tau;', '\\phi': '&phi;', '\\Phi': '&Phi;', '\\omega': '&omega;', '\\Omega': '&Omega;'
};

export const MATH_OPERATORS = {
  '\\cdot': '&middot;', '\\times': '&times;', '\\pm': '&plusmn;', '\\mp': '&#x2213;',
  '\\approx': '&asymp;', '\\neq': '&ne;', '\\le': '&le;', '\\ge': '&ge;', '\\infty': '&infin;',
  '\\partial': '&part;', '\\nabla': '&nabla;', '\\forall': '&forall;', '\\exists': '&exist;',
  '\\in': '&isin;', '\\notin': '&notin;', '\\rightarrow': '&rarr;', '\\leftarrow': '&larr;',
  '\\Rightarrow': '&rArr;', '\\Leftarrow': '&lArr;', '\\leftrightarrow': '&harr;',
  '\\int': '<span class="text-lg leading-none italic font-serif font-bold">&int;</span>',
  '\\sum': '<span class="text-lg leading-none font-bold">&sum;</span>',
  '\\sqrt': '&radic;'
};

export function parseMathSyntax(tex) {
  let s = (tex || '').trim();
  s = s.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (match, num, den) => {
    return `<span class="inline-flex flex-col text-center align-middle mx-1 text-xs sm:text-sm font-mono-math"><span class="border-b border-current pb-0.5 px-1">${parseMathSyntax(num)}</span><span class="pt-0.5 px-1">${parseMathSyntax(den)}</span></span>`;
  });
  s = s.replace(/\\sqrt\[([^{}]+)\]\{([^{}]+)\}/g, (match, n, inner) => {
    return `<span class="inline-flex items-center align-middle font-mono-math"><sup class="text-[9px] -mr-1">${parseMathSyntax(n)}</sup><span class="text-base leading-none">&radic;</span><span class="border-t border-current px-0.5 ml-0.5">${parseMathSyntax(inner)}</span></span>`;
  });
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (match, inner) => {
    return `<span class="inline-flex items-center align-middle font-mono-math"><span class="text-base leading-none">&radic;</span><span class="border-t border-current px-0.5 ml-0.5">${parseMathSyntax(inner)}</span></span>`;
  });
  s = s.replace(/\\vec\{([^{}]+)\}/g, (match, inner) => `<span class="inline-flex flex-col items-center justify-center font-mono-math"><span class="text-[10px] leading-none">&rarr;</span><span>${inner}</span></span>`);
  s = s.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
  s = s.replace(/\^([a-zA-Z0-9+\-&;]+)/g, '<sup>$1</sup>');
  s = s.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
  s = s.replace(/_([a-zA-Z0-9+\-&;]+)/g, '<sub>$1</sub>');
  for (const [key, val] of Object.entries(GREEK_SYMBOLS)) s = s.split(key).join(val);
  for (const [key, val] of Object.entries(MATH_OPERATORS)) s = s.split(key).join(val);
  s = s.replace(/\\text\{([^{}]+)\}/g, '<span class="font-sans font-normal">$1</span>');
  return s;
}

export function renderMathInHtml(htmlString) {
  if (!htmlString) return '';
  let res = htmlString.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
    return `<div class="my-3 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center font-mono-math text-sm text-tagsci-900 dark:text-emerald-300 shadow-sm overflow-x-auto">${parseMathSyntax(tex)}</div>`;
  });
  res = res.replace(/\$([^\$\n]+?)\$/g, (match, tex) => {
    return `<span class="inline-block font-mono-math text-tagsci-800 dark:text-emerald-300 px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold">${parseMathSyntax(tex)}</span>`;
  });
  return res;
}

export function formatRichText(str) {
  if (!str) return '';
  let res = str;
  // 1. Bold: **text**
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // 2. Underline: <u>text</u> or __text__
  res = res.replace(/<u>(.*?)<\/u>/gi, '<u class="underline underline-offset-2">$1</u>');
  res = res.replace(/__(.*?)__/g, '<u class="underline underline-offset-2">$1</u>');
  // 3. Italic: *text* (when not part of **)
  res = res.replace(/(?<!\*)\*(?!\*)([^\*]+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>');
  return res;
}

/* =========================================================
   Mathematical Expression Compiler for Cartesian Functions
   ========================================================= */
export function compileMathExpression(exprStr) {
  if (!exprStr || typeof exprStr !== 'string' || !exprStr.trim()) {
    return () => NaN;
  }
  let clean = exprStr.trim()
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))')
    .replace(/\\sqrt\{([^{}]+)\}/g, 'Math.sqrt($1)')
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\|([^\|]+)\|/g, 'Math.abs($1)')
    .replace(/\babs\s*\(/g, 'Math.abs(')
    .replace(/\bsqrt\s*\(/g, 'Math.sqrt(')
    .replace(/\bcbrt\s*\(/g, 'Math.cbrt(')
    .replace(/\bsin\s*\(/g, 'Math.sin(')
    .replace(/\bcos\s*\(/g, 'Math.cos(')
    .replace(/\btan\s*\(/g, 'Math.tan(')
    .replace(/\bsec\s*\(([^)]+)\)/g, '(1/Math.cos($1))')
    .replace(/\bcsc\s*\(([^)]+)\)/g, '(1/Math.sin($1))')
    .replace(/\bcot\s*\(([^)]+)\)/g, '(1/Math.tan($1))')
    .replace(/\bln\s*\(/g, 'Math.log(')
    .replace(/\blog\s*\(/g, 'Math.log10(')
    .replace(/\bexp\s*\(/g, 'Math.exp(')
    .replace(/\bfloor\s*\(/g, 'Math.floor(')
    .replace(/\bceil\s*\(/g, 'Math.ceil(')
    .replace(/\bround\s*\(/g, 'Math.round(')
    .replace(/\bpi\b/gi, 'Math.PI')
    .replace(/\be\b(?![a-zA-Z0-9_])/g, 'Math.E')
    .replace(/(\d+)\s*([a-zA-Z(])/g, '$1*$2')
    .replace(/(\))\s*(\()/g, '$1*$2')
    .replace(/(\))\s*([a-zA-Z0-9])/g, '$1*$2')
    .replace(/([a-zA-Z0-9_]+)\s*\^\s*([a-zA-Z0-9_]+|\([^)]+\))/g, 'Math.pow($1, $2)')
    .replace(/\^\s*([0-9.]+)/g, '**$1');

  try {
    const fn = new Function('x', 'Math', `with(Math){ try { return (${clean}); } catch(e){ return NaN; } }`);
    return (x) => fn(x, Math);
  } catch (e) {
    return () => NaN;
  }
}

/* =========================================================
   SVG Cartesian Plane & Piecewise Function Generator
   ========================================================= */
export function renderCartesianPlaneSvg(block) {
  const xMin = Number(block.xMin) || -10;
  const xMax = Number(block.xMax) || 10;
  const yMin = Number(block.yMin) || -10;
  const yMax = Number(block.yMax) || 10;
  const gridStep = Number(block.gridStep) || 1;
  const width = 540;
  const height = 380;
  const pad = 40;

  const toSvgX = (x) => pad + ((x - xMin) / (xMax - xMin)) * (width - 2 * pad);
  const toSvgY = (y) => height - pad - ((y - yMin) / (yMax - yMin)) * (height - 2 * pad);

  // Background & Grid lines
  let gridPaths = '';
  let axisTicks = '';

  // Vertical grid & X ticks
  const xRange = xMax - xMin;
  const stepX = gridStep <= 0 ? 1 : gridStep;
  const firstX = Math.ceil(xMin / stepX) * stepX;
  for (let x = firstX; x <= xMax; x += stepX) {
    const sx = toSvgX(x);
    if (sx >= pad && sx <= width - pad) {
      gridPaths += `<line x1="${sx}" y1="${pad}" x2="${sx}" y2="${height - pad}" stroke="currentColor" class="text-slate-200 dark:text-slate-800/80" stroke-width="0.8" />`;
      if (x !== 0) {
        axisTicks += `<line x1="${sx}" y1="${toSvgY(0) - 3}" x2="${sx}" y2="${toSvgY(0) + 3}" stroke="currentColor" class="text-slate-400 dark:text-slate-600" stroke-width="1.2" />`;
        axisTicks += `<text x="${sx}" y="${Math.min(height - pad + 15, Math.max(pad + 12, toSvgY(0) + 14))}" text-anchor="middle" font-size="9" font-family="monospace" class="fill-slate-400 dark:fill-slate-500 font-bold">${x}</text>`;
      }
    }
  }

  // Horizontal grid & Y ticks
  const yRange = yMax - yMin;
  const stepY = gridStep <= 0 ? 1 : gridStep;
  const firstY = Math.ceil(yMin / stepY) * stepY;
  for (let y = firstY; y <= yMax; y += stepY) {
    const sy = toSvgY(y);
    if (sy >= pad && sy <= height - pad) {
      gridPaths += `<line x1="${pad}" y1="${sy}" x2="${width - pad}" y2="${sy}" stroke="currentColor" class="text-slate-200 dark:text-slate-800/80" stroke-width="0.8" />`;
      if (y !== 0) {
        axisTicks += `<line x1="${toSvgX(0) - 3}" y1="${sy}" x2="${toSvgX(0) + 3}" y2="${sy}" stroke="currentColor" class="text-slate-400 dark:text-slate-600" stroke-width="1.2" />`;
        axisTicks += `<text x="${Math.max(pad - 6, Math.min(width - pad - 12, toSvgX(0) - 8))}" y="${sy + 3}" text-anchor="end" font-size="9" font-family="monospace" class="fill-slate-400 dark:fill-slate-500 font-bold">${y}</text>`;
      }
    }
  }

  // Origin (0,0) Axes
  const axisX_Y = toSvgY(0);
  const axisY_X = toSvgX(0);

  let axesSvg = '';
  // X-Axis
  if (axisX_Y >= pad && axisX_Y <= height - pad) {
    axesSvg += `
      <line x1="${pad - 10}" y1="${axisX_Y}" x2="${width - pad + 15}" y2="${axisX_Y}" stroke="currentColor" class="text-slate-700 dark:text-slate-300" stroke-width="1.8" />
      <polygon points="${width - pad + 18},${axisX_Y} ${width - pad + 10},${axisX_Y - 4} ${width - pad + 10},${axisX_Y + 4}" class="fill-slate-700 dark:fill-slate-300" />
      <text x="${width - pad + 24}" y="${axisX_Y + 3.5}" font-size="11" font-weight="bold" class="fill-slate-800 dark:fill-slate-200 font-mono">x</text>
    `;
  }
  // Y-Axis
  if (axisY_X >= pad && axisY_X <= width - pad) {
    axesSvg += `
      <line x1="${axisY_X}" y1="${height - pad + 10}" x2="${axisY_X}" y2="${pad - 15}" stroke="currentColor" class="text-slate-700 dark:text-slate-300" stroke-width="1.8" />
      <polygon points="${axisY_X},${pad - 18} ${axisY_X - 4},${pad - 10} ${axisY_X + 4},${pad - 10}" class="fill-slate-700 dark:fill-slate-300" />
      <text x="${axisY_X - 2}" y="${pad - 22}" font-size="11" font-weight="bold" text-anchor="middle" class="fill-slate-800 dark:fill-slate-200 font-mono">y</text>
    `;
  }

  // Origin label
  if (axisX_Y >= pad && axisX_Y <= height - pad && axisY_X >= pad && axisY_X <= width - pad) {
    axesSvg += `<text x="${axisY_X - 6}" y="${axisX_Y + 12}" font-size="9" font-weight="bold" class="fill-slate-400 font-mono">0</text>`;
  }

  // Render Function Pieces
  const pieces = block.pieces || [];
  let curvesSvg = '';
  let endpointsSvg = '';
  let piecewiseFormulaItems = [];

  const defaultColors = ['#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#06b6d4'];

  pieces.forEach((piece, pIdx) => {
    const expr = piece.expr || 'x';
    const fn = compileMathExpression(expr);
    const pColor = piece.color || defaultColors[pIdx % defaultColors.length];
    const pStyle = piece.style || 'solid';
    const dashArray = pStyle === 'dashed' ? '6,4' : pStyle === 'dotted' ? '2,3' : 'none';

    const pMin = (piece.domainMin !== undefined && piece.domainMin !== null && piece.domainMin !== '' && !isNaN(piece.domainMin)) 
      ? Number(piece.domainMin) 
      : xMin;
    const pMax = (piece.domainMax !== undefined && piece.domainMax !== null && piece.domainMax !== '' && !isNaN(piece.domainMax)) 
      ? Number(piece.domainMax) 
      : xMax;

    const startInc = piece.minInclusive !== false;
    const endInc = piece.maxInclusive !== false;

    // Build math condition text for legend
    let conditionText = '';
    if (pMin > xMin && pMax < xMax) {
      conditionText = `${pMin} ${startInc ? '\\le' : '<'} x ${endInc ? '\\le' : '<'} ${pMax}`;
    } else if (pMin > xMin) {
      conditionText = `x ${startInc ? '\\ge' : '>'} ${pMin}`;
    } else if (pMax < xMax) {
      conditionText = `x ${endInc ? '\\le' : '<'} ${pMax}`;
    } else {
      conditionText = '\\text{for all } x';
    }
    piecewiseFormulaItems.push({ expr, conditionText, color: pColor });

    // Sample Curve Points
    const clampStart = Math.max(xMin, pMin);
    const clampEnd = Math.min(xMax, pMax);
    if (clampStart < clampEnd) {
      const samples = 240;
      const dx = (clampEnd - clampStart) / samples;
      let pathD = '';
      let isDrawing = false;
      let prevY = null;

      for (let i = 0; i <= samples; i++) {
        const cx = clampStart + i * dx;
        const cy = fn(cx);

        if (isNaN(cy) || !isFinite(cy) || cy < (yMin - yRange * 2) || cy > (yMax + yRange * 2)) {
          isDrawing = false;
          prevY = null;
          continue;
        }

        // Check for asymptote jump
        if (prevY !== null && Math.abs(cy - prevY) > yRange * 0.75) {
          isDrawing = false;
        }

        const sx = toSvgX(cx);
        const sy = toSvgY(cy);

        if (!isDrawing) {
          pathD += `M ${sx.toFixed(1)} ${sy.toFixed(1)} `;
          isDrawing = true;
        } else {
          pathD += `L ${sx.toFixed(1)} ${sy.toFixed(1)} `;
        }
        prevY = cy;
      }

      if (pathD) {
        curvesSvg += `<path d="${pathD.trim()}" fill="none" stroke="${pColor}" stroke-width="2.5" stroke-dasharray="${dashArray}" stroke-linecap="round" stroke-linejoin="round" />`;
      }
    }

    // Endpoints (Open ○ / Closed ● Circles)
    // 1. Start boundary
    if (pMin >= xMin && pMin <= xMax && piece.domainMin !== undefined && piece.domainMin !== null && piece.domainMin !== '') {
      const yStart = fn(pMin);
      if (!isNaN(yStart) && isFinite(yStart) && yStart >= (yMin - 0.5) && yStart <= (yMax + 0.5)) {
        const cx = toSvgX(pMin);
        const cy = toSvgY(yStart);
        if (startInc) {
          endpointsSvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" fill="${pColor}" stroke="#ffffff" stroke-width="1.8" />`;
        } else {
          endpointsSvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" fill="#ffffff" stroke="${pColor}" stroke-width="2.2" />`;
        }
      }
    }

    // 2. End boundary
    if (pMax >= xMin && pMax <= xMax && piece.domainMax !== undefined && piece.domainMax !== null && piece.domainMax !== '') {
      const yEnd = fn(pMax);
      if (!isNaN(yEnd) && isFinite(yEnd) && yEnd >= (yMin - 0.5) && yEnd <= (yMax + 0.5)) {
        const cx = toSvgX(pMax);
        const cy = toSvgY(yEnd);
        if (endInc) {
          endpointsSvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" fill="${pColor}" stroke="#ffffff" stroke-width="1.8" />`;
        } else {
          endpointsSvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" fill="#ffffff" stroke="${pColor}" stroke-width="2.2" />`;
        }
      }
    }
  });

  // Piecewise Mathematical Definition Panel
  let definitionBox = '';
  if (piecewiseFormulaItems.length > 0) {
    definitionBox = `
      <div class="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
        <div class="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-tagsci-600"></span>
          Piecewise Definition:
        </div>
        <div class="space-y-1 font-mono-math">
          ${piecewiseFormulaItems.map(item => `
            <div class="flex items-center justify-between text-xs sm:text-sm py-0.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
              <span class="font-bold" style="color: ${item.color}">${parseMathSyntax(item.expr)}</span>
              <span class="text-slate-500 text-[11px]">${parseMathSyntax('\\text{if } ' + item.conditionText)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="my-4 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      ${block.title ? `<h4 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-tagsci-600"></span>${renderMathInHtml(block.title)}</h4>` : ''}
      ${block.caption ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mb-3">${renderMathInHtml(block.caption)}</p>` : ''}
      
      <div class="w-full flex justify-center items-center bg-slate-50/70 dark:bg-slate-900/50 rounded-xl p-2 border border-slate-100 dark:border-slate-800/80 overflow-x-auto">
        <svg viewBox="0 0 ${width} ${height}" class="w-full max-w-lg h-auto select-none" xmlns="http://www.w3.org/2000/svg">
          <!-- Clip Region -->
          <defs>
            <clipPath id="plot-clip-${Math.random().toString(36).substr(2, 6)}">
              <rect x="${pad}" y="${pad}" width="${width - 2 * pad}" height="${height - 2 * pad}" />
            </clipPath>
          </defs>

          <!-- Grid Background -->
          <rect x="${pad}" y="${pad}" width="${width - 2 * pad}" height="${height - 2 * pad}" fill="transparent" />
          <g>${gridPaths}</g>
          <g>${axesSvg}</g>
          <g>${axisTicks}</g>
          <g>${curvesSvg}</g>
          <g>${endpointsSvg}</g>
        </svg>
      </div>

      ${definitionBox}
    </div>
  `;
}

/* =========================================================
   Table Block HTML Generator
   ========================================================= */
export function renderTableToHtml(block) {
  const title = block.title || '';
  const headers = block.headers || ['Column 1', 'Column 2'];
  const rows = block.rows || [['Sample 1', 'Sample 2']];

  let headerHtml = headers.map(h => `
    <th class="px-3 py-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      ${renderMathInHtml(h || '')}
    </th>
  `).join('');

  let rowsHtml = rows.map((r, rIdx) => `
    <tr class="${rIdx % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/60 dark:bg-slate-900/40'} hover:bg-tagsci-50/40 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-none">
      ${(r || []).map(cell => `
        <td class="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
          ${renderMathInHtml(cell || '')}
        </td>
      `).join('')}
    </tr>
  `).join('');

  return `
    <div class="my-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
      ${title ? `
        <div class="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span class="w-2 h-2 rounded bg-blue-500"></span>
            ${renderMathInHtml(title)}
          </h4>
        </div>
      ` : ''}
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr>${headerHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* =========================================================
   Unified Block Array to Rendered HTML
   ========================================================= */
export function renderBlocksToHtml(blocks) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return '';
  
  let html = '';
  blocks.forEach(b => {
    if (b.type === 'heading') {
      const headingClass = b.level === 'h2' 
        ? 'text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-5 mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-800'
        : 'text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-4 mb-1.5';
      html += `<h3 class="${headingClass}">${renderMathInHtml(b.text || '')}</h3>`;
    } else if (b.type === 'paragraph') {
      html += `<p class="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed my-2">${renderMathInHtml(b.text || '')}</p>`;
    } else if (b.type === 'formula') {
      html += `
        <div class="my-3 p-3.5 sm:p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
          ${b.title ? `<span class="text-[11px] font-bold text-tagsci-800 dark:text-emerald-400 block mb-1 uppercase tracking-wider">${renderMathInHtml(b.title)}</span>` : ''}
          <div class="text-center font-mono-math text-sm sm:text-base text-tagsci-950 dark:text-emerald-300 py-1 overflow-x-auto">
            ${renderMathInHtml('$$ ' + (b.formula || '') + ' $$')}
          </div>
          ${b.note ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">${renderMathInHtml(b.note)}</p>` : ''}
        </div>
      `;
    } else if (b.type === 'bullets') {
      if (b.items && Array.isArray(b.items) && b.items.length > 0) {
        html += `<ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 my-2">`;
        b.items.forEach(it => {
          html += `<li>${renderMathInHtml(it)}</li>`;
        });
        html += `</ul>`;
      }
    } else if (b.type === 'table') {
      html += renderTableToHtml(b);
    } else if (b.type === 'cartesian' || b.type === 'plot') {
      html += renderCartesianPlaneSvg(b);
    } else if (b.type === 'callout') {
      const isWarn = b.style === 'warning';
      const calloutClass = isWarn 
        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200' 
        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200';
      html += `
        <div class="my-3 p-3.5 rounded-xl border ${calloutClass}">
          ${b.title ? `<div class="font-bold text-xs mb-1">${renderMathInHtml(b.title)}</div>` : ''}
          <div class="text-xs leading-relaxed">${renderMathInHtml(b.text || '')}</div>
        </div>
      `;
    }
  });

  return html;
}

export function parseMarkdownToHtml(md) {
  if (!md) return '';
  const lines = md.trim().split('\n');
  const htmlLines = [];
  let inList = false;

  for (let line of lines) {
    let stripped = line.trim();
    if (stripped.startsWith('#### ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h5 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-3 mb-1">${formatRichText(stripped.substring(5))}</h5>`);
    } else if (stripped.startsWith('### ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h4 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-3.5 mb-1.5">${formatRichText(stripped.substring(4))}</h4>`);
    } else if (stripped.startsWith('## ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">${formatRichText(stripped.substring(3))}</h3>`);
    } else if (stripped.startsWith('# ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h2 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2">${formatRichText(stripped.substring(2))}</h2>`);
    } else if (stripped.startsWith('- ') || stripped.startsWith('* ')) {
      if (!inList) {
        htmlLines.push('<ul class="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">');
        inList = true;
      }
      let itemText = formatRichText(stripped.substring(2));
      htmlLines.push(`<li>${itemText}</li>`);
    } else if (stripped === '') {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push('<div class="h-2"></div>');
    } else {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      let pText = formatRichText(line);
      htmlLines.push(`<p class="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed my-1">${pText}</p>`);
    }
  }
  if (inList) htmlLines.push('</ul>');
  return renderMathInHtml(htmlLines.join('\n'));
}
