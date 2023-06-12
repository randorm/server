import { assertEditor, assertRoom, assertRoomGroup } from "../assert/mod.ts";
import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import type { RoomGroupModel, RoomModel } from "../model/mod.ts";
import { RoomGroupNode, RoomNode } from "../node/mod.ts";
import type { Operation } from "../types.ts";
import { asyncMap } from "../util/mod.ts";

export const RoomQuery: Operation = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    room: {
      type: new GraphQLNonNull(RoomNode),
      args: {
        roomId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { roomId }, { kv }) {
        const res = await kv.get<RoomModel>(["room", roomId]);

        if (res.value === null) {
          throw new GraphQLError(`Room with ID ${roomId} not found`);
        }

        return res.value;
      },
    },
    roomCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["room_count"]);

        return res.value === null ? 0 : Number(res.value);
      },
    },
    rooms: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(RoomNode),
        ),
      ),
      async resolve(_root, _args, { kv }) {
        const iter = kv.list<RoomModel>({ prefix: ["room"] });

        return await asyncMap(({ value }) => value, iter);
      },
    },
    roomGroup: {
      type: new GraphQLNonNull(RoomGroupNode),
      args: {
        roomGroupId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { roomGroupId }, { kv }) {
        const res = await kv.get<RoomGroupModel>(["room_group", roomGroupId]);

        if (res.value === null) {
          throw new GraphQLError(`RoomGroup with ID ${roomGroupId} not found`);
        }

        return res.value;
      },
    },
    roomGroupCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["room_group_count"]);

        return res.value === null ? 0 : Number(res.value);
      },
    },
    roomGroups: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(RoomGroupNode),
        ),
      ),
      async resolve(_root, _args, { kv }) {
        const iter = kv.list<RoomGroupModel>({ prefix: ["room_group"] });

        return await asyncMap(({ value }) => value, iter);
      },
    },
  }),
});

export const RoomMutation: Operation = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    createRoom: {
      type: new GraphQLNonNull(RoomNode),
      args: {
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
        capacity: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        price: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { name, capacity, price }, { user, kv }) {
        assertEditor(user);

        const countRes = await kv.get<Deno.KvU64>(["room_count"]);

        const room: RoomModel = {
          id: countRes.value === null ? 0 : Number(countRes.value),
          name,
          creatorId: user.id,
          capacity,
          price,
          groupIds: new Set(),
          memberIds: new Set(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        assertRoom(room);

        const commitRes = await kv.atomic()
          .check(countRes)
          .set(["room", room.id], room)
          .sum(["room_count"], 1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError("Failed to create Room");
        }

        return room;
      },
    },
    updateRoom: {
      type: new GraphQLNonNull(RoomNode),
      args: {
        roomId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
        capacity: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        price: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { roomId, name, capacity, price }, { user, kv }) {
        assertEditor(user);

        const roomRes = await kv.get<RoomModel>(["room", roomId]);

        if (roomRes.value === null) {
          throw new GraphQLError(`Room with ID ${roomId} not found`);
        }

        const update: RoomModel = {
          ...roomRes.value,
          name,
          capacity,
          price,
          updatedAt: new Date(),
        };

        assertRoom(update);

        const commitRes = await kv.atomic()
          .check(roomRes)
          .set(["room", roomId], update)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(`Failed to update Room with ID ${roomId}`);
        }

        return update;
      },
    },
    createRoomGroup: {
      type: new GraphQLNonNull(RoomGroupNode),
      args: {
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      async resolve(_root, { name }, { user, kv }) {
        assertEditor(user);

        const countRes = await kv.get<Deno.KvU64>(["room_group_count"]);

        const roomGroup: RoomGroupModel = {
          id: countRes.value === null ? 0 : Number(countRes.value),
          name,
          creatorId: user.id,
          roomIds: new Set(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        assertRoomGroup(roomGroup);

        const commitRes = await kv.atomic()
          .check(countRes)
          .set(["room_group", roomGroup.id], roomGroup)
          .sum(["room_group_count"], 1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError("Failed to create RoomGroup");
        }

        return roomGroup;
      },
    },
    updateRoomGroup: {
      type: new GraphQLNonNull(RoomGroupNode),
      args: {
        roomGroupId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        name: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      async resolve(_root, { roomGroupId, name }, { user, kv }) {
        assertEditor(user);

        const groupRes = await kv.get<RoomGroupModel>([
          "room_group",
          roomGroupId,
        ]);

        if (groupRes.value === null) {
          throw new GraphQLError(`RoomGroup with ID ${roomGroupId} not found`);
        }

        const update: RoomGroupModel = {
          ...groupRes.value,
          name,
          updatedAt: new Date(),
        };

        assertRoomGroup(update);

        const commitRes = await kv.atomic()
          .check(groupRes)
          .set(["room_group", roomGroupId], update)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to update RoomGroup with ID ${roomGroupId}`,
          );
        }

        return update;
      },
    },
    // extendRoomGroup: {
    //   type: new GraphQLNonNull(RoomGroupNode),
    //   args: {
    //     roomGroupId: {
    //       type: new GraphQLNonNull(GraphQLInt),
    //     },
    //     roomIds: {
    //       type: new GraphQLNonNull(
    //         new GraphQLList(
    //           new GraphQLNonNull(GraphQLInt),
    //         ),
    //       ),
    //     },
    //   },
    //   async resolve(_root, { roomGroupId, roomIds }, { user, kv }) {
    //     const groupRes = await kv.get<RoomGroupModel>([
    //       "room_group",
    //       roomGroupId,
    //     ]);

    //     if (groupRes.value === null) {
    //       throw new GraphQLError(`RoomGroup with ID ${roomGroupId} not found`);
    //     }

    //     const roomIdsSet = new Set<number>(roomIds);

    //     for (const roomId of roomIdsSet) {
    //       if (groupRes.value.roomIds.has(roomId)) continue;

    //       const roomRes = await kv.get<RoomModel>(["room", roomId]);

    //       if (roomRes.value === null) {
    //         throw new GraphQLError(`Room with ID ${roomId} not found`);
    //       }

    //       const update: RoomModel = {
    //         ...roomRes.value,
    //         groupIds: new Set([...roomRes.value.groupIds, roomGroupId]),
    //         updatedAt: new Date(),
    //       };

    //       const commitRes = await kv.atomic()
    //         .check(roomRes)
    //         .set(["room", roomId], update)
    //         .commit();

    //       if (!commitRes.ok) {
    //         throw new GraphQLError(
    //           `Failed to update Room with ID ${roomId}`,
    //         );
    //       }
    //     }
    //   },
    // },
  }),
});
