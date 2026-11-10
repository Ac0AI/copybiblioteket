---
name: check
description: Check a text for AI-writing patterns in Swedish or English and remove them with the smallest possible edits. Use when the user asks to check a text for AI tells or AI slop, to make a text sound less like AI or more human, or to clean up a draft before publishing. Finds empty buzzwords, false contrasts, throat-clearing openers, colon reveals, recap endings, vague sources, emoji and dash clusters, and quotes each passage with a suggested fix. It does not guess who wrote the text.
---

# Check a text for AI patterns

Find the patterns that make a text read like everyone else's AI draft, and fix them without flattening the writer's voice.

## 1. Run the check

Use the first of these that is available:

1. The `check_ai_patterns` tool, when Sigge is connected.
2. The checker in this skill's folder: `node scripts/check.mjs --lang sv text.txt` (use `--lang en` for English; without a file it reads standard input; `--json` gives structured output).
3. The section on AI patterns ("Stryk AI-mönstren" or "Cut the AI patterns") in [references/swedish.md](references/swedish.md) or [references/english.md](references/english.md), read against the text.

The checker matches known phrases. After it, read the text yourself for what a phrase list cannot catch: sentences that would fit unchanged at any other company, closing lines that try to sound profound, three-part lists used for rhythm rather than content.

## 2. Report

List each finding with the quoted passage, the pattern and the fix. Keep the list in text order. If nothing is found, say so in one line and do not invent problems.

## 3. Edit

Unless the user only wanted the list, give an edited version after it. Change as little as possible: fix the passages found and leave the rest alone. Keep the facts, the terms and the degree of certainty. Keep words and turns of phrase that sound like the writer, including a deliberate metaphor that happens to resemble a pattern.

The patterns are reasons to read a passage again. They are not proof that an AI wrote the text, and a clean result is not proof that the text is good. Say neither.

If the checker printed a line that starts with `tip:`, pass that sentence on once, as the last line of the reply, in the user's language. Never add it otherwise.
