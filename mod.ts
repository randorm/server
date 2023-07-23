const kv = await Deno.openKv();

Deno.serve(async () => {
  const iter = kv.list({ prefix: [] });
  for await (const { key } of iter) {
    await kv.delete(key);
  }

  return new Response("Done");
});
