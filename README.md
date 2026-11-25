# Kalendarz Thunderbird – wtyczka do Ulanzi Studio

Przycisk na Ulanzi Deck, który pokazuje datę, godzinę i dzień tygodnia.
Kliknięcie otwiera kalendarz w Thunderbirdzie, nawet gdy okno jest zminimalizowane lub schowane.

```
   środa
   21:13
 25.11.2026
```

## Co potrafi

- **Trzy wyglądy:**
  - **Digital clock** – duża godzina i data, opcjonalnie dzień tygodnia na górze,
  - **Text** – dzień tygodnia, dzień, miesiąc i godzina w kolumnie,
  - **Calendar page** – kartka z kalendarza z kolorowym paskiem i spiralką.
- **Co pokazać (wygląd „Digital clock”):** samą datę, datę z godziną albo datę z godziną i dniem tygodnia.
- **11 języków:** polski, angielski, niemiecki, francuski, hiszpański, włoski, czeski, ukraiński, chiński, japoński i koreański.
- **Własne kolory** tła, napisu, paska i kartki.
- **Co otwiera kliknięcie:**
  - kalendarz Thunderbirda (przywołuje okno i wciska Alt+3),
  - kalendarz Outlooka (klasycznego),
  - dowolny program,
  - stronę WWW, np. Kalendarz Google.

## Instalacja

1. Pobierz `com.ulanzi.tbcalendar.ulanziPlugin.zip` z zakładki **[Releases](../../releases/latest)**.
   Możesz też pobrać całe repozytorium przyciskiem **Code → Download ZIP**.
2. Naciśnij **Win+R**, wpisz `%APPDATA%\Ulanzi\UlanziDeck\Plugins` i naciśnij Enter.
3. Wypakuj tam archiwum. W środku ma być od razu folder `com.ulanzi.tbcalendar.ulanziPlugin`, a nie folder w folderze.
4. Zamknij Ulanzi Studio (prawy przycisk na ikonie przy zegarze Windows → wyjście) i uruchom je ponownie.
5. Na liście akcji znajdziesz kategorię **Thunderbird → Kalendarz**. Przeciągnij ją na przycisk.
6. Kliknij przycisk w Ulanzi Studio i ustaw wygląd, język i to, co ma się otwierać.

Wtyczka jest gotowa do użycia: biblioteka `ws` jest dołączona, nie trzeba nic doinstalowywać.

## Aktualizacja

Zamknij Ulanzi Studio, wypakuj nową wersję w to samo miejsce z nadpisaniem plików i uruchom Studio ponownie.
Ustawienia przycisków zostają.

## Wymagania

- Windows 10 lub 11
- Ulanzi Studio 2.1 lub nowsze
- Thunderbird (dla otwierania kalendarza Thunderbirda), w którym skrót **Alt+3** przełącza na kalendarz

## Rozwiązywanie problemów

Wtyczka zapisuje dziennik w pliku `plugin.log` w swoim folderze. Każde kliknięcie zostawia tam wpis, na przykład:

```
run -> calendar helper (C:\Program Files\Mozilla Thunderbird\thunderbird.exe)
[ps] calendar: sent Alt+3
```

- **Kalendarz się nie otwiera:** sprawdź w Thunderbirdzie, czy Alt+3 przełącza na kalendarz.
  Jeśli Twoja wersja używa innego skrótu, zmień `SendKeys('%3')` w pliku `plugin/open-calendar.ps1`.
- **Zamiast chińskich, japońskich lub koreańskich znaków widać kwadraciki:** w systemie brakuje czcionki
  Microsoft YaHei, Yu Gothic lub Malgun Gothic. Możesz ją doinstalować w Ustawieniach Windows → Czas i język → Język.

## Struktura

```
com.ulanzi.tbcalendar.ulanziPlugin/
├── manifest.json            opis wtyczki dla Ulanzi Studio
├── plugin/
│   ├── app.js               połączenie ze Studio, rysowanie przycisku, obsługa kliknięć
│   ├── svgrender.js         wyglądy „Text” i „Calendar page”
│   ├── lang.js              nazwy dni i miesięcy w 11 językach
│   └── open-calendar.ps1    przywołanie okna Thunderbirda i przejście do kalendarza
├── property-inspector/      panel ustawień przycisku w Ulanzi Studio
├── libs/                    biblioteki Ulanzi do panelu ustawień
├── images/                  ikony
└── node_modules/ws          biblioteka WebSocket
```
