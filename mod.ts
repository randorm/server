import { Application, Bot, oakCors } from "./deps.ts";
import { router } from "./routes/mod.ts";
import type { ServerContext } from "./types.ts";
import { setupKeys } from "./utils/mod.ts";

/**
 * Version of the key schema.
 */
const KEY_VERSION = "0.2.0";
/**
 * Key groups to setup.
 */
const KEY_GROUPS = ["distribution", "field", "group", "user"];
/**
 * Port to listen on.
 */
const PORT = 3000;

////////////////////////////////////////////////////////////////

// Step 1.1. Create a connection to the database.

const kv = await Deno.openKv();

// Step 1.2. Setup the database keys.

await setupKeys(kv, KEY_VERSION, KEY_GROUPS);

////////////////////////////////////////////////////////////////

// Step 2.1. Get a Telegram Bot token.

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");

if (!BOT_TOKEN) {
  throw new Error("Missing `BOT_TOKEN` environment variable");
}

// Step 2.2. Create a Telegram Bot instance.

const bot = new Bot(BOT_TOKEN);

// // Step 2.3. Register bot middlewares.

// bot.use(handlers);

////////////////////////////////////////////////////////////////

// Step 3.1. Create an Application instance.

const app = new Application<ServerContext>({
  state: { kv, bot },
});

// Step 3.2.1. Register the router.

app.use(router.routes());
app.use(router.allowedMethods());

// Step 3.2.2. Register CORS middleware.

app.use(oakCors());

// Step 3.3. Start the server.

await app.listen({ port: PORT });
