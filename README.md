# Copybiblioteket

[sigge.si](https://sigge.si) – ramverk, svenska exempel och källor för tydligare copy.

Ett fristående Git-repo med elva ramverk: Hormozi, Cialdini, Schwartz, Dunford, Jobs to Be Done, Wiebe, Fogg, AIDA/PAS/BAB, Hopkins, Ogilvy och svensk klarspråksbearbetning. Ramverken har egna svenska tillämpningar, frågor och fiktiva exempel. Varumärkets röst styr skrivandet.

Webben hjälper dig välja ramverk och kopiera ett komplett skrivunderlag till din AI-chatt. Själva skrivandet sker i din AI-klient, gärna med [Copy Operator](skills/copy-operator/SKILL.md). Sajten har ingen egen språkmodell, kontohantering eller databas.

## Kör lokalt

Node.js 24 rekommenderas.

```sh
npm ci --ignore-scripts
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
| `search_copy_knowledge` | Hitta svenska tillämpningar |
| `get_copy_framework` | Läs ramverk, exempel och källor |
| `search_copy_sources` | Hitta originalkällor med egna beskrivningar |
| `get_swedish_writing_guide` | Hämta skrivguiden |

Verktygen är läsande och gör inga externa API-anrop. Biblioteket sparar inte frågorna. Din AI-klients datahantering gäller separat. Webbhotellet behandlar normala trafikuppgifter; det finns ingen egen analys- eller spårningskod i appen.

## Valfria lokala fördjupningskällor

En befintlig lokal samling från The Brains kan användas genom `COPY_BRAINS_SOURCE_DIR`, som pekar på dess `data/brains`-katalog. Den måste innehålla index för `alex-hormozi` och `corey-haines`. Skillens lokala konfiguration accepterar också `sourceDirectory`.

Utan denna inställning fungerar hela biblioteket fristående. Källsökningen visar egna svenska beskrivningar och länkar till originalen. Med samlingen aktiverad lokalt visas ärvda engelska avsnitt med tydlig proveniens. Den publika startpunkten `app.ts` laddar alltid endast de egna ramverken och källänkarna, oavsett miljövariabler.

Samlingen distribueras inte i detta repo och laddas inte ner automatiskt. Ursprungskällornas språk bestämmer inte sluttextens ton. Använd [skrivguiden](skills/copy-operator/references/swedish.md) och skriv direkt på svenska utifrån mottagare, situation och varumärke.

## Utveckling och drift

```sh
npm run build
```

Det kör TypeScript-kontroll och tester av sökning, källor, HTTP och en riktig MCP-klient. Webbgränssnittet ligger i `public/`, ramverken i `data/copy-frameworks/`. `app.ts` exporterar Express-appen för Vercel. `vercel.json` anger byggkontroll, inkluderade datafiler och säkerhetsheaders. Inga hemligheter krävs för appen.

[Driftinstruktioner](docs/deployment.md), [ramverksurval och research](docs/framework-research.md), [skrivprov](examples/svenska-copyprov.md) och [valideringens gränser](docs/validation.md).

## Ursprung och licens

Detta är ett självständigt repo byggt från vårt tidigare experiment [Ac0AI/copy-brains](https://github.com/Ac0AI/copy-brains), commit `ff5094a6844d3bc4ca23eb14ca57cea58531cb7e`. Sökningen och den valfria lokala källaddaren bygger på [VicPitic/the-brains](https://github.com/VicPitic/the-brains). Dess MIT-notis finns kvar i [LICENSE](LICENSE).

Upstreams webbapp, kontosystem, e-postkod, databas och textsamlingar ingår inte. Våra ramverkskort, svenska exempel, webbgränssnitt och skill är egna tillämpningar. Detta är inte författarnas officiella tjänst och innebär inget godkännande från dem.

## Content and takedowns

Kod och egna tillämpningar är MIT-licensierade. Licensen omfattar inte de externa originalverk som källänkarna pekar på. Rapportera rättelser eller rättighetsfrågor via [repots issues](https://github.com/Ac0AI/copybiblioteket/issues). Fiktiva exempel är inte kundbevis; ramverken innebär ingen garanti om konvertering.
