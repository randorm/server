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

        const viewedKeySet = [...viewedIdsRes.value].map(
          (viewedId) => ["user", viewedId],
        );
        const viewedResSet = await kv.getMany<UserModel[]>(viewedKeySet);

        const viewed = [];
        for (const viewedRes of viewedResSet) {
          if (viewedRes.value === null) {
            const [_part, userId] = viewedRes.key;

            throw new GraphQLError(`User with ID ${userId} not found`);
          }

          viewed.push(viewedRes.value);
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

        const subscriptionKeySet = [...subscriptionIdsRes.value].map(
          (userId) => ["user", userId],
        );
        const subscriptionResSet = await kv.getMany<UserModel[]>(
          subscriptionKeySet,
        );

        const subscriptions = [];
        for (const subscriptionRes of subscriptionResSet) {
          if (subscriptionRes.value === null) {
            const [_part, userId] = subscriptionRes.key;

            throw new GraphQLError(`User with ID ${userId} not found`);
          }

          subscriptions.push(subscriptionRes.value);
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

        const subscriberKeySet = [...subscriberIdsRes.value].map(
          (userId) => ["user", userId],
        );
        const subscriberResSet = await kv.getMany<UserModel[]>(
          subscriberKeySet,
        );

        const subscribers = [];
        for (const subscriberRes of subscriberResSet) {
          if (subscriberRes.value === null) {
            const [_part, userId] = subscriberRes.key;

            throw new GraphQLError(`User with ID ${userId} not found`);
          }

          subscribers.push(subscriberRes.value);
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

        const fieldKeySet = [...fieldIdsRes.value].map(
          (fieldId) => ["field", fieldId],
        );
        const fieldResSet = await kv.getMany<FieldModel[]>(fieldKeySet);

        const fields = [];
        for (const fieldRes of fieldResSet) {
          if (fieldRes.value === null) {
            const [_part, fieldId] = fieldRes.key;

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

        const answerKeySet = [...fieldIdsRes.value].map(
          (fieldId) => ["answer", fieldId, id],
        );
        const answerResSet = await kv.getMany<AnswerModel[]>(answerKeySet);

        const answers = [];
        for (const answerRes of answerResSet) {
          if (answerRes.value === null) {
            const [_part, fieldId, userId] = answerRes.key;

            throw new GraphQLError(
              `Answer to Field with ID ${fieldId} from User with ID ${userId} not found`,
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

        const distributionKeySet = [...distributionIdsRes.value].map(
          (distributionId) => ["distribution", distributionId],
        );
        const distributionResSet = await kv.getMany<DistributionModel[]>(
          distributionKeySet,
        );

        const distributions = [];
        for (const distributionRes of distributionResSet) {
          if (distributionRes.value === null) {
            const [_part, distributionId] = distributionRes.key;

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

        const groupKeySet = [...groupIdsRes.value].map(
          (groupId) => ["group", groupId],
        );
        const groupResSet = await kv.getMany<GroupModel[]>(groupKeySet);

        const groups = [];
        for (const groupRes of groupResSet) {
          if (groupRes.value === null) {
            const [_part, groupId] = groupRes.key;

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
