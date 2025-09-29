import { describe, it, expect } from "vitest";
import { WebSocket } from "ws";
import { RoomManager } from "../../src/server/roomManager";

function mockWS() {
  return { send: () => {}, close: () => {} } as unknown as WebSocket;
}

describe("RoomManager capacity and assignment", () => {
  it("fills first room up to 32, then creates a new room", () => {
    const rm = new RoomManager({ capacity: 32, protocolVersion: "1" });
    const roomIds: string[] = [];
    for (let i = 0; i < 33; i++) {
      const ws = mockWS();
      const sessionId = `s${i + 1}`;
      const room = rm.addSession(sessionId, ws);
      roomIds.push(room.id);
    }
    const first = roomIds[0];
    const firstRoomCount = roomIds.filter((id) => id === first).length;
    expect(firstRoomCount).toBe(32);
    const uniqueRooms = new Set(roomIds);
    expect(uniqueRooms.size).toBe(2);
  });
});
