import { authFromEnvironment } from "./auth.js";
const runtime = authFromEnvironment();
if (!runtime)
  throw new Error("Configure account environment before migrating.");
await runtime.migrate();
console.log("Sigge account schema is ready.");
await runtime.db.destroy();
