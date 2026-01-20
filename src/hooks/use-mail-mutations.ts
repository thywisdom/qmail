
import { db } from "@/lib/db"
import { i, id } from "@instantdb/react"

export function useMailMutations() {
    // In InstantDB react SDK, 'db.transact' is typically available on the db instance returned by init.
    // If using a specific hook, it might be 'useTransaction' but standard usage is often direct or via db object.
    // Given the error 'Property useTransaction does not exist', we will use 'db.transact' directly.
    const transact = db.transact

    const markAsRead = (boxId: string, read: boolean) => {
        transact(
            db.tx.boxes[boxId].update({ read })
        )
    }

    const moveToTrash = (boxId: string) => {
        transact(
            db.tx.boxes[boxId].update({ status: "trash" })
        )
    }

    const restoreFromTrash = (boxId: string) => {
        transact(
            db.tx.boxes[boxId].update({ status: "inbox" })
        )
    }

    const archiveMail = (boxId: string) => {
        transact(
            db.tx.boxes[boxId].update({ status: "archive" })
        )
    }

    const unarchiveMail = (boxId: string) => {
        transact(
            db.tx.boxes[boxId].update({ status: "inbox" })
        )
    }


    const deletePermanently = (boxId: string) => {
        transact(
            db.tx.boxes[boxId].delete()
        )
    }

    // Relational 'Send'
    const sendMail = (mail: {
        subject: string,
        text: string,
        email: string, // Recipient
        name: string,
        to?: string,
        userEmail: string // Sender
    }) => {
        const mailContentId = id()
        const senderBoxId = id()
        const recipientBoxId = id()

        const recipientEmail = mail.to || mail.email
        const now = new Date().toISOString()

        transact([
            // 1. Create Shared Content
            db.tx.mails[mailContentId].update({
                subject: mail.subject,
                body: mail.text,
                senderEmail: mail.userEmail,
                recipientEmail: recipientEmail,
                createdAt: now,
            }),

            // 2. Sender Box (Sent Folder)
            db.tx.boxes[senderBoxId].update({
                userEmail: mail.userEmail,
                status: "sent",
                read: true,
                labels: [],
            }).link({ content: mailContentId }), // Link to content

            // 3. Recipient Box (Inbox)
            db.tx.boxes[recipientBoxId].update({
                userEmail: recipientEmail,
                status: "inbox",
                read: false,
                labels: [],
            }).link({ content: mailContentId }), // Link to content
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
