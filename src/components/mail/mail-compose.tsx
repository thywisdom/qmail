import * as React from "react"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PenSquare, Sparkles, Loader2 } from "lucide-react"
import { useMailMutations } from "@/hooks/use-mail-mutations"
import { cn } from "@/lib/utils"
import { generateEmail } from "@/app/actions/generate-email"
import { useAtom } from "jotai"
import { isQuantumModeAtom } from "@/hooks/use-quantum-mode"
import { encryptMessage } from "@/lib/ring-lwe"
import { toast } from "sonner"


interface MailComposeProps {
    className?: string
    isCollapsed?: boolean
}

export function MailCompose({ className, isCollapsed }: MailComposeProps) {
    const [open, setOpen] = React.useState(false)
    const { sendMail } = useMailMutations()
    const [loading, setLoading] = React.useState(false)
    const { user } = db.useAuth()

    // Controlled inputs for AI manipulation
    const [to, setTo] = React.useState("")
    const [subject, setSubject] = React.useState("")
    const [message, setMessage] = React.useState("")

    // AI State
    const [aiLoading, setAiLoading] = React.useState(false)

    // Fetch user profile for custom prompt
    const { data: userData } = db.useQuery(user?.email ? { $users: { $: { where: { email: user.email } } } } : null)
    const userProfile = userData?.$users?.[0]

    // Quantum Logic: Query recipient's identity
    const [isQuantum] = useAtom(isQuantumModeAtom)

    // We query the recipient to get their Public Key
    // Note: We use 'to' state, but debouncing is handled by InstantDB implicitly to some extent or we rely on the user finishing typing.


    // Correct Query for Relation Traversal:
    const { data: qData } = db.useQuery(
        to && isQuantum ? {
            $users: {
                $: { where: { email: to } },
                ringIdentities: {
                    $: { where: { status: "active" } }
                }
            }
        } : null
    )

    const recipientUser = qData?.$users?.[0]
    const recipientIdentity = recipientUser?.ringIdentities?.[0]

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        if (!to || !subject || !user?.email) {
            setLoading(false)
            // field validation handled by HTML required attribute mostly, but double check here
            setLoading(false)
            toast.error("Please fill in all fields.")
            return
        }

        // Quantum Check
        let finalMessage = message
        let isEncrypted = false
        let usedIdentityId = undefined

        if (isQuantum) {
            // Must have recipient identity
            if (!recipientIdentity) {
                toast.error("Recipient has no Quantum Identity. Cannot send secure mail.")
                setLoading(false)
                return
            }

            try {
                // Encrypt
                finalMessage = await encryptMessage(recipientIdentity.publicKey, message)
                isEncrypted = true
                usedIdentityId = recipientIdentity.id
            } catch {

                toast.error("Failed to encrypt message.")
                setLoading(false)
                return
            }
        }

        try {
            await sendMail({
                name: userProfile?.name || "Me",
                email: to,
                to: to,
                subject: subject,
                text: finalMessage,
                userEmail: user.email,
                isEncrypted,
                usedIdentityId
            })
            setOpen(false)
            // Reset form
            setTo("")
            setSubject("")
            setMessage("")
        } catch {
            toast.error("Failed to send email. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleAIGenerate = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (!subject && !message) {
            // Ideally show a toast here
            toast.error("Please add a subject or message content first.")
            return
        }

        setAiLoading(true)
        try {
            const customPrompt = userProfile?.aiCustomPrompt || ""
            const result = await generateEmail(subject, message, customPrompt)

            if (result.success && result.text) {
                setMessage(result.text)
            } else {
                toast.error(result.error || "Failed to generate AI content.")
            }
        } catch {
            toast.error("Failed to generate AI content.")
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    className={cn(
                        "justify-start gap-2",
                        isCollapsed ? "h-9 w-9 justify-center px-0" : "h-9 w-full px-3",
                        className
                    )}
                >
                    <PenSquare className="h-4 w-4" />
                    {!isCollapsed && "Compose"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <DialogTitle>New Message</DialogTitle>
                        <DialogDescription>
                            Send a new message to your contacts.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col p-6 gap-2">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <span className="text-sm font-medium text-muted-foreground w-[60px]">To</span>
                            <Input
                                id="to"
                                name="to"
                                placeholder="recipient@example.com"
                                className="border-0 focus-visible:ring-0 shadow-none px-0 h-9"
                                required
                                autoFocus
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 border-b pb-2">
                            <span className="text-sm font-medium text-muted-foreground w-[60px]">Subject</span>
                            <Input
                                id="subject"
                                name="subject"
                                placeholder="Subject"
                                className="border-0 focus-visible:ring-0 shadow-none px-0 h-9 text-base font-medium"
                                required
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 pt-2">
                            <Textarea
                                id="message"
                                name="message"
                                className="min-h-[300px] border-0 focus-visible:ring-0 resize-none p-0 shadow-none text-base"
                                placeholder="Type your message here..."
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 pb-6 sm:justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={loading || aiLoading}
                                onClick={handleAIGenerate}
                                className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950/50"
                            >
                                {aiLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                {aiLoading ? "Generating..." : "AI Generate"}
                            </Button>
                        </div>
                        <Button type="submit" disabled={loading || aiLoading} size="default">
                            {loading ? "Sending..." : "Send Message"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
