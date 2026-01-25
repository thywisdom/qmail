import React from "react"
import md5 from "md5"
import { db } from "@/lib/db"
import { Mail } from "@/components/mail/use-mail"

export function useSenderAvatars(mails: Mail[]) {
    // Get all unique sender emails from the mails
    const senderEmails = React.useMemo(() => {
        const emails = new Set<string>()
        mails.forEach(m => {
            const email = m.message?.senderEmail || m.email || ""
            if (email) emails.add(email.toLowerCase())
        })
        return Array.from(emails)
    }, [mails])

    // Fetch user profiles for all senders
    const { data: sendersData } = db.useQuery({
        $users: {
            $: {
                where: {
                    email: { in: senderEmails }
                }
            }
        }
    })

    const senderAvatars = React.useMemo(() => {
        const map = new Map<string, string>()

        // Populate from DB results
        // Populate from DB results
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendersData?.$users?.forEach((u: any) => {
            if (u.email && u.avatarUrl) {
                map.set(u.email.toLowerCase(), u.avatarUrl)
            }
        })

        // For missing, use Gravatar
        senderEmails.forEach(email => {
            if (!map.has(email)) {
                // Generate Gravatar
                const hash = md5(email.trim().toLowerCase())
                const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=mp` // mp = mystery person
                map.set(email, gravatarUrl)
            }
        })

        return map
    }, [sendersData, senderEmails])

    const getAvatar = React.useCallback((email?: string) => {
        if (!email) return undefined
        return senderAvatars.get(email.toLowerCase())
    }, [senderAvatars])

    return { getAvatar }
}
