# Sigge accounts and remote MCP

Owner decision: email + one-time code, optional AC0 Field Notes, Better Auth in this app, and Turso. No Neon, Supabase, Sign in with ChatGPT, or server-side model generation.

## Configure

Create a separate Turso database for Sigge in Europe. Use a database-scoped token, not a platform token. Configure the names in `.env.example` as encrypted production variables in Vercel. Generate a random `BETTER_AUTH_SECRET` of at least 32 bytes. Sender is fixed to `Sigge <hej@sigge.si>` on the verified Resend domain. Set `RESEND_FIELD_NOTES_SEGMENT_ID` to the verified existing Field Notes segment. Do not create a different audience or subscribe addresses as part of deployment.

Run the schema migration explicitly before enabling production access:

```sh
node --env-file=.env.production.local --import tsx copy/migrate-auth.ts
```

Migrations only add Better Auth tables, `fieldNotes`, and `usageLimit`. Startup does not run migrations. Account routes are absent and `/mcp` returns 503 unless `SIGGE_ACCOUNTS_ENABLED=true`. When enabled, missing secrets fail startup rather than expose an unauthenticated MCP server. Keep preview databases and secrets separate from production.

## Routes and clients

- `/connect`, `/en/connect`: signup, account, client instructions, and connection revocation.
- `/consent`, `/en/consent`: approve or deny a specific OAuth client. Client-provided names are untrusted labels.
- `/mcp`: authenticated stateless Streamable HTTP. The same ten read-only tools as local stdio: nine knowledge tools and `check_ai_patterns`. JWT signature, issuer, audience, expiry, scope and current user/client consent are checked.
- `/.well-known/oauth-protected-resource`: MCP discovery.
- `/.well-known/oauth-authorization-server/api/auth`: authorization-server discovery.
- `/api/auth/*`: Better Auth, email OTP and OAuth endpoints. Password signup and unnecessary OTP routes are disabled.
- `/api/account/field-notes`: same-origin, authenticated, verified-email opt-in. Failures remain pending and return 502. Repeated successful requests do not subscribe again.
- `/api/account/delete`: same-origin, authenticated, explicit `{confirm:true}`. Deletes the user, sessions, OAuth tokens, consents and user-owned clients, Field Notes status and pending codes in one transaction and clears cookies. A Field Notes newsletter subscription is managed through the newsletter's own unsubscribe link.
- `/privacy`, `/en/privacy`: the privacy policy. Keep it in step with this document.
- `/api/account/connections/revoke`: same-origin request, ownership check, consent and refresh-token family removal. Current access is denied immediately.

Claude Code:

```sh
claude mcp add --transport http --scope user sigge https://sigge.si/mcp
```

Run `/mcp` and authenticate. ChatGPT: Plugins → + → Add custom MCP server → `https://sigge.si/mcp` → OAuth. Availability follows the user's account/workspace settings. Public directory publication is a separate task; a custom server does not need a directory listing.

## Security and data

Six-digit codes expire after ten minutes, allow five wrong attempts, are stored hashed, and are consumed once. Database-backed rate limiting works across instances. Additional email limits are three sends per address per ten minutes and 100 total sends per day; counters use a secret-keyed hash rather than the address. On Vercel, only the trusted `x-vercel-forwarded-for` header supplies client IPs. Local development falls back to a shared rate-limit bucket when no trusted header is present.

MCP clients use authorization code + S256 PKCE. CIMD is supported with the package's SSRF-resistant Node transport; explicit DCR fallback supports older clients and loopback callbacks. Never allow arbitrary redirect URIs or disable CSRF/PKCE checks. Browser sessions are Secure and HttpOnly on HTTPS, with same-origin write checks. Access tokens expire after five minutes. Revocation removes refresh tokens as well as consent.

Resend failures must not appear as success: Better Auth normally catches mail callback failures, so the outer request wrapper tracks the awaited result in AsyncLocalStorage and returns a failure status. Never configure background mail execution without preserving this behavior and serverless task lifetime.

Field Notes consent time and provider success are stored separately from account creation. No newsletter email is sent by signup; future broadcasts use the existing AC0 Field Notes segment. The current account status records the signup result; it is not a live mirror of later newsletter unsubscribes.

Do not log email codes, bearer tokens, cookies, or OAuth query strings. Never return production codes to the browser. Local QA fixtures use simulated delivery and must stay outside the deployment. The production writing model route stays disabled.

## Verification

`npm run build` runs types, bundles, and tests. Auth tests use disposable SQLite databases and simulated mail/contact providers. They exercise actual HTTP OAuth, PKCE token exchange, a real MCP SDK client in both languages, replay, expired codes, explicit opt-in, provider failures and connection revocation. Provider delivery, production Turso state and actual Claude Code/ChatGPT account connections require separate live checks.

## Production activation, 28 October 2026

PR #3 is deployed to `https://sigge.si`. Turso database/group `sigge` uses `aws-eu-central-1` (Frankfurt) in the existing `ac0ai` account. Production variables are encrypted in Vercel and use a database-scoped token and a separate Sigge Resend API key. The mail key needs contact access for the existing Field Notes segment as well as sending access. No production secrets are configured for previews.

Live verification exercised browser signup, real provider delivery to a Resend test sink, OAuth approval, token renewal, discovery of all nine MCP tools, profile listing, writing guidance in both languages, newsletter opt-in and immediate revocation. The disposable test account, OAuth client and newsletter contact were removed. A normal inbox delivery and an actual user's Claude Code/ChatGPT connection remain separate checks. See `validation.md`.
