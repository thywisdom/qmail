"use server"

import { Groq } from "groq-sdk"

export async function enhanceUserPrompt(currentPrompt: string) {
    // using specific key for this feature as requested
    const apiKey = process.env.GROQ_API_KEY2

    if (!apiKey) {
        return { success: false, error: "System Configuration Error: GROQ_API_KEY2 missing." }
    }

    const groq = new Groq({ apiKey })

    const systemPrompt = `You are an expert AI Prompt Engineer specialized in creating efficient system instructions.
Your task is to refine the user's input into a concise, high-density system prompt.

Guidelines:
- **EXTREMELY CONCISE**: Remove all filler words. Use fragments instead of full sentences where possible.
- **Role-Based**: Define the Persona clearly (e.g., "Role: Professor of Theoretical Physics").
- **No Conversational Wrapper**: Do NOT output "Here is your prompt" or "User Information:". JUST output the prompt text itself.
- **Focus**: If the user provides bio info, convert it into a "Persona" instruction.
- **Format**: Use a simple single-block format or 2-3 short bullet points.
- **Length**: Keep it under 50 words if possible.

Input: "im Suman , i ma professor at CALTECH PhD in major in theortical phsics and PHD quantum thermodynamics"
Ideal Output: "Persona: Professor Suman (Caltech, PhD Theoretical Physics & Quantum Thermodynamics). Tone: Academic, precise, authoritative."
`

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: currentPrompt }
            ],
            // Using the same reliable model
            model: "llama-3.3-70b-versatile",
            temperature: 0.5, // Lower temperature for more deterministic/structured output
            max_tokens: 512,
        })

        return { success: true, text: completion.choices[0]?.message?.content || "" }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown Error";
        return { success: false, error: `Prompt Enhancement Failed: ${errorMessage}` }
    }
}
