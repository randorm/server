import { GraphQLError } from "../deps.ts";
import type { DistributionModel, UserModel } from "../model/mod.ts";
import { DistributionState, Gender } from "../model/mod.ts";
import type { NodeContext } from "../types.ts";
import {
  difference,
  divideWhile,
  getMany,
  idifference,
  limit,
  map,
  sample,
} from "../utils/mod.ts";

export async function recommend(
  distributionId: number,
  amount: number,
  { user, kv }: NodeContext,
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

  const viewedIds = difference(viewedIdsRes.value, subscriptionIdsRes.value);

  const subscriberIds = limit(
    idifference(
      difference(subscriberIdsRes.value, subscriptionIdsRes.value),
      viewedIds,
    ),
    amount,
  );

  if (subscriberIds.length) {
    const subscribers = await getMany<UserModel>(
      map((userId) => ["user", userId], subscriberIds),
      kv,
      ([_part, userId]) => `User with ID ${userId} not found`,
    );

    return subscribers;
  }

  const excludedIds = new Set<number>([...subscriptionIdsRes.value, user.id]);

  const [viewedParticipantIds, unviewedParticipantIds] = divideWhile(
    difference(participantIdsRes.value, excludedIds),
    viewedIds,
    (_viewed, unviewed) => unviewed.size !== amount,
  );

  if (unviewedParticipantIds.size) {
    const participants = await getMany<UserModel>(
      map((userId) => ["user", userId], unviewedParticipantIds),
      kv,
      ([_part, userId]) => `User with ID ${userId} not found`,
    );

    return participants;
  }

  if (viewedParticipantIds.size) {
    const sampledIds = sample(viewedParticipantIds, amount);

    const viewed = await getMany<UserModel>(
      map((userId) => ["user", userId], sampledIds),
      kv,
      ([_part, userId]) => `User with ID ${userId} not found`,
    );

    return viewed;
  }

  return [];
}
