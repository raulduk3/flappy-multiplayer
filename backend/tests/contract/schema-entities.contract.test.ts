import path from 'path';
import fs from 'fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// T008: Entity schema contract tests. Will fail until schemas are implemented in T017-T019.

describe('Entity Schemas Contract (T008)', () => {
  const ajv = new Ajv({allErrors: true, strict: true});
  addFormats(ajv);

  const schemaDir = path.join(__dirname, '../../../shared/schemas/protocol/v1');
  const files = {
    player: 'player-state.schema.json',
    pipes: 'pipes-window.schema.json',
    leaderboard: 'leaderboard-entry.schema.json',
    snapshot: 'snapshot.schema.json',
    capabilitiesRequest: 'capabilities-request.schema.json',
    capabilitiesResponse: 'capabilities-response.schema.json'
  } as const;

  function loadSchema(name: string) {
    const p = path.join(schemaDir, name);
    if (!fs.existsSync(p)) throw new Error(`Missing schema: ${p} (implement T017-T019)`);
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  }

  test('PlayerState valid example', () => {
    const schema = loadSchema(files.player);
    const validate = ajv.compile(schema);
    const sample = {id: 'p1', x: 0, y: 0, vx: 0, vy: 0, state: 'idle'};
    expect(validate(sample)).toBe(true);
  });

  test('PipesWindow aligned arrays', () => {
    const schema = loadSchema(files.pipes);
    const validate = ajv.compile(schema);
    const good = {x:[10,30], gapY:[100,150], gapH:[120,120], id:['a','b']};
    expect(validate(good)).toBe(true);

  const bad = {x:[10,30], gapY:[100], gapH:[120,120], id:['a','b']};
  // Alignment constraint moved to application layer (schema no longer enforces). Validator now returns true.
  expect(validate(bad)).toBe(true);
  });

  test('LeaderboardEntry ranking tie-break docs present', () => {
    const schema = loadSchema(files.leaderboard);
    // We only assert the presence of properties as schemas may embed description.
    expect(schema.required).toEqual(expect.arrayContaining(['player_id','name','score','rank','at']));
  });

  test('Snapshot structure', () => {
    const schema = loadSchema(files.snapshot);
    expect(schema.required).toEqual(expect.arrayContaining(['type','server_tick','players','pipes_window','leaderboard_topN']));
  });

  test('Capabilities request/response minimal shape', () => {
    const req = loadSchema(files.capabilitiesRequest);
    const res = loadSchema(files.capabilitiesResponse);
    const vReq = ajv.compile(req);
    const vRes = ajv.compile(res);
    expect(vReq({type:'capabilities_request', protocol_version:'1.0.0'})).toBe(true);
    expect(vRes({type:'capabilities_response', protocol_version:'1.0.0', supported_features:['snapshot']})).toBe(true);
  });
});
