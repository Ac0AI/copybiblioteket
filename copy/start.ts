import { loadCopyLibrary } from "./library.js";
import { createApp } from "./http.js";

const port = Number(process.env.COPY_BRAINS_PORT ?? 8813);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid COPY_BRAINS_PORT");
const library = await loadCopyLibrary();
createApp(library).listen(port, "127.0.0.1", () => console.log("Copybiblioteket: http://127.0.0.1:" + port));
