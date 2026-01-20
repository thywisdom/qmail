import { atom, useAtom } from "jotai"

// Define Mail type here as well to decouple from data file eventually
export type Mail = {
    id: string
    name: string
    email: string
    subject: string
    text: string
    date: string
    read: boolean
    labels: string[]
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
