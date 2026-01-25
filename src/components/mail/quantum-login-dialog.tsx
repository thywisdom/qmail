"use client"

import * as React from "react"
import { useQuantumAuth } from "@/hooks/use-quantum-auth"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"

interface QuantumLoginDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function QuantumLoginDialog({ open, onOpenChange, onSuccess }: QuantumLoginDialogProps) {
    const { login } = useQuantumAuth()
    const [qmk, setQmk] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const success = await login(qmk)
        setLoading(false)

        if (success) {
            setQmk("") // Clear sensitive input
            onSuccess()
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-indigo-500" />
                        Enter Quantum Master Key
                    </DialogTitle>
                    <DialogDescription>
                        Enter your personal Quantum Master Key to unlock secure mode.
                        This key is used to decrypt your identity locally.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="qmk">Master Key (Passphrase)</Label>
                        <Input
                            id="qmk"
                            type="password"
                            placeholder="Enter your passphrase..."
                            value={qmk}
                            onChange={(e) => setQmk(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={!qmk || loading}>
                            {loading ? "Verifying..." : "Unlock Mode"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
