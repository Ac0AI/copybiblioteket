# Comparing texts with and without Sigge

A way to find out whether a change to the plugin or the tools makes the copy better, instead of assuming it does.

## How it works

`tasks.json` holds writing tasks. Each one is a short request, the way people actually type it, plus what the business owner knows but has not said: prices, limits, what customers have said word for word, how the owner writes. `run.mjs` plays each task as a conversation. A simulated owner answers questions from that knowledge, corrects what is wrong and volunteers nothing. A version that asks for a customer's words gets them; a version that just writes does not. `judge.mjs` then compares the texts two at a time without being told which is which, twice with the order swapped, and counts a win only when both orders agree.

```sh
git worktree add /tmp/sigge-main origin/main && ln -s "$PWD/node_modules" /tmp/sigge-main/node_modules
node evaluations/compare/run.mjs --out /tmp/compare --conditions bare,current,new,new+brand --current-root /tmp/sigge-main
node evaluations/compare/judge.mjs --out /tmp/compare --pairs new:bare,new:current,new+brand:bare,current:bare
```

Conditions: `bare` is the assistant without Sigge, `current` is the plugin and server in `--current-root`, `new` is this checkout, and `new+brand` is this checkout after the owner has set up a brand file in an earlier conversation.

Both scripts need the `claude` CLI. `--model` chooses the writer (default `sonnet`) and the judge (default `opus`). `--settings` takes a settings file, which is how other installed plugins are switched off so that they do not write the text instead. Finished conversations are kept; pass `--force` to run them again.

## What the result means

The judge is a language model reading as a copy chief. It is told what the owner knows, so it can list invented facts, and it scores how well the text answers the reader's doubt, how specific and believable it is, and whether it sounds like the sender. It does not know which text sells more, and neither do we until a real reader has acted on it. Six tasks are also few: treat a result of four wins to two as a hint and five or six to nothing as a finding. Read the texts and the judge's reasons in the output folder before changing anything because of the numbers.
