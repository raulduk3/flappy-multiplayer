// T036: Performance sanity test for message validation
// Skippable via CI by setting VALIDATION_PERF=skip
import {validateMessage} from '../../src/ws/validation.js';

const ITERATIONS = 500;

function time<T>(fn: ()=>T): {ms:number; result:T} {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return {ms: end - start, result};
}

describe('validation performance (T036)', () => {
  const skip = process.env.VALIDATION_PERF === 'skip';
  (skip ? test.skip : test)('average validation under 5ms per call (synthetic)', () => {
    const sample = {type:'hello', protocol_version:'1.0.0'};
    // Warm-up
    for (let i=0;i<50;i++) validateMessage(sample);
    const total = time(()=>{
      for (let i=0;i<ITERATIONS;i++) validateMessage(sample);
    }).ms;
    const avg = total / ITERATIONS;
    // Soft threshold (in CI on shared runners might be higher); just assert < 5ms
    expect(avg).toBeLessThan(5);
  });
});
