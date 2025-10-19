// validation/discoveryPlugin.schema.ts
import { z } from "zod";

// If DiscoveryPluginAction is an enum, prefer nativeEnum:
// enum DiscoveryPluginAction { Middleware = "Middleware", ... }
// const zAction = z.nativeEnum(DiscoveryPluginAction).nullable();
// If it's not an enum (string union unknown), keep it permissive:
const zAction = z.string().min(1).nullable();

// Helper: coerce empty string / undefined → null
const nullableString = z.preprocess((v) => {
  if (v === "" || v === undefined) return null;
  return v;
}, z.string().min(1).nullable());

// Helper: coerce to URL or null
const nullableUrl = z.preprocess((v) => {
  if (v === "" || v == null) return null;
  return v;
}, z.url().nullable());

// Helper: coerce date (accept Date or ISO string) or null
const nullableDate = z.preprocess((v) => {
  if (v === "" || v == null) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return isNaN(+d) ? null : d;
}, z.date().nullable());

// Helper: validate a regex pattern string safely
const nullableRegex = z.preprocess((v) => (v === "" ? null : v), z.string().nullable())
  .superRefine((val, ctx) => {
    if (val == null) return;
    try {
      // Accept raw pattern; you can extend to accept flags like /.../i if you store them
      // eslint-disable-next-line no-new
      new RegExp(val);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid regular expression",
      });
    }
  });

// Content-Type (very permissive; adjust to your allowed list if needed)
const nullableContentType = z.preprocess((v) => (v === "" ? null : v),
  z.string().min(1).nullable()
);

const nullableStatus = z.string().nullable();

// Two-letter ISO code (lowercase). If you maintain a list, replace with Set-check.
const countryCode2 = z.preprocess((v) => (v === "" || v == null ? "us" : String(v).toLowerCase()),
  z.string().regex(/^[a-z]{2}$/, "Use a 2-letter lowercase ISO 3166-1 code")
);

// HTTP method (prefer strict enum; you allowed string, but strict is safer)
const httpMethod = z.enum(["GET", "POST", "PUT", "DELETE"]);

// Semver-ish version (relax/replace if you store arbitrary versions)
const versionString = z.string().regex(/^[0-9]+(\.[0-9]+){1,2}([-\w\.]+)?$/);

// Headers: string/number/boolean values (adjust as needed)
const headersRecord = z.record(z.union([z.string(), z.number(), z.boolean()])).default({});

// fieldMapping: any values keyed by string
const fieldMappingRecord = z.record(z.any()).default({});

export const discoveryPluginSchema = z.object({
  uuid: z.uuid('v4'),

  pluginType: z.string(),           // string | null
  url: z.url(),                     // URL | null
  active: z.boolean(),
  groupName: z.string().min(1),
  action: zAction,                      // DiscoveryPluginAction | null
  homePage: nullableUrl,
  description: z.preprocess((v) => (v === "" ? null : v), z.string().max(5000).nullable()),
  label: z.preprocess((v) => (v === "" ? null : v), z.string().max(255)),
  readOnly: z.boolean(),
  sortOrder: z.number().int().min(0).default(0),
  timeOut: z.number().int().min(0).max(300000),       // 0..5 minutes; adjust to your semantics
  lastAccessedOn: nullableDate,
  createdOn: z.preprocess((v) => (v ? v : new Date()), z.date()),
  timeTakenIn: z.number().int().min(0).default(0),
  method: httpMethod,

  accessed: z.number().int().min(0).default(0),
  version: versionString,

  mimeTypeRegex: nullableRegex,
  status: z.string().nullable(),
  statusError: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
  contentTypeHeader: nullableContentType,
  fieldMapping: fieldMappingRecord,
  headers: headersRecord,
  selectorValue: z.union([z.string(), z.number()]).nullable(),
  country: countryCode2.nullable(),
})
.superRefine((obj, ctx) => {
  // Cross-field rules (examples — tweak or remove as needed):

  // If method is GET, you typically should not send a Content-Type header.
  if (obj.method === "GET" && obj.contentTypeHeader) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contentTypeHeader"],
      message: "Content-Type is unusual for GET requests.",
    });
  }

  // If a mimeTypeRegex exists, and a contentTypeHeader exists, ensure it matches.
  if (obj.mimeTypeRegex && obj.contentTypeHeader) {
    try {
      const re = new RegExp(obj.mimeTypeRegex);
      if (!re.test(obj.contentTypeHeader)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contentTypeHeader"],
          message: "contentTypeHeader does not match mimeTypeRegex.",
        });
      }
    } catch {
      // handled in nullableRegex
    }
  }
});

// Types you can import elsewhere
export type DiscoveryPluginValidated = z.infer<typeof discoveryPluginSchema>;
export type DiscoveryPluginInput = z.input<typeof discoveryPluginSchema>;
