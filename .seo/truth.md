# Source of truth

Härlett ur repot 2026-11-02. Härled om när ramverk, profiler, pris eller anslutningar ändras.

| Claim | Value | Source | Read |
|---|---|---|---|
| Antal ramverk | 13 (3-2-1 borttaget 2026-11-10) | data/copy-frameworks/*.json | 2026-11-10 |
| Antal personprofiler | 59, alla från The Brains | data/people/*.json, AGENTS.md | 2026-11-02 |
| Pris | Gratis, ingen betald plan | client/pages/index.html JSON-LD offers price 0 | 2026-11-02 |
| Språk | Svenska och engelska | data/translations/en/, client/messages.js | 2026-11-02 |
| MCP-adress | https://sigge.si/mcp, Streamable HTTP + OAuth | AGENTS.md, README.md | 2026-11-02 |
| Konto | E-postkod (Better Auth + Turso, Resend från hej@sigge.si) | AGENTS.md | 2026-11-02 |
| AI-skrivning på sajten | Avstängd; den publika verkstaden anropar ingen AI | README.md, privacyOne | 2026-11-02 |
| Spårning | Ingen egen analys- eller annonsspårning | privacyThree i client/messages.js | 2026-11-02 |
| Operatör | AC0 AI SLU | footerLegal | 2026-11-02 |
| MCP-verktyg | 10 st: list/search/get frameworks, sources, writing guides, people, check_ai_patterns | README.md | 2026-11-02 |

## Integrations

| Integration | Status | Source |
|---|---|---|
| Claude (claude.ai, appar, Claude Code) | ja, via MCP-connector | client/connect-messages.js |
| ChatGPT | ja, via MCP-connector | client/connect-messages.js |
| Sign in with ChatGPT | nej | AGENTS.md |
| Egen AI-skrivning på sajten | nej | README.md |

## Contradictions found

| Claim | Code says | Site says | Which is right |
|---|---|---|---|
| Antal ramverk efter fyra namn | 13 totalt = 4 + 9 | "och tio till" (rättat i PR #12) | koden |
