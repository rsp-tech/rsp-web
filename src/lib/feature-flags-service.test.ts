import { describe, expect, it } from "vitest";
import type { FeatureFlag } from "@/types";
import {
  evaluatePublicFlags,
  evaluateUserFlags,
} from "./feature-flags-service";

const mockFlags: FeatureFlag[] = [
  {
    id: "disabled_flag",
    name: "Disabled Flag",
    description: null,
    is_enabled: false,
    is_ga: true,
    allowed_roles: [],
    allowed_emails: [],
  },
  {
    id: "ga_flag",
    name: "GA Flag",
    description: null,
    is_enabled: true,
    is_ga: true,
    allowed_roles: [],
    allowed_emails: [],
  },
  {
    id: "role_flag",
    name: "Role Flag",
    description: null,
    is_enabled: true,
    is_ga: false,
    allowed_roles: [2, 3],
    allowed_emails: [],
  },
  {
    id: "email_flag",
    name: "Email Flag",
    description: null,
    is_enabled: true,
    is_ga: false,
    allowed_roles: [],
    allowed_emails: ["beta@example.com"],
  },
];

describe.concurrent("feature-flags-service suite", () => {
  it.concurrent("evaluatePublicFlags returns only enabled GA flags", () => {
    const publicFlags = evaluatePublicFlags(mockFlags);
    expect(publicFlags).toEqual(["ga_flag"]);
  });

  it.concurrent("evaluateUserFlags returns non-GA role/email targeted flags", () => {
    const userRoleFlags = evaluateUserFlags(mockFlags, {
      app_metadata: {
        role_id: 2,
      },
      email: "random@test.com",
      id: "",
      user_metadata: {},
      aud: "",
      created_at: "",
    });
    expect(userRoleFlags).toEqual(["role_flag"]);

    const userEmailFlags = evaluateUserFlags(mockFlags, {
      app_metadata: {
        role_id: 99,
      },
      email: "BETA@EXAMPLE.COM",
      id: "",
      user_metadata: {},
      aud: "",
      created_at: "",
    });
    expect(userEmailFlags).toEqual(["email_flag"]);
  });
});
