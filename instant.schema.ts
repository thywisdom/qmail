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
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    contacts: i.entity({
      email: i.string(),
      name: i.string(),
    }),
    // Content of the mail (shared/immutable)
    mails: i.entity({
      subject: i.string(),
      body: i.string(),
      senderEmail: i.string(),
      recipientEmail: i.string(), // Main recipient for reference
      createdAt: i.string(),
    }),
    // User-specific state (folder, read status)
    boxes: i.entity({
      userEmail: i.string().indexed(), // Owner
      status: i.string().indexed(), // "inbox", "sent", "trash", "archive", "draft"
      read: i.boolean(),
      labels: i.json(), // Extra tags
    }),
  },
  links: {
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
  },
  rooms: {},
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
