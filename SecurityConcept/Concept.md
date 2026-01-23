# Ring-LWE System Concept

## 1. Core Philosophy: The Quantum-Resistant Sidecar
This project integrates **Post-Quantum Cryptography (PQC)** into a modern mail application (QMail). Instead of embedding complex math directly into the app logic, we treat the cryptography provider as a **High-Performance Sidecar**.

*   **QMail (The Client)**: Handles user identity, data storage (InstantDB), and business logic. It is the "Coordinator".
*   **Ring-LWE (The Oracle)**: A stateless Microservice written in Rust. It does only three things: Generate Keys, Encrypt, and Decrypt. It knows nothing about "users" or "emails".

---

## 2. Key Management & Lifecycle

### The Identity Model
Every user has a **Ring Identity**, which consists of a pair of keys:
1.  **Public Key (PK)**: Safe to share. stored in cleartext. used by *others* to send mail to you.
2.  **Secret Key (SK)**: Never leaves the client device in plaintext. Stored **Encrypted** in the database.

### Key Exchange (The "Inbox" Pattern)
Unlike real-time chat (Signal/WhatsApp) which requires complex handshakes (X3DH), Email is asynchronous. We use a **Publish-Subscribe** pattern for keys:
1.  **Bob Publishes**: Bob generates a key pair and effectively "pins" his Public Key to his profile in the database.
2.  **Alice Fetches**: When Alice wants to write to Bob, she looks up his current pinned Public Key.
3.  **Alice Encrypts**: Alice seals the message with that PK and sends it.
4.  **Bob Decrypts**: Bob uses his private SK to unseal it whenever he comes online.

### Key Updation (Manual Rotation)
To maintain security over years, keys must be rotated. We use an **Atomic Switch** strategy:

1.  **User Initiates**: The user clicks "Rotate Keys".
2.  **Generate**: A new Key Pair is created.
3.  **Atomic Transaction**: In a single database operation:
    *   The **Old Key** is marked `revoked` (archived for decrypting history).
    *   The **New Key** is marked `active` (used for all future mail).

There is never a moment where a user has no active key.

---

## 3. The "Link-Based" Security Flow

A critical challenge in key rotation is: *How do I decrypt an email from 2 years ago if I have changed keys 5 times since then?*

We solve this with **Immutable Links**:
*   Every email in the database triggers a **Hard Link** to the specific `RingIdentity` (Key ID) used to encrypt it.
*   The email does not say "Decrypt with Bob's Key".
*   It says "Decrypt with Key ID #542".

### The Decryption Pipeline
1.  **Fetch Mail**: Client loads the email.
2.  **Follow Link**: Client follows the ID link to finding the stored (Revoked) Key #542.
3.  **Fetch Secret**: Client downloads the *Encrypted Secret Key* for #542.
4.  **Unlock**: Users decrypts #542 locally using their master password.
5.  **Read**: The email content is revealed.

## 4. Summary of Guarantees
*   **Forward Compatibility**: New keys work instantly for new mail.
*   **Backward Compatibility**: Old keys are preserved to read history.
*   **Zero-Knowledge Storage**: The database (InstantDB) and the Crypto Service (Ring-LWE) never see a raw Secret Key. Only the User's Client Device does.
