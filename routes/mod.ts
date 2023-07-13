import { Router } from "../deps.ts";
import type { ServerContext } from "../types.ts";
import { router as authentication } from "./authentication.ts";
import { router as bot } from "./bot.ts";
import { router as graphql } from "./graphql.ts";

export const router = new Router<ServerContext>();

router.use(authentication.routes());
router.use(authentication.allowedMethods());

router.use(bot.routes());
router.use(bot.allowedMethods());

router.use(graphql.routes());
router.use(graphql.allowedMethods());
