// T061: Multi-room capacity expansion integration test
import { handleJoin } from "../../src/server/handlers/join.ts";
import { roomRegistry } from "../../src/server/services/roomRegistry.ts";

describe("Multi-room Capacity (T061)", () => {
  test("joining beyond capacity creates a new room", () => {
    const max = 5; // use smaller capacity by mutating first room for test isolation
    // First join sets up first room
    const firstSent: any[] = [];
    const { room: firstRoom } = handleJoin("capUser0", (m) =>
      firstSent.push(m),
    );
    // Override capacity lower for faster test
    (firstRoom.config as any).max_humans = max;
    // Fill to capacity
    for (let i = 1; i < max; i++) handleJoin("capUser" + i, () => {});
    expect(firstRoom.humans.size).toBe(max);
    const roomsBefore = roomRegistry.getRooms().length;
    // Next join should allocate a second room
    const { room: secondRoom } = handleJoin("capUserX", () => {});
    expect(secondRoom.room_id).not.toBe(firstRoom.room_id);
    expect(roomRegistry.getRooms().length).toBe(roomsBefore + 1);
  });
});
