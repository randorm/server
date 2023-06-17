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
  DistributionModel,
  GroupModel,
  ProfileModel,
  UserModel,
} from "../model/mod.ts";
import { DateScalar } from "../scalar/mod.ts";
import type { Node } from "../types.ts";
import { AnswerNode, DistributionNode, GroupNode } from "./mod.ts";

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

        if (res.value === null) {
          throw new GraphQLError(`Views of User with ID ${id} not found`);
        }

        return Number(res.value);
      },
    },
    profile: {
      type: new GraphQLNonNull(ProfileNode),
    },
    viewedCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["user:viewed_count", id]);

        if (res.value === null) {
          throw new GraphQLError(
            `Viewed count of User with ID ${id} not found`,
          );
        }

        return Number(res.value);
      },
    },
    viewed: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const viewedIdsRes = await kv.get<Set<number>>(["user:viewed_ids", id]);

        if (viewedIdsRes.value === null) {
          throw new GraphQLError(`Viewed IDs of User with ID ${id} not found`);
        }

        const viewed = [];
        for (const viewedId of viewedIdsRes.value) {
          const userRes = await kv.get<UserModel>(["user", viewedId]);

          if (userRes.value === null) {
            throw new GraphQLError(`User with ID ${viewedId} not found`);
          }

          viewed.push(userRes.value);
        }

        return viewed;
      },
    },
    subscriptionCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["user:subscription_count", id]);

        if (res.value === null) {
          throw new GraphQLError(
            `Subscription count of User with ID ${id} not found`,
          );
        }

        return Number(res.value);
      },
    },
    subscriptions: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const subscriptionIdsRes = await kv.get<Set<number>>([
          "user:subscription_ids",
          id,
        ]);

        if (subscriptionIdsRes.value === null) {
          throw new GraphQLError(
            `Subscription IDs of User with ID ${id} not found`,
          );
        }

        const subscriptions = [];
        for (const subscriptionId of subscriptionIdsRes.value) {
          const userRes = await kv.get<UserModel>(["user", subscriptionId]);

          if (userRes.value === null) {
            throw new GraphQLError(`User with ID ${subscriptionId} not found`);
          }

          subscriptions.push(userRes.value);
        }

        return subscriptions;
      },
    },
    subscriberCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["user:subscriber_count", id]);

        if (res.value === null) {
          throw new GraphQLError(
            `Subscriber count of User with ID ${id} not found`,
          );
        }

        return Number(res.value);
      },
    },
    subscribers: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const subscriberIdsRes = await kv.get<Set<number>>([
          "user:subscriber_ids",
          id,
        ]);

        if (subscriberIdsRes.value === null) {
          throw new GraphQLError(
            `Subscriber IDs of User with ID ${id} not found`,
          );
        }

        const subscribers = [];
        for (const subscriberId of subscriberIdsRes.value) {
          const userRes = await kv.get<UserModel>(["user", subscriberId]);

          if (userRes.value === null) {
            throw new GraphQLError(`User with ID ${subscriberId} not found`);
          }

          subscribers.push(userRes.value);
        }

        return subscribers;
      },
    },
    answerCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ fieldIds }) => fieldIds.size,
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
    distributionCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ distributionIds }) => distributionIds.size,
    },
    distributions: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(DistributionNode),
        ),
      ),
      async resolve({ distributionIds }, _args, { kv }) {
        const distributions = [];
        for (const distributionId of distributionIds) {
          const res = await kv.get<DistributionModel>([
            "distribution",
            distributionId,
          ]);

          if (res.value === null) {
            throw new GraphQLError(
              `Distribution with ID ${distributionId} not found`,
            );
          }

          distributions.push(res.value);
        }

        return distributions;
      },
    },
    groupCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ groupIds }) => groupIds.size,
    },
    groups: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(GroupNode),
        ),
      ),
      async resolve({ groupIds }, _args, { kv }) {
        const groups = [];
        for (const groupId of groupIds) {
          const res = await kv.get<GroupModel>(["group", groupId]);

          if (res.value === null) {
            throw new GraphQLError(`Group with ID ${groupId} not found`);
          }

          groups.push(res.value);
        }

        return groups;
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
