const kv = await Deno.openKv();

const iter = kv.list({ prefix: [] });
for await (const { key } of iter) {
  await kv.delete(key);
}
