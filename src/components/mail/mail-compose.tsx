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
import { PenSquare } from "lucide-react"
import { useMailMutations } from "@/hooks/use-mail-mutations"
import { cn } from "@/lib/utils"

interface MailComposeProps {
    className?: string
    isCollapsed?: boolean
}

export function MailCompose({ className, isCollapsed }: MailComposeProps) {
    const [open, setOpen] = React.useState(false)
    const { sendMail } = useMailMutations()
    const [loading, setLoading] = React.useState(false)
    const { user } = db.useAuth()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        // Simple validation could be added here
        const to = formData.get("to") as string
        const subject = formData.get("subject") as string
        const message = formData.get("message") as string

        if (!to || !subject || !user?.email) {
            setLoading(false)
            console.error("Missing fields or user not logged in")
            return // show error
        }

        try {
            await sendMail({
                name: "Me", // Sender name
                email: to, // Recipient for display
                to: to, // Explicit recipient
                subject: subject,
                text: message,
                userEmail: user.email // Pass authenticated user email
            })
            setOpen(false)
        } catch (error) {
            console.error("Failed to send", error)
        } finally {
            setLoading(false)
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
                            />
                        </div>
                        <div className="flex-1 pt-2">
                            <Textarea
                                id="message"
                                name="message"
                                className="min-h-[300px] border-0 focus-visible:ring-0 resize-none p-0 shadow-none text-base"
                                placeholder="Type your message here..."
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 pb-6 sm:justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                            Draft saved automatically
                        </div>
                        <Button type="submit" disabled={loading} size="default">
                            {loading ? "Sending..." : "Send Message"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
