"use server"

import { Groq } from "groq-sdk"

export async function generateReply(threadContext: string) {
    const apiKey = process.env.GROQ_API_KEY3

    if (!apiKey) {
        throw new Error("GROQ_API_KEY3 is not defined.")
    }

    const groq = new Groq({ apiKey })

    const systemPrompt = `You are an intelligent AI Email Assistant.
Your task is to draft a professional, concise, and relevant reply to the provided email thread.

Guidelines:
- Analyze the most recent message in the thread carefully.
- adopt a professional and helpful tone.
- Be concise. Avoid fluff.
- Do NOT include subject lines or placeholders like "[Your Name]" unless absolutely necessary.
- If the thread context implies a specific relationship, adapt slightly (e.g. casual vs formal).
- Output ONLY the body of the reply email.

Thread Context Provided Below:
`

    // Truncate context to prevent 413 errors (max ~12k tokens)
    // 1 token ~= 4 chars. 12000 tokens ~= 48000 chars. 
    // We'll be conservative and use 20000 chars max.
    const MAX_CONTEXT_LENGTH = 20000
    const safeContext = threadContext.length > MAX_CONTEXT_LENGTH
        ? "..." + threadContext.slice(-MAX_CONTEXT_LENGTH)
        : threadContext

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: safeContext }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            max_tokens: 1024,
        })

        return { success: true, text: completion.choices[0]?.message?.content || "" }
    } catch (error) {
        console.error("Groq Reply Generation Error:", error)
        // Extract error message safe for client
        return { success: false, error: "Failed to generate reply (API Error)." }
    }
}
