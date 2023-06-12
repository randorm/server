import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import type { RoomGroupModel, RoomModel, UserModel } from "../model/mod.ts";
import { DateScalar } from "../scalar/mod.ts";
import type { Node } from "../types.ts";
import { UserNode } from "./mod.ts";

export const RoomGroupNode: Node<RoomGroupModel> = new GraphQLObjectType({
  name: "RoomGroup",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    creator: {
      type: new GraphQLNonNull(UserNode),
      async resolve({ creatorId }, _args, { kv }) {
        const res = await kv.get<UserModel>(["user", creatorId]);

        if (res.value === null) {
          throw new GraphQLError(`User with ID ${creatorId} not found`);
        }

        return res.value;
      },
    },
    roomCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ roomIds }) => roomIds.size,
    },
    rooms: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(RoomNode),
        ),
      ),
      async resolve({ roomIds }, _args, { kv }) {
        const rooms = [];
        for (const roomId of roomIds) {
          const res = await kv.get<RoomModel>(["room", roomId]);

          if (res.value === null) {
            throw new GraphQLError(`Room with ID ${roomId} not found`);
          }

          rooms.push(res.value);
        }

        return rooms;
      },
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
    updatedAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});

export const RoomNode: Node<RoomModel> = new GraphQLObjectType({
  name: "Room",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    creator: {
      type: new GraphQLNonNull(UserNode),
      async resolve({ creatorId }, _args, { kv }) {
        const res = await kv.get<UserModel>(["user", creatorId]);

        if (res.value === null) {
          throw new GraphQLError(`User with ID ${creatorId} not found`);
        }

        return res.value;
      },
    },
    capacity: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    price: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    groups: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(RoomGroupNode),
        ),
      ),
      async resolve({ groupIds }, _args, { kv }) {
        const groups = [];
        for (const groupId of groupIds) {
          const res = await kv.get<RoomGroupModel>(["room_group", groupId]);

          if (res.value === null) {
            throw new GraphQLError(`RoomGroup with ID ${groupId} not found`);
          }

          groups.push(res.value);
        }

        return groups;
      },
    },
    members: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve({ memberIds }, _args, { kv }) {
        const members = [];
        for (const memberId of memberIds) {
          const res = await kv.get<UserModel>(["user", memberId]);

          if (res.value === null) {
            throw new GraphQLError(`User with ID ${memberId} not found`);
          }

          members.push(res.value);
        }

        return members;
      },
    },
    createdAt: {
      type: new GraphQLNonNull(DateScalar),
    },
    updatedAt: {
      type: new GraphQLNonNull(DateScalar),
    },
  }),
});
