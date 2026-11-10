# Sigge

Sigge helps your AI assistant write copy that sounds like you, in Swedish or English. The plugin brings thirteen copy frameworks, a writing guide for each language and a check for AI-writing patterns. Your own assistant does the writing. It works right after installation, with no account and nothing to sign in to.

Sigge is a free service from [AC0](https://ac0.ai).

## What you can ask for

| Ask | What happens |
| --- | --- |
| "Write a landing page for our bookkeeping firm." | `write` gathers the brief, picks the frameworks that fit, writes in your voice and checks the draft before you see it. |
| "Check this text for AI patterns." | `check` quotes each empty buzzword, false contrast and throat-clearing opener, and fixes them with the smallest possible edits. |
| "Review my sales email before I send it." | `review` reads the text as a copy chief would and points to the passages that need work. |
| "What can Sigge do?" | `start` gives a short introduction. |

You can also call a skill by name, for example `/sigge:write` in Claude Code.

## Install

**Claude Code**

```
/plugin install sigge --marketplace Ac0AI/sigge
```

**Claude on the web, desktop and Cowork:** open Customize, then Plugins, choose Add marketplace and enter `Ac0AI/sigge`.

**Codex**

```
codex plugin marketplace add Ac0AI/sigge
codex plugin add sigge@sigge
```

**ChatGPT:** add `https://sigge.si/mcp` as a custom MCP server under Plugins, without sign-in. This gives the tools; the skills need Codex or a workspace that has imported the marketplace.

## What ships with the plugin

- Thirteen frameworks, each with a table for choosing a move, named moves with example lines, a complete fictional worked example, common mistakes and links to the original sources: Hormozi, Cialdini, Schwartz, Dunford, Jobs to Be Done, Wiebe, Fogg, Ogilvy, Hopkins, James Clear and more.
- A writing guide for natural Swedish and one for English.
- A checker for AI-writing patterns in both languages. It needs Node.js; without it the assistant reads the text against the pattern list instead.
- A copy chief checklist with 25 checks.

## The connection to sigge.si

The plugin also connects to `https://sigge.si/mcp`. It adds 59 perspectives, source search and a tool that picks frameworks for a task. It needs no account. If the connection is unavailable, the skills use what ships with the plugin.

## Privacy

The skills run in your own assistant, and the bundled checker runs wherever your assistant runs it. When the assistant uses the tools at `sigge.si/mcp` instead, the query or text is sent there, answered and not stored; the tools are read-only and call no language model. Sigge has no accounts and sets no cookies. Full policy: [sigge.si/privacy](https://sigge.si/privacy).

## Limits

The frameworks and perspectives are our own applications of public material. They are not the authors' official services and are not endorsed by them. A framework is a way to think, not evidence about your product and not a promise about conversion. The pattern check finds known phrases; a clean result does not prove the text is good, and a finding does not prove an AI wrote it.

## Licence

MIT. See [LICENSE](LICENSE). The licence does not cover the original works the sources link to. Corrections and rights questions: [issues](https://github.com/Ac0AI/sigge/issues) or hej@sigge.si.
