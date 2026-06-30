import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import { SCHEMAS, SCHEMA_VERSION } from "./index.js";

const here = dirname(fileURLToPath(import.meta.url));
for (const [type, schema] of Object.entries(SCHEMAS)) {
  const js = zodToJsonSchema(schema, { name: `${type}` });
  js.$comment = `schema_version ${SCHEMA_VERSION}`;
  writeFileSync(join(here, `${type}.schema.json`), JSON.stringify(js, null, 2) + "\n");
  process.stderr.write(`generated ${type}.schema.json\n`);
}
