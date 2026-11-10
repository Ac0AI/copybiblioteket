# Drift på sigge.si

- GitHub: `Ac0AI/sigge` (hette `Ac0AI/copybiblioteket` till november 2026), fristående repo.
- Vercel-team: `ac0` (AC0 AI SL).
- Vercel-projekt: `copybiblioteket`.
- Produktion: `https://sigge.si`.
- Domänregistrering och auktoritativ DNS: Porkbun.

## Release

1. Kör `npm ci --ignore-scripts` och `npm run build`.
2. Granska diffen och publicera den avsedda committen till GitHub.
3. Vercels Git-koppling bygger produktion från `main`. Samma kontroller körs i Vercels build, så ett testfel stoppar bygget.
4. Verifiera `/`, `/library`, `/people` och motsvarande adresser under `/en/`, `/api/health`, `/api/people`, en sökning och en källänk över HTTPS. Kontrollera att `/api/write` fortfarande ger 503. Kontrollera sidan i webbläsare. Verifiera också `/connect`, `/en/connect` och en verklig MCP-anslutning till `https://sigge.si/mcp` utan inloggning.

För en manuell första release eller felsökning, välj alltid teamet `ac0` och projektet `copybiblioteket`. Gissa inte domänens DNS-mål; hämta rekommenderade värden från Vercels domänkonfiguration. Uppdatera endast avsedda webbposter hos Porkbun.

## Innehåll och data

`public/` serveras som statiska filer. Startsidan har en explicit Express-rutt med `sendFile`, eftersom Vercels Express-adapter inte serverar katalogindex genom `express.static`. [Vercels Express-dokumentation](https://vercel.com/docs/frameworks/backend/express#serving-static-assets) anger att express.static ignoreras i drift. Express ger läsande API:er och POST `/api/search`. Sökningen använder ett litet BM25-index i minnet. Det finns inga konton och ingen databas. Det finns inga uppladdningar eller externa modellanrop. Sökfrågor placeras inte i URL:en och sparas inte av applikationen.

`app.ts` stänger uttryckligen av den valfria lokala, ärvda textsamlingen. Bara egna ramverk, de 59 personprofilerna på svenska och engelska och källänkar publiceras. Installerad skill och MCP kan använda en separat lokal samling. Lokal konfiguration, miljöfiler och maskinsökvägar ska inte checkas in.

## Kontroll och återställning

`GET /api/health` ska returnera `status: ok`, `frameworks: 13`, `people: 59`, `sourceMode: links`. Vid en dålig release: återställ till en tidigare verifierad produktionsdeployment med Vercels rollback, och kontrollera domänen igen. Efter rollback kan automatisk domäntilldelning behöva återaktiveras genom promotion.

Det finns inga kontinuerliga externa syntetiska kontroller konfigurerade. Vercels byggstatus och driftsloggar används vid release och felsökning.

## DNS vid första publiceringen

Porkbun har en ALIAS-post för `sigge.si` och en CNAME för `www.sigge.si`, båda till `276345049d2bb2c5.vercel-dns-016.com`, TTL 600. Detta var projektets rekommenderade mål vid publiceringen; hämta aktuell konfiguration före framtida ändringar. Övriga poster lämnades kvar. Vercel hanterar TLS och omdirigerar www till huvudadressen.

## Skrivverkstad och åtkomst

`npm run build` genererar HTML för båda språken från `client/pages/` och `client/messages.js`, samt fyra JS-paket för skrivverkstad, ramverk, profiler och anslutning. Alla genererade filer är ignorerade och måste byggas vid release. HTML, JS och engelska katalogdata inkluderas uttryckligen i Vercel-funktionen och sidor/paket har sendFile-rutter. Kontrollera skrivverkstad, bibliotek, profiler och anslutning på båda språken samt /studio-app.js, /library.js, /people.js och /connect.js över HTTPS eftersom ett lyckat bygge inte bevisar att filerna finns i drift. Jämför paketens SHA-256 med bygget. Brief och skrivunderlag behandlas i webbläsaren. Hela tjänsten fungerar utan hemligheter. Den lokala AI-utvärderingen ingår inte i HTTP-rutterna.

## Konton borttagna, 10 november 2026

Konton, inloggning med e-postkod och anmälan till Field Notes togs bort. `https://sigge.si/mcp` är öppen för alla, med en spärr per IP-adress i minnet (120 anrop per minut och instans). Klienter som anslöts under kontotiden fortsätter fungera: deras token ignoreras, och `/api/auth/oauth2/token` svarar på förnyelser.

Kvar att göra för ägaren efter utrullningen, eftersom det ligger utanför repot:

- Radera Turso-databasen `sigge`. Den innehåller e-postadresser från kontotiden, och integritetssidan säger att kontouppgifterna raderas.
- Ta bort miljövariablerna `SIGGE_ACCOUNTS_ENABLED`, `SIGGE_PUBLIC_URL`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY` och `RESEND_FIELD_NOTES_SEGMENT_ID` i Vercel. Koden läser dem inte längre.
- Återkalla Sigges nyckel hos Resend om den inte används till något annat.
