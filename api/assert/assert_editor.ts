import { GraphQLError } from "../deps.ts";
import type { UserModel } from "../model/mod.ts";
import { RoleModel } from "../model/mod.ts";

export function assertEditor(user: UserModel) {
  if (!user.role || user.role !== RoleModel.EDITOR) {
    throw new GraphQLError("User is not an editor");
  }
}
