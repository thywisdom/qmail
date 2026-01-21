import { Mail } from "@/components/mail/use-mail";

/**
 * Maps a database box entry (with nested message content) to the UI Mail object.
 * Handles potentially missing or malformed data gracefully.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBoxToMail(box: any): Mail {
    // Robust extraction: Handle array or object for 'has: one' relation
    const contentRaw = box.content;
    const message = Array.isArray(contentRaw) ? contentRaw[0] : contentRaw;

    return {
        id: box.id,
        userEmail: box.userEmail,
        status: box.status,
        read: box.read,
        labels: box.labels,

        // These fields are seemingly unused in the UI type but were in the mapping
        // Keeping them for now if the UI expects checking them directly, 
        // though `status` should be the source of truth.
        // The Mail type in use-mail.ts doesn't strictly have trash/archive as booleans, 
        // but let's check the type definition again.
        // Looking at use-mail.ts from context:
        // export type Mail = { ... status: string; ... } 
        // It does NOT have trash/archive boolean fields in the type definition in use-mail.ts shown in Step 33.
        // However, the previous mapping in page.tsx was adding them. 
        // If the type allows extra properties or if I should strictly follow the type.
        // Let's stick to the type in use-mail.ts.

        // Flatten Content
        subject: message?.subject || "(No Subject)",
        text: message?.body || "", // Map 'body' to 'text' for UI
        date: message?.createdAt || new Date().toISOString(),

        // Name mapping: 
        // If 'sent', name is Recipient. 
        // If 'inbox', name is Sender.
        name: box.status === "sent" ? (message?.recipientEmail || "Recipient") : (message?.senderEmail || "Sender"),
        email: box.status === "sent" ? (message?.recipientEmail || "") : (message?.senderEmail || ""),

        message: message, // Keep raw if needed
        threadId: message?.threadId // Map threadId
    };
}
