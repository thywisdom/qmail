# 03. Data Schema

## Database Overview
QMail uses **InstantDB**, a client-side database that manages relational data with graph-like links.

## Schema Entities

### 1. Users (`$users`)
Core user profile data.
*   `email`: User's unique email address.
*   `name`, `avatarUrl`, `bio`: Profile details.
*   `preferredAIRule`: (Custom) The User's custom "System Prompt" for the AI Assistant.
*   `status`: User presence (e.g., "dnd", "busy").

### 2. Mails (`mails`)
The immutable content of a message.
*   `subject`: Email subject.
*   `body`: The content. **Contains Ciphertext** if `isEncrypted` is true.
*   `senderEmail`, `recipientEmail`: Metadata.
*   `isEncrypted`: Boolean flag.
*   `threadId`: Grouping identifier for conversation threads.

### 3. Boxes (`boxes`)
User-specific views of the mail (Inbox, Sent, Trash). This allows for features like "Archive" without deleting the actual mail.
*   `userEmail`: The owner of this box entry.
*   `status`: "inbox", "archive", "trash", etc.
*   `read`: Read/Unread status.
*   `labels`: JSON array of tags.

### 4. Ring Identities (`ringIdentities`)
Stores the cryptographic keys for the QuantumSecure mode.
*   `publicKey`: The public Ring-LWE key.
*   `encryptedSecretKey`: The private key, encrypted with the user's Master Key.
*   `status`: "active" (current) or "revoked" (historical).

## Relationships (Links)

The power of the schema lies in its links:

| Link Name | Source | Target | Cardinality | Description |
| :--- | :--- | :--- | :--- | :--- |
| `$boxesMails` | `boxes` | `mails` | 1:Many | Connects a user's box state to the actual mail content. |
| `$usersRingIdentities` | `$users` | `ringIdentities` | 1:Many | A user can have multiple keys (history of rotation). |
| `$mailsRingIdentity` | `mails` | `ringIdentities` | 1:1 | **Critical**. Links a specific email to the specific Key Identity used to encrypt it. Ensures historical decryption works. |
| `$usersLinkedPrimaryUser`| `$users` | `$users` | 1:Many | Used for account delegation/multi-account features. |

## Schema Definition
*Source: `src/instant.schema.ts`*

```typescript
// (Simplified snippet)
ringIdentities: i.entity({
    publicKey: i.string(),
    encryptedSecretKey: i.string(),
    status: i.string().indexed(), // "active", "revoked"
    // ...
}),
links: {
    $mailsRingIdentity: {
        forward: { on: "mails", has: "one", label: "usedRingIdentity" },
        reverse: { on: "ringIdentities", has: "many", label: "encryptedMails" }
    }
}
```
