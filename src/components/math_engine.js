/* =========================================================
   TagSci Content Studio - Offline Math & Markdown Engine
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
