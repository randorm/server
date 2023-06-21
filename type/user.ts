import { assertOwner } from "../assert/mod.ts";
import {
  GraphQLEnumType,
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../deps.ts";
import type {
  AnswerModel,
  DistributionModel,
  FieldModel,
  GroupModel,
  ProfileModel,
  UserModel,
} from "../model/mod.ts";
import { DateScalar } from "../scalar/mod.ts";
import type { Node } from "../types.ts";
import {
  AnswerInterface,
  DistributionInterface,
  FieldInterface,
  GroupNode,
} from "./mod.ts";

export const RoleEnum = new GraphQLEnumType({
  name: "Role",
  values: {
    EDITOR: {
      value: "editor",
    },
    VIEWER: {
      value: "viewer",
    },
  },
});

export const GenderEnum = new GraphQLEnumType({
  name: "Gender",
  values: {
    MALE: {
      value: "male",
    },
    FEMALE: {
      value: "female",
    },
  },
});

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
      async resolve({ id }, _args, { user, kv }) {
        assertOwner(user, id);

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
      async resolve({ id }, _args, { user, kv }) {
        assertOwner(user, id);

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
      async resolve({ id }, _args, { user, kv }) {
        assertOwner(user, id);

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
    fieldCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["user:field_count", id]);

        if (res.value === null) {
          throw new GraphQLError(`Field count of User with ID ${id} not found`);
        }

        return Number(res.value);
      },
    },
    fields: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(FieldInterface),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const fieldIdsRes = await kv.get<Set<number>>(["user:field_ids", id]);

        if (fieldIdsRes.value === null) {
          throw new GraphQLError(`Field IDs of User with ID ${id} not found`);
        }

        const fields = [];
        for (const fieldId of fieldIdsRes.value) {
          const fieldRes = await kv.get<FieldModel>(["field", fieldId]);

          if (fieldRes.value === null) {
            throw new GraphQLError(`Field with ID ${fieldId} not found`);
          }

          fields.push(fieldRes.value);
        }

        return fields;
      },
    },
    answers: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(AnswerInterface),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const fieldIdsRes = await kv.get<Set<number>>(["user:field_ids", id]);

        if (fieldIdsRes.value === null) {
          throw new GraphQLError(`Field IDs of User with ID ${id} not found`);
        }

        const answers = [];
        for (const fieldId of fieldIdsRes.value) {
          const answerRes = await kv.get<AnswerModel>(["answer", fieldId, id]);

          if (answerRes.value === null) {
            throw new GraphQLError(
              `Answer to Field with ID ${fieldId} from User with ID ${id} not found`,
            );
          }

          answers.push(answerRes.value);
        }

        return answers;
      },
    },
    distributionCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["user:distribution_count", id]);

        if (res.value === null) {
          throw new GraphQLError(
            `Distribution count of User with ID ${id} not found`,
          );
        }

        return Number(res.value);
      },
    },
    distributions: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(DistributionInterface),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const distributionIdsRes = await kv.get<Set<number>>([
          "user:distribution_ids",
          id,
        ]);

        if (distributionIdsRes.value === null) {
          throw new GraphQLError(
            `Distribution IDs of User with ID ${id} not found`,
          );
        }

        const distributions = [];
        for (const distributionId of distributionIdsRes.value) {
          const distributionRes = await kv.get<DistributionModel>([
            "distribution",
            distributionId,
          ]);

          if (distributionRes.value === null) {
            throw new GraphQLError(
              `Distribution with ID ${distributionId} not found`,
            );
          }

          distributions.push(distributionRes.value);
        }

        return distributions;
      },
    },
    groupCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve({ id }, _args, { kv }) {
        const res = await kv.get<Deno.KvU64>(["user:group_count", id]);

        if (res.value === null) {
          throw new GraphQLError(`Group count of User with ID ${id} not found`);
        }

        return Number(res.value);
      },
    },
    groups: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(GroupNode),
        ),
      ),
      async resolve({ id }, _args, { kv }) {
        const groupIdsRes = await kv.get<Set<number>>(["user:group_ids", id]);

        if (groupIdsRes.value === null) {
          throw new GraphQLError(`Group IDs of User with ID ${id} not found`);
        }

        const groups = [];
        for (const groupId of groupIdsRes.value) {
          const groupRes = await kv.get<GroupModel>(["group", groupId]);

          if (groupRes.value === null) {
            throw new GraphQLError(`Group with ID ${groupId} not found`);
          }

          groups.push(groupRes.value);
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
