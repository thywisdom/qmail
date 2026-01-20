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
    }),
    contacts: i.entity({
      email: i.string(),
      name: i.string(),
    }),
    mails: i.entity({
      archive: i.boolean().optional(),
      date: i.string(),
      email: i.string(),
      labels: i.json(),
      name: i.string(),
      read: i.boolean(),
      subject: i.string(),
      text: i.string(),
      trash: i.boolean().optional(),
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
    $usersMails: {
      forward: {
        on: "$users",
        has: "many",
        label: "mails",
      },
      reverse: {
        on: "mails",
        has: "one",
        label: "user",
      },
    },
  },
  rooms: {},
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
