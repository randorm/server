import { GraphQLError } from "../deps.ts";
import type { ProfileModel } from "../model/mod.ts";

export function assertProfile(profile: ProfileModel) {
  if (!profile.firstName || profile.firstName.length > 64) {
    throw new GraphQLError("First name should be between 1 and 64 characters");
  }
  if (!profile.lastName || profile.lastName.length > 64) {
    throw new GraphQLError("Last name should be between 1 and 64 characters");
  }

  if (profile.birthday > new Date()) {
    throw new GraphQLError("Birthday should be in the past");
  }

  if (!profile.bio || profile.bio.length > 256) {
    throw new GraphQLError("Bio should be between 1 and 256 characters");
  }
}
