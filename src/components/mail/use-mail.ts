import { atom, useAtom } from "jotai"

// Define Mail type here as well to decouple from data file eventually
import { Mail, MailFilter } from "@/lib/types"

export type { Mail, MailFilter }

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
