import { difference, GraphQLError } from "../../../deps.ts";
import type { ServerContext, UserContext } from "../../../types.ts";
import type { ProfileModel, UserModel } from "../model/mod.ts";
import { Role } from "../model/mod.ts";

export function assertFirstName(firstName: string) {
  if (!firstName || firstName.length > 64) {
    throw new GraphQLError("First name should be between 1 and 64 characters");
  }
}

export function assertLastName(lastName: string) {
  if (!lastName || lastName.length > 64) {
    throw new GraphQLError("Last name should be between 1 and 64 characters");
  }
}

export function assertBirthday(birthday: Date) {
  const { years } = difference(birthday, new Date(), { units: ["years"] });

  if (!years || years < 4 || years > 120) {
    throw new GraphQLError("Birthday should be between 4 and 120 years ago");
  }
}

export function assertBio(bio: string) {
  if (!bio || bio.length > 256) {
    throw new GraphQLError("Bio should be between 1 and 256 characters");
  }
}

export function assertUserProfile(profile: ProfileModel) {
  assertFirstName(profile.firstName);
  assertLastName(profile.lastName);
  assertBirthday(profile.birthday);
  assertBio(profile.bio);
}

export function assertEditor(user: UserModel) {
  if (user.role !== Role.EDITOR) {
    throw new GraphQLError("User is not an editor");
  }
}

export function assertOwner(user: UserModel, id: number) {
  if (user.role !== Role.EDITOR && user.id !== id) {
    throw new GraphQLError("User has no access to the data");
  }
}

export function assertAuthenticated(
  context: ServerContext | UserContext,
): asserts context is UserContext {
  if (!("user" in context) || !("userRes" in context)) {
    throw new GraphQLError("User is not authenticated");
  }
}
