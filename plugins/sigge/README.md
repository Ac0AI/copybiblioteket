# Sigge

Sigge helps your AI assistant write copy that sounds like you, in Swedish or English. The plugin brings fourteen copy frameworks, a writing guide for each language and a check for AI-writing patterns. Your own assistant does the writing. It works right after installation, without an account.

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
/plugin install sigge --marketplace Ac0AI/copybiblioteket
```

**Claude on the web, desktop and Cowork:** open Customize, then Plugins, choose Add marketplace and enter `Ac0AI/copybiblioteket`.

**Codex**

```
codex plugin marketplace add Ac0AI/copybiblioteket
codex plugin add sigge@sigge
```

**ChatGPT:** add `https://sigge.si/mcp` as a custom MCP server under Plugins. This gives the tools; the skills need Codex or a workspace that has imported the marketplace.

## What ships with the plugin

- Fourteen frameworks as short applications with questions, a fictional before-and-after example and links to the original sources: Hormozi, Cialdini, Schwartz, Dunford, Jobs to Be Done, Wiebe, Fogg, Ogilvy, Hopkins, James Clear and more.
- A writing guide for natural Swedish and one for English.
- A checker for AI-writing patterns in both languages. It needs Node.js; without it the assistant reads the text against the pattern list instead.
- A copy chief checklist with 25 checks.

## The optional account

A free Sigge account adds 59 perspectives, source search and a tool that picks frameworks for a task. Connect it at [sigge.si/connect](https://sigge.si/connect) with a code sent to your email. The plugin already lists the connection (`https://sigge.si/mcp`); it stays unused until you sign in.

## Privacy

The skills run in your own assistant and send nothing to Sigge. The checker runs on your computer. The first time it runs it prints one line about our newsletter and saves an empty file named `tip-shown` so the line is never printed again. With an account connected, the tools are read-only, call no language model and save no text. Full policy: [sigge.si/privacy](https://sigge.si/privacy).

## Limits

The frameworks and perspectives are our own applications of public material. They are not the authors' official services and are not endorsed by them. A framework is a way to think, not evidence about your product and not a promise about conversion. The pattern check finds known phrases; a clean result does not prove the text is good, and a finding does not prove an AI wrote it.

## Licence

MIT. See [LICENSE](LICENSE). The licence does not cover the original works the sources link to. Corrections and rights questions: [issues](https://github.com/Ac0AI/copybiblioteket/issues) or hej@sigge.si.
