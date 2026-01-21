"use client"

import { db } from "@/lib/db"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function MailLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isAuthLoading } = db.useAuth()
    const router = useRouter()

    // Query for the user profile in our entities
    const { data, isLoading: isQueryLoading } = db.useQuery(
        user?.email ? {
            $users: {
                $: {
                    where: { email: user.email }
                }
            }
        } : null
    )

    const isLoading = isAuthLoading || isQueryLoading
    const userProfile = data?.$users?.[0]

    useEffect(() => {
        if (isLoading) return

        // If not authenticated, redirect to login (handled usually by middleware or page check, but good to have here)
        if (!user) {
            // Safety: Clear cookie if we think we are logged out to prevent loops
            document.cookie = "__session=; path=/; max-age=0;"
            router.push("/login")
            return
        }

        // If authenticated but no profile or profile is new, redirect to setup
        // If authenticated but profile is not active, redirect to setup
        // This covers: no profile, status='new', status=undefined, etc.
        if (!userProfile || userProfile.accountStatus !== 'active') {
            router.push("/setup")
        }
    }, [user, userProfile, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Render children only if we have a valid active user profile
    // This prevents flashing content before redirect
    if (user && userProfile && userProfile.accountStatus === 'active') {
        return <>{children}</>
    }

    // While determining redirect or if valid, show nothing or loading
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
}
