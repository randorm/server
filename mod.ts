import type { MiddlewareFn } from "./deps.ts";
import { Application, Bot, oakCors } from "./deps.ts";
import { router } from "./routes/mod.ts";
import type { BotContext, ServerContext } from "./types.ts";
import {
  PORT,
  setupKeys,
  STORAGE_KEY_GROUPS,
  STORAGE_VERSION,
} from "./utils/mod.ts";

// Step 1.1. Create a connection to the database.

const kv = await Deno.openKv();

// Step 1.2. Setup the database keys.

await setupKeys(kv, STORAGE_VERSION, STORAGE_KEY_GROUPS);

////////////////////////////////////////////////////////////////

// Step 2.1. Get a Telegram Bot token.

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");

if (!BOT_TOKEN) {
  throw new Error("Missing `BOT_TOKEN` environment variable");
}

// Step 2.2. Create a Telegram Bot instance.

const bot = new Bot<BotContext>(BOT_TOKEN);

// // Step 2.3. Register bot middlewares.

// TODO(Azaki-san): bot.use(handlers);
// TODO(Azaki-san): bot.use(sessions)

// Step 2.4. Setup the webhook.

// TODO(Azaki-san): setup the webhook.

////////////////////////////////////////////////////////////////

// Step 3.1. Get a JWK.

const JWK = Deno.env.get("JWK");

if (!JWK) {
  throw new Error("Missing `JWK` environment variable");
}

// Step 3.2. Create a CryptoKey instance.

const jwk = await crypto.subtle.importKey(
  "jwk",
  JSON.parse(JWK),
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

////////////////////////////////////////////////////////////////

// Step 4.1. Create a ServerContext object.

const state: ServerContext = {
  kv,
  botToken: BOT_TOKEN,
  bot,
  jwk,
};

////////////////////////////////////////////////////////////////

// Step 5.1. Create a statePlugin function.

export function statePlugin(state: ServerContext): MiddlewareFn<BotContext> {
  return (ctx, next) => {
    ctx.state = state;

    return next();
  };
}

// Step 5.3. Register the statePlugin function.

bot.use(statePlugin(state));

////////////////////////////////////////////////////////////////

// Step 6.1. Create an Application instance.

const app = new Application<ServerContext>({ state });

// Step 6.2.1. Register the router.

app.use(router.routes());
app.use(router.allowedMethods());

// Step 6.2.2. Register CORS middleware.

app.use(oakCors());

// Step 6.3. Start the server.

await app.listen({ port: PORT });
