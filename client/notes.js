// The Field Notes signup: confirm the address with a one-time code, then subscribe.
// It uses the same account endpoints as /connect, because only a verified address may subscribe.
import { t, language } from "./i18n.js";
const $ = (id) => document.getElementById(id);
const show = (id) => {
  for (const part of ["email-form", "code-form", "signed-in-join", "done"]) $(part).hidden = part !== id;
};
function notice(key) {
  $("account-notice").textContent = t(key);
  $("account-notice").hidden = false;
}
async function api(path, body) {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "x-sigge-language": language },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error("Request failed"), { status: response.status });
  return data;
}
async function busy(button, label, work) {
  const idle = button.textContent;
  button.disabled = true;
  button.textContent = t(label);
  try {
    await work();
  } finally {
    button.disabled = false;
    button.textContent = idle;
  }
}
async function join() {
  try {
    await api("/api/account/field-notes", { consent: true });
    $("account-notice").hidden = true;
    show("done");
  } catch {
    notice("notesFailed");
    show("signed-in-join");
  }
}
const email = () => $("account-email-input").value.trim();
$("email-form").addEventListener("submit", (event) => {
  event.preventDefault();
  busy($("send-code"), "sendingCode", async () => {
    try {
      await api("/api/auth/email-otp/send-verification-otp", { email: email(), type: "sign-in" });
      $("code-email").textContent = email();
      $("account-notice").hidden = true;
      show("code-form");
      $("code").focus();
    } catch (error) {
      notice(error.status === 429 ? "tooManyRequests" : "sendCodeError");
    }
  });
});
$("code-form").addEventListener("submit", (event) => {
  event.preventDefault();
  busy($("verify-code"), "verifyingCode", async () => {
    try {
      await api("/api/auth/sign-in/email-otp", { email: email(), otp: $("code").value.trim() });
    } catch (error) {
      return notice(error.status === 429 ? "tooManyRequests" : "authError");
    }
    $("signed-in-email").textContent = email();
    await join();
  });
});
$("change-email").addEventListener("click", () => {
  $("code").value = "";
  show("email-form");
  $("account-email-input").focus();
});
$("join").addEventListener("click", () => busy($("join"), "verifyingCode", join));

try {
  const { enabled } = await api("/api/connection");
  if (!enabled) {
    notice("notesUnavailable");
    $("send-code").disabled = true;
  } else {
    const account = await api("/api/account");
    if (account.user && account.fieldNotes === "subscribed") show("done");
    else if (account.user) {
      $("signed-in-email").textContent = account.user.email;
      show("signed-in-join");
    }
  }
} catch {
  notice("connectionError");
}
