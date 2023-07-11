import { Router } from "../deps.ts";
import type { ServerContext } from "../types.ts";
import { router as authentication } from "./authentication.ts";
import { router as graphql } from "./graphql.ts";

export const router = new Router<ServerContext>();

router.use(graphql.routes());
router.use(graphql.allowedMethods());

router.use(authentication.routes());
router.use(authentication.allowedMethods());
