"use client"

import * as React from "react"
import { db } from "@/lib/db"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [sentEmail, setSentEmail] = React.useState<string>("")
    const [error, setError] = React.useState<string>("")

    // Checking phase: Once we have a user (from useAuth), check their profile status
    const { user } = db.useAuth()
    const { data: userData, isLoading: isQueryLoading } = db.useQuery(
        user?.email ? {
            $users: {
                $: {
                    where: { email: user.email }
                }
            }
        } : null
    )

    React.useEffect(() => {
        if (user && !isQueryLoading) {
            const userProfile = userData?.$users?.[0]
            if (userProfile && userProfile.accountStatus === 'active') {
                router.push("/mail")
            } else {
                router.push("/setup")
            }
        }
    }, [user, isQueryLoading, userData, router])

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        if (isLoading) return

        setIsLoading(true)
        setError("")

        const target = event.target as typeof event.target & {
            email: { value: string }
        }
        const email = target.email.value.trim().toLowerCase()

        if (!email) {
            setError("Email is required")
            setIsLoading(false)
            return
        }

        try {
            await db.auth.sendMagicCode({ email })
            setSentEmail(email)
        } catch (error) {
            console.error(error)
            setError("Failed to send code. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    async function onVerify(event: React.SyntheticEvent) {
        event.preventDefault()
        if (isLoading) return

        setIsLoading(true)
        setError("")

        const target = event.target as typeof event.target & {
            code: { value: string }
        }
        const code = target.code.value.trim()

        if (!code) {
            setError("Code is required")
            setIsLoading(false)
            return
        }

        try {
            const result = await db.auth.signInWithMagicCode({ email: sentEmail, code })

            // Set session cookie for middleware
            document.cookie = `__session=true; path=/; max-age=2592000; SameSite=Lax`

            // We don't redirect here immediately. 
            // We let the useEffect above handle it once the user profile query resolves.
        } catch (error: any) {
            console.error("Verification failed:", error)

            let message = error.body?.message || error.message || "Failed to verify code."

            // Handle specific "Record not found" error from InstantDB which implies invalid/expired code
            if (message.includes("Record not found")) {
                message = "Invalid or expired verification code. Please check your code and try again."
            }

            setError(message)
            setIsLoading(false)
        }
        // Note: We don't set isLoading to false on success, as we want to show loading while we redirect
    }

    if (sentEmail) {
        return (
            <div className={cn("grid gap-6", className)} {...props}>
                <form onSubmit={onVerify}>
                    <div className="grid gap-2">
                        <div className="grid gap-1">
                            <Label className="sr-only" htmlFor="code">
                                Code
                            </Label>
                            <Input
                                key="code-input"
                                id="code"
                                name="code"
                                placeholder="123456"
                                type="text"
                                autoCapitalize="none"
                                autoComplete="off"
                                autoCorrect="off"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button disabled={isLoading}>
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Verify Code
                        </Button>
                    </div>
                </form>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Sent to {sentEmail}
                        </span>
                    </div>
                </div>
                <Button variant="ghost" onClick={() => { setSentEmail(""); setError("") }} disabled={isLoading}>
                    Try different email
                </Button>
            </div>
        )
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={onSubmit}>
                <div className="grid gap-2">
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            Email
                        </Label>
                        <Input
                            key="email-input"
                            id="email"
                            name="email"
                            placeholder="name@example.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button disabled={isLoading}>
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Sign In with Email
                    </Button>
                </div>
            </form>
        </div>
    )
}
