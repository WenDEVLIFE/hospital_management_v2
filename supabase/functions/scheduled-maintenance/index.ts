import {
  HttpError,
  requireJobToken,
  serve,
  serviceClient,
} from "../_shared/http.ts";

serve(async (request) => {
  await requireJobToken(request, "HMS_MAINTENANCE_TOKEN");
  const { data, error } = await serviceClient().rpc(
    "expire_insurance_policies",
  );
  if (error) throw new HttpError(500, "maintenance_failed");
  return Response.json({ expiredInsurancePolicies: data });
});
