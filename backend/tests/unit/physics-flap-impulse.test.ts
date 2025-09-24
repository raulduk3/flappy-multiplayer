// T059: Flap impulse constant identical usage
import { FLAP_IMPULSE } from "../../../shared/src/physics/constants.ts";

describe("Physics Flap Impulse (T059)", () => {
  test("constant exported and numeric", () => {
    expect(typeof FLAP_IMPULSE).toBe("number");
    expect(FLAP_IMPULSE).toBeLessThan(0); // upward negative
  });
});
