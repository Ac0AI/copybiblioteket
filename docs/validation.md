# Validering

27 oktober 2026, fristående version 1.0.

- `npm run build`: TypeScript-kontroll och 20 automatiska tester godkända lokalt.
- Svenska och engelska sökfrågor, källhänvisningar, svenska tecken, tomma träffar, indata och HTTP testas.
- En riktig MCP-klient startar stdio-servern från en annan arbetskatalog och läser verktyg och resultat.
- Produktionsstarten testas med en ogiltig lokal källkatalog i miljön: den använder ändå endast egna tillämpningar och källänkar.
- `npm install --ignore-scripts` rapporterade noll kända sårbarheter. Detta är inte en fullständig säkerhetsrevision.
- Skrivproven i examples/ kommer från det tidigare lokala experimentet och är märkta som samma assistents bedömning.

## Verifierad publicering

Kontrollerat 27 oktober 2026 på https://sigge.si, produktionskod `6322c45ff6e73bb3fe14e8c0fa8f58d1bc64f19f`:

- GitHub-repot är fristående (`fork: false`). [CI-körningen](https://github.com/Ac0AI/copybiblioteket/actions/runs/40582566993) lyckades.
- Vercel-projektet `ac0/copybiblioteket` byggde och publicerade från `main`. Git-push till produktion har verifierats.
- HTTPS-startsidan svarar 200. `www.sigge.si` omdirigerar med 308 till huvudadressen.
- Hälsokontrollen visar 11 ramverk och `sourceMode: links`.
- En svensk fråga om kundomdömen och förtroende ger Cialdini först. Källsökning ger originalkällor med våra egna svenska beskrivningar.
- JavaScript, CSS, ikon, robots.txt och sitemap svarar 200. Ogiltig sökning ger 400 och interna filer kan inte läsas via webbvägar.
- Webbläsarkontroll av den publika startsidan, svensk sökning och lyckad kopiering av skrivunderlag.
- Lokal installerad skill är strukturellt validerad. En faktisk MCP-klient upptäcker fem verktyg och kan läsa den separat konfigurerade lokala fördjupningssamlingen.
- Vercels runtime-felvy visade inga fel i det kontrollerade 30-minutersfönstret. Detta är en kontroll vid release, ingen kontinuerlig övervakning.

Livekontrollen hittade och rättade Vercels hantering av startsidans katalogindex. Startsidan serveras nu via en explicit `sendFile`-rutt; övriga statiska resurser levereras av Vercels CDN.

## Begränsningar

Ingen jämförelse med Hormozis egen AI eller mätning av konverteringseffekt har gjorts. Begreppssökning är inte generell semantisk förståelse. Missade träffar behöver omformulering eller ramverkslistan. En valfri lokal ärvd samling har inte verifierats i sin helhet mot originalen och ingår inte i publik drift.

Sajten skriver inte färdig copy med en inbyggd modell. Den ger underlag till din AI-klient och Copy Operator-skillen. Skillens strukturella validering bevisar inte språklig kvalitet.
