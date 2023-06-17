import { assertUserProfile } from "../assert/mod.ts";
import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import { GenderEnum } from "../enum/mod.ts";
import type { UserModel } from "../model/mod.ts";
import { UserNode } from "../node/mod.ts";
import { DateScalar } from "../scalar/mod.ts";
import type { Operation } from "../types.ts";
import { asyncMap } from "../util/mod.ts";

export const UserQuery: Operation = new GraphQLObjectType({
  name: "Query",
  fields: {
    user: {
      type: new GraphQLNonNull(UserNode),
      args: {
        userId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { userId }, { kv }) {
        const res = await kv.get<UserModel>(["user", userId]);

        if (res.value === null) {
          throw new GraphQLError(`User with ID ${userId} not found`);
        }

        return res.value;
      },
    },
    userCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["user_count"]);

        if (res.value === null) {
          throw new GraphQLError("User count not found");
        }

        return Number(res.value);
      },
    },
    users: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve(_root, _args, { kv }) {
        const iter = kv.list<UserModel>({ prefix: ["user"] });

        return await asyncMap(({ value }) => value, iter);
      },
    },
  },
});

export const UserMutation: Operation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    updateUserProfile: {
      type: new GraphQLNonNull(UserNode),
      args: {
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
      },
      async resolve(_root, args, { user, userRes, kv }) {
        assertUserProfile(args);

        const update: UserModel = {
          ...user,
          profile: args,
          updatedAt: new Date(),
        };

        const commitRes = await kv.atomic()
          .check(userRes)
          .set(["user", user.id], update)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(`Failed to update User with ID ${user.id}`);
        }

        return update;
      },
    },
    markViewed: {
      type: new GraphQLNonNull(UserNode),
      args: {
        userId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(_root, { userId }, { user, kv, userRes }) {
        const viewedIdsRes = await kv.get<Set<number>>([
          "user:viewed_ids",
          user.id,
        ]);

        if (viewedIdsRes.value === null) {
          throw new GraphQLError(
            `Viewed IDs of User with ID ${user.id} not found`,
          );
        }

        const targetRes = await kv.get<UserModel>(["user", userId]);

        if (targetRes.value === null) {
          throw new GraphQLError(`User with ID ${userId} not found`);
        }

        const viewedIds = new Set<number>([...viewedIdsRes.value, userId]);

        const commitRes = await kv.atomic()
          .check(userRes)
          .set(["user:viewed_ids", user.id], viewedIds)
          .sum(["user:viewed_count", user.id], 1n)
          .sum(["user:views", userId], 1n)
          .commit();

        if (!commitRes.ok) {
          throw new GraphQLError(`Failed to update User with ID ${userId}`);
        }

        return targetRes.value;
      },
    },
  },
});
