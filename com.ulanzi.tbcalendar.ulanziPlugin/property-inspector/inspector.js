const CHECKS = ["weekday", "day", "month", "time"];
const DEFAULTS = {
  openMode: "thunderbird",
  programPath: "",
  programArgs: "",
  url: "",
  style: "home",
  homeContent: "full",
  lang: "pl",
  dateFormat: "text",
  bgColor: "#000000",
  textColor: "#ffffff",
  stripColor: "#0078d4",
  stripTextColor: "#ffffff",
  cardColor: "#ffffff",
  cardTextColor: "#1a1a1a",
};
const toBool = (v) => v === undefined || v === null ? true : v === true || v === "true" || v === 1 || v === "1" || v === "on";
const $ = (id) => document.getElementById(id);

function readForm() {
  const s = {};
  for (const f of CHECKS) s[f] = $(f).checked;
  for (const f of Object.keys(DEFAULTS)) s[f] = $(f).value;
  return s;
}

function fillForm(param) {
  const p = param && typeof param === "object" ? param : {};
  for (const f of CHECKS) $(f).checked = toBool(p[f]);
  for (const [f, def] of Object.entries(DEFAULTS)) $(f).value = p[f] ?? def;
  updateVisibility();
}

// Pokazuje tylko kolory pasujące do wybranego wyglądu.
function updateVisibility() {
  const card = $("style").value === "card";
  document.querySelectorAll(".only-card").forEach((el) => el.classList.toggle("hidden-row", !card));
  document.querySelectorAll(".only-plain").forEach((el) => el.classList.toggle("hidden-row", card));
  const home = $("style").value === "home";
  document.querySelectorAll(".only-home").forEach((el) => el.classList.toggle("hidden-row", !home));
  document.querySelectorAll(".not-home").forEach((el) => el.classList.toggle("hidden-row", home));
  const mode = $("openMode").value;
  document.querySelectorAll(".only-program").forEach((el) => el.classList.toggle("hidden-row", mode !== "program"));
  document.querySelectorAll(".only-url").forEach((el) => el.classList.toggle("hidden-row", mode !== "url"));
}

let sendTimer = 0;
function send() {
  updateVisibility();
  clearTimeout(sendTimer);
  sendTimer = setTimeout(() => $UD.sendParamFromPlugin(readForm()), 120);
}

$UD.connect();

$UD.onConnected(() => {
  document.querySelector(".uspi-wrapper").classList.remove("hidden");
  updateVisibility();
  const form = $("property-inspector");
  form.addEventListener("change", send);
  form.addEventListener("input", send); // kolor zmienia się na żywo podczas wybierania

  $("browse").addEventListener("click", () => $UD.selectFileDialog("Programy (*.exe *.lnk *.bat *.cmd)"));
  document.querySelectorAll(".presets a").forEach((a) => a.addEventListener("click", (ev) => {
    ev.preventDefault();
    $("url").value = a.dataset.url;
    send();
  }));
});

// Wynik okna wyboru pliku
$UD.onSelectdialog((j) => {
  if (j && j.path) {
    $("programPath").value = j.path.replace(/\//g, "\\");
    send();
  }
});

$UD.onAdd((j) => j && fillForm(j.param));
$UD.onParamFromApp((j) => j && fillForm(j.param));
