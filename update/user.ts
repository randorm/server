import { GraphQLNonNull, GraphQLObjectType } from "../deps.ts";
import { UserNode } from "../type/mod.ts";

export const MarkViewedUpdate = new GraphQLObjectType({
  name: "MarkViewedUpdate",
  fields: {
    user: {
      type: new GraphQLNonNull(UserNode),
    },
    viewer: {
      type: new GraphQLNonNull(UserNode),
    },
  },
});

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
    unsubscriber: {
      type: new GraphQLNonNull(UserNode),
    },
  },
});
