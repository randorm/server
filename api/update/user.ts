import { GraphQLNonNull, GraphQLObjectType } from "../deps.ts";
import { UserNode } from "../node/mod.ts";

export const SubscribeUpdate = new GraphQLObjectType({
  name: "SubscribeUpdate",
  fields: {
    user: {
      type: new GraphQLNonNull(UserNode),
    },
    subscriber: {
      type: new GraphQLNonNull(UserNode),
    },
  },
});

export const UnsubscribeUpdate = new GraphQLObjectType({
  name: "UnsubscribeUpdate",
  fields: {
    user: {
      type: new GraphQLNonNull(UserNode),
    },
    subscriber: {
      type: new GraphQLNonNull(UserNode),
    },
  },
});
