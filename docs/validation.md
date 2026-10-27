# Validering

27 oktober 2026, skrivverkstad och 59 profiler.

## Automatiska kontroller

- `npm run build`: TypeScript-kontroll, 28 tester och paketering av webbläsarkoden.
- Alla 59 profilidentiteter är unika och matchar det importerade originalets katalog. Profilerna har HTTPS-källänkar och uttrycklig proveniens. Sökning på varje exakt namn ger rätt person först.
- Svenska och engelska sökfrågor, källhänvisningar, svenska tecken, tomma träffar, indatagränser och HTTP testas.
- Skrivunderlag bevarar fakta, villkor, röstprov och ändringsinstruktioner. Ett uttryckligt personval gäller före automatiskt urval, som begränsas till tre profiler och utesluter kategorin Fördjupning.
- En riktig MCP-klient startar stdio-servern från en annan arbetskatalog, upptäcker åtta verktyg och läser ramverk, profiler och källor.
- Produktionsstarten använder endast egna tillämpningar och källänkar även om en lokal textsamling anges i miljön. HTTP kan inte anropa AI, skapa konton eller prenumerera medan åtkomst väntar.
- Lokala AI-tester använder simulerad gateway för skrivar-/redaktörsordning, felhantering, faktareferenser och obligatoriska formuleringar. Strängkontroller kan inte avgöra om varje påstående faktiskt följer av sitt underlag.
- Den lokala källsamlingen innehåller 58 läsbara fördjupningsindex för katalogens 59 profiler. Profiler utan index använder egna svenska tillämpningar och ärvda källänkar.
- Installerad Copy Operator är strukturellt validerad och dess CLI-hjälpare har kontrollerats mot personbiblioteket. Detta bevisar inte språklig kvalitet.

## Lokala skrivprov

Sex fiktiva briefar finns i evaluations/briefs.json: varm bokföringscopy, teknisk B2B, lekfull konsumenttext, saknade belägg, bearbetning med exakta villkor och ett röstprov som innehåller ogrundade resultatpåståenden. GPT-5.2 kördes med skrivar- och redaktörssteg. Resultaten sparas lokalt i den ignorerade evaluations/results-katalogen.

Första omgången tog 17–29 sekunder per brief. Den behöll obligatoriska formuleringar och undvek att överföra röstprovets kundresultat till det nya erbjudandet. Granskningen hittade också svagheter: kopierade stilprov, påhittade detaljer om ett första samtal och fler följdfrågor än uppgiften krävde. Instruktionerna har därför skärpts. Två nya körningar (17 respektive 25 sekunder) visade fortfarande ordagrann återanvändning av ett stilprov och för långtgående tolkning av ett tekniskt röstprov. Den lokala AI-skrivaren är därför fortsatt en utvärderingsdel, inte en verifierad publik skrivfunktion. Noll automatiska varningar är inte bevis för korrekt eller bra copy. Exemplen kräver mänsklig redigering.

## Webbläsarkontroll lokalt

Profilen Justin Welsh kunde öppnas, väljas och följas till skrivverkstaden. Valet, briefen, prisvillkoren och skrivguiden finns i det skapade underlaget. Kopieringsknappen visar lyckat besked; kopiering till ett annat program är inte verifierad. Frivillig lagring återställde brief och text efter omladdning. Börja om, versionsåterställning och radering av lokalt sparat testarbete fungerade. Separat fysisk mobilkontroll är inte utförd.

## Publicering

Release ska kontrolleras separat över HTTPS: /, /library, /people, API med 59 profiler, skrivunderlag, sökning, statiska filer och stängd AI-rutt. Körning av lokala tester är inte bevis för publicerad funktion. Den tidigare versionen av sigge.si är redan verifierad; den nya releasekontrollen dokumenteras när publiceringen är klar.

## Begränsningar

Ingen jämförelse med Hormozis egen AI eller mätning av konverteringseffekt har gjorts. Begreppssökning är inte generell semantisk förståelse. Personprofilerna är våra svenska tillämpningar; alla ärvda källor har inte granskats mot originalen. Den valfria lokala textsamlingen ingår inte i publik drift.

Sajten skapar skrivunderlag och erbjuder en redigeringsyta. Den skriver inte färdig copy med en inbyggd modell. Konton, automatisk Field Notes-prenumeration och offentlig modellåtkomst är uppskjutna enligt ägarens beslut.
