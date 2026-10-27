import { loadCopyLibrary } from "./library.js";
import { personSchema, searchInput } from "./schema.js";

const [command = "list", argument, person] = process.argv.slice(2);
try {
  const library = await loadCopyLibrary();
  let output: unknown;
  if (command === "list") output = library.list();
  else if (command === "guide") output = { guide: library.writingGuide };
  else if (command === "get") {
    output = library.get(argument);
    if (!output) throw new Error("Okänt ramverk. Kör list.");
  } else if (command === "search" || command === "sources") {
    const { query, limit } = searchInput.parse({ query: argument });
    output = command === "search" ? library.search(query, limit)
      : library.searchSources(query, limit, person ? personSchema.parse(person) : undefined);
  } else throw new Error("Använd list, guide, get <id>, search <fråga> eller sources <fråga> [person].");
  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
} catch (error) {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
  process.exitCode = 1;
}
