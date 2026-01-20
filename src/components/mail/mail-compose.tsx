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
import { Label } from "@/components/ui/label"
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
            <DialogContent className="sm:max-w-[525px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>New Message</DialogTitle>
                        <DialogDescription>
                            Send a new message to your contacts.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="to" className="text-right">
                                To
                            </Label>
                            <Input
                                id="to"
                                name="to"
                                placeholder="recipient@example.com"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="subject" className="text-right">
                                Subject
                            </Label>
                            <Input
                                id="subject"
                                name="subject"
                                placeholder="Subject"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                name="message"
                                className="min-h-[200px]"
                                placeholder="Type your message here..."
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Sending..." : "Send Message"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
