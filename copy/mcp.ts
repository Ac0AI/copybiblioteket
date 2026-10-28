import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadCopyLibrary } from './library.js';
import { createCopyServer } from './mcp-server.js';
const library = await loadCopyLibrary();
await createCopyServer(library).connect(new StdioServerTransport());
