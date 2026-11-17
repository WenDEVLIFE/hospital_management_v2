import { z } from "zod";

export const finalizeClinicalNoteSchema = z.object({
  noteId: z.string().uuid("Select a valid clinical note."),
});

export type FinalizeClinicalNoteInput = z.infer<
  typeof finalizeClinicalNoteSchema
>;
