"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ShieldCheck, Key } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { db } from "@/lib/db"
import { id } from "@instantdb/react"
import { deriveKeyFromQMK, encryptSecretKey } from "@/lib/crypto-utils"
import { generateKeyPair } from "@/lib/ring-lwe"

// Use same salt as auth provider
const DEFAULT_SALT = "QUANTUM_MAIL_SALT_V1"

export function QuantumSetupForm() {
    const router = useRouter()
    const { user } = db.useAuth()

    // We explicitly query user to ensure we have the record to update
    // although we can just update by ID.

    const [step, setStep] = React.useState<"intro" | "create" | "generating">("intro")
    const [qmk, setQmk] = React.useState("")
    const [confirmQmk, setConfirmQmk] = React.useState("")
    const [error, setError] = React.useState("")

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (qmk.length < 8) {
            setError("Master Key must be at least 8 characters.")
            return
        }

        if (qmk !== confirmQmk) {
            setError("Keys do not match.")
            return
        }

        if (!user) {
            setError("User session not found.")
            return
        }

        setStep("generating")

        try {
            // 1. Derive CryptoKey from QMK
            const derivedKey = await deriveKeyFromQMK(qmk, DEFAULT_SALT)

            // 2. Generate Ring-LWE Keypair
            const keyPair = await generateKeyPair()

            // 3. Encrypt Secret Key
            const encryptedSK = await encryptSecretKey(keyPair.secret_key, derivedKey)

            // 4. Store in InstantDB (Ring Identity) AND Activate Account
            const identityId = id()

            await db.transact([
                // Create Identity
                db.tx.ringIdentities[identityId].update({
                    publicKey: keyPair.public_key,
                    encryptedSecretKey: encryptedSK,
                    status: "active",
                    createdAt: new Date().toISOString(),
                }).link({ user: user.id }),

                // Activate User Account (Atomic Guarantee)
                db.tx.$users[user.id].update({
                    accountStatus: "active"
                })
            ])

            toast.success("Quantum Identity Created & Account Activated!")
            router.push("/mail") // Done!

        } catch (err) {
            console.error(err)
            setError("Failed to generate identity. Please try again.")
            setStep("create")
        }
    }

    if (step === "intro") {
        return (
            <Card className="w-[380px]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-500" />
                        Quantum Security
                    </CardTitle>
                    <CardDescription>
                        Upgrade your account to support Post-Quantum Cryptography. Creates a unique identity for secure communication.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                        <p className="mb-2 font-medium text-foreground">What is this?</p>
                        We use Ring-LWE algorithms to protect your emails against future quantum computer attacks.
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={() => setStep("create")}>
                        Setup Secure Identity
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    if (step === "generating") {
        return (
            <Card className="w-[380px]">
                <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
                    <p className="font-medium">Generating Ring-LWE Keys...</p>
                    <p className="text-sm text-muted-foreground">This involves complex math, please wait.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-[380px]">
            <CardHeader>
                <CardTitle>Create Master Key</CardTitle>
                <CardDescription>
                    Create a strong passphrase. This is the <b>ONLY</b> way to decrypt your secure emails. We do not store this.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreate}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="qmk">Quantum Master Key</Label>
                        <Input
                            id="qmk"
                            type="password"
                            value={qmk}
                            onChange={(e) => setQmk(e.target.value)}
                            placeholder="Min. 8 characters"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirm Key</Label>
                        <Input
                            id="confirm"
                            type="password"
                            value={confirmQmk}
                            onChange={(e) => setConfirmQmk(e.target.value)}
                            placeholder="Re-enter key"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full">
                        <Key className="mr-2 h-4 w-4" />
                        Generate Identity
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
