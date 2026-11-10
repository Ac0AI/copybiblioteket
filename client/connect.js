// Connect page: the explainer film and the copy buttons. There is nothing to sign in to.
import { t, onLanguageChange } from "./i18n.js";
import { films } from "./film.js";
films();
const $ = (id) => document.getElementById(id);
let noticeKey = null;
function notice(key) {
  noticeKey = key;
  $("connect-notice").textContent = t(key);
  $("connect-notice").hidden = false;
}
onLanguageChange(() => {
  if (noticeKey) notice(noticeKey);
});
for (const [button, source] of [
  ["copy-plugin-repo", "plugin-repo"],
  ["copy-plugin-claude", "plugin-claude-command"],
  ["copy-plugin-codex", "plugin-codex-command"],
  ["copy-claude-url", "claude-url"],
  ["copy-mcp", "mcp-url"],
  ["copy-command", "claude-command"],
])
  $(button).addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($(source).textContent);
      notice("connectionCopied");
    } catch {
      notice("copyBlocked");
    }
  });
