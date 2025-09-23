import path from 'path';
import fs from 'fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// T006: Contract test for envelope types parity
// This test is expected to FAIL initially because the implementation schemas do not yet exist (T017+).
// It validates that all planned message types including FR-023 capabilities messages are covered.

describe('Protocol Envelope Contract (T006)', () => {
  const ajv = new Ajv({allErrors: true, strict: true});
  addFormats(ajv);

  const envelopeSchemaPath = path.join(__dirname, '../../../shared/schemas/protocol/v1/envelope.schema.json');
  let schema: any;

  beforeAll(() => {
    if (!fs.existsSync(envelopeSchemaPath)) {
      // Force a failing condition with clear message until schema is implemented.
      throw new Error(`Missing schema file: ${envelopeSchemaPath} (implement in T017)`);
    }
    schema = JSON.parse(fs.readFileSync(envelopeSchemaPath, 'utf-8'));
  });

  test('includes all required message type discriminators', () => {
    const expectedTypes = [
      'hello',
      'welcome',
      'error',
      'input',
      'engrave',
      'snapshot',
      'runStart',
      'runEnd',
      'capabilities_request',
      'capabilities_response'
    ];

    // Collect any obvious enumerations / oneOf branches
    const typeValues: string[] = [];

    function collect(obj: any) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.const && typeof obj.const === 'string') typeValues.push(obj.const);
      if (Array.isArray(obj.oneOf)) obj.oneOf.forEach(collect);
      if (Array.isArray(obj.anyOf)) obj.anyOf.forEach(collect);
      if (Array.isArray(obj.allOf)) obj.allOf.forEach(collect);
      if (obj.properties) Object.values(obj.properties).forEach(collect);
      if (obj.definitions) Object.values(obj.definitions).forEach(collect);
    }

    collect(schema);

    expectedTypes.forEach(t => {
      expect(typeValues).toContain(t); // ensure each expected type is represented
    });
  });
});
