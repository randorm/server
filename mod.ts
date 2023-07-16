import { Application, Bot, oakCors, webhookCallback } from "./deps.ts";
import { router } from "./routes/mod.ts";
import { composer } from "./services/bot/mod.ts";
import type { BotContext, ServerContext } from "./types.ts";
import {
  PORT,
  setupKeys,
  setupState,
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

////////////////////////////////////////////////////////////////

// Step 3. Create a webhook callback.

const webhook = webhookCallback(bot, "oak");

////////////////////////////////////////////////////////////////

// Step 4.1. Get a JWK.

const JWK = Deno.env.get("JWK");

if (!JWK) {
  throw new Error("Missing `JWK` environment variable");
}

// Step 4.2. Create a CryptoKey instance.

const jwk = await crypto.subtle.importKey(
  "jwk",
  JSON.parse(JWK),
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

////////////////////////////////////////////////////////////////

// Step 5. Create a ServerContext object.

const state: ServerContext = {
  kv,
  botToken: BOT_TOKEN,
  bot,
  jwk,
  webhook,
};

////////////////////////////////////////////////////////////////

// Step 6.1. Register bot state middleware.

bot.use(setupState(state));

// Step 6.2. Register bot handlers.

bot.use(composer);

////////////////////////////////////////////////////////////////

// Step 7.1. Create an Application instance.

const app = new Application<ServerContext>({ contextState: "alias", state });

// Step 7.2.1. Register CORS middleware.

app.use(oakCors());

// Step 7.2.2. Register application routes.

app.use(router.routes());
app.use(router.allowedMethods());

////////////////////////////////////////////////////////////////

// Step 8.1. Get the server origin.

const ORIGIN = Deno.env.get("ORIGIN");

if (!ORIGIN) {
  throw new Error("Missing `ORIGIN` environment variable");
}

const WEBHOOK_URL = new URL("/bot", ORIGIN);

// Step 8.2. Start the server.

await Promise.all([
  app.listen({ port: PORT }),
  bot.api.setWebhook(WEBHOOK_URL.toString()),
]);
