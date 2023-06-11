import { GraphQLError } from "../deps.ts";
import type { RoomGroupModel } from "../model/mod.ts";

export function assertRoomGroup(roomGroup: RoomGroupModel) {
  if (!roomGroup.name || roomGroup.name.length > 32) {
    throw new GraphQLError(
      "RoomGroup name should be between 1 and 32 characters",
    );
  }
}
