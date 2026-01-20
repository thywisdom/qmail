
import { db } from "@/lib/db"
import { i, id } from "@instantdb/react"

export function useMailMutations() {
    // In InstantDB react SDK, 'db.transact' is typically available on the db instance returned by init.
    // If using a specific hook, it might be 'useTransaction' but standard usage is often direct or via db object.
    // Given the error 'Property useTransaction does not exist', we will use 'db.transact' directly.
    const transact = db.transact

    const markAsRead = (mailId: string, read: boolean) => {
        transact(
            db.tx.mails[mailId].update({ read })
        )
    }

    const moveToTrash = (mailId: string) => {
        transact(
            db.tx.mails[mailId].update({ trash: true })
        )
    }

    const restoreFromTrash = (mailId: string) => {
        transact(
            db.tx.mails[mailId].update({ trash: false })
        )
    }

    const archiveMail = (mailId: string) => {
        transact(
            db.tx.mails[mailId].update({ archive: true })
        )
    }

    const unarchiveMail = (mailId: string) => {
        transact(
            db.tx.mails[mailId].update({ archive: false })
        )
    }


    const deletePermanently = (mailId: string) => {
        transact(
            db.tx.mails[mailId].delete()
        )
    }

    // Simplistic 'Send' that creates a mail. 
    // In a real app this might trigger a server function or workflow.
    const sendMail = (mail: {
        subject: string,
        text: string,
        email: string, // This will be the RECIPIENT for sent mails
        name: string,
        to?: string // Optional, but preferred for clarity in call sites
    }) => {
        const mailId = id()
        const isReply = mail.subject.startsWith("Re:")

        // If it's a reply or compose, we treat it as SENT by us.
        // We add "sent" to labels.
        // For the 'email' field in schema: 
        // - If Inbox: it's the Sender.
        // - If Sent: it's the Recipient.

        const labels = ["sent"]

        transact([
            db.tx.mails[mailId].update({
                name: mail.name,
                subject: mail.subject,
                text: mail.text,
                email: mail.to || mail.email, // Use explicit 'to' if provided
                read: true, // Sent mails are read by default
                date: new Date().toISOString(),
                labels: labels,
                archive: false,
                trash: false
            })
            // Link to current user would happen here if we had the user ID easily accessible or context
        ])
    }

    return {
        markAsRead,
        moveToTrash,
        restoreFromTrash,
        archiveMail,
        unarchiveMail,
        deletePermanently,
        sendMail
    }
}
