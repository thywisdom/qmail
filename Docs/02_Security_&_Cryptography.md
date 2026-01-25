# 02. Security & Cryptography (QuantumSecure)

## Overview
QMail integrates **Post-Quantum Cryptography (PQC)** using the **Ring-LWE (Ring Learning With Errors)** algorithm. This ensures that communications remain secure even against future attacks from quantum computers. The implementation treats the cryptographic provider as a stateless sidecar, while the Next.js client handles Identity and Key Management.

## Core Concepts

### 1. Quantum Master Key (QMK)
*   **Definition**: A user-defined master password/key.
*   **Purpose**: Encrypts the local copy of the Ring-LWE Secret Key.
*   **Storage**: **Never stored** on the server. It exists only in the user's memory (or password manager) and the application's volatile memory during a session.

### 2. Ring Identity
Every user has one or more "Ring Identities". Each identity consists of:
*   **Public Key (PK)**: Safe to share. Stored in cleartext in the database.
*   **Secret Key (SK)**: Never leaves the client in plaintext. Stored **Encrypted (AES-GCM)** in the database.

## Key Lifecycle

### Setup & Key Generation
1.  **User Action**: User enables "Quantum Mode" in settings.
2.  **Request**: Client calls `POST /api/ring-lwe/keygen`.
3.  **Generation**: The Rust service creates a fresh Ring-LWE Key Pair.
4.  **Local Encryption**:
    *   Client receives raw `SK`.
    *   Client encrypts `SK` using the user's `QMK`.
    *   `encryptedSK = AES_Encrypt(SK, QMK)`
5.  **Storage**: The `PK` and `encryptedSK` are uploaded to the `ringIdentities` table in InstantDB with status `active`.

### Atomic Key Rotation
To maintain security, keys can be rotated. This uses an Atomic Transaction in InstantDB:
1.  **Generate**: New Key Pair created via API.
2.  **Transact**:
    *   Set `status="revoked"` for the old key.
    *   Set `status="active"` for the new key.
    *   Record `createdAt` timestamp.
*Result*: There is never a gap where a user has no active key.

## Encryption Flow (Sending Mail)
When Alice sends a secure email to Bob:
1.  **Lookup**: Client queries InstantDB for Bob's identity where `status == "active"`.
2.  **Encrypt**: Client sends Bob's `PK` and the message body to the Ring-LWE API.
3.  **Link**: The resulting `ciphertext` is stored in the `mails` table. Crucially, a **Database Link** is created between the specific Mail and the specific Ring Identity (`$mailsRingIdentity`).
    *   *Why?* This allows Bob to know exactly which key to use to decrypt it, even if he has rotated keys 50 times since then.

## Decryption Flow (Reading Mail)
When Bob opens a secure email:
1.  **Identify Key**: Client follows the `usedRingIdentity` link on the mail object to find the correct Identity record.
2.  **Unlock Secret**:
    *   Client downloads `encryptedSK`.
    *   Client decrypts it using the local session `QMK`.
3.  **Decrypt Message**:
    *   Client sends the raw `SK` and `ciphertext` to the Ring-LWE API.
    *   API returns plaintext.
4.  **Display**: Text is shown in the UI. Plaintext is **never saved back** to the database.

## API Specification

**Base URL**: `/api/ring-lwe` (Proxies to `https://ring-lwe.onrender.com`)

| Endpoint | Method | Payload | Response |
| :--- | :--- | :--- | :--- |
| `/keygen` | POST | `{}` | `{ public_key, secret_key }` |
| `/encrypt` | POST | `{ public_key, message }` | `{ ciphertext }` |
| `/decrypt` | POST | `{ secret_key, ciphertext }` | `{ message }` |
