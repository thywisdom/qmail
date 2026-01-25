# 04. AI Integration

QMail leverages **Groq**'s high-speed inference engine (Llama-3.3-70b) to provide intelligent assistance. All AI operations are handled via secure Server Actions.

## Features

### 1. Smart Email Drafting
Generates complete email drafts from a short subject and content summary.
*   **Action**: `generateEmailDraft` (`src/app/actions/generate-email.ts`)
*   **Mechanism**: Takes user input -> injects "System Prompt" -> Calls Groq.
*   **Customization**: Can inject a user-specific `aiCustomPrompt` (see below) to tailor the tone.

### 2. Prompt Enhancer
Helps users create their custom "Persona".
*   **Action**: `enhanceUserPrompt` (`src/app/actions/enhance-prompt.ts`)
*   **Use Case**: A user types "I am a professor at Caltech". The Enhancer converts this into a rigid system instruction: *"Persona: Professor (Caltech). Tone: Academic, precise."*
*   **Goal**: Improves the quality of subsequent generated emails.

### 3. Smart Reply
Drafts context-aware replies to threads.
*   **Action**: `generateReply` (`src/app/actions/generate-reply.ts`)
*   **Context**: Reads the recent thread history to understand the conversation before suggesting a response.

## Configuration

### Custom AI Persona
Users can define a `preferredAIRule` or `aiCustomPrompt` in their profile. This string is appended to the System Prompt of the generator.

**Example Flow**:
1.  User saves custom rule: *"Always sign off with 'Sent from the Quantum Realm'."*
2.  User drafts email.
3.  Generator receives rule.
4.  Output email ends with *"Sent from the Quantum Realm"*.

### Environment Variables
The AI features require specific API keys in `.env`:
*   `GROQ_API_KEY`: For the main Email Generator.
*   `GROQ_API_KEY2`: For the Prompt Enhancer.
*   `GROQ_API_KEY3`: For the Smart Reply feature.
