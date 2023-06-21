import { GraphQLError } from "../deps.ts";
import type { UserModel } from "../model/mod.ts";
import { Role } from "../model/mod.ts";

export function assertEditor(user: UserModel) {
  if (user.role !== Role.EDITOR) {
    throw new GraphQLError("User is not an editor");
  }
}
