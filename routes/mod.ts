import { Router } from "../deps.ts";
import type { ServerContext } from "../types.ts";
import { router as graphql } from "./graphql.ts";

export const router = new Router<ServerContext>();

router.use(graphql.routes());
router.use(graphql.allowedMethods());