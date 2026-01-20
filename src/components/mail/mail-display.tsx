import { addDays, addHours, format, nextSaturday } from "date-fns"
import {
    Archive,
    ArchiveX,
    Clock,
    Forward,
    MoreVertical,
    Reply,
    ReplyAll,
    Trash2,
} from "lucide-react"

import { db } from "@/lib/db"
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
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { Mail } from "@/components/mail/use-mail"
import { useMailMutations } from "@/hooks/use-mail-mutations"
import React from "react"

interface MailDisplayProps {
    mail: Mail | null
    mails: Mail[] // Need all mails to find the thread
}

export function MailDisplay({ mail, mails }: MailDisplayProps) {
    const today = new Date()
    const { moveToTrash, archiveMail, sendMail, markAsRead, deletePermanently } = useMailMutations()
    const { user } = db.useAuth()

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

    const [replyText, setReplyText] = React.useState("")


    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center p-2">
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
                    <Tooltip>
                        <Popover>
                            <PopoverTrigger asChild>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={!mail}>
                                        <Clock className="h-4 w-4" />
                                        <span className="sr-only">Snooze</span>
                                    </Button>
                                </TooltipTrigger>
                            </PopoverTrigger>
                            <PopoverContent className="flex w-[535px] p-0">
                                <div className="flex flex-col gap-2 border-r px-2 py-4">
                                    <div className="px-4 text-sm font-medium">Snooze until</div>
                                    <div className="grid min-w-[250px] gap-1">
                                        <Button
                                            variant="ghost"
                                            className="justify-start font-normal"
                                        >
                                            Later today{" "}
                                            <span className="ml-auto text-muted-foreground">
                                                {format(addHours(today, 4), "E, h:m b")}
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="justify-start font-normal"
                                        >
                                            Tomorrow
                                            <span className="ml-auto text-muted-foreground">
                                                {format(addDays(today, 1), "E, h:m b")}
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="justify-start font-normal"
                                        >
                                            This weekend
                                            <span className="ml-auto text-muted-foreground">
                                                {format(nextSaturday(today), "E, h:m b")}
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="justify-start font-normal"
                                        >
                                            Next week
                                            <span className="ml-auto text-muted-foreground">
                                                {format(addDays(today, 7), "E, h:m b")}
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <Calendar />
                                </div>
                            </PopoverContent>
                        </Popover>
                        <TooltipContent>Snooze</TooltipContent>
                    </Tooltip>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!mail}>
                                <Reply className="h-4 w-4" />
                                <span className="sr-only">Reply</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reply</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!mail}>
                                <ReplyAll className="h-4 w-4" />
                                <span className="sr-only">Reply all</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reply all</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!mail}>
                                <Forward className="h-4 w-4" />
                                <span className="sr-only">Forward</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Forward</TooltipContent>
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
                <div className="flex flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto">
                        {threadMails.map((threadMail, index) => (
                            <div key={threadMail.id} className="flex flex-col">
                                <div className="flex items-start p-4">
                                    <div className="flex items-start gap-4 text-sm">
                                        <Avatar>
                                            <AvatarImage alt={threadMail.name} />
                                            <AvatarFallback>
                                                {threadMail.name
                                                    .split(" ")
                                                    .map((chunk) => chunk[0])
                                                    .join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-1">
                                            <div className="font-semibold">{threadMail.name}</div>
                                            <div className="line-clamp-1 text-xs">{threadMail.subject}</div>
                                            <div className="line-clamp-1 text-xs">
                                                <span className="font-medium">Reply-To:</span> {threadMail.email}
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
                        ))}
                    </div>
                    <Separator className="mt-auto" />
                    <div className="p-4">
                        <form onSubmit={handleReply}>
                            <div className="grid gap-4">
                                <Textarea
                                    className="p-4"
                                    placeholder={`Reply ${mail.name}...`}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="flex items-center">
                                    <Label
                                        htmlFor="mute"
                                        className="flex items-center gap-2 text-xs font-normal"
                                    >
                                        <Switch id="mute" aria-label="Mute thread" /> Mute this
                                        thread
                                    </Label>
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
