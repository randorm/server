import { GraphQLError } from "../deps.ts";
import type { RoomModel } from "../model/mod.ts";

export function assertRoom(room: RoomModel) {
  if (!room.name || room.name.length > 32) {
    throw new GraphQLError("Room name should be between 1 and 32 characters");
  }

  if (room.capacity <= 0) {
    throw new GraphQLError(
      `Room with ID ${room.id} has capacity less than or equal to 0`,
    );
  }

  if (room.price < 0) {
    throw new GraphQLError(`Room with ID ${room.id} has price less than 0`);
  }

  if (room.memberIds.size > room.capacity) {
    throw new GraphQLError(
      `Room with ID ${room.id} has more members than capacity`,
    );
  }
}
