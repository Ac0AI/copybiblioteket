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
4. Verifiera `/`, `/library`, `/people`, `/api/health`, `/api/people`, en sökning och en källänk över HTTPS. Kontrollera att `/api/write` fortfarande ger 503. Kontrollera sidan i webbläsare.

För en manuell första release eller felsökning, välj alltid teamet `ac0` och projektet `copybiblioteket`. Gissa inte domänens DNS-mål; hämta rekommenderade värden från Vercels domänkonfiguration. Uppdatera endast avsedda webbposter hos Porkbun.

## Innehåll och data

`public/` serveras som statiska filer. Startsidan har en explicit Express-rutt med `sendFile`, eftersom Vercels Express-adapter inte serverar katalogindex genom `express.static`. [Vercels Express-dokumentation](https://vercel.com/docs/frameworks/backend/express#serving-static-assets) anger att express.static ignoreras i drift. Express ger läsande API:er och POST `/api/search`. Sökningen använder ett litet BM25-index i minnet. Det finns inga inloggningar, uppladdningar, skriv-API:er, databaser eller externa modellanrop. Sökfrågor placeras inte i URL:en och sparas inte av applikationen.

`app.ts` stänger uttryckligen av den valfria lokala, ärvda textsamlingen. Bara egna ramverk, de 59 svenska personprofilerna och källänkar publiceras. Installerad skill och MCP kan använda en separat lokal samling. Lokal konfiguration, miljöfiler och maskinsökvägar ska inte checkas in.

## Kontroll och återställning

`GET /api/health` ska returnera `status: ok`, `frameworks: 11`, `people: 59`, `sourceMode: links`. Vid en dålig release: återställ till en tidigare verifierad produktionsdeployment med Vercels rollback, och kontrollera domänen igen. Efter rollback kan automatisk domäntilldelning behöva återaktiveras genom promotion.

Det finns inga kontinuerliga externa syntetiska kontroller konfigurerade. Vercels byggstatus och driftsloggar används vid release och felsökning.

## DNS vid första publiceringen

Porkbun har en ALIAS-post för `sigge.si` och en CNAME för `www.sigge.si`, båda till `276345049d2bb2c5.vercel-dns-016.com`, TTL 600. Detta var projektets rekommenderade mål vid publiceringen; hämta aktuell konfiguration före framtida ändringar. Övriga poster lämnades kvar. Vercel hanterar TLS och omdirigerar www till huvudadressen.

## Skrivverkstad och åtkomst

`npm run build` bygger `client/studio.js` till `public/studio-app.js`. Den genererade filen är ignorerad och måste byggas vid release. Den inkluderas uttryckligen i Vercel-funktionen och har en sendFile-rutt; kontrollera alltid /studio-app.js över HTTPS eftersom lyckat bygge inte bevisar att den genererade filen finns i drift. Brief och skrivunderlag behandlas i webbläsaren. Konton väntar på beslut; appen behöver inga autentiserings-, databas-, modell- eller e-posthemligheter. Den lokala AI-utvärderingen ingår inte i HTTP-rutterna.

Resend-domänen sigge.si verifierades med DKIM och de tre SPF/returvägsposter som leverantören begärde. Den planerade avsändaren är Sigge <hej@sigge.si>. Verifierad domän är inte ett genomfört leveranstest. Ingen publik funktion skickar e-post i denna release.
