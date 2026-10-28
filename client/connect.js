import { t, language, onLanguageChange, route } from "./i18n.js";
const $ = (id) => document.getElementById(id);
const consentPage = !!$("consent-form");
let user = null,
  notesStatus = "not-subscribed",
  noticeKey = null;
const oauthParams = new URLSearchParams(location.search);
const oauthQuery = oauthParams.has("sig")
  ? location.search.slice(1)
  : undefined;
function notice(key) {
  noticeKey = key;
  $("account-notice").textContent = t(key);
  $("account-notice").hidden = false;
}
async function api(path, body) {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "x-sigge-language": language,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error("Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}
const authBody = (body) => ({
  ...body,
  ...(oauthQuery ? { oauth_query: oauthQuery } : {}),
});
function followAuthURL(value) {
  const target = new URL(value, location.origin);
  const path = target.pathname.replace(/^\/en(?=\/|$)/, "");
  if (target.origin === location.origin && ["/connect", "/consent"].includes(path)) {
    target.pathname = route(path);
  }
  location.assign(target.href);
}
async function loadConnections() {
  const connections = await api("/api/auth/oauth2/get-consents");
  const list = $("connection-list");
  list.replaceChildren();
  $("no-connections").hidden = connections.length > 0;
  for (const connection of connections) {
    const row = document.createElement("li"),
      name = document.createElement("span"),
      button = document.createElement("button");
    let client;
    try {
      client = await api(
        "/api/auth/oauth2/public-client?client_id=" +
          encodeURIComponent(connection.clientId),
      );
    } catch {}
    name.textContent =
      client?.client_name || client?.name || connection.clientId;
    button.type = "button";
    button.className = "button outlined";
    button.textContent = t("revokeConnection");
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await api("/api/account/connections/revoke", { id: connection.id });
        await loadConnections();
        notice("connectionRemoved");
      } catch {
        notice("connectionError");
        button.disabled = false;
      }
    });
    row.append(name, button);
    list.append(row);
  }
}
async function joinNotes() {
  await api("/api/account/field-notes", { consent: true });
  notesStatus = "subscribed";
  showNotes();
}
function showNotes() {
  if (!$("newsletter-account")) return;
  $("newsletter-account").hidden = !user;
  $("notes-state").textContent =
    notesStatus === "subscribed"
      ? t("notesSubscribed")
      : notesStatus === "pending"
        ? t("notesFailed")
        : t("newsletterDetail");
  $("notes-join").hidden = notesStatus === "subscribed";
}
async function loadAccount() {
  const account = await api("/api/account");
  user = account.user;
  notesStatus = account.fieldNotes;
  if (consentPage) {
    if (!user) {
      location.replace(route("/connect") + location.search);
      return;
    }
    if (!oauthQuery) {
      notice("consentInvalid");
      return;
    }
    const client = await api(
      "/api/auth/oauth2/public-client?client_id=" +
        encodeURIComponent(oauthParams.get("client_id") || ""),
    );
    $("client-name").textContent =
      client.client_name || client.name || oauthParams.get("client_id");
    $("client-id").textContent = oauthParams.get("client_id");
    $("consent-email").textContent = user.email;
    $("consent-actions").hidden = false;
    return;
  }
  $("signed-in").hidden = !user || !!oauthQuery;
  $("sign-in").hidden = !!user && !oauthQuery;
  $("connections").hidden = !user;
  if (user && oauthQuery) $("account-email-input").value = user.email;
  if (user) {
    $("account-email").textContent = user.email;
    await loadConnections();
  }
  showNotes();
}
if (!consentPage) {
  $("email-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("send-code").disabled = true;
    $("send-code").textContent = t("sendingCode");
    try {
      await api("/api/auth/email-otp/send-verification-otp", {
        email: $("account-email-input").value.trim(),
        type: "sign-in",
      });
      $("code-form").hidden = false;
      $("email-form").hidden = true;
      $("code-email").textContent = $("account-email-input").value.trim();
      $("account-notice").hidden = true;
      $("code").focus();
    } catch (error) {
      notice(error.status === 429 ? "tooManyRequests" : "sendCodeError");
    } finally {
      $("send-code").disabled = false;
      $("send-code").textContent = t("sendCode");
    }
  });
  $("code-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("verify-code").disabled = true;
    $("verify-code").textContent = t("verifyingCode");
    try {
      const result = await api(
        "/api/auth/sign-in/email-otp",
        authBody({
          email: $("account-email-input").value.trim(),
          otp: $("code").value.trim(),
        }),
      );
      let notesFailed = false;
      if ($("newsletter").checked)
        try {
          await joinNotes();
        } catch {
          notesFailed = true;
        }
      if (result.url) {
        if (notesFailed) sessionStorage.setItem("sigge-notes-pending", "true");
        followAuthURL(result.url);
        return;
      }
      await loadAccount();
      $("account-notice").hidden = !notesFailed;
      if (notesFailed) notice("notesFailed");
    } catch (error) {
      notice(error.status === 429 ? "tooManyRequests" : "authError");
    } finally {
      $("verify-code").disabled = false;
      $("verify-code").textContent = t("verifyCode");
    }
  });
  $("change-email").addEventListener("click", () => {
    $("email-form").hidden = false;
    $("code-form").hidden = true;
    $("code").value = "";
    $("account-email-input").focus();
  });
  $("sign-out").addEventListener("click", async () => {
    $("sign-out").disabled = true;
    try {
      await api("/api/auth/sign-out", {});
      location.assign(route("/connect"));
    } catch {
      notice("signOutError");
      $("sign-out").disabled = false;
    }
  });
  $("notes-join").addEventListener("click", async () => {
    $("notes-join").disabled = true;
    try {
      await joinNotes();
    } catch {
      notice("notesFailed");
    } finally {
      $("notes-join").disabled = false;
    }
  });
  for (const [id, value] of [
    ["copy-command", "claude-command"],
    ["copy-mcp", "mcp-url"],
  ])
    $(id).addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText($(value).textContent);
        notice("connectionCopied");
      } catch {
        notice("copyBlocked");
      }
    });
} else {
  $("consent-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    for (const b of $("consent-actions").querySelectorAll("button"))
      b.disabled = true;
    try {
      const result = await api(
        "/api/auth/oauth2/consent",
        authBody({ accept: event.submitter.value === "allow" }),
      );
      if (result.url) followAuthURL(result.url);
      else notice("consentInvalid");
    } catch {
      notice("consentInvalid");
      for (const b of $("consent-actions").querySelectorAll("button"))
        b.disabled = false;
    }
  });
}
onLanguageChange(() => {
  if (noticeKey) notice(noticeKey);
  showNotes();
  if (user && !consentPage)
    loadConnections().catch(() => notice("connectionError"));
});
try {
  const connection = await api("/api/connection");
  if (!connection.enabled) {
    notice("connectUnavailable");
    for (const input of document.querySelectorAll("form input,form button"))
      input.disabled = true;
  } else {
    if (sessionStorage.getItem("sigge-notes-pending")) {
      notice("notesFailed");
      sessionStorage.removeItem("sigge-notes-pending");
    }
    if (!consentPage) {
      $("mcp-url").textContent = connection.mcpURL;
      $("claude-command").textContent =
        "claude mcp add --transport http --scope user sigge " +
        connection.mcpURL;
    }
    await loadAccount();
  }
} catch {
  notice("connectionError");
}
