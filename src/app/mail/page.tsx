"use client"

import { MailComponent } from "@/components/mail/mail"
import { db } from "@/lib/db"
import { useEffect, useState } from "react"
import { type Mail } from "@/components/mail/use-mail"

export default function MailPage() {
    const defaultLayout = undefined
    const defaultCollapsed = undefined

    const { isLoading, user, error } = db.useAuth()
    const { data } = db.useQuery({ mails: {} })

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    if (!user) {
        if (typeof document !== "undefined") {
            document.cookie = "__session=; path=/; max-age=0;"
        }
        if (typeof window !== "undefined") {
            window.location.href = "/login"
        }
        return null
    }

    const mails: Mail[] = data?.mails as Mail[] || []

    // Construct account data from user info
    const accounts = user ? [
        {
            label: "User", // Could be user.email or a name if available
            email: user.email || "user@example.com",
            icon: (
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current">
                    {/* Generic User Icon or Vercel default */}
                    <title>User</title>
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
            )
        }
    ] : []

    return (
        <div className="hidden flex-col md:flex h-screen">
            <MailComponent
                accounts={accounts}
                mails={mails}
                defaultLayout={defaultLayout}
                defaultCollapsed={defaultCollapsed}
                navCollapsedSize={4}
            />
        </div>
    )
}
