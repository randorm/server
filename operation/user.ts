import { recommend } from "../algorithms/mod.ts";
import { assertUserProfile } from "../assert/mod.ts";
import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import type { ProfileModel, UserModel } from "../model/mod.ts";
import { DateScalar } from "../scalar/mod.ts";
import { GenderEnum, UserNode } from "../type/mod.ts";
import type { Operation } from "../types.ts";
import type {
  MarkViewedUpdateModel,
  SubscribeUpdateModel,
  UnsubscribeUpdateModel,
} from "../update/mod.ts";
import {
  MarkViewedUpdate,
  SubscribeUpdate,
  UnsubscribeUpdate,
} from "../update/mod.ts";
import { amap, filter } from "../utils/mod.ts";

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
      async resolve(
        _root,
        { userId }: { userId: number },
        { kv },
      ): Promise<UserModel> {
        const res = await kv.get<UserModel>(["user", userId]);

        if (res.value === null) {
          throw new GraphQLError(`User with ID ${userId} not found`);
        }

        return res.value;
      },
    },
    me: {
      type: new GraphQLNonNull(UserNode),
      resolve: (_root, _args, { user }): UserModel => user,
    },
    userCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, { kv }): Promise<number> {
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
      async resolve(_root, _args, { kv }): Promise<UserModel[]> {
        const iter = kv.list<UserModel>({ prefix: ["user"] });

        return await amap(({ value }) => value, iter);
      },
    },
    recommend: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        amount: {
          type: new GraphQLNonNull(GraphQLInt),
          defaultValue: 5,
        },
      },
      async resolve(
        _root,
        { distributionId, amount }: { distributionId: number; amount: number },
        context,
      ): Promise<UserModel[]> {
        if (amount < 1 || amount > 10) {
          throw new GraphQLError("Amount must be between 1 and 10");
        }

        return await recommend(distributionId, amount, context);
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
      async resolve(
        _root,
        args: ProfileModel,
        { user, userRes, kv },
      ): Promise<UserModel> {
        assertUserProfile(args);

        if (args.gender !== user.profile.gender) {
          const distributionCountRes = await kv.get<Deno.KvU64>([
            "user:distribution_count",
            user.id,
          ]);

          if (distributionCountRes.value === null) {
            throw new GraphQLError(
              `Distribution count of User with ID ${user.id} not found`,
            );
          }

          if (distributionCountRes.value.value) {
            throw new GraphQLError(
              "User cannot change gender after joining the first distribution",
            );
          }
        }

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
      type: new GraphQLNonNull(MarkViewedUpdate),
      args: {
        userId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        { userId }: { userId: number },
        { kv, user },
      ): Promise<MarkViewedUpdateModel> {
        if (userId === user.id) {
          throw new GraphQLError("User cannot view themselves");
        }

        const [userRes, viewedIdsRes] = await kv.getMany<[
          UserModel,
          Set<number>,
        ]>([
          ["user", userId],
          ["user:viewed_ids", user.id],
        ]);

        if (userRes.value === null) {
          throw new GraphQLError(`User with ID ${userId} not found`);
        }
        if (viewedIdsRes.value === null) {
          throw new GraphQLError(
            `Viewed IDs of User with ID ${user.id} not found`,
          );
        }

        const operation = kv.atomic()
          .sum(["user:views", userId], 1n);

        if (!viewedIdsRes.value.has(userId)) {
          const viewedIds = new Set<number>([...viewedIdsRes.value, userId]);

          operation
            .check(viewedIdsRes)
            .set(["user:viewed_ids", user.id], viewedIds)
            .sum(["user:viewed_count", user.id], 1n);
        }

        const commitRes = await operation.commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to mark User with ID ${userId} viewed`,
          );
        }

        return { user: userRes.value, viewer: user };
      },
    },
    subscribe: {
      type: new GraphQLNonNull(SubscribeUpdate),
      args: {
        userId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        { userId }: { userId: number },
        { kv, user },
      ): Promise<SubscribeUpdateModel> {
        if (userId === user.id) {
          throw new GraphQLError("User cannot subscribe to themselves");
        }

        const [
          userRes,
          subscriptionIdsRes,
          subscriberIdsRes,
        ] = await kv.getMany<[
          UserModel,
          Set<number>,
          Set<number>,
        ]>([
          ["user", userId],
          ["user:subscription_ids", user.id],
          ["user:subscriber_ids", userId],
        ]);

        if (userRes.value === null) {
          throw new GraphQLError(`User with ID ${userId} not found`);
        }
        if (subscriptionIdsRes.value === null) {
          throw new GraphQLError(
            `Subscription IDs of User with ID ${user.id} not found`,
          );
        }
        if (subscriberIdsRes.value === null) {
          throw new GraphQLError(
            `Subscriber IDs of User with ID ${userId} not found`,
          );
        }

        const inSubscriptions = subscriptionIdsRes.value.has(userId);
        const inSubscribers = subscriberIdsRes.value.has(user.id);

        if (inSubscriptions && inSubscribers) {
          return { user: userRes.value, subscriber: user };
        }

        const operation = kv.atomic();

        if (!inSubscriptions) {
          const subscriptionIds = new Set<number>([
            ...subscriptionIdsRes.value,
            userId,
          ]);

          operation
            .check(subscriptionIdsRes)
            .set(["user:subscription_ids", user.id], subscriptionIds)
            .sum(["user:subscription_count", user.id], 1n);
        }

        if (!inSubscribers) {
          const subscriberIds = new Set<number>([
            ...subscriberIdsRes.value,
            user.id,
          ]);

          operation
            .check(subscriberIdsRes)
            .set(["user:subscriber_ids", userId], subscriberIds)
            .sum(["user:subscriber_count", userId], 1n);
        }

        const commitRes = await operation.commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to subscribe to User with ID ${userId}`,
          );
        }

        return { user: userRes.value, subscriber: user };
      },
    },
    unsubscribe: {
      type: new GraphQLNonNull(UnsubscribeUpdate),
      args: {
        userId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        { userId }: { userId: number },
        { kv, user },
      ): Promise<UnsubscribeUpdateModel> {
        if (userId === user.id) {
          throw new GraphQLError("User cannot unsubscribe from themselves");
        }

        const [
          userRes,
          subscriptionCountRes,
          subscriptionIdsRes,
          subscriberCountRes,
          subscriberIdsRes,
        ] = await kv.getMany<[
          UserModel,
          Deno.KvU64,
          Set<number>,
          Deno.KvU64,
          Set<number>,
        ]>([
          ["user", userId],
          ["user:subscription_count", user.id],
          ["user:subscription_ids", user.id],
          ["user:subscriber_count", userId],
          ["user:subscriber_ids", userId],
        ]);

        if (userRes.value === null) {
          throw new GraphQLError(`User with ID ${userId} not found`);
        }
        if (subscriptionCountRes.value === null) {
          throw new GraphQLError(
            `Subscription count of User with ID ${user.id} not found`,
          );
        }
        if (subscriptionIdsRes.value === null) {
          throw new GraphQLError(
            `Subscription IDs of User with ID ${user.id} not found`,
          );
        }
        if (subscriberCountRes.value === null) {
          throw new GraphQLError(
            `Subscriber count of User with ID ${userId} not found`,
          );
        }
        if (subscriberIdsRes.value === null) {
          throw new GraphQLError(
            `Subscriber IDs of User with ID ${userId} not found`,
          );
        }

        const inSubscriptionIds = subscriptionIdsRes.value.has(userId);
        const inSubscriberIds = subscriberIdsRes.value.has(user.id);

        if (!inSubscriptionIds && !inSubscriberIds) {
          return { user: userRes.value, unsubscriber: user };
        }

        const operation = kv.atomic();

        if (inSubscriptionIds) {
          const subscriptionIds = new Set<number>(
            filter((id) => id !== userId, subscriptionIdsRes.value),
          );

          operation
            .check(subscriptionCountRes)
            .check(subscriptionIdsRes)
            .set(
              ["user:subscription_count", user.id],
              new Deno.KvU64(BigInt(subscriptionIds.size)),
            )
            .set(["user:subscription_ids", user.id], subscriptionIds);
        }

        if (inSubscriberIds) {
          const subscriberIds = new Set<number>(
            filter((id) => id !== user.id, subscriberIdsRes.value),
          );

          operation
            .check(subscriberCountRes)
            .check(subscriberIdsRes)
            .set(
              ["user:subscriber_count", userId],
              new Deno.KvU64(BigInt(subscriberIds.size)),
            )
            .set(["user:subscriber_ids", userId], subscriberIds);
        }

        const commitRes = await operation.commit();

        if (!commitRes.ok) {
          throw new GraphQLError(
            `Failed to unsubscribe from User with ID ${userId}`,
          );
        }

        return { user: userRes.value, unsubscriber: user };
      },
    },
  },
});
