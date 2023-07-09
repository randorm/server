import { GraphQLNonNull, GraphQLObjectType } from "../../../deps.ts";
import type { UserModel } from "../../database/model/mod.ts";
import { UserNode } from "../type/mod.ts";
import type { Node } from "../types.ts";

export interface MarkViewedUpdateModel {
  readonly user: UserModel;
  readonly viewer: UserModel;
}

export const MarkViewedUpdate: Node<
  MarkViewedUpdateModel
> = new GraphQLObjectType({
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

export interface SubscribeUpdateModel {
  readonly user: UserModel;
  readonly subscriber: UserModel;
}

export const SubscribeUpdate: Node<
  SubscribeUpdateModel
> = new GraphQLObjectType({
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

export interface UnsubscribeUpdateModel {
  readonly user: UserModel;
  readonly unsubscriber: UserModel;
}

export const UnsubscribeUpdate: Node<
  UnsubscribeUpdateModel
> = new GraphQLObjectType({
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
