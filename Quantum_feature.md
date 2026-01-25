# QuantumSecure Feature Analysis

This document outlines the technical implementation of the "QuantumSecure" mode in QMail, detailing the architecture, API data flow, and database schema integration.

## 1. Architecture Overview

The QuantumSecure feature implements a **Hybrid Post-Quantum Cryptography** scheme.
-   **Core Algorithm**: Ring-LWE (Ring Learning With Errors), a lattice-based cryptographic method resistant to quantum computer attacks.
-   **Service Architecture**: A dedicated Rust-based microservice handles the cryptographic primitives, while the Next.js app handles key management and storage.
-   **Security Model**:
    -   **End-to-End Encryption**: The server (InstantDB) stores only ciphertext.
    -   **Client-Side Key Management**: Private keys are encrypted at rest using a "Quantum Master Key" (QMK) known only to the user.

---

## 2. API Integration & Data Flow

The application uses a **Proxy Pattern** to communicate with the Ring-LWE service.

### API Endpoints
**Base URL**: `/api/ring-lwe/[action]` (Proxies to `https://ring-lwe.onrender.com`)

| Action | Function | Input Parameters | Output |
| :--- | :--- | :--- | :--- |
| `keygen` | Generate Keypair | `{}` | `{ public_key, secret_key }` |
| `encrypt` | Encrypt Message | `{ public_key, message }` | `{ ciphertext }` |
| `decrypt` | Decrypt Message | `{ secret_key, ciphertext }` | `{ message }` |

### Detailed Data Flow

#### A. Key Generation (Setup)
1.  **Trigger**: User enables Quantum Mode in Settings.
2.  **API Call**: `POST /api/ring-lwe/keygen`
3.  **Processing**:
    -   Rust Service generates a Ring-LWE keypair.
    -   **Public Key**: Stored as plain text in DB.
    -   **Secret Key**: Encrypted Client-Side using user's QMK (AES-GCM).
4.  **Schema Binding**:
    -   Saved to `ringIdentities` table.
    -   Linked to `$users` table via `$usersRingIdentities`.

#### B. Sending Secure Mail (Encryption)
**File**: `src/components/mail/mail-compose.tsx`

1.  **Recipient Lookup**:
    -   Query: `db.useQuery({ $users: { where: { email: to }, ringIdentities: { where: { status: "active" } } } })`
    -   **Parameter**: `recipientIdentity.publicKey` is bound from the `ringIdentities` table.
2.  **Encryption**:
    -   Call `encryptMessage(publicKey, plainText)`.
    -   Payload sent to `/api/ring-lwe/encrypt`.
3.  **Storage**:
    -   The returned `ciphertext` is saved to `mails` -> `body`.
    -   `isEncrypted` flag set to `true`.
    -   **Critical Link**: The `usedIdentityId` is saved to link the specific key used.

#### C. Reading Secure Mail (Decryption)
**File**: `src/components/mail/mail-display.tsx`

1.  **Unlock**: User enters QMK -> `useQuantumAuth` derives the "Session Key".
2.  **Key Retrieval (Analysis Fix)**:
    -   Primary: Look for `usedRingIdentity` link on the mail object.
    -   Fallback: Look for `active` identity in `ringIdentities` if specific link is broken.
3.  **Secret Key Unlock**:
    -   The `encryptedSecretKey` from DB is decrypted using the Session Key.
    -   Result: Raw Ring-LWE Secret Key.
4.  **Decryption**:
    -   Call `decryptMessage(rawSecretKey, mail.text)`.
    -   Payload sent to `/api/ring-lwe/decrypt`.
5.  **Display**: Plaintext rendered in UI (Ephemeral, not saved back to DB).

---

## 3. Database Schema Integration

The feature relies on the following **InstantDB** schema definitions (`src/instant.schema.ts`):

### `ringIdentities` Table
Stores the cryptographic identity.
-   `publicKey` (String): The public lock. Shared with everyone.
-   `encryptedSecretKey` (String): The private key, encrypted with QMK. Safe to store in DB.
-   `status` (String): "active" or "revoked".

### `mails` Table
Stores the message content.
-   `body` (String): Stores **Ciphertext** if `isEncrypted` is true.`
-   `isEncrypted` (Boolean): Flag to trigger the secure UI.

### Relationships
-   `$usersRingIdentities`: One-to-Many (`User` -> `Identities`). Allows key rotation.
-   `$mailsRingIdentity`: One-to-One/Many (`Mail` -> `Identity`). **Critical** for knowing *which* key decodes a specific message.

---

## 4. Summary of Code Components

-   **`src/lib/ring-lwe.ts`**: Client-side SDK for the API.
-   **`src/hooks/use-quantum-auth.tsx`**: Manages the QMK and Session Key state (Memory only).
-   **`src/app/api/ring-lwe/[action]/route.ts`**: Next.js API Route acting as a secure proxy.
-   **`src/components/mail/mail-*.tsx`**: UI components handling the user interaction and DB queries.
