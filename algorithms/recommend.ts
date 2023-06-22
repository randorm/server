import { GraphQLError } from "../deps.ts";
import type { DistributionModel, UserModel } from "../model/mod.ts";
import { DistributionState, Gender } from "../model/mod.ts";
import { difference, getMany, idifference, limit } from "../utils/mod.ts";

export async function recommend(
  user: UserModel,
  distributionId: number,
  kv: Deno.Kv,
  amount: number,
): Promise<UserModel[]> {
  const [
    distributionRes,
    participantIdsRes,
    subscriberIdsRes,
    subscriptionIdsRes,
    viewedIdsRes,
  ] = await kv.getMany<[
    DistributionModel,
    Set<number>,
    Set<number>,
    Set<number>,
    Set<number>,
  ]>([
    ["distribution", distributionId],
    [
      user.profile.gender === Gender.MALE
        ? "distribution:male_participant_ids"
        : "distribution:female_participant_ids",
      distributionId,
    ],
    ["user:subscriber_ids", distributionId],
    ["user:subscription_ids", user.id],
    ["user:viewed_ids", user.id],
  ]);

  if (distributionRes.value === null) {
    throw new GraphQLError(
      `Distribution with ID ${distributionId} not found`,
    );
  }
  if (participantIdsRes.value === null) {
    throw new GraphQLError(
      `Participant IDs of Distribution with ID ${distributionId} not found`,
    );
  }
  if (subscriberIdsRes.value === null) {
    throw new GraphQLError(
      `Subscriber IDs of User with ID ${user.id} not found`,
    );
  }
  if (subscriptionIdsRes.value === null) {
    throw new GraphQLError(
      `Subscription IDs of User with ID ${user.id} not found`,
    );
  }
  if (viewedIdsRes.value === null) {
    throw new GraphQLError(
      `Viewed IDs of User with ID ${user.id} not found`,
    );
  }

  if (distributionRes.value.state !== DistributionState.GATHERING) {
    throw new GraphQLError(
      `Distribution with ID ${distributionId} is not in GATHERING state`,
    );
  }

  if (!participantIdsRes.value.has(user.id)) {
    throw new GraphQLError(
      `User with ID ${user.id} is not a participant of Distribution with ID ${distributionId}`,
    );
  }

  const subscriberIds = limit(
    idifference(
      difference(subscriberIdsRes.value, subscriptionIdsRes.value),
      viewedIdsRes.value,
    ),
    amount,
  );

  if (subscriberIds.length) {
    const subscribers = await getMany<UserModel>(
      subscriberIds.map((userId) => ["user", userId]),
      kv,
      ([_part, userId]) => `User with ID ${userId} not found`,
    );

    return subscribers;
  }

  const participantIds = limit(
    idifference(
      difference(participantIdsRes.value, subscriptionIdsRes.value),
      viewedIdsRes.value,
    ),
    amount,
  );

  if (participantIds.length) {
    const participants = await getMany<UserModel>(
      participantIds.map((userId) => ["user", userId]),
      kv,
      ([_part, userId]) => `User with ID ${userId} not found`,
    );

    return participants;
  }

  const viewedIds = limit(
    idifference(viewedIdsRes.value, subscriptionIdsRes.value),
    amount,
  );

  if (viewedIds.length) {
    const viewed = await getMany<UserModel>(
      viewedIds.map((userId) => ["user", userId]),
      kv,
      ([_part, userId]) => `User with ID ${userId} not found`,
    );

    return viewed;
  }

  return [];
}
