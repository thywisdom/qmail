// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  $users: {
    allow: {
      view: "true",
      create: "false",
      update: "auth.id != null && auth.email == data.email",
      delete: "false",
    },
  },
  ringIdentities: {
    allow: {
      view: "true",
      create: "auth.id != null && auth.id in data.ref('user.id')",
      update: "auth.id != null && auth.id in data.ref('user.id')",
      delete: "false",
    },
    fields: {
      encryptedSecretKey: "auth.id in data.ref('user.id')"
    }
  },
} satisfies InstantRules;

export default rules;
