import { format } from "date-fns"
import {
    Archive,
    Calendar as CalendarIcon,
    MoreVertical,
    Trash2,
    Sparkles,
    Loader2
} from "lucide-react"

import { db } from "@/lib/db"
import { useSenderAvatars } from "@/hooks/use-sender-avatars"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Mail } from "@/lib/types"
import { useMailMutations } from "@/hooks/use-mail-mutations"
import React from "react"
import { generateReply } from "@/app/actions/generate-reply"
import { useQuantumAuth } from "@/hooks/use-quantum-auth"


import { decryptSecretKey } from "@/lib/crypto-utils"
import { decryptMessage, encryptMessage } from "@/lib/ring-lwe"
import { toast } from "sonner"
import { useAtom } from "jotai"
import { isQuantumModeAtom } from "@/hooks/use-quantum-mode"

import { ShieldCheck, Lock } from "lucide-react"

interface MailDisplayProps {
    mail: Mail | null
    mails: Mail[] // Need all mails to find the thread
}

export function MailDisplay({ mail, mails }: MailDisplayProps) {
    const { moveToTrash, archiveMail, sendMail, markAsRead, deletePermanently } = useMailMutations()
    const { user } = db.useAuth()
    const [isQuantum] = useAtom(isQuantumModeAtom)

    const [replyText, setReplyText] = React.useState("")
    const [isGeneratingReply, setIsGeneratingReply] = React.useState(false)
    const [showPrivacyWarning, setShowPrivacyWarning] = React.useState(false)

    // Lifted State: Track decrypted content by Mail ID
    const [decryptedContents, setDecryptedContents] = React.useState<Record<string, string>>({})

    const handleTrash = () => {
        if (!mail) return
        if (mail.status === "trash") {
            deletePermanently(mail.id)
        } else {
            moveToTrash(mail.id)
        }
    }

    const handleArchive = () => {
        if (mail) archiveMail(mail.id)
    }

    // Thread Logic: Find all mails in the same thread
    const threadMails = React.useMemo(() => {
        if (!mail || !mail.threadId) return mail ? [mail] : []
        return mails
            .filter((m) => m.threadId === mail.threadId)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }, [mail, mails])

    const { getAvatar } = useSenderAvatars(threadMails)

    // Determine who we are replying to. 
    const recipientEmail = mail?.email

    const { data: qData } = db.useQuery(
        recipientEmail && isQuantum ? {
            $users: {
                $: { where: { email: recipientEmail } },
                ringIdentities: {
                    $: { where: { status: "active" } }
                }
            }
        } : null
    )
    const recipientUser = qData?.$users?.[0]
    const recipientIdentity = recipientUser?.ringIdentities?.[0]


    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mail || !user?.email) return

        let finalMessage = replyText
        let isEncrypted = false
        let usedIdentityId = undefined

        if (isQuantum) {
            if (!recipientIdentity) {
                toast.error("Sender has no Quantum Identity. Cannot reply securely.")
                return
            }
            try {
                finalMessage = await encryptMessage(recipientIdentity.publicKey, replyText)
                isEncrypted = true
                usedIdentityId = recipientIdentity.id
            } catch (err) {
                toast.error("Encryption Failed")
                console.error(err)
                return
            }
        }

        sendMail({
            subject: mail.subject.startsWith("Re:") ? mail.subject : `Re: ${mail.subject}`,
            text: finalMessage,
            email: mail.email,
            to: mail.email,
            name: user.email,
            userEmail: user.email,
            threadId: mail.threadId,
            isEncrypted,
            usedIdentityId
        })
        setReplyText("")
        if (isEncrypted) toast.success("Secure Reply Sent")
        else toast.success("Reply Sent")
    }

    const onGenerateReplyClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (!threadMails.length) return

        // 1. Check if the latest mail is encrypted and NOT decrypted
        // We use the last mail in the thread as the reference context
        const latestMail = threadMails[threadMails.length - 1]

        if (latestMail.isEncrypted && !decryptedContents[latestMail.id]) {
            toast.error("Please decrypt the latest message to generate a reply.")
            return
        }

        // 2. Warn user about privacy
        setShowPrivacyWarning(true)
    }

    const performAiGeneration = async () => {
        setShowPrivacyWarning(false)
        setIsGeneratingReply(true)
        try {
            // Construct context - ONLY include plain text or SUCCESSFULLY decrypted text
            const context = threadMails.map(m => {
                const body = m.isEncrypted
                    ? (decryptedContents[m.id] || "[Encrypted Message Omitted]")
                    : m.text

                // Skip huge omitted blocks or useless ciphertext
                if (body === "[Encrypted Message Omitted]") return ""

                return `From: ${m.name || m.email}\nSubject: ${m.subject}\nBody: ${body}\nDate: ${m.date}\n---\n`
            }).filter(Boolean).join("\n")

            if (!context.trim()) {
                toast.error("No readable content available for AI context.")
                return
            }

            const result = await generateReply(context)
            if (result.success && result.text) {
                setReplyText(result.text)
            } else {
                toast.error(result.error || "Failed to generate reply")
            }
        } catch (err) {
            console.error(err)
            toast.error("An error occurred during generation")
        } finally {
            setIsGeneratingReply(false)
        }
    }


    return (
        <div className="flex h-full flex-col">
            <AlertDialog open={showPrivacyWarning} onOpenChange={setShowPrivacyWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Privacy Warning</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to send the <strong>decrypted content</strong> of this email thread to a third-party AI provider (Groq) to generate a reply.
                            <br /><br />
                            This content will leave the secure Quantum environment. Do you wish to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={performAiGeneration}>Proceed</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex h-[52px] items-center p-2">
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!mail} onClick={handleArchive}>
                                <Archive className="h-4 w-4" />
                                <span className="sr-only">Archive</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Archive</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!mail} onClick={handleTrash}>
                                {mail?.status === "trash" ? <Trash2 className="h-4 w-4 text-red-600" /> : <Trash2 className="h-4 w-4" />}
                                <span className="sr-only">Move to trash</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{mail?.status === "trash" ? "Delete permanently" : "Move to trash"}</TooltipContent>
                    </Tooltip>
                    <Separator orientation="vertical" className="mx-1 h-6" />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Tooltip>
                        <Popover>
                            <PopoverTrigger asChild>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={!mail}>
                                        <CalendarIcon className="h-4 w-4" />
                                        <span className="sr-only">Calendar</span>
                                    </Button>
                                </TooltipTrigger>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-auto">
                                <div className="p-2">
                                    <Calendar />
                                </div>
                            </PopoverContent>
                        </Popover>
                        <TooltipContent>Calendar</TooltipContent>
                    </Tooltip>
                </div>
                <Separator orientation="vertical" className="mx-2 h-6" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={!mail}>
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                            if (!threadMails.length) return
                            const hasUnread = threadMails.some(m => !m.read)
                            threadMails.forEach(m => markAsRead(m.id, !!hasUnread))
                        }}>
                            {threadMails.some(m => !m.read) ? "Mark thread as read" : "Mark thread as unread"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>Star thread</DropdownMenuItem>
                        <DropdownMenuItem>Add label</DropdownMenuItem>
                        <DropdownMenuItem>Mute thread</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Separator />
            {mail ? (
                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        {threadMails.map((threadMail, index) => {
                            const isMe = threadMail.message?.senderEmail === user?.email
                            const senderName = isMe ? "Me" : (threadMail.name || threadMail.message?.senderEmail || "Unknown")

                            return (
                                <div key={threadMail.id} className="flex flex-col">
                                    <div className="flex items-start p-4">
                                        <div className="flex items-start gap-4 text-sm">
                                            <Avatar>
                                                <AvatarImage
                                                    src={getAvatar(threadMail.message?.senderEmail || threadMail.email)}
                                                    alt={senderName}
                                                />
                                                <AvatarFallback>
                                                    {senderName
                                                        .split(" ")
                                                        .map((chunk) => chunk[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-1">
                                                <div className="font-semibold">{senderName}</div>
                                                <div className="line-clamp-1 text-xs">{threadMail.subject}</div>
                                                <div className="line-clamp-1 text-xs">
                                                    <span className="font-medium">Reply-To:</span> {threadMail.message?.senderEmail || threadMail.email}
                                                </div>
                                            </div>
                                        </div>
                                        {threadMail.date && (
                                            <div className="ml-auto text-xs text-muted-foreground">
                                                {format(new Date(threadMail.date), "PPpp")}
                                            </div>
                                        )}
                                    </div>
                                    <MailContent
                                        mail={threadMail}
                                        onDecrypt={(text) => setDecryptedContents(prev => ({ ...prev, [threadMail.id]: text }))}
                                        decryptedTextOverride={decryptedContents[threadMail.id]}
                                    />
                                    {index < threadMails.length - 1 && <Separator />}
                                </div>
                            )
                        })}
                    </div>
                    <Separator className="mt-auto" />
                    <div className="p-4 bg-background">
                        <form onSubmit={handleReply}>
                            <div className="grid gap-4">
                                <Textarea
                                    className="p-4"
                                    placeholder={`Reply ${mail.name}...`}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="flex items-center">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                        onClick={onGenerateReplyClick}
                                        disabled={isGeneratingReply}
                                    >
                                        {isGeneratingReply ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-4 w-4" />
                                        )}
                                        {isGeneratingReply ? "Generating..." : "Generate Reply"}
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="ml-auto"
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="p-8 text-center text-muted-foreground">
                    No message selected
                </div>
            )
            }
        </div >
    )
}

function MailContent({ mail, onDecrypt, decryptedTextOverride }: { mail: Mail, onDecrypt: (text: string) => void, decryptedTextOverride?: string }) {
    const { isQuantumReady, derivedKey } = useQuantumAuth()
    const { user } = db.useAuth()
    const [isDecrypting, setIsDecrypting] = React.useState(false)
    const [error, setError] = React.useState("")

    const { data: identityData } = db.useQuery(
        mail.isEncrypted && user?.id ? {
            ringIdentities: {
                $: { where: { "user.id": user.id, status: "active" } }
            },
            mails: {
                $: { where: { id: mail.message?.id || "" } },
                usedRingIdentity: {}
            }
        } : null
    )


    const handleDecrypt = async () => {
        if (!mail.isEncrypted) return
        if (!isQuantumReady || !derivedKey) {
            toast.error("Please unlock Quantum Mode first.")
            return
        }

        setIsDecrypting(true)
        setError("")
        try {
            if (mail.message?.recipientEmail !== user?.email) {
                // If I am the sender, I actually CANNOT decrypt it unless I stored a copy. 
                // Ring-LWE is public-key encryption. Sender encrypts with Recipient's Public Key.
                // Sender does not have the Recipient's Secret Key. 
                // Unless the system encrypted a copy for the sender, the sender cannot read their own sent encrypted mail.
                // Use-Case Check: Currently, 'sendMail' creates ONE content record. 
                // If I sent it, I encrypted it for the RECIPIENT. I essentially locked it and threw away the key (unless I am the recipient too).
                // WARNING: This is a property of the current system design. 
                // For now, let's inform the user.
                throw new Error("Only the recipient can decrypt this message.")
            }

            let usedIdentity = identityData?.mails?.[0]?.usedRingIdentity
            if (!usedIdentity) {
                const activeIdentity = identityData?.ringIdentities?.[0]
                if (activeIdentity) usedIdentity = activeIdentity
            }

            if (!usedIdentity) throw new Error("Encryption Key Reference missing.")

            const rawSK = await decryptSecretKey(usedIdentity.encryptedSecretKey, derivedKey)
            const plaintext = await decryptMessage(rawSK, mail.text)

            onDecrypt(plaintext)

        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Decryption failed.")
        } finally {
            setIsDecrypting(false)
        }
    }


    if (!mail.isEncrypted) {
        return (
            <div className="whitespace-pre-wrap px-4 pb-4 text-sm">
                {mail.text}
            </div>
        )
    }

    return (
        <div className="mx-4 mb-4 rounded-md border text-sm">
            <div className="flex items-center gap-2 bg-muted/50 p-2 text-muted-foreground border-b">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                <span className="font-medium text-xs uppercase tracking-wider">Quantum Secure</span>
            </div>

            <div className="p-4 bg-muted/10">
                {!isQuantumReady ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                        <Lock className="h-8 w-8 opacity-50" />
                        <p>Message is locked.</p>
                        <p className="text-xs">Enter your Quantum Master Key to verify and decrypt.</p>
                    </div>
                ) : !decryptedTextOverride && !isDecrypting ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Lock className="h-10 w-10 opacity-20" />
                            <p className="text-sm">This content is encrypted with Ring-LWE.</p>
                        </div>
                        <Button
                            onClick={handleDecrypt}
                            variant="outline"
                            className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Decrypt Mail
                        </Button>
                    </div>
                ) : isDecrypting ? (
                    <div className="flex items-center justify-center py-4 gap-2 text-indigo-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Decrypting...
                    </div>
                ) : error ? (
                    <div className="text-destructive py-2 text-center">
                        {error}
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap font-mono text-foreground">
                        {decryptedTextOverride}
                    </div>
                )}
            </div>
        </div>
    )
}
