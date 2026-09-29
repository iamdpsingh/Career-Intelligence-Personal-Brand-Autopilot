const fs = require('fs');
const crypto = require('crypto');
let content = fs.readFileSync('providers/db/schema.ts', 'utf8');

content = content.replace(/drizzle-orm\/pg-core/g, 'drizzle-orm/sqlite-core');
content = content.replace(/pgTable/g, 'sqliteTable');
content = content.replace(/uuid\("id"\)\.primaryKey\(\)\.defaultRandom\(\)/g, 'text("id").primaryKey().$defaultFn(() => crypto.randomUUID())');
content = content.replace(/uuid\("([^"]+)"\)/g, 'text("$1")');
content = content.replace(/jsonb\("([^"]+)"\)/g, 'text("$1", { mode: "json" })');
content = content.replace(/timestamp\("([^"]+)", \{ mode: "date" \}\)/g, 'integer("$1", { mode: "timestamp_ms" })');
content = content.replace(/timestamp\("([^"]+)"\)\.defaultNow\(\)/g, 'integer("$1", { mode: "timestamp_ms" }).$defaultFn(() => new Date())');
content = content.replace(/timestamp\("([^"]+)"\)/g, 'integer("$1", { mode: "timestamp_ms" })');
content = content.replace(/boolean\("([^"]+)"\)/g, 'integer("$1", { mode: "boolean" })');

// Fix imports
content = content.replace(/import \{[\s\S]*?\} from "drizzle-orm\/sqlite-core";/, `import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";\nimport crypto from "crypto";`);

fs.writeFileSync('providers/db/schema.ts', content);
