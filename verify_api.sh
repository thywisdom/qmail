#!/bin/bash

# Configuration
BASE_URL="https://ring-lwe.onrender.com"
MESSAGE="Hello Quantum World"

# Helper for JSON parsing
parse_json() {
    echo "$1" | python3 -c "import sys, json; print(json.load(sys.stdin)['$2'])"
}

echo "----------------------------------------"
echo "🔍 Starting Ring-LWE API Verification"
echo "Target: $BASE_URL"
echo "----------------------------------------"

# 1. Generate Key Pair
echo -e "\n1️⃣  Step 1: Generating Key Pair..."
START_TIME=$(date +%s%3N)
KEYGEN_RES=$(curl -s -X POST "$BASE_URL/keygen" \
    -H "Content-Type: application/json" \
    -d '{}')
END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

if [ -z "$KEYGEN_RES" ]; then
    echo "❌ KeyGen Failed: Empty response"
    exit 1
fi

# Extract Keys (using Python for portability instead of jq)
PUBLIC_KEY=$(parse_json "$KEYGEN_RES" "public_key")
SECRET_KEY=$(parse_json "$KEYGEN_RES" "secret_key")

if [ -z "$PUBLIC_KEY" ] || [ -z "$SECRET_KEY" ]; then
    echo "❌ KeyGen Failed: Invalid JSON or missing keys"
    echo "Response: $KEYGEN_RES"
    exit 1
fi

echo "✅ KeyGen Success (${DURATION}ms)"
echo "   Public Key (trunc): ${PUBLIC_KEY:0:20}..."
echo "   Secret Key (trunc): ${SECRET_KEY:0:20}..."


# 2. Encrypt Message
echo -e "\n2️⃣  Step 2: Encrypting Message..."
echo "   Message: '$MESSAGE'"

ENCRYPT_PAYLOAD=$(jq -n \
                  --arg pk "$PUBLIC_KEY" \
                  --arg msg "$MESSAGE" \
                  '{public_key: $pk, message: $msg}')

# Fallback if jq is missing
if ! command -v jq &> /dev/null; then
    ENCRYPT_PAYLOAD="{\"public_key\": \"$PUBLIC_KEY\", \"message\": \"$MESSAGE\"}"
fi

ENCRYPT_RES=$(curl -s -X POST "$BASE_URL/encrypt" \
    -H "Content-Type: application/json" \
    -d "$ENCRYPT_PAYLOAD")

CIPHERTEXT=$(parse_json "$ENCRYPT_RES" "ciphertext")

if [ -z "$CIPHERTEXT" ] || [ "$CIPHERTEXT" == "null" ]; then
    echo "❌ Encryption Failed"
    echo "Response: $ENCRYPT_RES"
    exit 1
fi

echo "✅ Encryption Success"
echo "   Ciphertext (trunc): ${CIPHERTEXT:0:20}..."


# 3. Decrypt Message
echo -e "\n3️⃣  Step 3: Decrypting Message..."

DECRYPT_PAYLOAD=$(jq -n \
                  --arg sk "$SECRET_KEY" \
                  --arg ct "$CIPHERTEXT" \
                  '{secret_key: $sk, ciphertext: $ct}')

if ! command -v jq &> /dev/null; then
    DECRYPT_PAYLOAD="{\"secret_key\": \"$SECRET_KEY\", \"ciphertext\": \"$CIPHERTEXT\"}"
fi

DECRYPT_RES=$(curl -s -X POST "$BASE_URL/decrypt" \
    -H "Content-Type: application/json" \
    -d "$DECRYPT_PAYLOAD")

DECRYPTED_MESSAGE=$(parse_json "$DECRYPT_RES" "message")

if [ "$DECRYPTED_MESSAGE" == "$MESSAGE" ]; then
    echo "✅ Decryption Success"
    echo "   Result: '$DECRYPTED_MESSAGE'"
else
    echo "❌ Decryption Mismatch"
    echo "   Expected: '$MESSAGE'"
    echo "   Got:      '$DECRYPTED_MESSAGE'"
    echo "   Response: $DECRYPT_RES"
    exit 1
fi

echo -e "\n----------------------------------------"
echo "🎉 All API Tests Passed!"
echo "----------------------------------------"
