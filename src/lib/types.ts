export type Mail = {
    // Box fields
    id: string
    userEmail: string
    status: string // "inbox", "sent", "trash", "archive"
    read: boolean
    labels: string[]

    // Mail Content fields (flattened)
    message?: {
        id: string
        subject: string
        body: string
        senderEmail: string
        recipientEmail: string
        createdAt: string
    }

    // Derived/Legacy fields for UI compatibility (mapped in page or component)
    name: string
    email: string
    subject: string
    text: string
    date: string
    threadId: string
    isEncrypted?: boolean
}

export type MailFilter = "inbox" | "trash" | "archive" | "sent" | "drafts"
