"use client"

import { db } from "@/lib/db"
import { mails, contacts } from "@/lib/data" // Importing from local data copy

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { id } from "@instantdb/react"

export default function SeedPage() {
    const [status, setStatus] = useState("Idle")

    const handleSeed = () => {
        setStatus("Seeding...")

        try {
            // Seed Mails
            const mailChunks = []
            const chunkSize = 50
            for (let i = 0; i < mails.length; i += chunkSize) {
                const chunk = mails.slice(i, i + chunkSize);
                const txs = chunk.map(mail => {
                    return db.tx.mails[mail.id].update({
                        subject: mail.subject,
                        text: mail.text,
                        date: mail.date,
                        read: mail.read,
                        labels: mail.labels,
                        name: mail.name,
                        email: mail.email,
                    })
                })
                db.transact(txs)
            }

            // Seed Contacts
            const contactChunks = []
            for (let i = 0; i < contacts.length; i += chunkSize) {
                const chunk = contacts.slice(i, i + chunkSize);
                const txs = chunk.map(contact => {
                    const contactId = id()
                    return db.tx.contacts[contactId].update({
                        name: contact.name,
                        email: contact.email,
                    })
                })
                db.transact(txs)
            }

            setStatus("Done!")
        } catch (e) {
            console.error(e)
            setStatus("Error")
        }
    }

    return (
        <div className="flex h-screen items-center justify-center flex-col gap-4">
            <h1>Seed Data</h1>
            <p className="text-sm text-gray-500">Click below to populate database with example data</p>
            <Button onClick={handleSeed} disabled={status !== "Idle"}>
                {status}
            </Button>
        </div>
    )
}
