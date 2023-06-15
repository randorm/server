import { GraphQLError } from "../deps.ts";
import type { UserModel } from "../model/mod.ts";

export function assertUserProfile(user: UserModel) {
  if (!user.profile.firstName || user.profile.firstName.length > 32) {
    throw new GraphQLError("First name should be between 1 and 32 characters");
  }
  if (!user.profile.lastName || user.profile.lastName.length > 32) {
    throw new GraphQLError("Last name should be between 1 and 32 characters");
  }

  if (user.profile.birthday > new Date()) {
    throw new GraphQLError("Birthday should be in the past");
  }

  if (!user.profile.bio || user.profile.bio.length > 256) {
    throw new GraphQLError("Bio should be between 1 and 256 characters");
  }
}
