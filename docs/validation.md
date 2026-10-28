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
