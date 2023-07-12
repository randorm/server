import {
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "../../../deps.ts";
import { recommend } from "../../algorithms/mod.ts";
import { assertAuthenticated } from "../../database/assert/mod.ts";
import type { ProfileModel, UserModel } from "../../database/model/mod.ts";
import {
  markViewed,
  subscribe,
  unsubscribe,
  updateUserProfile,
  user,
  userCount,
  users,
} from "../../database/operation/mod.ts";
import { DateScalar } from "../scalar/mod.ts";
import { GenderEnum, UserNode } from "../type/mod.ts";
import type { Operation } from "../types.ts";
import type {
  MarkViewedUpdateModel,
  SubscribeUpdateModel,
  UnsubscribeUpdateModel,
} from "../update/mod.ts";
import {
  MarkViewedUpdate,
  SubscribeUpdate,
  UnsubscribeUpdate,
} from "../update/mod.ts";

export const UserQuery: Operation = new GraphQLObjectType({
  name: "Query",
  fields: {
    user: {
      type: new GraphQLNonNull(UserNode),
      args: {
        userId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        args: { userId: number },
        context,
      ): Promise<UserModel> {
        return await user(context, args);
      },
    },
    me: {
      type: new GraphQLNonNull(UserNode),
      resolve(_root, _args, context): UserModel {
        assertAuthenticated(context);

        return context.user;
      },
    },
    userCount: {
      type: new GraphQLNonNull(GraphQLInt),
      async resolve(_root, _args, context): Promise<number> {
        return await userCount(context);
      },
    },
    users: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      async resolve(_root, _args, context): Promise<UserModel[]> {
        return await users(context);
      },
    },
    recommend: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(UserNode),
        ),
      ),
      args: {
        distributionId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        amount: {
          type: new GraphQLNonNull(GraphQLInt),
          defaultValue: 5,
        },
      },
      async resolve(
        _root,
        { distributionId, amount }: { distributionId: number; amount: number },
        context,
      ): Promise<UserModel[]> {
        assertAuthenticated(context);

        if (amount < 1 || amount > 10) {
          throw new GraphQLError("Amount must be between 1 and 10");
        }

        return await recommend(distributionId, amount, context);
      },
    },
  },
});

export const UserMutation: Operation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    updateUserProfile: {
      type: new GraphQLNonNull(UserNode),
      args: {
        firstName: {
          type: new GraphQLNonNull(GraphQLString),
        },
        lastName: {
          type: new GraphQLNonNull(GraphQLString),
        },
        gender: {
          type: new GraphQLNonNull(GenderEnum),
        },
        birthday: {
          type: new GraphQLNonNull(DateScalar),
        },
        bio: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      async resolve(_root, args: ProfileModel, context): Promise<UserModel> {
        assertAuthenticated(context);

        return await updateUserProfile(context, args);
      },
    },
    markViewed: {
      type: new GraphQLNonNull(MarkViewedUpdate),
      args: {
        userId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        args: { userId: number },
        context,
      ): Promise<MarkViewedUpdateModel> {
        assertAuthenticated(context);

        return await markViewed(context, args);
      },
    },
    subscribe: {
      type: new GraphQLNonNull(SubscribeUpdate),
      args: {
        userId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        args: { userId: number },
        context,
      ): Promise<SubscribeUpdateModel> {
        assertAuthenticated(context);

        return await subscribe(context, args);
      },
    },
    unsubscribe: {
      type: new GraphQLNonNull(UnsubscribeUpdate),
      args: {
        userId: {
          type: new GraphQLNonNull(GraphQLInt),
        },
      },
      async resolve(
        _root,
        args: { userId: number },
        context,
      ): Promise<UnsubscribeUpdateModel> {
        assertAuthenticated(context);

        return await unsubscribe(context, args);
      },
    },
  },
});
