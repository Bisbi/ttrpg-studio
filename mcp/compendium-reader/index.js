#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { pathToFileURL } from "node:url";
import { validateConfig } from "./lib/config.js";
import { createLogger } from "./lib/logger.js";
import { CompendiumStore } from "./lib/store.js";
import { CompendiumQuery } from "./lib/query.js";
import { ToolError, CODES } from "./lib/errors.js";

export function buildServer(env) {
  const logger = createLogger(env);
  const cfg = validateConfig(env);
  let store = new CompendiumStore({ ...cfg, logger });
  store.load();
  let query = new CompendiumQuery(store);

  const refresh = () => {
    if (store.reloadIfStale()) query = new CompendiumQuery(store);
  };

  const handlers = {
    async search({ query: q, type, limit, cursor, fields }) {
      refresh();
      return query.search(q, { type, limit, cursor, fields, lang: cfg.lang });
    },
    async list({ type, filters, limit, cursor, fields }) {
      refresh();
      return query.list(type, { filters, limit, cursor, fields, lang: cfg.lang });
    },
    async get({ type, idOrName, fields }) {
      refresh();
      return query.get(type, idOrName, { fields, lang: cfg.lang });
    },
    async read_file({ file, root_key, fields }) {
      refresh();
      const rows = store.allOfType(file.replace(/\.json$/, "").replace(/s$/, ""));
      return { results: rows };
    },
  };

  const TOOLS = [
    { name: "search", description: "Cerca record nel compendio (full-text).",
      inputSchema: { type: "object", properties: {
        query: { type: "string" }, type: { type: "string" },
        limit: { type: "number" }, cursor: { type: "string" },
        fields: { type: "array", items: { type: "string" } } }, required: ["query"] } },
    { name: "list", description: "Elenca/filtra record di un tipo.",
      inputSchema: { type: "object", properties: {
        type: { type: "string" }, filters: { type: "object" },
        limit: { type: "number" }, cursor: { type: "string" },
        fields: { type: "array", items: { type: "string" } } }, required: ["type"] } },
    { name: "get", description: "Recupera un singolo record per id o nome.",
      inputSchema: { type: "object", properties: {
        type: { type: "string" }, idOrName: { type: "string" },
        fields: { type: "array", items: { type: "string" } } }, required: ["type", "idOrName"] } },
    { name: "read_file", description: "Accesso grezzo ai record di un file.",
      inputSchema: { type: "object", properties: {
        file: { type: "string" }, root_key: { type: "string" },
        fields: { type: "array", items: { type: "string" } } }, required: ["file"] } },
  ];

  const server = new Server({ name: "compendium-reader", version: "0.1.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const fn = handlers[req.params.name];
    try {
      if (!fn) throw new ToolError(CODES.INVALID_INPUT, `Tool sconosciuto: ${req.params.name}`, false);
      const result = await fn(req.params.arguments ?? {});
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (e) {
      const err = e instanceof ToolError ? e.toJSON() : { code: CODES.INTERNAL, message: String(e?.message ?? e), retriable: false };
      logger.error(err.code, err.message);
      return { isError: true, content: [{ type: "text", text: JSON.stringify(err) }] };
    }
  });

  return { server, handlers, refresh };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const { server } = buildServer(process.env);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("[compendium-reader] connesso\n");
  } catch (e) {
    process.stderr.write(`[compendium-reader] avvio fallito: ${e.message}\n`);
    process.exit(1);
  }
}
