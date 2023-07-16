import { MINUTE } from "../deps.ts";

export const AUTHENTICATION_TIME_LIMIT = MINUTE * 30;

export const AUTHENTICATION_TOKEN_TTL = "30 days";

export const STORAGE_KEY_GROUPS = ["distribution", "field", "group", "user"];

export const STORAGE_VERSION_KEY = "_version";

export const STORAGE_VERSION = "0.2.0";

export const STORAGE_BATCH_SIZE = 10;

export const PORT = 3000;

// export const CANCEL_GIF_ID =
