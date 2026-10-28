import { betterAuth } from "better-auth";
import { emailOTP, jwt } from "better-auth/plugins";
import { getMigrations } from "better-auth/db/migration";
import { mcp } from "@better-auth/mcp";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely, sql } from "kysely";
import { Resend } from "resend";
import { createHash, createHmac } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

export type Mailer = (
  email: string,
  code: string,
  language: "sv" | "en",
) => Promise<void>;
export type Subscriber = (email: string) => Promise<string>;
export type AuthConfig = {
  baseURL: string;
  databaseURL: string;
  databaseToken?: string;
  secret: string;
  sendCode: Mailer;
  subscribe: Subscriber;
};
type FieldNotes = {
  userId: string;
  consentAt: string;
  status: string;
  contactId: string | null;
};

export function createAuthRuntime(config: AuthConfig) {
  const origin = new URL(config.baseURL).origin;
  const resource = origin + "/mcp";
  const delivery = new AsyncLocalStorage<{
    status: number;
    clientId?: string;
    retryAfter?: number;
  }>();
  const db = new Kysely<{ fieldNotes: FieldNotes }>({
    dialect: new LibsqlDialect({
      url: config.databaseURL,
      authToken: config.databaseToken,
    }),
  });
  async function takeLimit(key: string, seconds: number, max: number) {
    const bucket = Math.floor(Date.now() / 1000 / seconds);
    const result = await sql<{
      count: number;
    }>`insert into "usageLimit" ("key","bucket","count") values (${key},${bucket},1)
      on conflict("key") do update set "count"=case when "bucket"=${bucket} then "count"+1 else 1 end,"bucket"=${bucket} returning "count"`.execute(
      db,
    );
    return result.rows[0].count <= max;
  }
  const auth = betterAuth({
    appName: "Sigge",
    baseURL: origin,
    basePath: "/api/auth",
    secret: config.secret,
    database: { db, type: "sqlite", transaction: true },
    trustedOrigins: [origin],
    emailAndPassword: { enabled: false },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    advanced: {
      ipAddress: { ipAddressHeaders: ["x-vercel-forwarded-for"] },
      useSecureCookies: origin.startsWith("https:"),
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/email-otp/send-verification-otp": { window: 600, max: 5 },
        "/sign-in/email-otp": { window: 600, max: 10 },
        "/oauth2/register": { window: 3600, max: 20 },
      },
    },
    disabledPaths: [
      "/token",
      "/oauth2/delete-consent",
      "/sign-up/email",
      "/email-otp/check-verification-otp",
      "/email-otp/verify-email",
      "/email-otp/request-password-reset",
      "/forget-password/email-otp",
      "/email-otp/reset-password",
      "/email-otp/request-email-change",
      "/email-otp/change-email",
    ],
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        allowedAttempts: 5,
        storeOTP: "hashed",
        async sendVerificationOTP({ email, otp, type }, ctx) {
          if (type !== "sign-in")
            throw new Error("Only email sign-in is supported.");
          const language =
            ctx?.request?.headers.get("x-sigge-language") === "en"
              ? "en"
              : "sv";
          const emailKey = createHmac("sha256", config.secret)
            .update(email.toLowerCase())
            .digest("hex");
          const blockedWindow = !(await takeLimit("mail/" + emailKey, 600, 3))
            ? 600
            : !(await takeLimit("mail/daily", 86400, 100))
              ? 86400
              : 0;
          if (blockedWindow) {
            const state = delivery.getStore();
            if (state) {
              state.status = 429;
              state.retryAfter =
                blockedWindow - (Math.floor(Date.now() / 1000) % blockedWindow);
            }
            return;
          }
          try {
            await config.sendCode(email, otp, language);
          } catch {
            const state = delivery.getStore();
            if (state) state.status = 502;
            else throw new Error("Sign-in delivery failed.");
          }
        },
      }),
      jwt(),
      mcp({
        resource,
        loginPage: "/connect",
        consentPage: "/consent",
        scopes: ["openid", "email", "profile", "offline_access", "copy:read"],
        accessTokenExpiresIn: 300,
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        clientRegistrationDefaultApplicationType: "infer",
        clientPrivileges: () => false,
        async customAccessTokenClaims({ user }) {
          const clientId = delivery.getStore()?.clientId;
          if (!user || !clientId) return { sigge_consent: "" };
          const found = await sql<{
            id: string;
          }>`select id from "oauthConsent" where "userId"=${user.id} and "clientId"=${clientId} limit 1`.execute(
            db,
          );
          return { sigge_consent: found.rows[0]?.id ?? "" };
        },
      }),
      cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
    ],
  });
  async function migrate() {
    const migration = await getMigrations(auth.options);
    await migration.runMigrations();
    await db.schema
      .createTable("fieldNotes")
      .ifNotExists()
      .addColumn("userId", "text", (c) =>
        c.primaryKey().references("user.id").onDelete("cascade"),
      )
      .addColumn("consentAt", "text", (c) => c.notNull())
      .addColumn("status", "text", (c) => c.notNull())
      .addColumn("contactId", "text")
      .execute();
    await db.schema
      .createTable("usageLimit")
      .ifNotExists()
      .addColumn("key", "text", (c) => c.primaryKey())
      .addColumn("bucket", "integer", (c) => c.notNull())
      .addColumn("count", "integer", (c) => c.notNull())
      .execute();
  }
  async function subscribe(user: { id: string; email: string }) {
    const existing = await db
      .selectFrom("fieldNotes")
      .selectAll()
      .where("userId", "=", user.id)
      .executeTakeFirst();
    if (existing?.status === "subscribed") return;
    if (!(await takeLimit("notes/" + user.id, 60, 3)))
      throw new Error("Please retry later.");
    await db
      .insertInto("fieldNotes")
      .values({
        userId: user.id,
        consentAt: new Date().toISOString(),
        status: "pending",
        contactId: null,
      })
      .onConflict((c) => c.column("userId").doNothing())
      .execute();
    const contactId = await config.subscribe(user.email);
    await db
      .updateTable("fieldNotes")
      .set({ status: "subscribed", contactId })
      .where("userId", "=", user.id)
      .execute();
  }
  // Verify current consent as well as JWTs, so a revoked connection stops immediately.
  async function hasConsent(
    userId: string,
    clientId: string,
    consentId: string,
  ) {
    const row =
      await sql`select id from "oauthConsent" where "userId"=${userId} and "clientId"=${clientId} and id=${consentId} limit 1`.execute(
        db,
      );
    return row.rows.length === 1;
  }
  // Better Auth intentionally catches mail errors. Await delivery here and expose
  // provider failure to the caller, isolated per request, never as a false success.
  async function handleAuthRequest(request: Request) {
    const state: { status: number; clientId?: string; retryAfter?: number } = {
      status: 0,
    };
    if (
      new URL(request.url).pathname === "/api/auth/oauth2/token" &&
      request.method === "POST"
    ) {
      const contentType = request.headers.get("content-type") ?? "";
      const body = await request.clone().text();
      try {
        state.clientId = contentType.includes("application/json")
          ? JSON.parse(body).client_id
          : (new URLSearchParams(body).get("client_id") ?? undefined);
        if (
          !state.clientId &&
          request.headers.get("authorization")?.startsWith("Basic ")
        )
          state.clientId = decodeURIComponent(
            Buffer.from(
              request.headers.get("authorization")!.slice(6),
              "base64",
            )
              .toString()
              .split(":")[0],
          );
      } catch {
        /* The OAuth provider rejects malformed token requests. */
      }
    }
    return delivery.run(state, async () => {
      const response = await auth.handler(request);
      return state.status
        ? Response.json(
            {
              error:
                state.status === 429
                  ? "Please retry later."
                  : "Sign-in email could not be sent.",
            },
            {
              status: state.status,
              headers:
                state.status === 429
                  ? { "Retry-After": String(state.retryAfter ?? 600) }
                  : {},
            },
          )
        : response;
    });
  }
  return {
    auth,
    db,
    origin,
    resource,
    migrate,
    subscribe,
    hasConsent,
    handleAuthRequest,
  };
}
export type AuthRuntime = ReturnType<typeof createAuthRuntime>;

export function resendServices(key: string, segmentId: string) {
  const resend = new Resend(key);
  const sendCode: Mailer = async (email, code, language) => {
    const en = language === "en";
    const text = en
      ? `Your Sigge sign-in code is ${code}.\n\nIt expires in 10 minutes and can only be used once.\nIf you did not request this code, you can ignore this email.\n\nhttps://sigge.si/en/connect`
      : `Din inloggningskod till Sigge är ${code}.\n\nKoden gäller i 10 minuter och kan bara användas en gång.\nOm du inte har begärt koden kan du bortse från mejlet.\n\nhttps://sigge.si/connect`;
    const sent = await resend.emails.send(
      {
        from: "Sigge <hej@sigge.si>",
        to: [email],
        subject: en
          ? "Your sign-in code for Sigge"
          : "Din inloggningskod till Sigge",
        text,
        html:
          '<div style="font-family:system-ui;line-height:1.7;white-space:pre-line">' +
          text +
          "</div>",
      },
      {
        idempotencyKey:
          "sigge-login/" +
          createHash("sha256")
            .update(email + "\0" + code)
            .digest("hex"),
      },
    );
    if (sent.error || !sent.data?.id)
      throw new Error("Sign-in email could not be sent.");
  };
  const subscribe: Subscriber = async (email) => {
    const found = await resend.contacts.get({ email });
    if (found.error && found.error.name !== "not_found")
      throw new Error("Field Notes contact lookup failed.");
    let id = found.data?.id;
    if (!id) {
      const created = await resend.contacts.create({
        email,
        unsubscribed: false,
        segments: [{ id: segmentId }],
      });
      if (created.error || !created.data?.id)
        throw new Error("Field Notes subscription failed.");
      id = created.data.id;
    } else {
      const joined = await resend.contacts.segments.add({ email, segmentId });
      if (joined.error) throw new Error("Field Notes subscription failed.");
      if (found.data?.unsubscribed) {
        const updated = await resend.contacts.update({
          email,
          unsubscribed: false,
        });
        if (updated.error) throw new Error("Field Notes subscription failed.");
      }
    }
    return id;
  };
  return { sendCode, subscribe };
}

export function authFromEnvironment(): AuthRuntime | undefined {
  if (process.env.SIGGE_ACCOUNTS_ENABLED !== "true") return undefined;
  const {
    TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN,
    BETTER_AUTH_SECRET,
    RESEND_API_KEY,
    RESEND_FIELD_NOTES_SEGMENT_ID,
    SIGGE_PUBLIC_URL,
  } = process.env;
  if (
    !TURSO_DATABASE_URL ||
    !TURSO_AUTH_TOKEN ||
    !BETTER_AUTH_SECRET ||
    !RESEND_API_KEY ||
    !RESEND_FIELD_NOTES_SEGMENT_ID ||
    !SIGGE_PUBLIC_URL
  )
    throw new Error("Sigge account configuration is incomplete.");
  if (!SIGGE_PUBLIC_URL.startsWith("https://"))
    throw new Error("Public authentication requires HTTPS.");
  return createAuthRuntime({
    baseURL: SIGGE_PUBLIC_URL,
    databaseURL: TURSO_DATABASE_URL,
    databaseToken: TURSO_AUTH_TOKEN,
    secret: BETTER_AUTH_SECRET,
    ...resendServices(RESEND_API_KEY, RESEND_FIELD_NOTES_SEGMENT_ID),
  });
}
