import {
  body,
  HttpError,
  requireAdmin,
  serve,
  serviceClient,
  z,
} from "../_shared/http.ts";

const input = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("create"),
    email: z.email().max(254).transform((email) => email.toLowerCase()),
    password: z.string().min(12).max(72).refine((value) =>
      new TextEncoder().encode(value).length <= 72
    ),
    fullName: z.string().trim().min(1).max(200),
  }),
  z.strictObject({
    action: z.literal("set-active"),
    userId: z.uuid(),
    active: z.boolean(),
  }),
]);

serve(async (request) => {
  const actorId = await requireAdmin(request);
  const args = await body(request, input);
  const service = serviceClient();

  if (args.action === "create") {
    const { data, error } = await service.auth.admin.createUser({
      email: args.email,
      password: args.password,
      email_confirm: true,
      user_metadata: { full_name: args.fullName },
      app_metadata: { hms_create_actor: actorId },
    });
    if (
      error?.code === "email_exists" || error?.code === "user_already_exists"
    ) {
      throw new HttpError(409, "account_exists");
    }
    if (
      error?.code === "weak_password" || error?.code === "validation_failed"
    ) {
      throw new HttpError(400, "invalid_account");
    }
    if (error || !data.user) throw new HttpError(500, "account_create_failed");
    return Response.json({ userId: data.user.id }, { status: 201 });
  }

  const { error } = await service.rpc("check_edge_account_target", {
    p_actor: actorId,
    p_target: args.userId,
  });
  if (error?.code === "42501") throw new HttpError(403, "forbidden");
  if (error?.code === "P0002") throw new HttpError(404, "user_not_found");
  if (error) throw new HttpError(500, "authorization_failed");

  const { error: updateError } = await service.auth.admin.updateUserById(
    args.userId,
    {
      ban_duration: args.active ? "none" : "876000h",
      app_metadata: { hms_status_actor: actorId },
    },
  );
  if (updateError?.status === 404) throw new HttpError(404, "user_not_found");
  if (updateError) throw new HttpError(500, "account_update_failed");
  return Response.json({ userId: args.userId, active: args.active });
});
