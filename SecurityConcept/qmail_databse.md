// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      avatarUrl: i.string().optional(),
      accountStatus: i.string().optional(),
      name: i.string().optional(),
      bio: i.string().optional(),
      preferredAIRule: i.string().optional(),
      aiCustomPrompt: i.string().optional(),
      status: i.string().optional(), // "dnd", "busy", "confidential", "open"
    }),
    // Content of the mail (shared/immutable)
    mails: i.entity({
      subject: i.string(),
      body: i.string(),
      senderEmail: i.string(),
      recipientEmail: i.string(), // Main recipient for reference
      createdAt: i.string(),
      threadId: i.any().optional(), // Group messages by thread - relaxed to any to fix schema push
      isEncrypted: i.boolean().optional(),
      // encryptionKeyId is replaced by the link $mailsRingIdentity
    }),
    // User-specific state (folder, read status)
    boxes: i.entity({
      userEmail: i.string().indexed(), // Owner
      status: i.string().indexed(), // "inbox", "sent", "trash", "archive", "draft"
      read: i.boolean(),
      labels: i.json(), // Extra tags
    }),
    ringIdentities: i.entity({
      publicKey: i.string().indexed(),
      encryptedSecretKey: i.string(), 
      status: i.string().indexed(), // "active", "revoked"
      createdAt: i.string(),
      lastUsedAt: i.string().optional(),
    }),
  },
  links: {
    $mailsRingIdentity: {
        forward: {
          on: "mails",
          has: "one",
          label: "usedRingIdentity",
        },
        reverse: {
          on: "ringIdentities",
          has: "many",
          label: "encryptedMails",
        }
    },
    $boxesMails: {
      forward: {
        on: "boxes",
        has: "one",
        label: "content",
      },
      reverse: {
        on: "mails",
        has: "many",
        label: "boxes",
      }
    },
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    $usersRingIdentities: {
      forward: {
        on: "$users",
        has: "many",
        label: "ringIdentities",
      },
      reverse: {
        on: "ringIdentities",
        has: "one",
        label: "user",
      }
    },
  },
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
type AppSchema = _AppSchema
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;