// Ulanzi Studio plugin: przycisk pokazuje datę/godzinę i otwiera kalendarz w Thunderbirdzie.
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const { renderStyleSvg } = require("./svgrender");

const UUID = "com.ulanzi.ulanzistudio.tbcalendar";
const [address = "127.0.0.1", port = "3906"] = process.argv.slice(2);
const LOG = path.join(__dirname, "..", "plugin.log");
const DEFAULTS = { style: "home", homeContent: "full", lang: "pl", weekday: true, day: true, month: true, time: true, numeric: false, textColor: "#ffffff", bgColor: "#000000" };

function log(msg) {
  try {
    if (fs.existsSync(LOG) && fs.statSync(LOG).size > 512 * 1024) fs.renameSync(LOG, LOG + ".old");
    fs.appendFileSync(LOG, `${new Date().toISOString()} ${msg}\n`);
  } catch {}
}

function findThunderbird() {
  const candidates = [
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Mozilla Thunderbird", "thunderbird.exe"),
    process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "Mozilla Thunderbird", "thunderbird.exe"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Mozilla Thunderbird", "thunderbird.exe"),
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || "thunderbird.exe";
}

function start(exe, args, extra = {}) {
  log(`run -> ${exe} ${args.join(" ")}`);
  try {
    const child = spawn(exe, args, { detached: true, stdio: "ignore", ...extra });
    child.on("error", (e) => log(`spawn error: ${e.message}`));
    child.unref();
  } catch (e) {
    log(`spawn failed: ${e.message}`);
  }
}

// Uruchamia program przez powłokę Windows (jak "Uruchom"), więc działa też sama nazwa, np. outlook.exe.
function shellStart(program, args) {
  const q = (s) => `"${String(s).replace(/"/g, "")}"`;
  const cmd = `start "" ${q(program)} ${args || ""}`.trim();
  start(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `"${cmd}"`], { windowsVerbatimArguments: true, windowsHide: true });
}

function openLink(url) {
  // FileProtocolHandler otwiera http(s) w domyślnej przeglądarce i obsługuje protokoły typu outlookcal:
  start("rundll32.exe", ["url.dll,FileProtocolHandler", url], { windowsHide: true });
}

// Thunderbird ignoruje dziś opcję -calendar, więc skrypt PowerShell sam przywołuje okno
// Thunderbirda i przełącza je na kalendarz skrótem Alt+3.
let tbBusy = false;
function thunderbirdCalendar() {
  if (tbBusy) return log("calendar: already in progress, press ignored");
  tbBusy = true;
  const exe = findThunderbird();
  const script = path.join(__dirname, "open-calendar.ps1");
  log(`run -> calendar helper (${exe})`);
  let child;
  try {
    child = spawn("powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden", "-File", script, "-Exe", exe],
      { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    tbBusy = false;
    log(`helper spawn failed: ${e.message}`);
    return start(exe, ["-calendar"]);
  }
  let err = "";
  child.stderr.on("data", (b) => { err += b.toString(); });
  const done = () => { tbBusy = false; };
  const timer = setTimeout(done, 45000);
  child.on("error", (e) => { clearTimeout(timer); done(); log(`helper error: ${e.message}`); start(exe, ["-calendar"]); });
  child.on("exit", (code) => {
    clearTimeout(timer); done();
    if (code) log(`helper exit ${code}${err ? ": " + err.trim().slice(0, 500) : ""}`);
  });
}

function openCalendar(o = DEFAULTS) {
  switch (o.openMode) {
    case "outlook":
      return shellStart("outlook.exe", "/select outlook:calendar");
    case "program":
      if (!o.programPath) return log("program mode without path");
      return shellStart(o.programPath, o.programArgs);
    case "url": {
      let url = String(o.url || "").trim();
      if (!url) return log("url mode without url");
      if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = "https://" + url;
      return openLink(url);
    }
    default:
      return thunderbirdCalendar();
  }
}

// --- wygląd "jak w domu" (z wtyczki Zegar + Kalendarz): SVG, Segoe UI ---
const { H_LANG } = require("./lang");
const pad2 = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let svgCounter = 0;
function renderHomeSvg(now, o) {
  const L = H_LANG[o.lang] || H_LANG.pl;
  const color = (v, def) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : def);
  const bg = color(o.bgColor, "#000000");
  const fg = color(o.textColor, "#ffffff");
  const font = `font-family="${L.font || "Segoe UI"}" text-anchor="middle"`;
  const S = 196, X = S / 2;
  const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const wd = o.homeContent === "full"; // dzień tygodnia tylko w trybie "data + godzina + dzień tygodnia"
  const top = wd ? `<text x="${X}" y="46" ${font} font-size="26" fill="${fg}" fill-opacity="0.8">${esc(L.days[now.getDay()])}</text>\n  ` : "";
  let body;
  if (o.homeContent === "date") {
    body = wd
      ? `<text x="${X}" y="126" ${font} font-weight="bold" font-size="90" fill="${fg}">${now.getDate()}</text>
  <text x="${X}" y="168" ${font} font-size="28" fill="${fg}" fill-opacity="0.8">${esc(L.months[now.getMonth()])}</text>`
      : `<text x="${X}" y="116" ${font} font-weight="bold" font-size="104" fill="${fg}">${now.getDate()}</text>
  <text x="${X}" y="160" ${font} font-size="30" fill="${fg}" fill-opacity="0.8">${esc(L.months[now.getMonth()])}</text>`;
  } else {
    body = wd
      ? `<text x="${X}" y="116" ${font} font-weight="bold" font-size="62" fill="${fg}">${time}</text>
  <text x="${X}" y="160" ${font} font-size="28" fill="${fg}" fill-opacity="0.8">${now.getDate()}.${pad2(now.getMonth() + 1)}.${now.getFullYear()}</text>`
      : `<text x="${X}" y="104" ${font} font-weight="bold" font-size="64" fill="${fg}">${time}</text>
  <text x="${X}" y="150" ${font} font-size="30" fill="${fg}" fill-opacity="0.8">${now.getDate()}.${pad2(now.getMonth() + 1)}.${now.getFullYear()}</text>`;
  }
  // Licznik w komentarzu: każdy obraz jest inny, więc Studio go nie pominie.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect x="0" y="0" width="${S}" height="${S}" fill="${bg}"/>
  ${top}${body}
<!-- r${++svgCounter} --></svg>`;
}

// --- przyciski i ich ustawienia ---
const keys = new Map(); // context -> { uuid, key, actionid, opts, active }
const ctxOf = (d) => `${d.uuid}___${d.key}___${d.actionid}`;
const toBool = (v, def) => (v === undefined || v === null ? def : v === true || v === "true" || v === 1 || v === "1" || v === "on");

function parseOpts(param) {
  const p = param && typeof param === "object" ? param : {};
  const o = {};
  for (const k of ["weekday", "day", "month", "time"]) o[k] = toBool(p[k], DEFAULTS[k]);
  o.numeric = p.dateFormat === "numeric";
  o.style = ["card", "home"].includes(p.style) ? p.style : "plain";
  o.lang = Object.prototype.hasOwnProperty.call(H_LANG, p.lang) ? p.lang : "pl";
  o.homeContent = ["date", "timedate", "full"].includes(p.homeContent) ? p.homeContent : "full";
  o.openMode = ["thunderbird", "outlook", "program", "url"].includes(p.openMode) ? p.openMode : "thunderbird";
  for (const k of ["textColor", "bgColor", "cardColor", "cardTextColor", "stripColor", "stripTextColor", "programPath", "programArgs", "url"]) {
    if (p[k]) o[k] = p[k];
  }
  return o;
}

function upsert(d, param) {
  const ctx = ctxOf(d);
  const entry = keys.get(ctx) || { uuid: d.uuid, key: d.key, actionid: d.actionid, opts: { ...DEFAULTS }, active: true };
  if (param !== undefined) entry.opts = parseOpts(param);
  keys.set(ctx, entry);
  return entry;
}

function draw(entry, now = new Date()) {
  if (!entry.active || !ws || ws.readyState !== WebSocket.OPEN) return;
  const L = H_LANG[entry.opts.lang] || H_LANG.pl;
  const svg = entry.opts.style === "home" ? renderHomeSvg(now, entry.opts) : renderStyleSvg(now, entry.opts, L);
  const data = "data:image/svg+xml;base64," + Buffer.from(svg, "utf8").toString("base64");
  ws.send(JSON.stringify({
    cmd: "state", uuid: UUID, key: "", actionid: "",
    param: { statelist: [{
      uuid: entry.uuid, key: entry.key, actionid: entry.actionid,
      type: 1, data,
      textData: "", showtext: false,
    }] },
  }));
}

function drawAll() {
  const now = new Date();
  for (const e of keys.values()) draw(e, now);
}

// Odświeżanie dokładnie na początku każdej minuty.
function scheduleTick() {
  const now = new Date();
  setTimeout(() => { drawAll(); scheduleTick(); }, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
}

// --- połączenie z Ulanzi Studio ---
let ws;
function connect() {
  ws = new WebSocket(`ws://${address}:${port}`);

  ws.on("open", () => {
    log(`connected ws://${address}:${port}`);
    ws.send(JSON.stringify({ code: 0, cmd: "connected", uuid: UUID }));
  });

  ws.on("message", (raw) => {
    let d;
    try { d = JSON.parse(raw.toString()); } catch { return; }
    if (!d || (d.code !== undefined && d.cmdType !== "REQUEST")) return;

    // Główny serwis musi odpowiedzieć hostowi na każde polecenie.
    ws.send(JSON.stringify({ cmd: d.cmd, uuid: d.uuid, key: d.key, actionid: d.actionid, code: 0, ...d }));

    try {
      switch (d.cmd) {
        case "add":
        case "paramfromapp":
        case "paramfromplugin":
          draw(upsert(d, d.param));
          break;
        case "setactive": {
          const e = upsert(d);
          e.active = toBool(d.active, true);
          draw(e);
          break;
        }
        case "run": {
          const known = keys.get(ctxOf(d));
          const hasParam = d.param && typeof d.param === "object" && Object.keys(d.param).length > 0;
          const e = known && !hasParam ? known : upsert(d, hasParam ? d.param : undefined);
          if (!known) draw(e);
          openCalendar(e.opts);
          break;
        }
        case "clear":
          for (const p of Array.isArray(d.param) ? d.param : []) keys.delete(ctxOf(p));
          break;
      }
    } catch (e) {
      log(`error handling ${d.cmd}: ${e.stack || e.message}`);
    }
  });

  ws.on("close", () => { log("disconnected"); setTimeout(connect, 3000); });
  ws.on("error", (e) => log(`ws error: ${e.message}`));
}

log(`start, args: ${process.argv.slice(2).join(" ")}`);
connect();
scheduleTick();
