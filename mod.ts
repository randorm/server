import { GraphQLError } from "./deps.ts";
import { distribute } from "./services/algorithms/mod.ts";
import {
  assertChoiceField,
  assertDistribution,
  assertTextField,
} from "./services/database/assert/mod.ts";
import type {
  ChoiceFieldModel,
  DistributionModel,
  FieldModel,
  TextFieldModel,
  UserModel,
} from "./services/database/model/mod.ts";
import {
  DistributionState,
  FieldType,
  Role,
} from "./services/database/model/mod.ts";
import {
  difference,
  getMany,
  map,
  setupKeys,
  STORAGE_KEY_GROUPS,
  STORAGE_VERSION,
} from "./utils/mod.ts";

const USER_ID = 1;

const FIELDS = [
  // 1
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Lark or owl?",
    multiple: false,
    options: [
      "Lark",
      "Owl",
    ],
  },
  // 2
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Order is important to you??",
    multiple: false,
    options: [
      "Order is a saint thing",
      "Order isn't the most important thing in life",
      "I can adapt to any conditions",
    ],
  },
  // 3
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Comfortable temperature",
    multiple: false,
    options: [
      "I like it cool, air it out a lot",
      "I like the warmth and fresh air",
      "The warmer the better",
    ],
  },
  // 4
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "How do you feel about noise?",
    multiple: false,
    options: [
      "Good, I like to listen to loud music and talk loudly",
      "Neutral, I can live in any conditions",
      "I don't like noise, I try to be in quiet most of the time",
    ],
  },
  // 5
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Nutritional habits",
    multiple: false,
    options: [
      "I cook by myself",
      "I'll be ordering take-outs",
      "I'll go to the canteen",
    ],
  },
  // 6
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "How do you feel about sharing things and food?",
    multiple: false,
    options: [
      "Negative, I will only cook for myself",
      "Positive, ready to buy food and cook together",
      "Doesn't matter, negotiable",
    ],
  },
  // 7
  <Omit<TextFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.TEXT,
    required: true,
    question: "Do you have any allergies?",
    format: null,
    sample: null,
  },
  // 8
  <Omit<TextFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.TEXT,
    required: true,
    question: "Describe your interests, hobbies and habits",
    format: null,
    sample: null,
  },
  // 9
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Do you smoke?",
    multiple: false,
    options: [
      "Yes",
      "Rarely",
      "No",
    ],
  },
  // 10
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Do you drink alcohol?",
    multiple: false,
    options: [
      "Yes",
      "Rarely",
      "No",
    ],
  },
  // 11
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Native language",
    multiple: false,
    options: [
      "Russian",
      "English",
      "Other",
    ],
  },
  // 12
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Sociability",
    multiple: false,
    options: [
      "Talking all the time",
      "Depends on the mood",
      "Talking is not for me",
    ],
  },
  // 13
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "Most of the time I'd like to spend...",
    multiple: false,
    options: [
      "In privacy, I value personal space where no one is disturbing me",
      "With friends, I like to be in the company",
      "Depends on mood, I like to be alone and in company",
    ],
  },
  // 14
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "I'd like a roommate...",
    multiple: false,
    options: [
      "who speaks russian",
      "a foreigner speaker",
    ],
  },
  // 15
  <Omit<ChoiceFieldModel, "id" | "creatorId" | "createdAt">> {
    type: FieldType.CHOICE,
    required: true,
    question: "I'd like a roommate...",
    multiple: false,
    options: [
      "Similar to my preferences",
      "Opposite to my preferences",
    ],
  },
];

const kv = await Deno.openKv();

async function createDistribution(
  { name }: { name: string },
): Promise<DistributionModel> {
  const nextIdRes = await kv.get<Deno.KvU64>(["distribution_next_id"]);

  if (nextIdRes.value === null) {
    throw new GraphQLError("Next Distribution ID not found");
  }

  const distribution: DistributionModel = {
    id: Number(nextIdRes.value),
    state: DistributionState.PREPARING,
    creatorId: USER_ID,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  assertDistribution(distribution);

  const commitRes = await kv.atomic()
    .check(nextIdRes)
    .set(["distribution", distribution.id], distribution)
    .set(
      ["distribution:field_count", distribution.id],
      new Deno.KvU64(0n),
    )
    .set(["distribution:field_ids", distribution.id], new Set<number>())
    .sum(["distribution_count"], 1n)
    .sum(["distribution_next_id"], 1n)
    .commit();

  if (!commitRes.ok) {
    throw new GraphQLError("Failed to create Distribution");
  }

  return distribution;
}

async function createTextField(
  args: Pick<TextFieldModel, "required" | "question" | "format" | "sample">,
): Promise<TextFieldModel> {
  const nextRes = await kv.get<Deno.KvU64>(["field_next_id"]);

  if (nextRes.value === null) {
    throw new GraphQLError("Next Field ID not found");
  }

  const field: TextFieldModel = {
    id: Number(nextRes.value),
    type: FieldType.TEXT,
    creatorId: USER_ID,
    ...args,
    createdAt: new Date(),
  };

  assertTextField(field);

  const commitRes = await kv.atomic()
    .set(["field", field.id], field)
    .set(["field:answer_count", field.id], new Deno.KvU64(0n))
    .sum(["field_count"], 1n)
    .sum(["field_next_id"], 1n)
    .commit();

  if (!commitRes.ok) {
    throw new GraphQLError("Failed to create TextField");
  }

  return field;
}

async function createChoiceField(
  args: Pick<
    ChoiceFieldModel,
    "required" | "question" | "multiple" | "options"
  >,
): Promise<ChoiceFieldModel> {
  const nextRes = await kv.get<Deno.KvU64>(["field_next_id"]);

  if (nextRes.value === null) {
    throw new GraphQLError("Next Field ID not found");
  }

  const field: ChoiceFieldModel = {
    id: Number(nextRes.value),
    type: FieldType.CHOICE,
    creatorId: USER_ID,
    ...args,
    createdAt: new Date(),
  };

  assertChoiceField(field);

  const commitRes = await kv.atomic()
    .set(["field", field.id], field)
    .set(["field:answer_count", field.id], new Deno.KvU64(0n))
    .sum(["field_count"], 1n)
    .sum(["field_next_id"], 1n)
    .commit();

  if (!commitRes.ok) {
    throw new GraphQLError("Failed to create ChoiceField");
  }

  return field;
}

async function updateDistributionFields(
  { distributionId, fieldIds }: {
    distributionId: number;
    fieldIds: readonly number[];
  },
): Promise<DistributionModel> {
  const [
    distributionRes,
    fieldIdsRes,
  ] = await kv.getMany<[DistributionModel, Set<number>]>([
    ["distribution", distributionId],
    ["distribution:field_ids", distributionId],
  ]);

  if (distributionRes.value === null) {
    throw new GraphQLError(
      `Distribution with ID ${distributionId} not found`,
    );
  }
  if (fieldIdsRes.value === null) {
    throw new GraphQLError(
      `Field IDs of Distribution with ID ${distributionId} not found`,
    );
  }

  if (distributionRes.value.state !== DistributionState.PREPARING) {
    throw new GraphQLError(
      `Distribution with ID ${distributionId} is not in PREPARING state`,
    );
  }

  const uniqueFieldIds = new Set(fieldIds);

  if (uniqueFieldIds.size !== fieldIds.length) {
    throw new GraphQLError("Field IDs must be unique");
  }

  const unverifiedFieldIds = difference(
    uniqueFieldIds,
    fieldIdsRes.value,
  );

  await getMany<FieldModel>(
    map((fieldId) => ["field", fieldId], unverifiedFieldIds),
    kv,
    ([_part, fieldId]) => `Field with ID ${fieldId} not found`,
  );

  const commitRes = await kv.atomic()
    .check(distributionRes)
    .set(
      ["distribution:field_count", distributionId],
      new Deno.KvU64(BigInt(uniqueFieldIds.size)),
    )
    .set(["distribution:field_ids", distributionId], uniqueFieldIds)
    .commit();

  if (!commitRes.ok) {
    throw new GraphQLError(
      `Failed to update Distribution with ID ${distributionId}`,
    );
  }

  return distributionRes.value;
}

async function updateDistributionState(
  { distributionId, state }: {
    distributionId: number;
    state: DistributionState;
  },
): Promise<DistributionModel> {
  const distributionRes = await kv.get<DistributionModel>([
    "distribution",
    distributionId,
  ]);

  if (distributionRes.value === null) {
    throw new GraphQLError(
      `Distribution with ID ${distributionId} not found`,
    );
  }

  switch (distributionRes.value.state) {
    case DistributionState.PREPARING: {
      if (state !== DistributionState.ANSWERING) {
        throw new GraphQLError("State order is violated");
      }

      const update: DistributionModel = {
        ...distributionRes.value,
        state,
        updatedAt: new Date(),
      };

      assertDistribution(update);

      const commitRes = await kv.atomic()
        .check(distributionRes)
        .set(["distribution", distributionId], update)
        .set(
          ["distribution:participant_count", distributionId],
          new Deno.KvU64(0n),
        )
        .set(
          ["distribution:male_participant_ids", distributionId],
          new Set<number>(),
        )
        .set(
          ["distribution:female_participant_ids", distributionId],
          new Set<number>(),
        )
        .commit();

      if (!commitRes.ok) {
        throw new GraphQLError(
          `Failed to update Distribution with ID ${distributionId}`,
        );
      }

      return update;
    }
    case DistributionState.ANSWERING: {
      if (state !== DistributionState.GATHERING) {
        throw new GraphQLError("State order is violated");
      }

      const update: DistributionModel = {
        ...distributionRes.value,
        state,
        updatedAt: new Date(),
      };

      assertDistribution(update);

      // TODO(machnevegor): notify users about the start of the feed

      const commitRes = await kv.atomic()
        .check(distributionRes)
        .set(["distribution", distributionId], update)
        .commit();

      if (!commitRes.ok) {
        throw new GraphQLError(
          `Failed to update Distribution with ID ${distributionId}`,
        );
      }

      return update;
    }
    case DistributionState.GATHERING: {
      if (state !== DistributionState.CLOSED) {
        throw new GraphQLError("State order is violated");
      }

      return await distribute(distributionRes, kv);
    }
    case DistributionState.CLOSED: {
      throw new GraphQLError("Distribution is in CLOSED state");
    }
  }
}

Deno.serve(async () => {
  await setupKeys(kv, STORAGE_VERSION, STORAGE_KEY_GROUPS);

  const userRes = await kv.get<UserModel>(["user", USER_ID]);

  if (userRes.value === null) {
    throw new GraphQLError("User not found");
  }

  if (userRes.value.role !== Role.EDITOR) {
    const update: UserModel = {
      ...userRes.value,
      role: Role.EDITOR,
      updatedAt: new Date(),
    };

    const commitRes = await kv.atomic()
      .check(userRes)
      .set(["user", USER_ID], update)
      .commit();

    if (!commitRes.ok) {
      throw new GraphQLError("Failed to update user");
    }
  }

  const distribution = await createDistribution({ name: "Check-in 2023" });

  const fieldIds = [];
  for (const field of FIELDS) {
    switch (field.type) {
      case FieldType.TEXT: {
        const textField = await createTextField(field);
        fieldIds.push(textField.id);
        break;
      }
      case FieldType.CHOICE: {
        const choiceField = await createChoiceField(field);
        fieldIds.push(choiceField.id);
        break;
      }
    }
  }

  await updateDistributionFields({
    distributionId: distribution.id,
    fieldIds: [...fieldIds],
  });

  await updateDistributionState({
    distributionId: distribution.id,
    state: DistributionState.ANSWERING,
  });

  await updateDistributionState({
    distributionId: distribution.id,
    state: DistributionState.GATHERING,
  });

  return new Response("Done");
});
