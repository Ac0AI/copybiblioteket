# Sigge

[sigge.si](https://sigge.si) – ramverk, exempel och källor för tydligare copy på svenska och engelska. En gratistjänst från [AC0](https://ac0.ai).

En tvåspråkig skrivverkstad, 59 personprofiler och tretton ramverk i ett fristående Git-repo. Ramverken omfattar Hormozi, Cialdini, James Clear (vanor), Peter Yangs no-ai-slop, Schwartz, Dunford, Jobs to Be Done, Wiebe, Fogg, AIDA/PAS/BAB, Hopkins, Ogilvy och svensk klarspråksbearbetning. Varje ramverk har principer, en tabell för att välja grepp efter läget, namngivna grepp med exempelrader, ett helt påhittat textexempel och vanliga misstag, på båda språken. De engelska exemplen är skrivna för amerikanska läsare, med egna påhittade företag och dollar, och är inte översättningar av de svenska. Varumärkets röst styr skrivandet.

Enklaste vägen är pluginet för Claude, Claude Code och Codex. Den som använder ChatGPT eller inte vill installera något lägger till adressen `https://sigge.si/mcp` i sin AI. Inget av det kräver konto eller inloggning. På webben kan du också skapa ett komplett skrivunderlag att klistra in i en AI-chatt och granska en text mot AI-floskler. Själva skrivandet sker alltid i din egen AI-klient. AI-skrivning direkt på sajten är avstängd. En tvåstegsskrivare med Vercel AI Gateway finns för lokala tester i `copy/studio.ts`; den nås inte från webben.

## Installera pluginet

Claude Code:

```
/plugin install sigge --marketplace Ac0AI/sigge
```

Claude på webben, i datorn och i Cowork: öppna Customize, välj Plugins och Add marketplace, och ange `Ac0AI/sigge`.

Codex:

```sh
codex plugin marketplace add Ac0AI/sigge
codex plugin add sigge@sigge
```

Pluginet ligger i [plugins/sigge](plugins/sigge) och har fem färdigheter: `brand` (sätt upp en varumärkesfil för företaget), `write` (skriv eller skriv om copy), `check` (hitta och stryk AI-floskler), `review` (granska en befintlig text) och `start` (kort introduktion). De tretton ramverken, skrivguiderna och flosklerkollen följer med. Pluginet ansluter också till `https://sigge.si/mcp`, som ger de 59 perspektiven, källsökningen och verktyget som väljer ramverk åt uppgiften. Se [pluginets README](plugins/sigge/README.md).

Det som avgör en text är det bara företaget vet: vad som säljs och på vilka villkor, vad kunden tvekar inför, vad kunder faktiskt har sagt och hur avsändaren låter. Därför frågar `write` efter det som saknas innan den skriver, bestämmer läsare, tvekan och svar före utkastet och går igenom utkastet som en redaktör innan du får det. `brand` samlar samma saker en gång i filen `sigge-brand.md`, som alla färdigheter läser sedan. Formatet står i [brand-file.md](plugins/sigge/skills/write/references/brand-file.md).

`plugins/sigge/skills/write/references/swedish.md` och `english.md` är skrivguidernas källa; servern läser dem därifrån. Ramverkssidorna, flosklerkollens skript och kopiorna i de andra färdigheterna genereras med `npm run build:plugin` från `data/copy-frameworks/` och `client/slop.js`. Redigera källorna, inte de genererade filerna. Ett test stoppar bygget om de inte stämmer överens.

## Design och filmer

Sidorna delar designsystemet i `public/site.css` (Fraunces och Inter, självhostade). Filmen om att installera Sigge och skriva en första text (startsidan och anslutningssidan, `client/pages/_film-connect.html`) byggs av vanliga DOM-scener i `client/film.js` och kan pausas; med reducerad rörelse visas stillbilder. MP4-versioner för delning finns i `public/media/`, till exempel [så funkar Sigge](https://sigge.si/media/sigge-sa-funkar-det.mp4) och [installera Sigge](https://sigge.si/media/sigge-anslut-din-ai.mp4). Filmen om installationen exporteras bildruta för bildruta med `scripts/export-film.mjs`.

Maskoten Sigge är en SVG-bläckplump i `client/pages/_mascot.html` som byggs in där `{{mascot}}` står i sidmallarna. Namnet är en kortform av Sigurd, Sigvard och Sigfrid (fornnordiska *sigr*, seger); se avsnittet Om namnet på startsidan.

Integritetspolicyn finns på [sigge.si/privacy](https://sigge.si/privacy). Sigge har inga konton.

## Kör lokalt

Node.js 24 rekommenderas.

```sh
npm ci --ignore-scripts
npm run build
npm start
```

Öppna http://127.0.0.1:8813. Ändra port med `COPY_BRAINS_PORT`.

```sh
npm run search -- search "kunden tycker att priset är för högt"
npm run search -- sources "kundomdömen och förtroende"
npm run search -- get cialdini-persuasion
npm run search -- guide
```

## Anslut din AI-klient

Kör från repots rot:

```sh
codex mcp add copy-brains -- node "$PWD/node_modules/tsx/dist/cli.mjs" "$PWD/copy/mcp.ts"
```

Namnet `copy-brains` behålls för befintliga klientkopplingar. Detta kommando kör MCP lokalt via stdio; webbservern behöver inte vara igång. Den publika adressen är https://sigge.si/mcp och kräver ingen inloggning, se `/connect`. En ny chatt kan behövas efter registrering.

| Verktyg | Funktion |
| --- | --- |
| `get_writing_kit` | Börja här: vad som ska frågas före utkastet, arbetsordning, högst tre ramverk, kanalråd och skrivguide i ett svar |
| `get_brand_file` | Sätt upp en varumärkesfil: intervjufrågorna och filens format |
| `list_copy_frameworks` | Lista ramverken |
| `search_copy_knowledge` | Hitta tillämpningar på valt språk |
| `get_copy_framework` | Läs ramverk, exempel och källor |
| `search_copy_sources` | Hitta originalkällor med egna beskrivningar |
| `get_swedish_writing_guide` | Hämta den svenska skrivguiden (kompatibilitet) |
| `get_writing_guide` | Hämta svensk eller engelsk skrivguide |
| `list_copy_people` | Lista alla 59 profiler |
| `search_copy_people` | Hitta perspektiv efter namn eller ämne |
| `get_copy_person` | Läs tillämpningar och källhänvisningar |
| `check_ai_patterns` | Granska en text mot vanliga AI-mönster, med citat och förslag |

Ange `language: "en"` för engelska svar i MCP; svenska är standard. `get_swedish_writing_guide` ger alltid svenska. CLI kan köras med `COPY_BRAINS_LANGUAGE=en`. Servern har också två färdiga prompter, `write` och `check`, för klienter som visar MCP-prompter.

Alla verktyg är läsande och anropar ingen språkmodell; `check_ai_patterns` kör samma mönsterkoll som webben. Den publika adressen är öppen för alla och har en spärr per IP-adress mot överbelastning. Biblioteket sparar inte frågorna. Din AI-klients datahantering gäller separat. Webbhotellet behandlar normala trafikuppgifter; det finns ingen egen analys- eller spårningskod i appen.

## Valfria lokala fördjupningskällor

En befintlig lokal samling från The Brains kan användas genom `COPY_BRAINS_SOURCE_DIR`, som pekar på dess `data/brains`-katalog. Alla tillgängliga index för de 59 personerna läses. Saknade personindex faller tillbaka till de svenska profilernas källänkar. 

Utan denna inställning fungerar hela biblioteket fristående. Källsökningen visar egna svenska beskrivningar och länkar till originalen. Med samlingen aktiverad lokalt visas ärvda engelska avsnitt med tydlig proveniens. Den publika startpunkten `app.ts` laddar alltid endast de egna ramverken, personprofilerna och källänkarna, oavsett miljövariabler.

Samlingen distribueras inte i detta repo och laddas inte ner automatiskt. Ursprungskällornas språk bestämmer inte sluttextens ton. Använd [skrivguiden](plugins/sigge/skills/write/references/swedish.md) och skriv direkt på svenska utifrån mottagare, situation och varumärke.

## Utveckling och drift

```sh
npm run build
```

Det kör TypeScript-kontroll, tester av sökning, profiler, skrivunderlag, HTTP och en riktig MCP-klient samt bygger webbläsarkoden. Sidmallarna ligger i `client/pages/`, språktexterna i `client/messages.js` och webbläsarkoden i `client/`. Bygget skapar svenska och engelska HTML-sidor och JS-paket i `public/`; redigera källorna, inte de genererade filerna. Ramverken finns i `data/copy-frameworks/`, profilerna i `data/people/` och fullständiga engelska tillämpningar i `data/translations/en/`. Bygget stoppar om katalogöversättningar saknas. `app.ts` exporterar Express-appen för Vercel. `vercel.json` anger byggkontroll, inkluderade datafiler och säkerhetsheaders. Hela tjänsten fungerar utan hemligheter och utan databas.

[Driftinstruktioner](docs/deployment.md), [ramverksurval och research](docs/framework-research.md), [skrivprov](examples/svenska-copyprov.md) och [valideringens gränser](docs/validation.md).

## Ursprung och licens

Detta är ett självständigt repo byggt från vårt tidigare experiment [Ac0AI/copy-brains](https://github.com/Ac0AI/copy-brains), commit `ff5094a6844d3bc4ca23eb14ca57cea58531cb7e`. Sökningen och den valfria lokala källaddaren bygger på [VicPitic/the-brains](https://github.com/VicPitic/the-brains). Dess MIT-notis finns kvar i [LICENSE](LICENSE).

Upstreams webbapp, kontosystem, e-postkod, databas och textsamlingar ingår inte. Alla 59 profiler finns med som egna svenska tillämpningar, med källhänvisningar ärvda från katalogen. Hänvisningarna är inte självständigt granskade mot hela originalen. Våra ramverkskort, svenska exempel, webbgränssnitt och plugin är egna tillämpningar. Detta är inte författarnas officiella tjänst och innebär inget godkännande från dem.

## Content and takedowns

Kod och egna tillämpningar är MIT-licensierade. Licensen omfattar inte de externa originalverk som källänkarna pekar på. Rapportera rättelser eller rättighetsfrågor via [repots issues](https://github.com/Ac0AI/sigge/issues). Fiktiva exempel är inte kundbevis; ramverken innebär ingen garanti om konvertering.

## Skrivverkstaden på webben

Börja med uppgift, mottagare och fakta. Under **Fler inställningar** finns textens språk, format, röstprov och personval. **Skapa skrivunderlag** sammanställer brief, högst tre ramverk, högst tre personperspektiv och skrivguiden för valt språk i webbläsaren. Kopiera det till din AI-chatt. Befintlig text kan bearbetas med ett separat ändringsunderlag. Textredigering, nedladdning och frivillig lokal lagring fungerar utan konto.

**Fakta och villkor i en brief skickas inte till ett API av den publika skrivverkstaden.** Biblioteket laddas via läsande API:er. Kopiering till en annan AI-tjänst är användarens eget steg.

[Svenska](https://sigge.si/) och [English](https://sigge.si/en/) har egna adresser för skrivverkstad, ramverk, profiler och anslutning. Språkbytet sker på plats och behåller pågående arbete. Textens språk går att välja separat; utan ett uttryckligt val följer det gränssnittet. Lokal lagring är alltid frivillig. Exempelanteckningar är kommentarer till ett färdigskrivet, fiktivt exempel och granskar inte användarens text.

Läsande API:er väljer språk med `?lang=en` eller `?lang=sv`. Kategori- och person-id:n är stabila mellan språken.

## Jämförelse med och utan Sigge

`evaluations/compare` spelar upp sex uppgifter som samtal mellan en skribent och en simulerad företagare som vet mer än den säger, och låter en domare jämföra texterna parvis utan att veta vilken version som skrev vilken. Se [README:n där](evaluations/compare/README.md) och resultaten i [docs/validation.md](docs/validation.md). Kör den efter ändringar i färdigheterna, skrivkitet eller skrivguiderna. Den kräver Claude Code och kostar pengar per körning.

## Lokal AI-utvärdering

`node --env-file=.env.local --import tsx copy/evaluate.ts [case-id]` kör de fiktiva briefarna i `evaluations/briefs.json`. Kräver projektspecifik Vercel OIDC eller en uttryckligen konfigurerad AI Gateway-nyckel. Default är `openai/gpt-5.2`; `SIGGE_MODEL` kan ändra modell. Resultat skrivs lokalt till ignorerade `evaluations/results/`. Varje skrivomgång gör ett skrivar- och ett redaktörsanrop. Detta är modellgranskning, inte oberoende faktakontroll.
