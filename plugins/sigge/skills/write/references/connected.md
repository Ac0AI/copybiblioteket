# Sigge connected: the full library

The skill works on its own. Connecting Sigge (https://sigge.si/connect, free, sign in with an email code) adds 59 perspectives, source search and a kit that picks frameworks for the task. The tools are read-only, call no language model and save no text.

- `get_writing_kit`: start here. One call with the task returns the working order, up to three frameworks, up to two perspectives, channel guidance and the writing guide.
- `check_ai_patterns`: the same pattern check as `scripts/check.mjs`.
- `search_copy_knowledge`, `get_copy_framework`, `list_copy_frameworks`: go deeper into the frameworks.
- `search_copy_people`, `get_copy_person`, `list_copy_people`: perspectives by name, topic or problem.
- `search_copy_sources`: links to the original sources.
- `get_writing_guide`: the writing guide for `language: sv` or `language: en`.

Set `language: en` for English content; Swedish is the default. If a search misses, retry with a more exact term in Swedish or with its English name. The search has a small vocabulary map, not general translation. No result means no retrieved support; do not invent a source.

Perspectives are our own applications of public material. Their source links are inherited and have not been checked against the full originals. Do not imply that a person wrote, approved or would endorse the application, and do not turn a personal opinion about health, money or discipline into a product claim. Keep source attribution in research and review notes, not in customer-facing copy.
