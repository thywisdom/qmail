"use client"

import * as React from "react"
import { db } from "@/lib/db"
import { id } from "@instantdb/react"
// Removing unused import
import { deriveKeyFromQMK, encryptSecretKey } from "@/lib/crypto-utils"
import { generateKeyPair } from "@/lib/ring-lwe"
import { toast } from "sonner"
import { ShieldCheck, RotateCw, Loader2, AlertTriangle } from "lucide-react"

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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// Same salt for MVP
const DEFAULT_SALT = "QUANTUM_MAIL_SALT_V1"

export function KeyManagement() {
    const { user } = db.useAuth()
    const { data } = db.useQuery(
        user?.id ? {
            ringIdentities: {
                $: {
                    where: { "user.id": user.id, status: "active" }
                }
            }
        } : null
    )

    const activeIdentity = data?.ringIdentities?.[0]
    const [showRotateDialog, setShowRotateDialog] = React.useState(false)

    // Rotate Key State
    const [qmk, setQmk] = React.useState("")
    const [confirmQmk, setConfirmQmk] = React.useState("")
    const [step, setStep] = React.useState<"verify" | "generating">("verify")

    const handleRotate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        if (qmk !== confirmQmk) {
            toast.error("Keys do not match")
            return
        }

        setStep("generating")

        try {
            // 1. Derive CryptoKey
            const derivedKey = await deriveKeyFromQMK(qmk, DEFAULT_SALT)

            // 2. Generate New Ring-LWE Keypair
            const keyPair = await generateKeyPair()

            // 3. Encrypt New SK
            const encryptedSK = await encryptSecretKey(keyPair.secret_key, derivedKey)

            // 4. Atomic Replace in InstantDB
            const newId = id()
            const ops = []

            // Revoke old
            if (activeIdentity) {
                ops.push(
                    db.tx.ringIdentities[activeIdentity.id].update({
                        status: "revoked",
                        lastUsedAt: new Date().toISOString()
                    })
                )
            }

            // Add new
            ops.push(
                db.tx.ringIdentities[newId].update({
                    publicKey: keyPair.public_key,
                    encryptedSecretKey: encryptedSK,
                    status: "active",
                    createdAt: new Date().toISOString()
                }).link({ user: user.id })
            )

            await db.transact(ops)

            toast.success("Keys Rotated Successfully!")
            setShowRotateDialog(false)
            setQmk("")
            setConfirmQmk("")
            setStep("verify")

        } catch (error) {
            console.error(error)
            toast.error("Failed to rotate keys.")
            setStep("verify")
        }
    }

    if (!activeIdentity) {
        return (
            <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Quantum Identity Missing
                    </CardTitle>
                    <CardDescription>
                        You do not have a robust Ring-LWE identity setup yet.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    {/* Could trigger setup here, but typically handled in onboarding */}
                    <Button variant="outline">Setup Now</Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="border-l-4 border-l-indigo-500 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-500" />
                    Quantum Security
                </CardTitle>
                <CardDescription>
                    Manage your Ring-LWE cryptographic identity.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Active Public Key (Ring-LWE)</Label>
                    <div className="flex items-center gap-2">
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold w-full truncate">
                            {activeIdentity.publicKey.substring(0, 16)}...
                        </code>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                            Ver: {new Date(activeIdentity.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Your secret key is encrypted with your Master Key. We cannot see it.
                    </p>
                </div>
            </CardContent>
            <CardFooter>
                <Dialog open={showRotateDialog} onOpenChange={setShowRotateDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <RotateCw className="mr-2 h-4 w-4" />
                            Rotate Keys
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Rotate Quantum Keys</DialogTitle>
                            <DialogDescription>
                                Generating new keys will revoke the old ones.
                                <strong> You MUST enter your Master Key</strong> to encrypt the new secret key.
                            </DialogDescription>
                        </DialogHeader>

                        {step === "verify" ? (
                            <form onSubmit={handleRotate} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Confirm Quantum Master Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="Enter Passphrase"
                                        value={qmk}
                                        onChange={e => setQmk(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Re-enter to Verify</Label>
                                    <Input
                                        type="password"
                                        placeholder="Enter Passphrase again"
                                        value={confirmQmk}
                                        onChange={e => setConfirmQmk(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={!qmk || !confirmQmk}>
                                        Generate & Encrypt New Keys
                                    </Button>
                                </DialogFooter>
                            </form>
                        ) : (
                            <div className="py-10 flex flex-col items-center justify-center text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
                                <p className="font-medium">Generating & Encrypting...</p>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </CardFooter>
        </Card>
    )
}
