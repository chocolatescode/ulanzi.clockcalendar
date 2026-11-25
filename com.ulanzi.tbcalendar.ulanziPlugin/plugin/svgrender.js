// Style "Sam napis" i "Kartka z kalendarza" rysowane jako SVG czcionką systemową,
// żeby działały w każdym języku (także chińskim, japońskim, koreańskim).
// Układ odwzorowuje dawny renderer PNG (render.js): te same proporcje i odstępy.

const SIZE = 144;

// Stosunek wysokości linii (od góry znaków do dołu) do rozmiaru czcionki
// i położenie linii bazowej w tej wysokości — wartości zmierzone na Segoe UI.
const ROLE = {
  digits: { ratio: 0.734, base: 1.0 },   // cyfry: od góry cyfry do linii bazowej
  upper: { ratio: 0.93, base: 1.0 },     // WIELKIE LITERY (z akcentami nad)
  lower: { ratio: 1.02, base: 0.79 },    // małe litery z ogonkami pod linią
};

const pad2 = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const isCjk = (ch) => /[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-￯]/.test(ch);

// Przybliżona szerokość napisu (w px) dla danego rozmiaru czcionki, z lekkim zapasem.
function estWidth(text, fs, letterSpacing = 0) {
  let w = 0;
  for (const ch of text) {
    if (isCjk(ch)) w += 1.0;
    else if (/[0-9]/.test(ch)) w += 0.56;
    else if (/[.:,]/.test(ch)) w += 0.26;
    else if (/[MWŚMЖШЩЮФ]/.test(ch)) w += 0.85;
    else if (/[mwшщжю]/.test(ch)) w += 0.8;
    else if (/[il1ıìíїі]/.test(ch)) w += 0.26;
    else if (/[jtfr]/.test(ch)) w += 0.36;
    else if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) w += 0.66;
    else w += 0.52;
  }
  const n = [...text].length;
  return (w * fs + letterSpacing * Math.max(0, n - 1)) * 1.04;
}

// Układa linie w pionie w prostokącie box; zwraca elementy <text>.
// items: [{ text, role, base }]
function layout(items, box, gap, maxGrow, color, font) {
  if (!items.length) return "";
  const baseSum = items.reduce((s, it) => s + it.base, 0);
  const grow = Math.min(maxGrow, (box.h - gap * (items.length - 1)) / baseSum);
  const lines = items.map((it) => {
    const r = ROLE[it.role];
    let h = it.base * grow;
    let fs = h / r.ratio;
    let w = estWidth(it.text, fs);
    if (w > box.w) { const k = box.w / w; h *= k; fs *= k; w = box.w; }
    return { ...it, h, fs, ls: 0, r };
  });
  const total = lines.reduce((s, l) => s + l.h, 0) + gap * (lines.length - 1);
  let y = box.y + (box.h - total) / 2;
  const cx = box.x + box.w / 2;
  return lines.map((l) => {
    const baseline = y + l.h * l.r.base;
    y += l.h + gap;
    const spacing = l.ls ? ` letter-spacing="${l.ls.toFixed(2)}"` : "";
    // Zabezpieczenie: jeśli prawdziwa czcionka jest szersza niż szacunek, ściśnij do szerokości pola.
    const fit = estWidth(l.text, l.fs, l.ls) >= box.w - 0.5 ? ` textLength="${box.w}" lengthAdjust="spacingAndGlyphs"` : "";
    return `<text x="${cx.toFixed(2)}" y="${baseline.toFixed(2)}" font-family="${font}" font-size="${l.fs.toFixed(2)}" text-anchor="middle" fill="${color}"${spacing}${fit}>${esc(l.text)}</text>`;
  }).join("\n  ");
}

function upper(s, lang) {
  try { return s.toLocaleUpperCase(lang); } catch { return s.toUpperCase(); }
}

// Typ linii dla napisu w danym języku (CJK nie ma wielkich liter ani ogonków).
function roleFor(text, wantUpper) {
  if ([...text].some(isCjk)) return "upper";
  return wantUpper ? "upper" : "lower";
}

function color(v, def) {
  return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : def;
}

function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

function plainSvg(date, o, L, font) {
  const items = [];
  const wd = upper(L.days[date.getDay()], o.lang);
  if (o.weekday) items.push({ base: 20, text: wd, role: roleFor(wd, true) });
  if (o.numeric) {
    const parts = [];
    if (o.day) parts.push(String(date.getDate()));
    if (o.month) parts.push(pad2(date.getMonth() + 1));
    if (parts.length) items.push({ base: 46, text: parts.join("."), role: "digits" });
  } else {
    if (o.day) items.push({ base: 46, text: String(date.getDate()), role: "digits" });
    if (o.month) {
      const m = (o.day ? L.months : L.nom || L.months)[date.getMonth()];
      items.push({ base: 21, text: m, role: roleFor(m, false) });
    }
  }
  if (o.time) items.push({ base: 25, text: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`, role: "digits" });
  return layout(items, { x: 9, y: 8, w: SIZE - 18, h: SIZE - 16 }, 5, 1.8, color(o.textColor, "#ffffff"), font);
}

const CARD = { x: 12, y: 20, w: 120, h: 114, r: 14, strip: 34 };

function cardSvg(date, o, L, font) {
  const cardC = color(o.cardColor, "#ffffff");
  const cardT = color(o.cardTextColor, "#1a1a1a");
  const stripC = color(o.stripColor, "#0078d4");
  const stripT = color(o.stripTextColor, "#ffffff");

  let stripItem = null;
  if (!o.numeric && o.month) {
    const m = upper((L.nom || L.months)[date.getMonth()], o.lang);
    stripItem = { base: 18, text: m, role: roleFor(m, true) };
  }
  if (o.numeric && o.weekday) {
    const w = upper(L.days[date.getDay()], o.lang);
    stripItem = { base: 18, text: w, role: roleFor(w, true) };
  }

  const body = [];
  if (o.numeric) {
    const parts = [];
    if (o.day) parts.push(String(date.getDate()));
    if (o.month) parts.push(pad2(date.getMonth() + 1));
    if (parts.length) body.push({ base: 40, text: parts.join("."), role: "digits" });
  } else {
    if (o.day) body.push({ base: 40, text: String(date.getDate()), role: "digits" });
    if (o.weekday) {
      const w = upper(L.days[date.getDay()], o.lang);
      body.push({ base: 13, text: w, role: roleFor(w, true) });
    }
  }
  if (o.time) body.push({ base: 16, text: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`, role: "digits" });

  const { x, y, w, h, r, strip } = CARD;
  const ring = mix(cardC, cardT, 0.45);
  const inner = { x: x + 5, w: w - 10 };
  const rings = [x + w * 0.27, x + w * 0.73]
    .map((cx) => `<rect x="${cx - 4.5}" y="${y - 11}" width="9" height="21" rx="4.5" fill="${ring}"/>`).join("");
  return `<clipPath id="c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${cardC}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${strip}" fill="${stripC}" clip-path="url(#c)"/>
  ${rings}
  ${stripItem ? layout([stripItem], { ...inner, y: y + 6, h: strip - 8 }, 0, 1, stripT, font) : ""}
  ${layout(body, { ...inner, y: y + strip + 4, h: h - strip - 9 }, 4, 1.85, cardT, font)}`;
}

let counter = 0;
function renderStyleSvg(date, o, L) {
  const font = L.font || "Segoe UI";
  const inner = o.style === "card" ? cardSvg(date, o, L, font) : plainSvg(date, o, L, font);
  // Licznik w komentarzu: każdy obraz jest inny, więc Studio go nie pominie.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="${color(o.bgColor, "#000000")}"/>
  ${inner}
<!-- r${++counter} --></svg>`;
}

module.exports = { renderStyleSvg };
