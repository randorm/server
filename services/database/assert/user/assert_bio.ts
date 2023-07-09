import { GraphQLError } from "../../../../deps.ts";

export function assertBio(bio: string) {
  if (!bio || bio.length > 256) {
    throw new GraphQLError("Bio should be between 1 and 256 characters");
  }
}
