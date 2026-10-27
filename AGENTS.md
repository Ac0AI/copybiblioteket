# Copybiblioteket

A standalone Swedish copy library, deployed to sigge.si. Preserve the upstream MIT notice for reused search code.

- Native framework cards live in data/copy-frameworks/. Write original Swedish applications, cite public author/publisher/institution sources, and label invented examples.
- A framework is not customer evidence or a conversion guarantee. Preserve facts, conditions and source uncertainty.
- Write Swedish from the brief and brand voice, without assuming a single Swedish national tone.
- Public deployment uses only our own framework applications and links to originals. Optional inherited source collections are local references, not part of this repository or deployment.
- Keep personal briefs, customer data, credentials and machine paths out of the repository. copy-brains.local.json is local and ignored.
- app.ts is the Vercel entry. npm start binds to localhost. The MCP server uses stdio and makes no outbound calls.
- Run npm run build (typecheck and tests). Verify deployment and HTTPS on sigge.si after release.
- Do not add model APIs, accounts, databases or tracking unless requested. The user's AI client writes the copy using the skill.
