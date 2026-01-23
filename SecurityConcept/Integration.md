# Ring-LWE Integration Guide for QMail

## 1. System Overview
This document details the integration of the **Ring-LWE Cryptographic Service** into the **QMail Application**. The Ring-LWE service acts as a specialized, high-performance microservice responsible solely for quantum-resistant key generation, encryption, and decryption.

**Architecture Pattern**: Microservice / Sidecar
**Protocol**: HTTP (REST) with JSON payloads
**Data Encoding**: Base64 for all cryptographic binaries (keys, ciphertexts)

---

## 2. Database Schema (InstantDB)

We integrate with QMail's InstantDB schema. The existing attributes `$user` and `mails` are extended with a new entity to handle Ring-LWE identities.

### **New Entity: `ringIdentities`**

This entity stores the cryptographic keys. It links to the `$users` entity.

**Schema Definitions**:
```javascript
// Add to your InstantDB schema definition
ringIdentities: i.entity({
  publicKey: i.string().indexed(),       // The Ring-LWE public key (safe to share)
  encryptedSecretKey: i.string(),        // The Ring-LWE secret key, ENCRYPTED before storage
  status: i.string().indexed(),          // "active", "revoked"
  createdAt: i.string(),                 // ISO timestamp
  lastUsedAt: i.string().optional(),     // ISO timestamp
}),

// Update Links
links: {
  // ... existing links
  $usersRingIdentities: {
    forward: {
      on: "$users",
      has: "one",
      label: "ringIdentity",
    },
    reverse: {
      on: "ringIdentities",
      has: "one",
      label: "user",
    }
  }
}
```

> [!IMPORTANT]
> **Security Requirement**: The `encryptedSecretKey` attribute MUST be the result of a strong client-side or server-side encryption (e.g., AES-GCM) of the raw secret key using a user-owned secret (password-derived key) or master key. **Never store the raw key in InstantDB.**

---

## 3. Integration & Request Flow

The following flows describe the interaction between the QMail Frontend/Client, InstantDB, and the Ring-LWE Service.

### **A. User Setup / Key Rotation (Key Generation)**
**Trigger**: A new user signs up, or user manually requests key rotation.

1.  **QMail Client** calls Ring-LWE:
    *   `POST /keygen` (Payload: `{}`)
2.  **Ring-LWE Service** responds:
    *   `{ "public_key": "PK_BASE64", "secret_key": "SK_BASE64" }`
3.  **QMail Client** encrypts the secret key:
    *   `const encryptedSK = await encryptLocal(secret_key, userMasterKey);`
4.  **QMail Client** performs an **Atomic Rotation Transaction** in InstantDB:
    *   *Goal*: Revoke the old active key (if any) AND add the new active key in a single atomic operation.
    ```javascript
    // 1. Find the current active key (if exists)
    const oldKey = data.user.ringIdentities.find(k => k.status === "active");

    // 2. Prepare Transaction items
    const ops = [];
    
    // Revoke old key
    if (oldKey) {
      ops.push(tx.ringIdentities[oldKey.id].update({ status: "revoked", lastUsedAt: new Date().toISOString() }));
    }

    // Add new key
    ops.push(
      tx.ringIdentities[newId].update({
        publicKey: "PK_BASE64",
        encryptedSecretKey: encryptedSK,
        status: "active",
        createdAt: new Date().toISOString()
      }).link({user: userId})
    );

    // 3. Execute Atomically
    db.transact(ops);
    ```

### **B. Sending an Encrypted Email**
**Trigger**: Alice (Sender) writes to Bob (Recipient).

1.  **QMail Client** fetches Bob's **Active** public key from InstantDB:
    ```javascript
    // InstaQL Query
    const query = {
      $users: {
        $: { where: { email: "bob@example.com" } },
        ringIdentities: { $: { where: { status: "active" } } } // Fetch only ACTIVE key
      }
    };
    // Result: 
    // const recipientParams = data.$users[0].ringIdentities[0];
    // const bobPublicKey = recipientParams.publicKey;
    // const bobKeyId = recipientParams.id;
    ```
2.  **QMail Client** sends payload to Ring-LWE:
    *   `POST /encrypt` with `{ "public_key": bobPublicKey, "message": "Content..." }`
3.  **Ring-LWE Service** returns `{ "ciphertext": "CT_BASE64" }`.
4.  **QMail Client** creates the mail in InstantDB:
    ```javascript
    db.transact(
      tx.mails[mailId].update({
        subject: "Secret Subject",
        body: ciphertext, // Store ciphertext in body
        senderEmail: "alice@example.com",
        recipientEmail: "bob@example.com",
        createdAt: new Date().toISOString(),
        isEncrypted: true
      })
      .link({ usedRingIdentity: bobKeyId }) // <--- LINK the specific key used!
      // Link to boxes/threads as usual
    )
    ```

### **C. Viewing an Encrypted Email**
**Trigger**: Bob opens the email.

1.  **QMail Client** detects `isEncrypted: true`.
2.  **QMail Client** fetches the mail **with the linked key**:
    ```javascript
    // Query specific identity via link
    const query = {
      mails: {
        $: { where: { id: mailId } },
        usedRingIdentity: {} // <--- Follow the link
      }
    };
    // Result: 
    // const identity = data.mails[0].usedRingIdentity;
    // const encryptedSecretKey = identity.encryptedSecretKey;
    ```
3.  **QMail Client** decrypts the key locally:
    *   `const rawSK = await decryptLocal(encryptedSecretKey, userMasterKey);`
5.  **QMail Client** calls Ring-LWE:
    *   `POST /decrypt` with `{ "secret_key": rawSK, "ciphertext": mail.body }`
6.  **Ring-LWE Service** responds with `{ "message": "Plaintext..." }`.
7.  **QMail Client** displays the text.

---

## 4. API Specification Structure

### Base URL
`http://localhost:3000` (Ring-LWE Service)

*Note: If QMail is a purely client-side app (SPA), you may need to proxy these requests or configure CORS on the Ring-LWE service to allow traffic from the QMail domain.*

### Endpoints (Unchanged)
The JSON contract remains the same as previously defined.

#### 1. Generate Key Pair (`POST /keygen`)
#### 2. Encrypt Message (`POST /encrypt`)
#### 3. Decrypt Message (`POST /decrypt`)

See the [Ring-LWE Service Documentation] for payload details.

## 5. Security Checklist
- [ ] **InstantDB Rules**: Configure InstantDB permissions so users can only read `publicKey` of others, but `encryptedSecretKey` is only readable by the owner (`auth.id == data.user.id`).
- [ ] **Key Encryption**: Ensure `encryptLocal` uses a robust algorithm (e.g., WebCrypto AES-GCM) and the key is derived securely (e.g., PBKDF2).
- [ ] **Transport Security**: Ring-LWE must run over HTTPS if accessed from a public web client.
