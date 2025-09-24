// Room registry service (T020)
import { Room } from "../models/Room.ts";
import { Player } from "../models/Player.ts";
import { cloneRoomConfig, DEFAULT_ROOM_CONFIG } from "../config/roomConfig.ts";

class RoomRegistry {
  private rooms: Room[] = [];

  findOrCreateRoom(): Room {
    // Pick first room with capacity
    for (const r of this.rooms) {
      if (r.humans.size < r.config.max_humans) return r;
    }
    const room = new Room(cloneRoomConfig());
    this.rooms.push(room);
    return room;
  }

  assignPlayer(player: Player): Room {
    const room = this.findOrCreateRoom();
    room.addPlayer(player);
    room.spawnBotsForCurrentHumans();
    return room;
  }

  getRooms(): Room[] {
    return this.rooms;
  }
}

export const roomRegistry = new RoomRegistry();
