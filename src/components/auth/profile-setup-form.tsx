"use client"

import * as React from "react"
import { db } from "@/lib/db"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { QuantumSetupForm } from "@/components/auth/quantum-setup-form"


type ProfileSetupFormProps = React.HTMLAttributes<HTMLDivElement>

export function ProfileSetupForm({ className, ...props }: ProfileSetupFormProps) {
    const router = useRouter()
    const { user, isLoading: isAuthLoading } = db.useAuth()

    // Check if user has ring identity
    const { data: ringData } = db.useQuery(
        user?.id ? {
            ringIdentities: {
                $: {
                    where: { "user.id": user.id }
                }
            }
        } : null
    )

    // We can query the user profile here to pre-fill or check status
    const { data, isLoading: isQueryLoading } = db.useQuery(
        user?.email ? {
            $users: {
                $: {
                    where: { email: user.email }
                }
            }
        } : null
    )

    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [step, setStep] = React.useState<number>(1)
    const [name, setName] = React.useState<string>("")
    const [avatarUrl, setAvatarUrl] = React.useState<string>("/images/avatar.png")

    // Derived state
    const isPageLoading = isAuthLoading || isQueryLoading
    const userProfile = data?.$users?.[0]
    const hasRingIdentity = ringData?.ringIdentities && ringData.ringIdentities.length > 0

    // Enhanced Redirect Logic
    // Enhanced Redirect Logic
    React.useEffect(() => {
        if (isPageLoading) return

        // 1. Fully Active: Account Active AND Ring Identity Exists -> Go to /mail
        if (userProfile?.accountStatus === 'active' && hasRingIdentity) {
            router.push("/mail")
            return
        }

        // 2. Profile Details Done (Name exists) but No Identity -> Enforce Step 3
        if (userProfile?.name && !hasRingIdentity) {
            setStep(3)
        }

        // 3. Otherwise stay on Step 1 or 2 (Implicit)
    }, [isPageLoading, userProfile, hasRingIdentity, router])

    const totalSteps = 3
    const progress = (step / totalSteps) * 100

    async function onCompleteProfile() {
        if (!user?.email) return
        setIsLoading(true)

        try {
            const userId = userProfile?.id || crypto.randomUUID()

            await db.transact(
                db.tx.$users[userId].update({
                    name: name,
                    avatarUrl: avatarUrl,
                    // accountStatus will be set to "active" ONLY after Quantum Setup
                })
            )

            // Move to Quantum Setup
            setStep(3)
        } catch (error) {
            console.error("Failed to update profile:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    if (isPageLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    // Step 3 is special (QuantumForm) - it renders its own card/unwrapped style usually, 
    // but here we are inside a layout. The QuantumSetupForm is designed as a Card. 
    // We should unwrap it or adapt it. 
    // For simplicity, if step 3, we just render QuantumSetupForm which handles its own submission and redirect.
    if (step === 3) {
        return (
            <div className={cn("flex flex-col items-center gap-4", className)} {...props}>
                <div className="w-full mb-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span>Security Setup</span>
                        <span>Step 3 of 3</span>
                    </div>
                    <Progress value={100} className="h-2" />
                </div>
                {/* Render Quantum Form directly */}
                <QuantumSetupForm />
            </div>
        )
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                    <span>Profile Setup</span>
                    <span>Step {step} of {totalSteps}</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {step === 1 && (
                <div className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col items-center gap-4">
                        <Label className="text-lg font-medium">Choose your avatar</Label>
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>

                        <div className="flex gap-2 w-full">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="picture">Upload Image</Label>
                                <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Or leave default to use the generated avatar.
                        </p>
                    </div>
                    <Button onClick={() => setStep(2)}>
                        Continue
                    </Button>
                </div>
            )}

            {step === 2 && (
                <div className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            type="text"
                            autoCapitalize="words"
                            autoCorrect="off"
                            disabled={isLoading}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            This is how you will appear to others.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setStep(1)} disabled={isLoading}>
                            Back
                        </Button>
                        <Button onClick={onCompleteProfile} disabled={isLoading || !name.trim()}>
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save & Continue
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
