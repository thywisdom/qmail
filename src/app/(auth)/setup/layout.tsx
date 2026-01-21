"use client"

import { db } from "@/lib/db"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function SetupLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isAuthLoading } = db.useAuth()
    const router = useRouter()

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

        if (!user) {
            router.push("/login")
            return
        }

        // If user is already active, they shouldn't be in setup
        if (userProfile && userProfile.accountStatus === 'active') {
            router.push("/mail")
        }
    }, [user, userProfile, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Only render children if we are authenticated but NOT yet active (new or incomplete)
    // Note: userProfile might be undefined if it's a brand new user not yet in DB (though login flow usually creates one? No, login just does auth. Profile creation is explicit.)
    // Wait, the plan was update user-auth-form to CREATE the user if missing? 
    // Checking user-auth-form logic: It CHECKS user status. If not in DB, it goes to setup.
    // So here, userProfile might be null/undefined. That's a valid state for /setup.

    if (user && (!userProfile || userProfile.accountStatus !== 'active')) {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
}
