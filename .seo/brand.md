# Sigge — Brand Context

> Röstkontraktet. Läses i början av varje `/seo`-körning. Utkast 2026-11-02 från repot, sajten och ägarens svar i checkpointen. Positioneringen bekräftades av ägaren 2026-11-02 (NY-1). Rader märkta *inferred* är fortfarande obekräftade.

## Product

- **Name:** Sigge (sigge.si). Repo: Ac0AI/sigge. Plugin och MCP-server heter sigge.
- **Positioning (bekräftad 2026-11-02, NY-1):** Sigge är en gratis skrivverkstad och copy-MCP för grundare och marknadsförare som skriver säljtext med Claude eller ChatGPT, på svenska och engelska. Den vinner för att din egen AI får beprövade ramverk och en flosklerkoll direkt i chatten och texten fortfarande låter som du. Den är inte för den som vill att ett verktyg skriver färdig text åt en.
- **One-liner (≤20 words):** Gratis skrivverkstad och copy-MCP som ger din egen AI ramverk, perspektiv och en flosklerkoll, på svenska och engelska.
- **What we do:** Sigge ansluts till Claude eller ChatGPT via MCP (https://sigge.si/mcp). Din AI slår då upp 14 copyramverk, 59 personperspektiv och skrivguider och kör `check_ai_patterns` innan den svarar. Utan konto bygger webben ett skrivunderlag att klistra in i valfri AI-chatt och granskar text mot AI-floskler. Sigge skriver inte texten själv på sajten.
- **Pricing structure:** Gratis. Ingen betald plan.
- **Free tier?** Ja, allt är gratis. Sigge har inga konton och ingen inloggning (borttaget 2026-11-10). En gratistjänst från AC0 (ac0.ai).

## Audience

- **Primary persona:** Grundare och marknadsförare som skriver säljtext (landningssidor, mejl, annonser, LinkedIn) med Claude eller ChatGPT och vill att den låter mänsklig. Ägaren 2026-11-02: inte bara svenska, jobbar internationellt.
- **Secondary personas:** *inferred* Copywriters och byråer som vill ha ramverk direkt i sin AI; utvecklare som letar MCP-servrar för skrivande.
- **Industries we target:** Branschoberoende. Exemplen på sajten är en påhittad bokföringsbyrå.
- **Company size we target:** Ensamföretagare till små team.
- **Jobs to be done (top 3):**
  1. Få AI-skriven säljtext att låta som jag, inte som en AI.
  2. Använda beprövade copyramverk (Hormozi, Cialdini, Schwartz m.fl.) utan att läsa böckerna först.
  3. Hitta och stryka AI-floskler i en text innan den publiceras.

## Competitors

| Brand | URL | Tier | Notes |
|---|---|---|---|
| Copy.ai | copy.ai | head | AI-skrivverktyg som skriver texten åt dig. Sigge ger din egen AI ramverk i stället. |
| Jasper | jasper.ai | head | AI-skrivverktyg med varumärkesröst. |
| Språkrådet/Isof klarspråk | isof.se | niche | Svenska klarspråksråd; Sigges klarspråksramverk bygger vidare på samma idé. |

## Brand voice

- **Voice tags:** varm, rak, lite torr humor, konkret, inga floskler. Kortare meningar än genomsnittet. En bläckplump-maskot får vara lekfull; resten av texten är saklig.
- **Person/perspective:** du-tilltal till läsaren; "vi" om Sigge-teamet; maskoten pratar i jag-form.
- **Forbidden words/phrases:** allt i `client/slop.js` (sömlös, banbrytande, revolutionerande, skräddarsydd, holistisk, innovativ, kraftfull, spelförändrare, ta del av, i en värld där, till nästa nivå, din resa, navigera i, dyka ner i, transformera); emdash; "inte X, utan Y"-kontraster som stil.
- **Forbidden claims:** att Sigge skriver texten åt dig på sajten; att profilerna är citat, officiella eller godkända av personerna; att ett ramverk garanterar konvertering; användarsiffror, kundcase eller SLA:er som inte finns.
- **Reference brands for tone:** *inferred* Sajtens egen startsida efter PR #12.
- **Existing content to match:** startsidan (client/messages.js) och ramverkssidorna (data/copy-frameworks/*.json).

## Anti-positioning (where we don't compete)

1. Vi skriver inte texten åt dig på sajten (AI-skrivning på sajten är avstängd).
2. Vi är ingen AI-textdetektor som gissar vem som skrev; mönstren är skäl att läsa igen.
3. Vi är inte en kurs eller en bok; ramverken är korta tillämpningar med länk till originalet.
4. Vi säljer inget och har ingen betald nivå.
5. Vi är inte personernas officiella tjänst; profilerna är egna tillämpningar.

## Concrete differentiators

1. Fungerar inne i Claude eller ChatGPT via MCP, så du skriver där du redan skriver.
2. Flosklerkollen `check_ai_patterns` körs av din AI innan den svarar, på svenska och engelska.
3. 14 ramverk med frågor och påhittade före/efter-exempel, på båda språken.
4. Skrivunderlaget byggs i webbläsaren; inget skickas iväg utan konto.

## Proprietary data & first-hand experience

- **Product/usage data:** Ingen. Sigge har ingen egen analys- eller annonsspårning (privacy-texten), och MCP-verktygen sparar ingen frågetext.
- **How to get at it:** — (finns inte, med avsikt)
- **Off-limits — never publish:** e-postadresser och kontodata (Turso), innehåll i användares briefar.
- **First-hand experience:** Ramverkstillämpningarna och slop-mönstren i `client/slop.js` är egna.
- **Original research we can run:** Köra `check_ai_patterns` över publik AI-text (t.ex. 100 svenska landningssidor) och redovisa vilka mönster som är vanligast. *inferred, ej beslutat*
- **Internal experts:** —

## Author / E-E-A-T

- **Default author:** *inferred* AC0 AI SLU (Sigge-teamet).
- **Credentials:** —
- **Author bio URL:** https://www.ac0.ai/
