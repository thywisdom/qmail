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


    // Quick "Reply" implementation: just sends a new mail (to self/inbox for demo)
    const handleReply = (e: React.FormEvent) => {
        e.preventDefault()
        if (!mail || !user?.email) return

        // In a real app, this would send to the sender. 
        sendMail({
            subject: mail.subject.startsWith("Re:") ? mail.subject : `Re: ${mail.subject}`, // Keep Re: prefix
            text: replyText,
            email: mail.email, // Reply to the sender (or the email associated with the mail)
            to: mail.email,
            name: user.email, // Sender name can be user's email or name
            userEmail: user.email, // Enforce ownership by current user
            threadId: mail.threadId // maintain thread
        })
        setReplyText("") // Clear input
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
                                    <div className="whitespace-pre-wrap px-4 pb-4 text-sm">
                                        {threadMail.text}
                                    </div>
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
            )}
        </div>
    )
}
