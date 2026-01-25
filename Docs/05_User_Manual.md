# 05. User Manual

## Setup & Login
1.  **Access**: Open the application in your browser.
2.  **Login**: Enter your email. You will receive a Magic Code. Enter it to log in.

## Managing Security (Quantum Mode)
To use the Quantum Secure features, you must first initialize your identity.

1.  **Go to Settings**: Navigate to the user profile/settings area.
2.  **Enable Quantum Mode**: Click the "Enable" or "Rotate Keys" button.
3.  **Set Master Key**: You will be asked to define a **Quantum Master Key (QMK)**.
    *   *Important*: This password is NOT stored on the server. If you lose it, you cannot read your encrypted mail on a new device.
4.  **Confirmation**: Once complete, your "Ring Identity" is active.

## Sending Secure Mail
1.  **Compose**: Open the Compose window.
2.  **Toggle Security**: Click the Lock icon/Quantum Toggle.
3.  **Recipient Check**: The system checks if the recipient has an Active Key.
    *   *If Yes*: The lock turns Green. You can send.
    *   *If No*: You cannot send an encrypted mail to this user (feature disabled).
4.  **Send**: The mail body is encrypted locally and sent.

## Reading Secure Mail
1.  **Inbox**: Encrypted mails appear with a Lock icon.
2.  **Click to Open**:
3.  **Unlock**: If you haven't entered your QMK this session, you will be prompted to enter it.
4.  **View**: The message decrypts and displays.

## Using AI Assistant
1.  **Drafting**: In the compose window, click the "AI Draft" button.
2.  **Input**: Enter a rough idea (e.g., "Ask proper meeting time").
3.  **Generate**: The AI helps write the full text.
4.  **Customization**: Go to Settings -> AI Persona to define your writing style (e.g., "Casual", "Formal", "Brief").
