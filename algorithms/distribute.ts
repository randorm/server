import { GraphQLError, zip } from "../deps.ts";
import type { DistributionModel, GroupModel, UserModel } from "../model/mod.ts";
import { DistributionState } from "../model/mod.ts";
import { amap, getMany, map } from "../utils/mod.ts";
import { groupParticipants } from "./_magic.ts";

export interface ParticipantNode {
  readonly user: UserModel;
  readonly subscriptionIds: Set<number>;
  readonly subscriberIds: Set<number>;
}

export async function getParticipants(
  participantIds: Set<number>,
  kv: Deno.Kv,
): Promise<ParticipantNode[]> {
  const users = await getMany<UserModel>(
    map((userId) => ["user", userId], participantIds),
    kv,
    ([_part, userId]) => `User with ID ${userId} not found`,
  );
  const subscriptionIds = await getMany<Set<number>>(
    map((userId) => ["user:subscription_ids", userId], participantIds),
    kv,
    ([_part, userId]) => `Subscription IDs of User with ID ${userId} not found`,
  );
  const subscriberIds = await getMany<Set<number>>(
    map((userId) => ["user:subscriber_ids", userId], participantIds),
    kv,
    ([_part, userId]) => `Subscriber IDs of User with ID ${userId} not found`,
  );

  return map(
    ([user, subscriptionIds, subscriberIds]) => ({
      user,
      subscriptionIds,
      subscriberIds,
    }),
    zip(users, subscriptionIds, subscriberIds),
  );
}
export async function commitGroup(
  distributionRes: Deno.KvEntry<DistributionModel>,
  members: UserModel[],
  kv: Deno.Kv,
): Promise<number> {
  const nextIdRes = await kv.get<Deno.KvU64>(["group_next_id"]);

  if (nextIdRes.value === null) {
    throw new GraphQLError("Next Group ID not found");
  }

  const groupId = Number(nextIdRes.value);

  const memberIds = new Set<number>(map((user) => user.id, members));

  const group: GroupModel = {
    id: groupId,
    distributionId: distributionRes.value.id,
    memberIds,
    createdAt: new Date(),
  };

  const groupCommitRes = await kv.atomic()
    .check(distributionRes)
    .check(nextIdRes)
    .set(["group", group.id], group)
    .sum(["group_count"], 1n)
    .sum(["group_next_id"], 1n)
    .commit();

  if (!groupCommitRes.ok) {
    throw new GraphQLError("Failed to create Group");
  }

  for (const memberId of memberIds) {
    const groupIdsRes = await kv.get<Set<number>>(["user:group_ids", memberId]);

    if (groupIdsRes.value === null) {
      throw new GraphQLError(`Group IDs of User with ID ${memberId} not found`);
    }

    const groupIds = new Set<number>([...groupIdsRes.value, group.id]);

    const memberCommitRes = await kv.atomic()
      .check(distributionRes)
      .check(groupIdsRes)
      .set(["user:group_ids", memberId], groupIds)
      .sum(["user:group_count", memberId], 1n)
      .commit();

    if (!memberCommitRes.ok) {
      throw new GraphQLError(
        `Failed to update Group IDs of User with ID ${memberId}`,
      );
    }

    // TODO(machnevegor): Notify user about new group
  }

  return groupId;
}

export async function distribute(
  distributionRes: Deno.KvEntry<DistributionModel>,
  kv: Deno.Kv,
): Promise<DistributionModel> {
  const [
    maleParticipantIdsRes,
    femaleParticipantIdsRes,
  ] = await kv.getMany<[Set<number>, Set<number>]>([
    ["distribution:male_participant_ids", distributionRes.value.id],
    ["distribution:female_participant_ids", distributionRes.value.id],
  ]);

  if (maleParticipantIdsRes.value === null) {
    throw new GraphQLError(
      `Male participant IDs of Distribution with ID ${distributionRes.value.id} not found`,
    );
  }
  if (femaleParticipantIdsRes.value === null) {
    throw new GraphQLError(
      `Female participant IDs of Distribution with ID ${distributionRes.value.id} not found`,
    );
  }

  const update: DistributionModel = {
    ...distributionRes.value,
    state: DistributionState.CLOSED,
    updatedAt: new Date(),
  };

  const maleParticipants = await getParticipants(
    maleParticipantIdsRes.value,
    kv,
  );
  const femaleParticipants = await getParticipants(
    femaleParticipantIdsRes.value,
    kv,
  );

  const participantGroups = [
    ...groupParticipants(maleParticipants),
    ...groupParticipants(femaleParticipants),
  ];

  const groupIds = new Set<number>(
    await amap<ParticipantNode[], number>(
      async (participantGroup) => {
        const members = map(
          (participant) => participant.user,
          participantGroup,
        );

        return await commitGroup(distributionRes, members, kv);
      },
      participantGroups,
    ),
  );

  const distributionCommitRes = await kv.atomic()
    .check(distributionRes)
    .set(["distribution", distributionRes.value.id], update)
    .set(
      ["distribution:group_count", distributionRes.value.id],
      new Deno.KvU64(BigInt(groupIds.size)),
    )
    .set(["distribution:group_ids", distributionRes.value.id], groupIds)
    .commit();

  if (!distributionCommitRes.ok) {
    throw new GraphQLError(
      `Failed to close Distribution with ID ${distributionRes.value.id}`,
    );
  }

  return update;
}
