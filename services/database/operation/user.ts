import { GraphQLError } from "../../../deps.ts";
import type { ServerContext, UserContext } from "../../../types.ts";
import { filter } from "../../../utils/mod.ts";
import type {
  MarkViewedUpdateModel,
  SubscribeUpdateModel,
  UnsubscribeUpdateModel,
} from "../../graphql/update/mod.ts";
import { assertUserProfile } from "../assert/mod.ts";
import type { ProfileModel, UserModel } from "../model/mod.ts";
import { Role } from "../model/mod.ts";

export async function createUser(
  { kv }: ServerContext,
  { telegramId, username, profile }: {
    telegramId: number;
    username: string;
    profile: ProfileModel;
  },
): Promise<UserModel> {
  const nextIdRes = await kv.get<Deno.KvU64>(["user_next_id"]);

  if (nextIdRes.value === null) {
    throw new GraphQLError("Next User ID not found");
  }

  const nextId = Number(nextIdRes.value);

  const user: UserModel = {
    id: nextId,
    telegramId,
    username,
    role: Role.VIEWER,
    profile,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const firstCommitRes = await kv.atomic()
    .check(nextIdRes)
    .set(["user", nextId], user)
    .set(["user:field_count", nextId], new Deno.KvU64(0n))
    .set(["user:field_ids", nextId], new Set<number>())
    .set(["user:distribution_count", nextId], new Deno.KvU64(0n))
    .set(["user:distribution_ids", nextId], new Set<number>())
    .set(["user:group_count", nextId], new Deno.KvU64(0n))
    .set(["user:group_ids", nextId], new Set<number>())
    .sum(["user_count"], 1n)
    .sum(["user_next_id"], 1n)
    .commit();

  if (!firstCommitRes.ok) {
    throw new Error("Failed to create User");
  }

  const secondCommitRes = await kv.atomic()
    .set(["user:views", nextId], new Deno.KvU64(0n))
    .set(["user:viewed_count", nextId], new Deno.KvU64(0n))
    .set(["user:viewed_ids", nextId], new Set<number>())
    .set(["user:subscription_count", nextId], new Deno.KvU64(0n))
    .set(["user:subscription_ids", nextId], new Set<number>())
    .set(["user:subscriber_count", nextId], new Deno.KvU64(0n))
    .set(["user:subscriber_ids", nextId], new Set<number>())
    .set(["user_by_telegram_id", telegramId], nextId)
    .commit();

  if (!secondCommitRes.ok) {
    throw new Error("Failed to create User");
  }

  return user;
}

export async function updateUserProfile(
  { user, kv, userRes }: UserContext,
  profile: ProfileModel,
): Promise<UserModel> {
  assertUserProfile(profile);

  if (profile.gender !== user.profile.gender) {
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
    profile,
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
}

export async function markViewed(
  { user, kv }: UserContext,
  { userId }: { userId: number },
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
}

export async function subscribe(
  { user, kv }: UserContext,
  { userId }: { userId: number },
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
}

export async function unsubscribe(
  { user, kv }: UserContext,
  { userId }: { userId: number },
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
}
