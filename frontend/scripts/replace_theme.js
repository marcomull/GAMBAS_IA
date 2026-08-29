const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'hackaton', 'G9-LATAM-Team-38', 'frontend', 'src', 'app', 'analisis', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = {
  '\\$\\{themeStyles\\.bgMain\\}': 'bg-[var(--brand-bg)]',
  '\\$\\{themeStyles\\.textMain\\}': 'text-[var(--brand-text)]',
  '\\$\\{themeStyles\\.textMuted\\}': 'text-[var(--brand-muted)]',
  '\\$\\{themeStyles\\.bannerBg\\}': 'bg-[var(--brand-accent-hover)]',
  '\\$\\{themeStyles\\.bannerText\\}': 'text-[var(--brand-text)]',
  '\\$\\{themeStyles\\.cardBg\\}': 'bg-[var(--brand-card)]',
  '\\$\\{themeStyles\\.cardInner\\}': 'bg-[var(--brand-bg)]',
  '\\$\\{themeStyles\\.inputBg\\}': 'bg-[var(--brand-bg)]',
  '\\$\\{themeStyles\\.inputText\\}': 'text-[var(--brand-text)]',
  '\\$\\{themeStyles\\.inputBorder\\}': 'border-[var(--brand-border)]',
  '\\$\\{themeStyles\\.modalBg\\}': 'bg-[var(--brand-card)]',
  '\\$\\{themeStyles\\.borderSubtle\\}': 'border-[var(--brand-border)]',
  '\\$\\{themeStyles\\.barBg\\}': 'bg-[var(--brand-accent-hover)]',
  '\\$\\{isDarkMode \\? \'text-\\[#8DA9C4\\]\' : \'text-\\[#0B2545\\]\'\\}': 'text-[var(--brand-accent)]',
  '\\$\\{isDarkMode \\? \'text-\\[#8DA9C4\\] fill-\\[#8DA9C4\\]/20\' : \'text-\\[#0B2545\\] fill-\\[#0B2545\\]/25\'\\}': 'text-[var(--brand-accent)] fill-[var(--brand-accent)]/20',
  '\\$\\{isDarkMode \\? \'text-\\[#EEF4ED\\]\' : \'text-\\[#0B2545\\]\'\\}': 'text-[var(--brand-text)]',
  'themeStyles\\.textMuted': '"text-[var(--brand-muted)]"', // where used in classNames without ${}
  '\\$\\{themeStyles\\.barColors\\[idx % themeStyles\\.barColors\\.length\\]\\}': 'bg-[var(--brand-accent)]'
};

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(key, 'g');
  content = content.replace(regex, value);
}

// Reemplazar GlobalFooter
const footerRegex = /\{\/\* FOOTER EQUIPO \*\/\}\s*<footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center px-3 py-1\.5 flex-shrink-0 gap-2 border-t border-\[#8DA9C4\]\/10 text-xs">\s*<div className="flex items-center gap-1\.5">\s*<span className=\{?"text-\[var\(--brand-muted\)\]"\}?>Hecho con<\/span>\s*<Heart size=\{13\} className="text-red-400 fill-red-400\/20" \/>\s*<span className=\{?"text-\[var\(--brand-muted\)\]"\}?>por Equipo Babel<\/span>\s*<\/div>\s*<button\s*onClick=\{[^}]+\}\s*className="flex items-center gap-1 text-\[#8DA9C4\] hover:underline font-bold transition-colors"\s*>\s*<Users size=\{14\} \/>\s*<span>Ver Miembros del Equipo<\/span>\s*\{mostrarMiembros \? <ChevronUp size=\{13\} \/> : <ChevronDown size=\{13\} \/>\}\s*<\/button>\s*<\/footer>/;

const globalFooterCode = `      {/* FOOTER EQUIPO */}
      <GlobalFooter>
        <button
          onClick={() => setMostrarMiembros(!mostrarMiembros)}
          className="flex items-center gap-1 text-[var(--brand-accent)] hover:underline font-bold transition-colors"
        >
          <Users size={14} />
          <span>Ver Miembros del Equipo</span>
          {mostrarMiembros ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </GlobalFooter>`;

content = content.replace(footerRegex, globalFooterCode);

// Fix bg-[#8DA9C4] texts inside analisis components where it should be var(--brand-accent)
content = content.replace(/bg-\[#8DA9C4\]/g, 'bg-[var(--brand-accent)]');
content = content.replace(/text-\[#8DA9C4\]/g, 'text-[var(--brand-accent)]');
content = content.replace(/border-\[#8DA9C4\]\/20/g, 'border-[var(--brand-border)]');
content = content.replace(/border-\[#8DA9C4\]\/30/g, 'border-[var(--brand-border)]');
content = content.replace(/border-\[#8DA9C4\]/g, 'border-[var(--brand-accent)]');
content = content.replace(/text-\[#0B2545\]/g, 'text-[var(--brand-bg)]');
content = content.replace(/bg-\[#13315C\]/g, 'bg-[var(--brand-accent-hover)]');

// Replace {?"text-[var(--brand-muted)]"?} strings
content = content.replace(/className=\{?"text-\[var\(--brand-muted\)\]"\}?/g, 'className="text-[var(--brand-muted)]"');
content = content.replace(/className="text-\[var\(--brand-muted\)\]"/g, 'className="text-[var(--brand-muted)]"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('File updated successfully.');
