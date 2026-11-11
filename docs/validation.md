# Validering

28 oktober 2026, tvåspråkig skrivverkstad och 59 profiler.

## Automatiska kontroller

- `npm run build`: TypeScript-kontroll, 35 tester och paketering av webbläsarkoden.
- Alla 59 profilidentiteter är unika och matchar det importerade originalets katalog. Profilerna har HTTPS-källänkar och uttrycklig proveniens. Sökning på varje exakt namn ger rätt person först.
- Svenska och engelska sökfrågor, källhänvisningar, svenska tecken, tomma träffar, indatagränser och HTTP testas.
- Skrivunderlag bevarar fakta, villkor, röstprov och ändringsinstruktioner. Ett uttryckligt personval gäller före automatiskt urval, som begränsas till tre profiler och utesluter kategorin Fördjupning.
- En riktig MCP-klient startar stdio-servern från en annan arbetskatalog, upptäcker nio verktyg och läser ramverk, profiler och källor.
- Produktionsstarten använder endast egna tillämpningar och källänkar även om en lokal textsamling anges i miljön. HTTP kan inte anropa AI. Konto- och prenumerationsrutter är avstängda när kontokonfiguration saknas.
- Lokala AI-tester använder simulerad gateway för skrivar-/redaktörsordning, felhantering, faktareferenser och obligatoriska formuleringar. Strängkontroller kan inte avgöra om varje påstående faktiskt följer av sitt underlag.
- Den lokala källsamlingen innehåller 58 läsbara fördjupningsindex för katalogens 59 profiler. Profiler utan index använder egna svenska tillämpningar och ärvda källänkar.
- Installerad Copy Operator är strukturellt validerad och dess CLI-hjälpare har kontrollerats mot personbiblioteket. Detta bevisar inte språklig kvalitet.

## Tvåspråkigt flöde

- Alla 59 profiler och 11 ramverk finns på engelska, med oförändrade id:n, källor och proveniens.
- Tester kontrollerar engelskt underlag och ändringsunderlag, bevarade valutor och exakta villkor, språkmatchning för skrivguide, HTML för de sex innehållsadresserna och avstängda AI-rutter. Kontotester kontrollerar även anslutnings- och godkännandesidorna på båda språken.
- I webbläsaren har språkbyte med ifylld brief, engelskt exempel, faktisk kopiering till webbläsarens urklipp, återförd text, ändringsunderlag och val av svensk text i engelskt gränssnitt kontrollerats. Frivillig lagring återställde text, språk och personval efter omladdning.
- Engelska ramverk kunde sökas, kopieras och läsas. Justin Welsh kunde väljas i engelska personbiblioteket och följas till rätt språk och personval i skrivverkstaden.
- Mobilbredd 390 × 844 kontrollerades med webbläsaremulering. Ingen horisontell överströmning; skrivunderlag, dialog, återförd text och nedladdning fungerade. Fysisk mobil är inte testad.
- Ingen ny modellutvärdering har körts för denna UI- och språkändring.

## Lokala skrivprov

Sex fiktiva briefar finns i evaluations/briefs.json: varm bokföringscopy, teknisk B2B, lekfull konsumenttext, saknade belägg, bearbetning med exakta villkor och ett röstprov som innehåller ogrundade resultatpåståenden. GPT-5.2 kördes med skrivar- och redaktörssteg. Resultaten sparas lokalt i den ignorerade evaluations/results-katalogen.

Första omgången tog 17–29 sekunder per brief. Den behöll obligatoriska formuleringar och undvek att överföra röstprovets kundresultat till det nya erbjudandet. Granskningen hittade också svagheter: kopierade stilprov, påhittade detaljer om ett första samtal och fler följdfrågor än uppgiften krävde. Instruktionerna har därför skärpts. Två nya körningar (17 respektive 25 sekunder) visade fortfarande ordagrann återanvändning av ett stilprov och för långtgående tolkning av ett tekniskt röstprov. Den lokala AI-skrivaren är därför fortsatt en utvärderingsdel, inte en verifierad publik skrivfunktion. Noll automatiska varningar är inte bevis för korrekt eller bra copy. Exemplen kräver mänsklig redigering.

## Webbläsarkontroll lokalt

Profilen Justin Welsh kunde öppnas, väljas och följas till skrivverkstaden. Valet, briefen, prisvillkoren och skrivguiden finns i det skapade underlaget. Kopieringsknappen visar lyckat besked; kopiering till ett annat program är inte verifierad. Frivillig lagring återställde brief och text efter omladdning. Börja om, versionsåterställning och radering av lokalt sparat testarbete fungerade. Separat fysisk mobilkontroll är inte utförd.

## Publicering

Commit 461b63270a06f979fdea06d76738457099043669 publicerades på sigge.si och verifierades över HTTPS 27 oktober 2026 kl. 22:02 UTC. [GitHub-kontrollen](https://github.com/Ac0AI/copybiblioteket/actions/runs/40591542705) passerade. 25 HTTP-kontroller verifierade startsidan, båda biblioteken, 59 profiler, skrivunderlaget, sökning, rätt JavaScript-bundle, statiska filer, interna filers otillgänglighet och de avstängda skriv-/kontorutterna. www omdirigerade till huvudadressen. Inga error/fatal-loggar hittades för deploymenten i det kontrollerade tiominutersfönstret. Detta är en releasekontroll, inte kontinuerlig övervakning.

Förhandskontrollen fångade att det genererade JavaScript-paketet saknades i drift. Filen inkluderas och serveras nu uttryckligen, och livefilens SHA-256 matchade det lokala bygget. Webbläsaren visade 59 av 59 profiler. Kontroll av snabb användning efter navigation ledde också till att perspektivval och skrivknapp väntar tills biblioteket är inläst. Ingen brief skickas till servern.

## Begränsningar

Ingen jämförelse med Hormozis egen AI eller mätning av konverteringseffekt har gjorts. Begreppssökning är inte generell semantisk förståelse. Personprofilerna är våra svenska tillämpningar; alla ärvda källor har inte granskats mot originalen. Den valfria lokala textsamlingen ingår inte i publik drift.

Sajten skapar skrivunderlag och erbjuder en redigeringsyta. Den skriver inte färdig copy med en inbyggd modell. Konton och frivillig Field Notes-prenumeration är aktiverade på sigge.si och verifierade med en disponibel testadress. Ingen automatisk prenumeration eller offentlig modellåtkomst är aktiverad.

## Konton och publik MCP, 28 oktober 2026

Lokala tester med separata SQLite-filer och simulerade leverantörer kontrollerar e-postägarskap, hashad engångskod, utgången kod, låsning efter felaktiga försök, rate limits, CSRF, samtycke och fel från mejl-/prenumerationsleverantören. Ett faktiskt HTTP/OAuth-flöde testar discovery, DCR, S256 PKCE, manipulerad callback, engångsbyte av kod, tokenförnyelse och omedelbar återkallning. En riktig MCP SDK-klient hämtar nio verktyg och skrivguiden på båda språken.

I webbläsaren testades registrering, språkbyte, faktisk kopiering av MCP-adressen, utloggning och godkännande av en lokal testklient. Koden från webbläsarflödet växlades till en fungerande MCP-token. Återkallning fungerade också i gränssnittet. Mobilbredd 390 × 844 kontrollerades utan horisontell överströmning. Testmejl och prenumerationer simulerades lokalt.

Commit `c470036187562df1f0343b8965db2f8f54e06eb2` publicerades till sigge.si via PR #3 den 28 oktober 2026. Turso-databasen `sigge` ligger i Frankfurt och dess schema validerades efter migrering. Produktionsvariabler är krypterade i Vercel; Resend har en separat Sigge-nyckel.

Livekontrollen genomförde e-postinloggning i webbläsaren, godkännande av en registrerad testklient, kodbyte, tokenförnyelse och upptäckt av nio MCP-verktyg. En riktig MCP SDK-klient hämtade listan med 59 profiler och skrivråd på båda språken. Återkallning i kontosidan gav omedelbart 401 för MCP och 400 för förnyelse. Utloggning, engelskt gränssnitt och mobilbredd kontrollerades också.

Resends skickade post hade rätt avsändare, mottagare och ämne. Testet använde en märkt `delivered@resend.dev`-adress: leverantörens leveransstatus är simulerad och bevisar inte leverans till en vanlig inkorg. Kontot gav ingen Field Notes-kontakt före tillval. Efter ett uttryckligt tillval verifierades kontakt, befintligt segment och sparat samtycke hos de riktiga leverantörerna. Testkontot, testklienten och testkontakten togs bort efteråt.

Detta bevisar tjänstens publicerade protokollflöde. Anslutning från användarens faktiska Claude Code- eller ChatGPT-konto är inte provad. Tillgängligheten där beror även på klientens konto- och arbetsyteinställningar.

## Plugin, skrivkit och borttagna konton, 10 november 2026

Samma dag togs konton, inloggning med e-postkod och Field Notes-anmälan bort. Avsnitten ovan om konton, OAuth och Field Notes beskriver läget före det och gäller inte längre.

Pluginet i `plugins/sigge` har fyra färdigheter. `npm run build` kör alla tester. De nya kontrollerar att pluginets genererade filer stämmer med `data/copy-frameworks` och `client/slop.js`, att de tre manifesten beskriver samma plugin, att varje färdighet bara använder `name` och `description` och att alla länkade filer finns, och att det medföljande skriptet hittar samma mönster som webben och MCP-verktyget. `claude plugin validate` (Claude Code 2.1.322) godkände både marketplace-filen och pluginet med `--strict`.

Den öppna adressen testas med en riktig MCP-klient över HTTP utan inloggning: elva verktyg, skrivkit och 59 profiler. Testerna visar också att en klient med gammal token fortsätter fungera, att en tokenförnyelse får svar, att ingen OAuth-discovery finns kvar och att spärren ger 429 efter gränsen utan att påverka andra adresser. Spärren ligger i minnet per instans och är inget skydd mot en bred attack.

Fyra riktiga körningar gjordes i Claude Code med pluginet laddat från katalogen, innan kontona togs bort: en svensk landningssida (`write`), en flosklerkoll på svenska (`check`), en granskning av ett engelskt säljmejl (`review`) och ett engelskt mejl via den lokala MCP-servern utan plugin. Rätt färdighet valdes varje gång, flosklerkollen kördes innan svaret och MCP-körningen gick `get_writing_kit` följt av `check_ai_patterns`. Körningarna tog 17–35 sekunder. Det här visar att flödet fungerar, inte att texterna är bra: fyra körningar är för få för att säga något om kvalitet, och ingen läsare utanför projektet har bedömt dem.

Inte provat: installation från GitHub (kräver att ändringen ligger på huvudgrenen och att repot heter `Ac0AI/sigge`), Claude på webben och i Cowork, Codex och ChatGPT. Manifesten för Codex och ChatGPT följer OpenAI:s dokumentation från 10 november 2026 men har inte lästs in av någon OpenAI-klient. Att befintliga anslutningar i Claude och ChatGPT överlever borttagningen av inloggningen är testat med en SDK-klient, inte med de riktiga apparna. Filmerna i `public/media` visar fortfarande inloggningssteget.

## Fördjupade ramverk och ny film, 10 november 2026

Nyhetsbrevsramverket 3-2-1 togs bort; dess adress leder nu till biblioteket. De tretton som är kvar fick en tabell för att välja grepp efter läget, sex eller sju namngivna grepp med en exempelrad var, ett helt påhittat textexempel och vanliga misstag, på svenska och engelska. Hopkins-kortet handlar nu om att ge skäl och pröva dem, inte bara om mätning. Perspektiv följer inte längre med automatiskt i skrivkitet, bara när användaren namnger en person.

`npm run build` kör 54 tester. De nya kontrollerar att båda språken har samma djup, att väljaren pekar på grepp som finns, att helexemplen är märkta som påhittade och behåller kronor, och att ramverkstexterna själva klarar Sigges flosklerkoll. Det sista hittade parvisa tankstreck i tjugo äldre texter, som nu är rättade.

Sakinnehållet är kontrollerat mot vad vi vet om originalen, inte mot de länkade källorna rad för rad. Det gäller särskilt Hormozis fyra garantityper, Schwartz marknadsmognad, Foggs tre slags uppmaningar, Clears vanestapling och Hopkins syn på prov och rubriker. Den engelska versionen är skriven från den svenska och granskad i urval.

En jämförelse gjordes med samma uppgift (en prissida för löneadministration, med en prisinvändning): med pluginet och verktyget, med pluginets medföljande filer, och helt utan Sigge. Texterna från de tre körningarna var ungefär lika bra. Körningarna med Sigge satte priset i rubriken, skilde på vad byrån gör och vad kunden gör, och listade antaganden som behöver kontrolleras. Körningen utan Sigge hade en pristabell som de andra saknade och ingen lista över antaganden. Ingen formulering eller uppgift ur ramverkens exempel läckte in i texterna. Det här är en uppgift och en modell; det visar inte att ramverken gör texterna bättre, och det visar inte motsatsen.

Filmen på start- och anslutningssidan har tre scener: installera pluginet, be om en text, och hur utkastet kollas innan läsaren ser det. Scenerna är kontrollerade i webbläsare i dator- och mobilbredd på båda språken. MP4-filerna `sigge-anslut-din-ai.mp4` och `sigge-connect-your-ai.mp4` är exporterade på nytt med `scripts/export-film.mjs` och har kvar det tidigare slutkortet. Filmen om skrivverkstaden är oförändrad.


## Fristående engelska, 10 november 2026

Den engelska katalogen var skriven från den svenska och hade svenska företag, kronor och svenska orter i exemplen. Exemplen i tolv ramverk är nu skrivna för amerikanska läsare, med egna påhittade företag, dollar och amerikanska orter. Kortet om att skriva svenska citerar fortfarande svensk text, eftersom det är vad det handlar om. Stavning, datum, klockslag och citattecken följer amerikansk engelska i ramverken, profilerna, skrivguiden och skrivverkstadens engelska exempel.

Två tester håller det på plats: de engelska exemplen får inte innehålla kronor, svenska företagsnamn eller svenska orter, och den engelska katalogen får inte innehålla brittisk stavning. Citattecknen konverterades med ett skript och kontrollerades för obalanserade par; åtta slumpvis valda meningar lästes.

De amerikanska sakuppgifterna i exemplen är påhittade men ska vara rimliga: en färja till Vineyard Haven på Martha’s Vineyard, kampanjpriser på internetabonnemang som löper ut, personnummer ersatt med Social Security-nummer vid finansiering. Ingen amerikansk läsare har granskat dem.

## Varumärkesfil, frågor före utkast och redigering, 11 november 2026

Jämförelsen från den 10 november visade att ramverken inte gjorde texterna märkbart bättre. Den jämförelsen var dessutom orättvis åt andra hållet: uppgiften sa åt skribenten att inte ställa frågor, och det är frågorna som visade sig göra skillnaden. Det som avgör en text är det bara företaget vet. Därför ändrades arbetsordningen: `write` och `get_writing_kit` frågar efter erbjudande, tvivel, belägg och röst innan första utkastet, bestämmer läsare, tvivel och svar före skrivandet och redigerar utkastet som en redaktör. Färdigheten `brand` och verktyget `get_brand_file` samlar samma saker en gång i `sigge-brand.md`. Pluginet har nu fem färdigheter och servern tolv verktyg.

### Hur det mättes

`evaluations/compare` spelar upp sex uppgifter som samtal: fyra svenska (landningssida för en städfirma, säljmejl för en fakturatjänst, omskrivning av en floskeltext för en cykelverkstad, LinkedIn-inlägg för en byrå) och två amerikanska (landningssida för ett påminnelseverktyg för tandläkare, välkomstmejl för en budgetapp). Varje uppgift är en kort förfrågan, så som folk skriver, plus det ägaren vet men inte har sagt: priser, gränser, kundomdömen ordagrant och hur ägaren själv skriver. En simulerad ägare svarar på frågor ur den kunskapen, rättar fel och säger inget självmant. Alla versioner får samma avslutande begäran om den färdiga texten.

En domare (en starkare modell än skribenten) jämför texterna två och två utan att veta vilken version som skrev vilken, två gånger med omvänd ordning. En version vinner en uppgift bara om båda ordningarna är överens. Domaren får veta vad ägaren vet och listar varje uppgift i texten som saknar stöd där.

### Resultat

Skribent `sonnet`, domare `opus`, sex uppgifter, slutlig version av färdigheterna.

| Jämförelse | Vinster | Påhittade uppgifter per text |
| --- | --- | --- |
| Ny Sigge mot ingen Sigge | 6–0 | 0–3 mot 2–11 |
| Ny Sigge mot Sigge från den 10 november | 5–0, en oavgjord | 0–2 mot 0–7 |
| Ny Sigge med varumärkesfil mot ingen Sigge | 6–0 | 0–1 mot 2–9 |
| Ny Sigge med varumärkesfil mot Sigge från den 10 november | 6–0 | 0–1 mot 0–6 |
| Otålig ägare som vägrar svara på frågor: ny Sigge mot ingen Sigge | 6–0 | 0–1 mot 0–14 |
| Starkare skribent (`opus`), tre uppgifter: ny Sigge mot ingen Sigge | 3–0 | 2–5 mot 4–16 |

Domarens betyg (1–5, medel över uppgifterna) för ny Sigge mot ingen Sigge: svarar på läsarens tvivel 4,6 mot 2,8, konkret 4,9 mot 2,9, trovärdig 4,8 mot 3,0, låter som avsändaren 4,8 mot 2,0, naturligt språk 4,0 mot 2,4. Raderna med varumärkesfil och raden med starkare skribent kommer från körningar före de sista justeringarna; de övriga från den slutliga versionen.

Sigge från den 10 november slog ingen Sigge i fyra av sex uppgifter. Vinsten med den nya versionen kommer alltså mest från frågorna, besluten och redigeringen, inte från ramverken.

### Det som gick fel på vägen

Tre fel hittades genom att läsa de förlorade texterna, och de lagades innan resultaten ovan:

- Modellen hoppade över färdigheten, anropade verktyget direkt och skrev ett utkast med platshållare. Då fylldes luckorna i och kundernas ord kom aldrig med. Skrivkitet börjar nu med en spärr mot utkast innan frågorna är ställda.
- När ägaren vägrade svara hittade Sigge på hur företaget arbetar ("lämna in cykeln hos oss" för en verkstad som hämtar hemma) och produktfunktioner som inte finns. Luckor skrivs nu som frågor inom hakparentes, och det som ingen har sagt beskrivs inte. Före lagningen: 5–1 och upp till tio påhittade uppgifter i en text. Efter: 6–0 och högst en.
- När ägaren inte visste vad kunderna tvekar över lät Sigge frågan falla och texten svarade inte på något tvivel. Sigge föreslår nu de troliga tvivlen och frågar vad som gäller.

### Vad resultatet inte visar

- Domaren är en språkmodell som läser som en redaktör. Den vet inte vilken text som säljer mer. Ingen riktig läsare har agerat på texterna.
- Sex uppgifter är få, och färdigheterna har justerats efter just de här uppgifterna. Det finns ingen uppsättning uppgifter som hållits undan, så siffrorna är troligen något för bra.
- Ägaren är simulerad och har alltid bra material: ett omdöme, en siffra, ett röstprov. Ett företag utan kunder eller omdömen har mindre att ge, och då blir skillnaden mindre.
- Skribenten och domaren kommer från samma leverantör. Andra assistenter är inte provade i jämförelsen.
- De små påhitten som finns kvar är mest formuleringar som gör en uppgift lite starkare än underlaget, till exempel "från 795 kr" när priset är 795 kr. Listan **Kontrollera** efter texten finns för dem, men den ersätter inte att ägaren läser texten.
- Frågorna kostar användaren ett svar till. Den som bara vill ha en text direkt får den, men den blir kortare och har frågor inom hakparentes.

`claude plugin validate` godkände marketplace-filen och pluginet med `--strict` efter ändringarna, och `npm run build` kör 55 tester.
