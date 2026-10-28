# Sigges skrivverkstad

Beslut 27 oktober 2026: Sigge är en publik tjänst. Konton och val av inloggningslösning väntar på ägarens beslut. Neon används inte i appen. Denna release ger ett komplett skrivunderlag utan konto; modellen körs i användarens egen AI-chatt.

## Flödet

1. Beskriv uppgift, mottagare, fakta, villkor och avsändarens röst.
2. Välj en av 59 profiler eller låt uppdragets ämne styra urvalet.
3. Skapa ett underlag med högst tre ramverk, högst tre personperspektiv och skrivguiden för textens språk.
4. Kopiera underlaget till en AI-chatt. Klistra tillbaka texten för redigering, nedladdning eller ett nytt ändringsunderlag.

Underlaget skapas i webbläsaren. Innehållet skickas inte till appens API. Lokal lagring är frivillig, kan stängas av och har en raderingsknapp. Versioner sparas när ett dokument ersätts eller återställs. Alla 59 profiler går att utforska på /people. Ramverken finns på /library och i Copy Operator via nio läsande MCP-verktyg.

## Innehåll

Svenskan skrivs från briefen och avsändarens stilprov, utan antagande om en enda svensk ton. Fakta, röstprov och obligatoriska formuleringar hålls isär. Profilerna har egna svenska tillämpningar och ärvda källhänvisningar som inte självständigt granskats mot hela originalen. De är inte citat eller personernas godkännande. Profiler i kategorin Fördjupning väljs bara uttryckligen, inte automatiskt som stöd för copy.

## Form

Bläck #152A41, papper #FFFFFF, arbetsyta #F2F5F8, kobolt #2354D7. Systemets sans används för verktygen och Georgia för textytan. Inga externa fontanrop. Brief och arbetsyta ligger i två kolumner på stora skärmar och följer efter varandra på små. Exempelanteckningar ligger i en utfällbar sektion under arbetsytan. Tre fält visas först; språk, format, röst och perspektiv finns under Fler inställningar. Gränssnittet finns på svenska och engelska, med separat val av textens språk. Exemplet är tydligt märkt som ett påhittat företag.

## Det som väntar

AI-skrivning på sajten, signup och skrivkvoter kräver ett senare beslut om åtkomst. POST /api/write ger 503 och auth-/prenumerationsrutter saknas. Ingen ny identitetsleverantör ska läggas till utan beslut. Field Notes länkar till AC0:s befintliga engelska brev; inga besökare prenumereras automatiskt.

Den lokala AI-utvärderingen i copy/studio.ts och copy/evaluate.ts använder ett skrivar- och ett redaktörsanrop via projektets Vercel AI Gateway. Den är separerad från den publika HTTP-rutten. Modellgranskning eller automatisk kontroll av faktareferenser är inte oberoende faktakontroll. Se valideringen innan denna del vidareutvecklas.
