import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { Room } from "./room.js";

export interface RoomManagerOptions {
  capacity?: number; // default 32
  protocolVersion: string;
  onLog?: (entry: any) => void;
}

export class RoomManager {
  private rooms: Room[] = [];
  private sessionToRoom: Map<string, Room> = new Map();
  private readonly capacity: number;
  private readonly protocolVersion: string;
  private readonly onLog?: (entry: any) => void;

  constructor(opts: RoomManagerOptions) {
    this.capacity = opts.capacity ?? 32;
    this.protocolVersion = opts.protocolVersion;
    this.onLog = opts.onLog;
  }

  // Allocate or reuse a room with space
  private getOrCreateRoom() {
    let room = this.rooms.find((r) => r.hasSpace());
    if (!room) {
      room = new Room({
        id: uuidv4(),
        seed: uuidv4(),
        capacity: this.capacity,
        protocolVersion: this.protocolVersion,
        onLog: this.onLog,
      });
      this.rooms.push(room);
    }
    return room;
  }

  addSession(sessionId: string, ws: WebSocket) {
    const room = this.getOrCreateRoom();
    room.addSession(sessionId, ws);
    this.sessionToRoom.set(sessionId, room);
    return room;
  }

  handleJoin(sessionId: string, messageId: string) {
    const room = this.sessionToRoom.get(sessionId);
    if (!room) return;
    room.handleJoin(sessionId, messageId);
  }

  handleFlap(sessionId: string, messageId: string) {
    const room = this.sessionToRoom.get(sessionId);
    if (!room) return;
    room.handleFlap(sessionId, messageId);
  }

  removeSession(sessionId: string) {
    const room = this.sessionToRoom.get(sessionId);
    if (!room) return;
    room.removeSession(sessionId);
    this.sessionToRoom.delete(sessionId);
    // If the room became empty, stop it and remove from list
    if ((room as any).size?.() === 0) {
      (room as any).stop?.();
      this.rooms = this.rooms.filter((r) => r !== room);
    }
  }

  stopAll() {
    for (const room of this.rooms) (room as any).stop?.();
    this.sessionToRoom.clear();
    this.rooms = [];
  }
}
