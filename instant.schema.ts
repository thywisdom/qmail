// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  // We inferred 1 attribute!
  // Take a look at this schema, and if everything looks good,
  // run `push schema` again to enforce the types.
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
      accountStatus: i.string().optional(), // Used to gate app access
      preferredAIRule: i.string().optional(), // Existing placeholder in DB/UI
      aiCustomPrompt: i.string().optional(), // New field for custom system role
    }),
    boxes: i.entity({
      labels: i.json(),
      read: i.boolean(),
      status: i.string().indexed(),
      userEmail: i.string().indexed(),
    }),
    mails: i.entity({
      body: i.string(),
      createdAt: i.string(),
      recipientEmail: i.string(),
      senderEmail: i.string(),
      subject: i.string(),
      threadId: i.string().indexed(),
    }),
  },
  links: {
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
    boxesContent: {
      forward: {
        on: "boxes",
        has: "one",
        label: "content",
      },
      reverse: {
        on: "mails",
        has: "many",
        label: "boxes",
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
