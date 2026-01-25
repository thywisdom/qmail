const BASE_URL = "/api/ring-lwe";

interface KeyPair {
    public_key: string;
    secret_key: string;
}

interface EncryptResponse {
    ciphertext: string;
}

interface DecryptResponse {
    message: string;
}

// ---------------------------
// Ring-LWE Service Wrapper
// ---------------------------

/**
 * Generates a new Ring-LWE keypair from the remote service.
 * @returns {Promise<KeyPair>} The public (safe) and secret (raw) keys.
 */
export async function generateKeyPair(): Promise<KeyPair> {
    const res = await fetch(`${BASE_URL}/keygen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });

    if (!res.ok) {
        throw new Error(`Ring-LWE KeyGen Failed: ${res.statusText}`);
    }
    return res.json();
}

/**
 * Encrypts a message using a recipient's Ring-LWE Public Key.
 * @param publicKey The recipient's public key (Base64)
 * @param message The plaintext message
 * @returns {Promise<string>} The ciphertext (Base64)
 */
export async function encryptMessage(publicKey: string, message: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_key: publicKey, message }) // Snake_case payload for Rust API
    });

    if (!res.ok) {
        throw new Error(`Ring-LWE Encrypt Failed: ${res.statusText}`);
    }

    const data: EncryptResponse = await res.json();
    return data.ciphertext;
}

/**
 * Decrypts a ciphertext using the owned Ring-LWE Secret Key.
 * @param secretKey The raw secret key (Base64)
 * @param ciphertext The encrypted message (Base64)
 * @returns {Promise<string>} The plaintext message
 */
export async function decryptMessage(secretKey: string, ciphertext: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret_key: secretKey, ciphertext }) // Snake_case payload for Rust API
    });

    if (!res.ok) {
        throw new Error(`Ring-LWE Decrypt Failed: ${res.statusText}`);
    }

    const data: DecryptResponse = await res.json();
    return data.message;
}
