import Ajv, {ErrorObject} from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';

// T020: Central Ajv validator loader & compile-once registry.

const ajv = new Ajv({allErrors: true, strict: true});
addFormats(ajv);

// Resolve schemas relative to repo root regardless of cwd (backend/ tests run with cwd=backend)
const schemaDir = path.join(__dirname, '..', '..', '..', 'shared', 'schemas', 'protocol', 'v1');

function loadSchema(file: string) {
  const p = path.join(schemaDir, file);
  if (!fs.existsSync(p)) throw new Error(`Schema file missing: ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// Preload top-level envelope schema; others are referenced inline or separate.
const envelopeSchema = loadSchema('envelope.schema.json');
const validateEnvelope = ajv.compile(envelopeSchema) as ((data: unknown)=>boolean) & {errors?: ErrorObject[]};

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export function validateMessage(msg: unknown): ValidationResult {
  const ok = validateEnvelope(msg);
  if (ok) return {valid: true};
  return {
    valid: false,
  errors: (validateEnvelope.errors || []).map((e: ErrorObject) => `${e.instancePath} ${e.message}`.trim())
  };
}

export type MessageType = string;

export function extractType(msg: any): MessageType | undefined {
  return msg && typeof msg === 'object' ? msg.type : undefined;
}

export function getAjv(): Ajv { return ajv; }
