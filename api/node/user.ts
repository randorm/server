import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import { GenderEnum, RoleEnum } from "../enum/mod.ts";
import type {
  AnswerModel,
  FieldModel,
  ProfileModel,
  RoomModel,
  UserModel,
} from "../model/mod.ts";
import { DateScalar } from "../scalar/mod.ts";
import type { Node } from "../types.ts";
import { AnswerNode, FieldNode, RoomNode } from "./mod.ts";

export const ProfileNode: Node<ProfileModel> = new GraphQLObjectType({
  name: "Profile",
  fields: () => ({
    firstName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    lastName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    gender: {
      type: new GraphQLNonNull(GenderEnum),
    },
    birthday: {
      type: new GraphQLNonNull(DateScalar),
    },
    bio: {
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
});

export const UserNode: Node<UserModel> = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    username: {
      type: new GraphQLNonNull(GraphQLString),
    },
    role: {
      type: new GraphQLNonNull(RoleEnum),
    },
    views: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["user:views", id]);

        return res.value === null ? 0 : Number(res.value);
      },
    },
    profile: {
      type: new GraphQLNonNull(ProfileNode),
    },
    viewedCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["user:viewed_count", id]);

        return res.value === null ? 0 : Number(res.value);
      },
    },
    viewed: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Set<UserModel>>(["user:viewed", id]);

        if (res.value === null) {
          throw new GraphQLError(`Viewed of User with ID ${id} not found`);
        }

        return res.value;
      },
    },
    subscriptionCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["user:subscription_count", id]);

        return res.value === null ? 0 : Number(res.value);
      },
    },
    subscriptions: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Set<UserModel>>(["user:subscriptions", id]);

        if (res.value === null) {
          throw new GraphQLError(
            `Subscriptions of User with ID ${id} not found`,
          );
        }

        return res.value;
      },
    },
    subscriberCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["user:subscriber_count", id]);

        return res.value === null ? 0 : Number(res.value);
      },
    },
    subscribers: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Set<UserModel>>(["user:subscribers", id]);

        if (res.value === null) {
          throw new GraphQLError(`Subscribers of User with ID ${id} not found`);
        }

        return res.value;
      },
    },
    fields: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(FieldNode),
        ),
      ),
      async resolve({ fieldIds }, _args, { kv }) {
        const fields = [];
        for (const fieldId of fieldIds) {
          const res = await kv.get<FieldModel>(["field", fieldId]);

          if (res.value === null) {
            throw new GraphQLError(`Field with ID ${fieldId} not found`);
          }

          fields.push(res.value);
        }

        return fields;
      },
    },
    answers: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(AnswerNode),
        ),
      ),
      async resolve({ fieldIds, id }, _args, { kv }) {
        const answers = [];
        for (const fieldId of fieldIds) {
          const res = await kv.get<AnswerModel>(["answer", fieldId, id]);

          if (res.value === null) {
            throw new GraphQLError(
              `Answer to Field with ID ${fieldId} from User with ID ${id} not found`,
            );
          }

          answers.push(res.value);
        }

        return answers;
      },
    },
    room: {
      type: RoomNode,
      async resolve({ roomId }, _args, { kv }) {
        if (roomId === null) return null;

        const res = await kv.get<RoomModel>(["room", roomId]);

        if (res.value === null) {
          throw new GraphQLError(`Room with ID ${roomId} not found`);
        }

        return res.value;
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
