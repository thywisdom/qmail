# QMail Project Documentation

Welcome to the technical documentation for **QMail**, a Next.js-based secure email application featuring Post-Quantum Cryptography and AI-assisted drafting.

## Table of Contents

1.  [**Architecture Overview**](./01_Architecture.md)
    *   High-level system design, technology stack, and component interaction.
2.  [**Security & Cryptography**](./02_Security_&_Cryptography.md)
    *   Deep dive into the **QuantumSecure** mode, Ring-LWE integration, and Key Management.
3.  [**Data Schema**](./03_Data_Schema.md)
    *   InstantDB schema definitions, entities (`users`, `mails`), and relationships.
4.  [**AI Features**](./04_AI_Integration.md)
    *   Documentation for the AI Email Assistant, Reply Generator, and Prompt Enhancer (Groq).
5.  [**User Manual & Flows**](./05_User_Manual.md)
    *   Guide on application setup, key rotation, and secure mail workflows.

## Quick Start

### Prerequisites
- Node.js & npm/bun
- InstantDB Application ID
- Groq API Keys (for AI features)
- Running Ring-LWE Microservice (for Quantum functions)

### Environment Variables
Ensure your `.env` file contains:
```bash
NEXT_PUBLIC_INSTANT_APP_ID=...
GROQ_API_KEY=...
GROQ_API_KEY2=...
GROQ_API_KEY3=...
```

### Installation
```bash
npm install
npm run dev
```
