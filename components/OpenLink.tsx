"use client";
import { openDocAction } from "@/app/documents/actions";

export default function OpenLink({ documentId, driveUrl }: { documentId: number; driveUrl: string }) {
  return (
    <a
      href={driveUrl}
      target="_blank"
      rel="noopener"
      onClick={() => {
        // Fire-and-forget: record that this document was opened, without
        // blocking or delaying the new tab from opening.
        openDocAction(documentId, driveUrl);
      }}
      className="text-sm text-navy underline"
    >
      Open
    </a>
  );
}
