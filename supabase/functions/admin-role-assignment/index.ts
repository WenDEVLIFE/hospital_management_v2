import { body, HttpError, requireUser, serve, z } from "../_shared/http.ts";

const input = z.strictObject({
  action: z.enum(["grant", "revoke"]),
  userId: z.uuid(),
  roleId: z.uuid(),
});

serve(async (request) => {
  const { supabase } = await requireUser(request);
  const args = await body(request, input);
  const { data, error } = await supabase.rpc("set_edge_user_role", {
    p_target: args.userId,
    p_role: args.roleId,
    p_grant: args.action === "grant",
  });
  if (error?.code === "42501") throw new HttpError(403, "forbidden");
  if (error?.code === "P0002") {
    throw new HttpError(404, "user_or_role_not_found");
  }
  if (error) throw new HttpError(500, "role_update_failed");
  return Response.json({ changed: data });
});
