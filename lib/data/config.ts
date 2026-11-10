/**
 * UI PREVIEW MODE
 * ---------------------------------------------------------------------------
 * While the Supabase client is not yet wired, pages render SYNTHETIC preview
 * rows so the interface can be reviewed end-to-end. These are NOT hospital
 * records and must never be treated as real data.
 * Set NEXT_PUBLIC_UI_PREVIEW=false to render pure empty states instead.
 */
export const isPreviewMode = process.env.NEXT_PUBLIC_UI_PREVIEW !== "false";
