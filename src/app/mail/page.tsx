"use client"


// We will use client-side fetching for now as this is an SPA-like auth app
// import { accounts, mails } from "@/app/(app)/examples/mail/data"
import { MailComponent } from "@/components/mail/mail"
import { db } from "@/lib/db"
import { useEffect, useState } from "react"
import { type Mail, useMail } from "@/components/mail/use-mail"

const defaultAccounts = [
    {
        label: "Alicia Koch",
        email: "alicia@example.com",
        icon: (
            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current">
                <title>Vercel</title>
                <path d="M24 22.525H0l12-21.05 12 21.05z" />
            </svg>
        ),
    },
]

export default function MailPage() {
    // Note: In a real Next.js app, layout cookies are usually read on the server.
    // Since we are client-side rendering the main content wrapper for simplicty with InstantDB,
    // we can pass default defaults. Real implementation might read cookies in a server component wrapper.
    const defaultLayout = undefined
    const defaultCollapsed = undefined

    const { isLoading, user, error } = db.useAuth()
    const { data } = db.useQuery({ mails: {} })

    console.log("MailPage: auth state", { isLoading, user, error })

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    if (!user) {
        console.log("MailPage: No user, redirecting to /login")
        // Clear session cookie to prevent infinite loops with middleware
        if (typeof document !== "undefined") {
            document.cookie = "__session=; path=/; max-age=0;"
        }

        // Redirect or show login (Middleware is better but for now)
        if (typeof window !== "undefined") {
            window.location.href = "/login"
        }
        return null
    }

    const mails: Mail[] = data?.mails as Mail[] || []

    return (
        <div className="hidden flex-col md:flex h-screen">
            <MailComponent
                accounts={defaultAccounts.map(acc => ({ ...acc, label: user.email || acc.label, email: user.email || acc.email }))}
                mails={mails}
                defaultLayout={defaultLayout}
                defaultCollapsed={defaultCollapsed}
                navCollapsedSize={4}
            />
        </div>
    )
}
