import { atom, useAtom } from "jotai"

// Define Mail type here as well to decouple from data file eventually
export type Mail = {
    // Box fields
    id: string
    userEmail: string
    status: string // "inbox", "sent", "trash", "archive"
    read: boolean
    labels: string[]

    // Mail Content fields (flattened)
    message?: {
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
    trash?: boolean
    archive?: boolean
}

export type MailFilter = "inbox" | "trash" | "archive" | "sent" | "junk" | "drafts"

type Config = {
    selected: Mail["id"] | null
    filter: MailFilter
}

const configAtom = atom<Config>({
    selected: null,
    filter: "inbox",
})

export function useMail() {
    return useAtom(configAtom)
}
