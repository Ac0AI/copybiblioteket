# The brand file

A brand file holds what a writer needs to know about one business and cannot guess: what it sells, who buys and why, what customers say in their own words, what the business can prove, and how it sounds. Sigge reads it before writing, so the user answers these questions once.

## Where it lives

- In a project folder: `sigge-brand.md` in the working folder. Also accept `.sigge/brand.md`, `.agents/product-marketing.md` and `.claude/product-marketing.md` if one of them already exists; do not create a second file.
- In a chat with no files: the user keeps the file in the project's knowledge or instructions, or pastes it at the start of a conversation. A message or document that begins with the heading below is a brand file.

One file per business. Never carry facts, quotes or voice from one business's file into copy for another.

## Format

Write the file in the user's language and translate the headings. Keep every quote and every voice sample word for word, with where it came from. Mark anything you inferred as an assumption. Leave a section out rather than fill it with guesses, and list what is missing under the last heading.

```markdown
# Sigge brand file: <business name>
Updated: <date>

## What we sell
One or two sentences a customer would understand. What is included, what it costs, what is not included.

## Who buys, and what made them look
The situation the buyer is in, not their age and industry. What had just happened when they started looking.

## What they hesitate over
The questions and worries that come up before someone buys. One line each.

## What customers say
Word-for-word quotes, each with source, date and whether it may be used with a name.
- "…" (Google review, March 2026, may be quoted with first name)

## What we can show
Numbers and facts we can stand behind, each with its source.
- 43 regular customers (our own records, November 2026)

## What we do that the alternatives do not
What the customer would otherwise choose, and the concrete difference.

## What we do not promise or say
Limits, things we do not offer, claims we must not make.

## How we sound
Two or three real samples of our own writing, word for word. Then a few observations: sentence length, how direct we are, humour, words we use, words we never use.

## Facts and terms
Prices, times, conditions, how to book or buy, what happens after the click.

## What we do not know yet
Open questions to ask the user next time.
```

## Keeping it up to date

When a conversation brings out a new fact, quote or voice sample, add it to the right section with its source and date. Never delete or rewrite what a person wrote in the file; add beside it and say what you added.
