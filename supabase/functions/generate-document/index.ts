import { PDFDocument, StandardFonts } from "npm:pdf-lib@1.17.1";
import { body, HttpError, requireUser, serve, z } from "../_shared/http.ts";

const input = z.strictObject({
  type: z.literal("invoice-summary"),
  invoiceId: z.uuid(),
});
const currency = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

serve(async (request) => {
  const { supabase } = await requireUser(request);
  const { invoiceId } = await body(request, input);
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "invoice_number,invoice_date,status,subtotal,discount_amount,total_amount,amount_paid,balance",
    )
    .eq("id", invoiceId).maybeSingle();

  if (error) throw new HttpError(500, "invoice_lookup_failed");
  if (!invoice) throw new HttpError(404, "invoice_not_found");

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const heading = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText("Invoice summary", { x: 48, y: 778, font: heading, size: 24 });

  const invoiceNumber = invoice.invoice_number.replace(/[^\x20-\x7e]/g, "?")
    .slice(0, 60);
  const date = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(invoice.invoice_date));

  const lines = [
    `Invoice number: ${invoiceNumber}`,
    `Date: ${date}`,
    `Status: ${invoice.status}`,
    `Subtotal: PHP ${currency.format(invoice.subtotal)}`,
    `Discount: PHP ${currency.format(invoice.discount_amount)}`,
    `Total: PHP ${currency.format(invoice.total_amount)}`,
    `Paid: PHP ${currency.format(invoice.amount_paid)}`,
    `Balance: PHP ${currency.format(invoice.balance)}`,
  ];
  for (const [index, line] of lines.entries()) {
    page.drawText(line, { x: 48, y: 730 - index * 25, font, size: 12 });
  }

  return new Response(new Uint8Array(await pdf.save()), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="invoice-summary.pdf"',
      "X-Content-Type-Options": "nosniff",
    },
  });
});
