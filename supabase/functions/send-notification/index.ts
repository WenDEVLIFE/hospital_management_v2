// @ts-types="npm:@types/nodemailer@8.0.2"
import nodemailer from "npm:nodemailer@10.6.0";
import {
  body,
  HttpError,
  requireEnv,
  requireJobToken,
  serve,
  serviceClient,
  z,
} from "../_shared/http.ts";

const input = z.strictObject({ notificationId: z.uuid() });
const smtpRejection = z.object({
  responseCode: z.number().int().min(400).max(599),
});

serve(async (request) => {
  await requireJobToken(request, "HMS_NOTIFICATION_TOKEN");
  const { notificationId } = await body(request, input);
  const service = serviceClient();
  const { data, error } = await service
    .from("notifications")
    .select("user_id, profiles!inner(id)")
    .eq("profiles.is_active", true)
    .eq("id", notificationId)
    .maybeSingle();

  if (error) throw new HttpError(500, "notification_lookup_failed");
  if (!data) throw new HttpError(404, "notification_recipient_unavailable");

  const { data: account, error: accountError } = await service.auth.admin
    .getUserById(data.user_id);
  if (accountError && accountError.status !== 404) {
    throw new HttpError(500, "recipient_lookup_failed");
  }
  const recipient = z.email().safeParse(account.user?.email);
  if (!account.user?.email_confirmed_at || !recipient.success) {
    throw new HttpError(404, "notification_recipient_unavailable");
  }

  const sender = z.email().safeParse(requireEnv("HMS_SMTP_USER"));
  const password = requireEnv("HMS_SMTP_APP_PASSWORD").replace(/\s/g, "");
  if (!sender.success || password.length !== 16) {
    throw new HttpError(503, "invalid_smtp_configuration");
  }

  const deliveries = () => service.from("notification_email_deliveries");
  const { error: claimError } = await deliveries().insert({
    notification_id: notificationId,
  });
  if (claimError?.code === "23505") {
    const { data: previous, error: lookupError } = await deliveries()
      .select("accepted_at").eq("notification_id", notificationId)
      .maybeSingle();
    if (lookupError) throw new HttpError(500, "delivery_lookup_failed");
    if (previous?.accepted_at) return Response.json({ accepted: true });
    throw new HttpError(409, "delivery_in_progress_or_unconfirmed");
  }
  if (claimError) throw new HttpError(500, "delivery_claim_failed");

  const smtp = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: sender.data, pass: password },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });
  try {
    await smtp.sendMail({
      from: sender.data,
      to: recipient.data,
      subject: "You have a hospital portal notification",
      text: "Sign in to your hospital portal to view your notification.",
      messageId: `<hms-notification-${notificationId}@${
        sender.data.split("@")[1]
      }>`,
    });
  } catch (error) {
    // A negative SMTP reply confirms rejection. A lost connection may occur
    // after Gmail accepted the message, so retain the claim in that case.
    if (smtpRejection.safeParse(error).success) {
      const { error: releaseError } = await deliveries().delete().eq(
        "notification_id",
        notificationId,
      );
      if (releaseError) throw new HttpError(500, "delivery_release_failed");
      throw new HttpError(502, "smtp_rejected");
    }
    throw new HttpError(502, "smtp_delivery_unconfirmed");
  } finally {
    smtp.close();
  }

  const { error: recordError } = await deliveries().update({
    accepted_at: new Date().toISOString(),
  })
    .eq("notification_id", notificationId);
  if (recordError) throw new HttpError(500, "delivery_record_failed");
  return Response.json({ accepted: true });
});
