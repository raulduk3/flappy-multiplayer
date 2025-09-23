// T033: Unit tests for error mapping utilities
import {ERRORS} from '../../src/ws/errors.js';

describe('ERRORS mapping', () => {
  const VERSION = '1.0.0';
  test('unsupportedBeforeHandshake', () => {
    const e = ERRORS.unsupportedBeforeHandshake(VERSION);
    expect(e.code).toBe('unsupported_action');
    expect(e.message).toMatch(/not allowed/i);
  });
  test('incompatibleProtocol includes clientVersion detail', () => {
    const e = ERRORS.incompatibleProtocol(VERSION, '2.0.0');
    expect(e.code).toBe('incompatible_protocol');
    expect(e.details.clientVersion).toBe('2.0.0');
  });
  test('validation collects details', () => {
    const e = ERRORS.validation(VERSION, {reason: 'bad'});
    expect(e.code).toBe('validation_error');
    expect(e.details.reason).toBe('bad');
  });
});
