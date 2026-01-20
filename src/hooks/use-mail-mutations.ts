
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
    // Simplistic 'Send' that creates a mail. -- UPDATED for Dual Copy
    const sendMail = (mail: {
        subject: string,
        text: string,
        email: string, // This is the RECIPIENT
        name: string,
        to?: string,
        userEmail: string // The SENDER's email (current user)
    }) => {
        const senderMailId = id()
        const recipientMailId = id()

        const recipientEmail = mail.to || mail.email

        const commonFields = {
            subject: mail.subject,
            text: mail.text,
            date: new Date().toISOString(),
        }

        transact([
            // 1. Sender Copy (Sent Folder)
            db.tx.mails[senderMailId].update({
                ...commonFields,
                name: "To: " + recipientEmail, // Display Name
                email: recipientEmail, // Associate with recipient for display
                ownerEmail: mail.userEmail, // Owned by SENDER
                read: true,
                labels: ["sent"],
                archive: false,
                trash: false
            }),

            // 2. Recipient Copy (Inbox)
            db.tx.mails[recipientMailId].update({
                ...commonFields,
                name: mail.name, // Display Name (Sender's name)
                email: mail.userEmail, // Associate with sender for display
                ownerEmail: recipientEmail, // Owned by RECIPIENT
                read: false, // Unread for recipient
                labels: [], // No special labels (Input)
                archive: false,
                trash: false
            })
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
