import AjvImport, { type ValidateFunction } from "ajv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadSchema(relPath: string) {
  const schemaPath = resolve(
    process.cwd(),
    "shared/schemas/protocol/v1",
    relPath,
  );
  const content = readFileSync(schemaPath, "utf-8");
  return JSON.parse(content);
}

// Some TS + NodeNext setups see Ajv default export as non-constructable. Cast to any to satisfy tsc.
const Ajv: any = AjvImport as any;
const ajv = new Ajv({ allErrors: true, strict: false });

// Load and compile schemas
const envelopeSchema = loadSchema("envelope.schema.json");
const testPingSchema = loadSchema("test.ping.request.schema.json");
const ackSuccessSchema = loadSchema("test.ping.ack.success.schema.json");
const ackErrorSchema = loadSchema("ack.error.schema.json");

const validateEnvelopeFn: ValidateFunction = ajv.compile(envelopeSchema);
const validateTestPingFn: ValidateFunction = ajv.compile(testPingSchema);
const validateAckSuccessFn: ValidateFunction = ajv.compile(ackSuccessSchema);
const validateAckErrorFn: ValidateFunction = ajv.compile(ackErrorSchema);

export function validateEnvelope(data: unknown) {
  const ok = validateEnvelopeFn(data);
  return { ok: !!ok, errors: validateEnvelopeFn.errors };
}

export function validateTestPing(data: unknown) {
  const ok = validateTestPingFn(data);
  return { ok: !!ok, errors: validateTestPingFn.errors };
}

export function validateAckSuccess(data: unknown) {
  const ok = validateAckSuccessFn(data);
  return { ok: !!ok, errors: validateAckSuccessFn.errors };
}

export function validateAckError(data: unknown) {
  const ok = validateAckErrorFn(data);
  return { ok: !!ok, errors: validateAckErrorFn.errors };
}
