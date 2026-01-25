"use client"

import { MailComponent } from "@/components/mail/mail"
import { db } from "@/lib/db"
import { type Mail } from "@/components/mail/use-mail"
import { mapBoxToMail } from "@/lib/mail-utils"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function MailPage() {

    const { isLoading, user } = db.useAuth()

    // Fetch user's boxes and join the message content
    const { data, isLoading: isQueryLoading } = db.useQuery({
        boxes: {
            $: {
                where: { userEmail: user?.email || "" }
            },
            content: {}
        },
        // Fetch identity and profile to verify setup
        $users: {
            $: {
                where: { email: user?.email || "" }
            }
        },
        ringIdentities: {
            $: {
                where: { "user.id": user?.id || "" }
            }
        }
    })

    const router = useRouter()
    const userProfile = data?.$users?.[0]
    const hasIdentity = data?.ringIdentities && data.ringIdentities.length > 0
    const isPageLoading = isLoading || isQueryLoading

    // Enforce Setup Flow
    React.useEffect(() => {
        if (isPageLoading) return // Wait for everything to load

        if (!user) return // Auth loading handled by isPageLoading check via useAuth's isLoading

        // If loaded, check strict requirements:
        // 1. Profile must exist and be active
        // 2. Identity must exist
        const isProfileActive = userProfile?.accountStatus === 'active'
        const isSetupComplete = isProfileActive && hasIdentity

        if (!isSetupComplete) {
            router.push("/setup")
        }
    }, [isPageLoading, user, userProfile, hasIdentity, router])

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    // Map Relational Data to Flat Mail Object for UI
    const mails: Mail[] = (data?.boxes || []).map(mapBoxToMail)

    // Construct account data from user info
    const accounts = user ? [
        {
            label: userProfile?.name || "User",
            email: user.email || "user@example.com",
            icon: (
                <Avatar className="h-4 w-4">
                    <AvatarImage src={userProfile?.avatarUrl} />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
            )
        }
    ] : []

    return (
        <div className="hidden flex-col md:flex h-screen overflow-hidden">
            <MailComponent
                accounts={accounts}
                mails={mails}
                defaultLayout={undefined}
                defaultCollapsed={undefined}
                navCollapsedSize={4}
            />
        </div>
    )
}
