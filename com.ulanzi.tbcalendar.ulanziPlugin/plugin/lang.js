// Nazwy dni i miesięcy: months = forma po liczbie ("25 listopada"), nom = sama nazwa ("listopad").
// Nazwy dni tygodnia i miesięcy (miesiąc w formie "25 listopada") w wybranym języku.
const H_LANG = {
  pl: { days: ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"],
        months: ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"],
        nom: ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"] },
  en: { days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] },
  de: { days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
        months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"] },
  fr: { days: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
        months: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] },
  es: { days: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
        months: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] },
  it: { days: ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"],
        months: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"] },
  cs: { days: ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"],
        months: ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"],
        nom: ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"] },
  uk: { days: ["неділя", "понеділок", "вівторок", "середа", "четвер", "пʼятниця", "субота"],
        months: ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"],
        nom: ["січень", "лютий", "березень", "квітень", "травень", "червень", "липень", "серпень", "вересень", "жовтень", "листопад", "грудень"] },
  zh: { days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"], font: "Microsoft YaHei UI, Microsoft YaHei, Segoe UI" },
  ja: { days: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
        months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"], font: "Yu Gothic UI, Meiryo UI, Segoe UI" },
  ko: { days: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
        months: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"], font: "Malgun Gothic, Segoe UI" },
};

module.exports = { H_LANG };
