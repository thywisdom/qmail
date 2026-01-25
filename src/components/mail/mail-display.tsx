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

import { Mail } from "@/components/mail/use-mail"
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

    const [replyText, setReplyText] = React.useState("")
    const [isGeneratingReply, setIsGeneratingReply] = React.useState(false)

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

    // Quantum Logic for Replying
    const [isQuantum] = useAtom(isQuantumModeAtom)

    // Determine who we are replying to. 
    // mail.email is usually the SENDER of the mail we are viewing. 
    // Or mail.replyTo if exists. for now use mail.email.
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


    // Quick "Reply" implementation: just sends a new mail (to self/inbox for demo)
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

        // In a real app, this would send to the sender. 
        sendMail({
            subject: mail.subject.startsWith("Re:") ? mail.subject : `Re: ${mail.subject}`, // Keep Re: prefix
            text: finalMessage,
            email: mail.email, // Reply to the sender (or the email associated with the mail)
            to: mail.email,
            name: user.email, // Sender name can be user's email or name
            userEmail: user.email, // Enforce ownership by current user
            threadId: mail.threadId, // maintain thread
            isEncrypted,
            usedIdentityId
        })
        setReplyText("") // Clear input
        if (isEncrypted) toast.success("Secure Reply Sent")
        else toast.success("Reply Sent")
    }

    const onGenerateReply = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (!threadMails.length) return

        setIsGeneratingReply(true)
        try {
            // Construct context from thread
            const context = threadMails.map(m =>
                `From: ${m.name || m.email}\nSubject: ${m.subject}\nBody: ${m.text}\nDate: ${m.date}\n---\n`
            ).join("\n")

            const result = await generateReply(context)
            if (result.success && result.text) {
                setReplyText(result.text)
            } else {
                console.error("Failed to generate reply")
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsGeneratingReply(false)
        }
    }


    return (
        <div className="flex h-full flex-col">
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
                    {/* Junk Removed */}
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
                    {/* Removed Reply/Forward buttons */}
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
                            // Correctly identify sender for display in thread
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
                                    <MailContent mail={threadMail} />
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
                                        onClick={onGenerateReply}
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

function MailContent({ mail }: { mail: Mail }) {
    const { isQuantumReady, derivedKey } = useQuantumAuth()
    const { user } = db.useAuth()
    const [decryptedText, setDecryptedText] = React.useState<string | null>(null)
    const [isDecrypting, setIsDecrypting] = React.useState(false)
    const [error, setError] = React.useState("")

    const { data: identityData } = db.useQuery(
        mail.isEncrypted && user?.id ? {
            ringIdentities: {
                $: { where: { "user.id": user.id, status: "active" } } // Simply fetch active key for now. 
                // ideally we fetch the SPECIFIC key used for this mail via link, but for MVP let's fetch active or check links.
                // The schema has $mailsRingIdentity. Let's try to query it.
            },
            mails: {
                // IMPORTANT: mail.id is the BOX id. We need the Content ID.
                // mapBoxToMail stores the raw content in mail.message
                $: { where: { id: mail.message?.id || "" } },
                usedRingIdentity: {}
            }
        } : null
    )

    React.useEffect(() => {
        if (!mail.isEncrypted) return
        if (!isQuantumReady || !derivedKey) return
        if (decryptedText) return // Already decrypted

        const decrypt = async () => {
            setIsDecrypting(true)
            setError("")
            try {
                // 1. Get the Identity used for this mail
                // If mail is sent to ME, I need MY key.
                // If I sent the mail, I need... wait, if I sent it, I encrypted it with RECIPIENT'S key.
                // Sender cannot decrypt their own Ring-LWE messages usually unless they stored a copy or the sender's ephemeral key (which Ring-LWE doesn't usually persist in this simple model).
                // "The email does not say 'Decrypt with Bob's Key'. It says 'Decrypt with Key ID #542'."
                // Key #542 is the RECIPIENT'S key. 
                // If I am the recipient, I have the Private Key for #542.
                // If I am the sender, I DO NOT have the Private Key for #542.
                // LIMITATION: Only RECIPIENT can decrypt. Sender sees ciphertext or "Encrypted for Recipient".

                // Check if I am the recipient
                if (mail.message?.recipientEmail !== user?.email) {
                    // I am the sender (or observer).
                    setDecryptedText("Encrypted message (Only recipient can view)")
                    return
                }

                // I am recipient. Fetch the key link.
                const usedIdentity = identityData?.mails?.[0]?.usedRingIdentity

                if (!usedIdentity) {
                    // Fallback to searching active identity if link missing (legacy/dev)
                    // But in strict mode, we need the link.
                    throw new Error("Encryption Key Reference missing.")
                }

                // 2. Decrypt SK
                const rawSK = await decryptSecretKey(usedIdentity.encryptedSecretKey, derivedKey)

                // 3. Decrypt Content
                // mail.text holds the ciphertext? Or mail.body? 
                // mapBoxToMail maps body -> text.
                const plaintext = await decryptMessage(rawSK, mail.text)
                setDecryptedText(plaintext)

            } catch (err) {
                console.error(err)
                setError("Decryption failed. Invalid Key or Session.")
            } finally {
                setIsDecrypting(false)
            }
        }

        decrypt()
    }, [mail, isQuantumReady, derivedKey, identityData, user, decryptedText])

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
                        {/* The Toggle in Nav handles logic, user needs to click that. Or provided button here */}
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
                        {decryptedText}
                    </div>
                )}
            </div>
        </div>
    )
}
