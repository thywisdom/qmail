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

type Config = {
    selected: Mail["id"] | null
}

const configAtom = atom<Config>({
    selected: null,
})

export function useMail() {
    return useAtom(configAtom)
}
