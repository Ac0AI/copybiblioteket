# Copybiblioteket

[sigge.si](https://sigge.si) – ramverk, exempel och källor för tydligare copy på svenska och engelska.

En tvåspråkig skrivverkstad, 59 personprofiler och elva ramverk i ett fristående Git-repo. Ramverken omfattar Hormozi, Cialdini, Schwartz, Dunford, Jobs to Be Done, Wiebe, Fogg, AIDA/PAS/BAB, Hopkins, Ogilvy och svensk klarspråksbearbetning. Ramverken har egna tillämpningar, frågor och fiktiva exempel på båda språken. Varumärkets röst styr skrivandet.

Webben hjälper dig välja ramverk och kopiera ett komplett skrivunderlag till din AI-chatt. Själva skrivandet sker i din AI-klient, gärna med [Copy Operator](skills/copy-operator/SKILL.md). Den publika sajten har inga konton eller någon databas. AI-skrivning direkt på sajten är avstängd medan åtkomst väntar på beslut. En tvåstegsskrivare med Vercel AI Gateway finns för lokala tester i `copy/studio.ts`; den nås inte från webben.

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

Namnet `copy-brains` behålls för befintliga klientkopplingar. MCP kör lokalt via stdio; webbservern behöver inte vara igång. En ny chatt kan behövas efter registrering.

Kopiera `skills/copy-operator` till din skill-katalog. Bevara egna ändringar om skillen redan finns. Lägg en lokal, ignorerad `copy-brains.local.json` i den installerade skillen med `repoPath` som pekar på denna checkout. Alternativt används `COPY_BRAINS_REPO`. Skillens hjälpskript fungerar även när MCP inte är tillgängligt.

| Verktyg | Funktion |
| --- | --- |
| `list_copy_frameworks` | Lista ramverken |
| `search_copy_knowledge` | Hitta tillämpningar på valt språk |
| `get_copy_framework` | Läs ramverk, exempel och källor |
| `search_copy_sources` | Hitta originalkällor med egna beskrivningar |
| `get_swedish_writing_guide` | Hämta den svenska skrivguiden (kompatibilitet) |
| `get_writing_guide` | Hämta svensk eller engelsk skrivguide |
| `list_copy_people` | Lista alla 59 profiler |
| `search_copy_people` | Hitta perspektiv efter namn eller ämne |
| `get_copy_person` | Läs tillämpningar och källhänvisningar |

Ange `language: "en"` för engelska svar i MCP; svenska är standard. `get_swedish_writing_guide` ger alltid svenska. CLI och skillens hjälpskript kan köras med `COPY_BRAINS_LANGUAGE=en`.

Verktygen är läsande och gör inga externa API-anrop. Biblioteket sparar inte frågorna. Din AI-klients datahantering gäller separat. Webbhotellet behandlar normala trafikuppgifter; det finns ingen egen analys- eller spårningskod i appen.

## Valfria lokala fördjupningskällor

En befintlig lokal samling från The Brains kan användas genom `COPY_BRAINS_SOURCE_DIR`, som pekar på dess `data/brains`-katalog. Alla tillgängliga index för de 59 personerna läses. Saknade personindex faller tillbaka till de svenska profilernas källänkar. Skillens lokala konfiguration accepterar också `sourceDirectory`.

Utan denna inställning fungerar hela biblioteket fristående. Källsökningen visar egna svenska beskrivningar och länkar till originalen. Med samlingen aktiverad lokalt visas ärvda engelska avsnitt med tydlig proveniens. Den publika startpunkten `app.ts` laddar alltid endast de egna ramverken, personprofilerna och källänkarna, oavsett miljövariabler.

Samlingen distribueras inte i detta repo och laddas inte ner automatiskt. Ursprungskällornas språk bestämmer inte sluttextens ton. Använd [skrivguiden](skills/copy-operator/references/swedish.md) och skriv direkt på svenska utifrån mottagare, situation och varumärke.

## Utveckling och drift

```sh
npm run build
```

Det kör TypeScript-kontroll, tester av sökning, profiler, skrivunderlag, HTTP och en riktig MCP-klient samt bygger webbläsarkoden. Sidmallarna ligger i `client/pages/`, språktexterna i `client/messages.js` och webbläsarkoden i `client/`. Bygget skapar svenska och engelska HTML-sidor och JS-paket i `public/`; redigera källorna, inte de genererade filerna. Ramverken finns i `data/copy-frameworks/`, profilerna i `data/people/` och fullständiga engelska tillämpningar i `data/translations/en/`. Bygget stoppar om katalogöversättningar saknas. `app.ts` exporterar Express-appen för Vercel. `vercel.json` anger byggkontroll, inkluderade datafiler och säkerhetsheaders. Inga hemligheter krävs för appen.

[Driftinstruktioner](docs/deployment.md), [ramverksurval och research](docs/framework-research.md), [skrivprov](examples/svenska-copyprov.md) och [valideringens gränser](docs/validation.md).

## Ursprung och licens

Detta är ett självständigt repo byggt från vårt tidigare experiment [Ac0AI/copy-brains](https://github.com/Ac0AI/copy-brains), commit `ff5094a6844d3bc4ca23eb14ca57cea58531cb7e`. Sökningen och den valfria lokala källaddaren bygger på [VicPitic/the-brains](https://github.com/VicPitic/the-brains). Dess MIT-notis finns kvar i [LICENSE](LICENSE).

Upstreams webbapp, kontosystem, e-postkod, databas och textsamlingar ingår inte. Alla 59 profiler finns med som egna svenska tillämpningar, med källhänvisningar ärvda från katalogen. Hänvisningarna är inte självständigt granskade mot hela originalen. Våra ramverkskort, svenska exempel, webbgränssnitt och skill är egna tillämpningar. Detta är inte författarnas officiella tjänst och innebär inget godkännande från dem.

## Content and takedowns

Kod och egna tillämpningar är MIT-licensierade. Licensen omfattar inte de externa originalverk som källänkarna pekar på. Rapportera rättelser eller rättighetsfrågor via [repots issues](https://github.com/Ac0AI/copybiblioteket/issues). Fiktiva exempel är inte kundbevis; ramverken innebär ingen garanti om konvertering.

## Skrivverkstaden utan konto

Börja med uppgift, mottagare och fakta. Under **Fler inställningar** finns textens språk, format, röstprov och personval. **Skapa skrivunderlag** sammanställer brief, högst tre ramverk, högst tre personperspektiv och skrivguiden för valt språk i webbläsaren. Kopiera det till din AI-chatt. Befintlig text kan bearbetas med ett separat ändringsunderlag. Textredigering, nedladdning och frivillig lokal lagring fungerar utan konto.

**Fakta och villkor i en brief skickas inte till ett API av den publika skrivverkstaden.** Biblioteket laddas via läsande API:er. Kopiering till en annan AI-tjänst är användarens eget steg. Field Notes länkas till AC0:s befintliga engelska brev; ingen prenumeration läggs till automatiskt.

[Svenska](https://sigge.si/) och [English](https://sigge.si/en/) har egna adresser för alla tre sidor. Språkbytet sker på plats och behåller pågående arbete. Textens språk går att välja separat; utan ett uttryckligt val följer det gränssnittet. Lokal lagring är alltid frivillig. Exempelanteckningar är kommentarer till ett färdigskrivet, fiktivt exempel och granskar inte användarens text.

Läsande API:er väljer språk med `?lang=en` eller `?lang=sv`. Kategori- och person-id:n är stabila mellan språken.

## Lokal AI-utvärdering

`node --env-file=.env.local --import tsx copy/evaluate.ts [case-id]` kör de fiktiva briefarna i `evaluations/briefs.json`. Kräver projektspecifik Vercel OIDC eller en uttryckligen konfigurerad AI Gateway-nyckel. Default är `openai/gpt-5.2`; `SIGGE_MODEL` kan ändra modell. Resultat skrivs lokalt till ignorerade `evaluations/results/`. Varje skrivomgång gör ett skrivar- och ett redaktörsanrop. Detta är modellgranskning, inte oberoende faktakontroll.
