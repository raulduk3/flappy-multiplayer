import * as AjvNS from "ajv";
import { ErrorObject } from "ajv";
import * as formatsPluginNS from "ajv-formats";
import fs from "fs";
import path from "path";

// T020: Central Ajv validator loader & compile-once registry.

const ajv = new AjvNS.Ajv({ allErrors: true, strict: true });
(formatsPluginNS as any).default(ajv);

// Resolve schemas relative to repo root regardless of cwd (backend/ tests run with cwd=backend)
const schemaDir = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "shared",
  "schemas",
  "protocol",
  "v1",
);

function loadSchema(file: string) {
  const p = path.join(schemaDir, file);
  if (!fs.existsSync(p)) throw new Error(`Schema file missing: ${p}`);
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

// Load & compile schemas. We keep a registry keyed by file base name (without extension)
// and also a message-type → validator map for quick lookups.
// Order matters for referenced schemas: include entity component schemas before aggregators (snapshot)
const SCHEMA_FILES = [
  // entity fragments referenced by others
  "player-state.schema.json",
  "pipes-window.schema.json",
  "leaderboard-entry.schema.json",
  // envelopes & messages
  "envelope.schema.json",
  // capabilities negotiation
  "capabilities-request.schema.json",
  "capabilities-response.schema.json",
  // legacy snapshot (capabilities-era)
  "snapshot.schema.json",
  // gameplay loop v2 snapshot (seq ordering) — keep separate name to allow A/B during migration
  "snapshot-v2.schema.json",
  "join-room.schema.json",
  "join-ack.schema.json",
  "flap-input.schema.json",
  "run-end.schema.json",
  "engrave-request.schema.json",
  "engrave-ack.schema.json",
];

// Inline lightweight schema(s) for handshake messages that are not part of the main
// protocol schema directory yet. This avoids having to create physical schema files
// while still keeping strict validation semantics for tests.
const INLINE_SCHEMAS: Record<string, any> = {
  hello: {
    $id: "hello.schema.json",
    type: "object",
    required: ["type", "protocol_version"],
    additionalProperties: true,
    properties: {
      type: { const: "hello" },
      protocol_version: { type: "string" },
    },
  },
  welcome: {
    $id: "welcome.schema.json",
    type: "object",
    required: ["type", "protocol_version", "capabilities"],
    additionalProperties: true,
    properties: {
      type: { const: "welcome" },
      protocol_version: { type: "string" },
      capabilities: { type: "object" },
    },
  },
};

interface CompiledValidator extends Function {
  errors?: ErrorObject[];
}

const schemaValidators: Record<string, CompiledValidator> = {};

for (const file of SCHEMA_FILES) {
  try {
    const schema = loadSchema(file);
    // Register schema explicitly first to ensure $id resolution for later refs.
    if (schema.$id) {
      try {
        ajv.addSchema(schema);
      } catch {
        /* ignore duplicate add */
      }
    }
    const validator = ajv.compile(schema) as CompiledValidator;
    const key = file.replace(/\.schema\.json$/, "");
    schemaValidators[key] = validator;
  } catch (err) {
    // Fail fast with context; tests should reveal missing schema.
    throw new Error(
      `Failed compiling schema ${file}: ${(err as Error).message}`,
    );
  }
}

// Compile inline schemas
for (const [key, schema] of Object.entries(INLINE_SCHEMAS)) {
  try {
    if (schema.$id) {
      try {
        ajv.addSchema(schema);
      } catch {
        /* duplicate ok */
      }
    }
    schemaValidators[key] = ajv.compile(schema) as CompiledValidator;
  } catch (e) {
    throw new Error(
      `Failed compiling inline schema ${key}: ${(e as Error).message}`,
    );
  }
}

// Envelope validator (top-level gate)
const validateEnvelope = schemaValidators["envelope"];

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

// Map of message.type → validator key(s). Some types (snapshot) can refer to multiple schema
// versions; for now we attempt v2 first then fall back to legacy.
const TYPE_TO_VALIDATORS: Record<string, string[]> = {
  // incoming client → server
  hello: ["hello"],
  join: ["join-room"],
  flap: ["flap-input"],
  engrave: ["engrave-request"],
  capabilities_request: ["capabilities-request"],
  capabilities_response: ["capabilities-response"],
  // server → client
  welcome: ["welcome"],
  joinAck: ["join-ack"],
  snapshot: ["snapshot-v2", "snapshot"],
  runEnd: ["run-end"],
  engraveAck: ["engrave-ack"],
};

export function validateMessage(msg: unknown): ValidationResult {
  // First ensure object shape at envelope level (type presence etc.)
  const envelopeOk = validateEnvelope(msg);
  if (!envelopeOk) {
    return {
      valid: false,
      errors: (validateEnvelope.errors || []).map((e: ErrorObject) =>
        `${e.instancePath} ${e.message}`.trim(),
      ),
    };
  }
  const type = extractType(msg as any);
  if (!type) return { valid: false, errors: ["missing type"] };
  const validators = TYPE_TO_VALIDATORS[type];
  if (!validators) {
    // Unknown type — treat as invalid so caller can decide how to handle.
    return { valid: false, errors: [`unknown message type: ${type}`] };
  }
  const errorsCollected: string[] = [];
  for (const key of validators) {
    const v = schemaValidators[key];
    if (!v) {
      errorsCollected.push(`internal: missing validator for ${key}`);
      continue;
    }
    const ok = v(msg);
    if (ok) return { valid: true };
    // Accumulate but continue to allow fallback (e.g., snapshot legacy)
    errorsCollected.push(
      ...(v.errors || []).map((e) =>
        `${key}${e.instancePath} ${e.message}`.trim(),
      ),
    );
  }
  return { valid: false, errors: errorsCollected };
}

export type MessageType = string;

export function extractType(msg: any): MessageType | undefined {
  return msg && typeof msg === "object" ? msg.type : undefined;
}

// Provide typed accessor (using typeof Ajv instance)
export function getAjv(): typeof ajv {
  return ajv;
}

// Expose for tests
export function getSchemaValidators() {
  return schemaValidators;
}
export function getTypeValidatorMapping() {
  return TYPE_TO_VALIDATORS;
}
