import { serve } from "https://deno.land/std@0.191.0/http/server.ts";
import { renderPlaygroundPage } from "https://esm.sh/graphql-playground-html@1.6.30";
import { graphql } from "https://esm.sh/graphql@16.5.0";
import { Schema } from "./operation/mod.ts";

serve(async (req: Request) => {
  switch (req.method) {
    case "GET":
      return new Response(
        renderPlaygroundPage({ endpoint: "/" }),
        {
          headers: { "content-type": "text/html" },
        },
      );
    case "POST": {
      const data = await req.json();

      try {
        const result = await graphql({
          schema: Schema,
          source: data.query,
          variableValues: data.variables,
          operationName: data.operationName,
          // TODO(machnevegor): add a contextValue
        });

        // TODO(machnevegor): remove the stub
        if (result.errors) {
          return Response.json(
            {
              errros: [
                { message: "Access Denied" },
              ],
              data: null,
            },
            { status: 500 },
          );
        }

        return Response.json(result);
      } catch (e) {
        return Response.json({ errros: [e], data: null }, { status: 500 });
      }
    }
    default:
      return new Response("Method Not Allowed", { status: 405 });
  }
});
