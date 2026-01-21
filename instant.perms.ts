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
} satisfies InstantRules;

export default rules;
