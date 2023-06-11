import { GraphQLEnumType } from "../deps.ts";

export const RoleEnum = new GraphQLEnumType({
  name: "Role",
  values: {
    EDITOR: {
      value: "editor",
    },
    VIEWER: {
      value: "viewer",
    },
  },
});
