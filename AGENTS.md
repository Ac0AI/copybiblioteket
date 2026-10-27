# Copybiblioteket

Sigge: a standalone Swedish copy workshop and library, deployed to sigge.si. Preserve the upstream MIT notice for reused search code.

- Native framework cards live in data/copy-frameworks/. Write original Swedish applications, cite public author/publisher/institution sources, and label invented examples.
- A framework is not customer evidence or a conversion guarantee. Preserve facts, conditions and source uncertainty.
- Write Swedish from the brief and brand voice, without assuming a single Swedish national tone.
- Public deployment uses only our own framework applications and links to originals. Optional inherited source collections are local references, not part of this repository or deployment.
- Keep personal briefs, customer data, credentials and machine paths out of the repository. copy-brains.local.json is local and ignored.
- app.ts is the Vercel entry. npm start binds to localhost. The MCP server uses stdio and makes no outbound calls.
- Person profiles live in data/people/. Keep all 59 catalogue identities, original Swedish applications and inherited-source provenance. Do not present profiles as endorsements.
- Public brief generation runs in the browser; no account, database, model or email action is exposed. Accounts are explicitly deferred by the owner.
- Run npm run build (typecheck, tests and browser bundle). Verify deployment and HTTPS on sigge.si after release.
- copy/studio.ts and copy/evaluate.ts are for local AI evaluation using the project's configured gateway only. Do not expose the model route or enable signup until the owner decides on access. Neon is not used. Do not add another identity provider without a decision.
