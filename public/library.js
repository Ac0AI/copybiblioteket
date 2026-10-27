const $ = (selector) => document.querySelector(selector);
const list = $("#framework-list"), detail = $("#detail"), status = $("#status");
let all = [], activeId = "", latestRequest = 0, sourceMode = "links";

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function link(title, url) {
  const node = element("a", title);
  if (new URL(url).protocol !== "https:") return element("span", title);
  node.href = url; node.target = "_blank"; node.rel = "noopener noreferrer";
  return node;
}
async function request(path, body) {
  const response = await fetch(path, body ? {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  } : {});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Biblioteket kunde inte läsas. Försök igen.");
  return data;
}
function setActive(id) {
  activeId = id;
  for (const button of list.querySelectorAll("button")) button.setAttribute("aria-current", String(button.dataset.id === id));
}
function renderList(frameworks, heading) {
  $("#list-heading").textContent = heading;
  list.replaceChildren();
  for (const f of frameworks) {
    const button = element("button", undefined, "framework-button");
    button.type = "button"; button.dataset.id = f.id;
    button.append(element("strong", f.title), element("span", f.author));
    button.setAttribute("aria-current", String(f.id === activeId));
    button.addEventListener("click", () => selectFramework(f.id, true));
    list.append(button);
  }
}
function subsection(title, text) {
  const section = element("section");
  section.append(element("h3", title), element("p", text));
  return section;
}
function bulleted(title, items) {
  const section = element("section"), ul = element("ul");
  for (const item of items) ul.append(element("li", item));
  section.append(element("h3", title), ul);
  return section;
}
function renderFramework(f) {
  setActive(f.id);
  detail.replaceChildren(element("p", f.author + " / " + f.category, "author"),
    element("h2", f.title), element("p", f.summary, "lead"));
  const contexts = element("div", undefined, "context");
  contexts.append(subsection("När det hjälper", f.useWhen), subsection("Tänk på", f.avoidWhen));
  detail.append(contexts, bulleted("Använd så här", f.principles), bulleted("Frågor att börja med", f.questions));
  const example = element("section", undefined, "example");
  example.append(element("h3", "Ett svenskt exempel"), element("p", f.example.context, "example-context"),
    element("p", "Utkast", "example-label"), element("blockquote", f.example.before),
    element("p", "Omarbetat", "example-label"), element("blockquote", f.example.after, "after"),
    element("p", f.example.explanation, "explanation"));
  detail.append(example, element("h3", "Läs originalkällorna"));
  const sources = element("ul", undefined, "source-links");
  for (const source of f.sources) {
    const li = element("li"); li.append(link(source.title, source.url)); sources.append(li);
  }
  detail.append(sources, element("p", "Tillämpningen och exemplet är våra egna. Exemplet är påhittat och har inte konverteringstestats.", "note"));
  const copy = element("button", "Kopiera skrivunderlag", "quiet-button copy-button");
  copy.type = "button";
  copy.addEventListener("click", async () => {
    const prompt = "Hjälp mig skriva copy med följande ramverk från Copybiblioteket (https://sigge.si). Använd $copy-operator om skillen finns. " +
      "Skriv direkt på naturlig svenska i varumärkets röst. Utgå från mitt underlag; hitta inte på fakta eller bevis. Fråga efter avgörande fakta som saknas.\n\n" +
      "Ramverk: " + f.title + "\n" + f.summary + "\n\n" +
      "Arbetssätt:\n" + f.principles.map((p) => "- " + p).join("\n") + "\n\n" +
      "Frågor att pröva:\n" + f.questions.map((p) => "- " + p).join("\n") + "\n\n" +
      "Källor:\n" + f.sources.map((s) => s.title + ": " + s.url).join("\n") + "\n\nMitt underlag:\n" +
      "Varumärke:\nMålgrupp och situation:\nVad texten ska göra:\nErbjudande och verifierade fakta:\nKanal:\nTon och godkända exempel:\n";
    try { await navigator.clipboard.writeText(prompt); status.textContent = "Skrivunderlaget är kopierat. Klistra in det i din AI-chatt och fyll i fakta."; }
    catch { status.textContent = "Kopieringen blockerades av webbläsaren. Använd copy-skillen och ange ramverket " + f.id + "."; }
  });
  detail.append(copy);
}
async function selectFramework(id, focus = false) {
  const requestId = ++latestRequest;
  try {
    const { framework } = await request("/api/frameworks/" + encodeURIComponent(id));
    if (requestId !== latestRequest) return;
    renderFramework(framework);
    if (focus && matchMedia("(max-width: 680px)").matches) detail.scrollIntoView({ behavior: "auto" });
  } catch (error) { if (requestId === latestRequest) status.textContent = error.message; }
}
function renderSources(data) {
  renderList(all, "Alla ramverk");
  setActive("");
  detail.replaceChildren(element("p", "Fördjupning", "author"), element("h2", sourceMode === "links" ? "Källor att läsa vidare i" : "Vad säger källorna?"), element("p", data.notice, "note"));
  if (!data.results.length) detail.append(element("p", "Inga träffar. Prova ett tydligare begrepp eller sök i de svenska ramverken."));
  for (const source of data.results) {
    const section = element("section", undefined, "source-item");
    section.append(element("p", source.person + (source.date ? " / " + source.date : ""), "author"),
      element("h3", source.heading || source.title),
      element("p", source.text, "source-passage"), link("Öppna originalkällan", source.url));
    detail.append(section);
  }
  detail.append(element("p", data.guidance, "note"));
}
async function search() {
  const query = $("#query").value.trim();
  if (!query) return reset();
  if (query.length < 2) { status.textContent = "Skriv minst två tecken."; return; }
  const scope = document.querySelector('input[name="scope"]:checked').value;
  const requestId = ++latestRequest;
  status.textContent = "Söker …";
  try {
    const body = { query, scope, limit: 6 };
    if (scope === "sources" && $("#person").value) body.person = $("#person").value;
    const data = await request("/api/search", body);
    if (requestId !== latestRequest) return;
    status.textContent = data.results.length + (scope === "sources" ? (sourceMode === "links" ? " källor" : " källavsnitt") : " ramverk") + " för din fråga.";
    if (scope === "sources") renderSources(data);
    else {
      renderList(data.results, "Sökresultat");
      if (data.results.length) renderFramework(data.results[0]);
      else { activeId = ""; detail.replaceChildren(element("h2", "Prova en annan fråga"), element("p", data.guidance)); }
    }
  } catch (error) { if (requestId === latestRequest) status.textContent = error.message; }
}
function reset() {
  $("#query").value = "";
  document.querySelector('input[value="frameworks"]').checked = true;
  $("#person-label").hidden = true;
  renderList(all, "Alla ramverk");
  status.textContent = all.length + " ramverk med egna svenska tillämpningar.";
  const wanted = decodeURIComponent(location.hash.slice(1));
  return selectFramework(all.some((f) => f.id === wanted) ? wanted : "hormozi-offer");
}
$("#search-form").addEventListener("submit", (event) => { event.preventDefault(); search(); });
$("#reset").addEventListener("click", reset);
for (const radio of document.querySelectorAll('input[name="scope"]')) {
  radio.addEventListener("change", () => { $("#person-label").hidden = radio.value !== "sources" || sourceMode === "links"; });
}
for (const button of document.querySelectorAll("[data-query]")) {
  button.addEventListener("click", () => { $("#query").value = button.dataset.query; search(); });
}
$("#show-guide").addEventListener("click", () => selectFramework("swedish-original", true));
request("/api/frameworks").then((data) => { all = data.frameworks; sourceMode = data.sourceMode; return reset(); })
  .catch((error) => { status.textContent = error.message; detail.replaceChildren(element("p", "Biblioteket kunde inte laddas. Ladda om sidan för att försöka igen.")); });

fetch("/api/people").then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(({people}) => {
  for (const person of people) { const option = element("option", person.name); option.value = person.id; $("#person").append(option); }
}).catch(() => {});
