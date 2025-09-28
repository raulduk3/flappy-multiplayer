import { v4 as uuidv4 } from "uuid";
import { Room } from "./room.js";
export class RoomManager {
    rooms = [];
    sessionToRoom = new Map();
    capacity;
    protocolVersion;
    onLog;
    constructor(opts) {
        this.capacity = opts.capacity ?? 32;
        this.protocolVersion = opts.protocolVersion;
        this.onLog = opts.onLog;
    }
    // Allocate or reuse a room with space
    getOrCreateRoom() {
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
    addSession(sessionId, ws) {
        const room = this.getOrCreateRoom();
        room.addSession(sessionId, ws);
        this.sessionToRoom.set(sessionId, room);
        return room;
    }
    handleJoin(sessionId, messageId) {
        const room = this.sessionToRoom.get(sessionId);
        if (!room)
            return;
        room.handleJoin(sessionId, messageId);
    }
    handleFlap(sessionId, messageId) {
        const room = this.sessionToRoom.get(sessionId);
        if (!room)
            return;
        room.handleFlap(sessionId, messageId);
    }
    removeSession(sessionId) {
        const room = this.sessionToRoom.get(sessionId);
        if (!room)
            return;
        room.removeSession(sessionId);
        this.sessionToRoom.delete(sessionId);
        // If the room became empty, stop it and remove from list
        if (room.size?.() === 0) {
            room.stop?.();
            this.rooms = this.rooms.filter((r) => r !== room);
        }
    }
    stopAll() {
        for (const room of this.rooms)
            room.stop?.();
        this.sessionToRoom.clear();
        this.rooms = [];
    }
}
