# Drift på sigge.si

- GitHub: `Ac0AI/copybiblioteket`, fristående repo.
- Vercel-team: `ac0` (AC0 AI SL).
- Vercel-projekt: `copybiblioteket`.
- Produktion: `https://sigge.si`.
- Domänregistrering och auktoritativ DNS: Porkbun.

## Release

1. Kör `npm ci --ignore-scripts` och `npm run build`.
2. Granska diffen och publicera den avsedda committen till GitHub.
3. Vercels Git-koppling bygger produktion från `main`. Samma kontroller körs i Vercels build, så ett testfel stoppar bygget.
4. Verifiera `/`, `/api/health`, en sökning och en källänk över HTTPS. Kontrollera sidan i webbläsare.

För en manuell första release eller felsökning, välj alltid teamet `ac0` och projektet `copybiblioteket`. Gissa inte domänens DNS-mål; hämta rekommenderade värden från Vercels domänkonfiguration. Uppdatera endast avsedda webbposter hos Porkbun.

## Innehåll och data

`public/` serveras som statiska filer. En explicit rewrite från `/` till `/index.html` låter Vercels CDN leverera startsidan även när Express tar emot övriga rutter. Express ger läsande API:er och POST `/api/search`. Sökningen använder ett litet BM25-index i minnet. Det finns inga inloggningar, uppladdningar, skriv-API:er, databaser eller externa modellanrop. Sökfrågor placeras inte i URL:en och sparas inte av applikationen.

`app.ts` stänger uttryckligen av den valfria lokala, ärvda textsamlingen. Bara egna ramverk och source-länkar publiceras. Installerad skill och MCP kan använda en separat lokal samling. Lokal konfiguration, miljöfiler och maskinsökvägar ska inte checkas in.

## Kontroll och återställning

`GET /api/health` ska returnera `status: ok`, `frameworks: 11`, `sourceMode: links` för den första versionen. Vid en dålig release: återställ till en tidigare verifierad produktionsdeployment med Vercels rollback, och kontrollera domänen igen. Efter rollback kan automatisk domäntilldelning behöva återaktiveras genom promotion.

Det finns inga kontinuerliga externa syntetiska kontroller konfigurerade. Vercels byggstatus och driftsloggar används vid release och felsökning.
