export type Language = 'sv' | 'en';
export const languageFrom = (value: unknown): Language => value === 'en' ? 'en' : 'sv';
export const notices = {
  sv: {
    profile: 'Egna svenska tillämpningar. Källhänvisningarna kommer från The Brains och har inte verifierats självständigt mot hela originalen. Profilerna är inte officiella eller godkända av personerna.',
    native: 'Egen svensk tillämpning med källhänvisningar. Exemplen är påhittade och visar skrivsätt, inte uppmätta resultat.',
    source: 'Ärvt material från The Brains. Längre källor är sammanfattade av projektet; innehållet är inte verifierat här mot hela originalet. Kontrollera viktiga påståenden i den länkade källan.',
    link: 'Här hittar du originalkällor till ramverken. Beskrivningarna är våra egna tillämpningar; öppna länken för att läsa författarens material.',
    found: 'Välj de ramverk som hjälper uppgiften. Skriv direkt på svenska utifrån varumärkets underlag.',
    empty: 'Ingen relevant träff. Prova ett konkret begrepp som pris, kundomdömen eller positionering, eller lista ramverken. Hitta inte på källstöd.',
    read: 'Läs originalkällan för fördjupning. Skriv självständig copy från ditt eget underlag och behåll varumärkets röst.',
    inherited: 'Källspråket är engelska. Använd idéerna som underlag och skriv självständig copy. Behåll källans osäkerhet och tillskriv inte egna råd till författaren.',
  },
  en: {
    profile: 'Our own applications, translated from our Swedish profiles. Source references are inherited from The Brains and have not been independently checked against the complete originals. Profiles are not official or endorsed by the people featured.',
    native: 'Our own application with source references. Examples are fictional and illustrate writing choices, not measured results.',
    source: 'Material inherited from The Brains. Longer sources were summarised by that project and have not been verified here against the complete originals. Check important claims in the linked source.',
    link: 'Original sources for further reading. Descriptions are our own applications; open the links to read the authors\' material.',
    found: 'Choose frameworks that help the task. Write directly in English from the brand\'s brief and evidence.',
    empty: 'No relevant match. Try a specific concept such as price, testimonials or positioning, or browse all frameworks. Do not invent supporting sources.',
    read: 'Read the original source for more context. Write your own copy from your brief and preserve the brand\'s voice.',
    inherited: 'The source language is English. Use the ideas as context and write your own copy. Preserve uncertainty and do not attribute your own advice to the author.',
  },
};
// Category ids stay Swedish and stable; these are the display labels per language.
export const categoryLabels: Record<string, Record<Language, string>> = {
  Publik: {sv:'Publik',en:'Audience'}, Erbjudande: {sv:'Erbjudande',en:'Offer'}, Distribution: {sv:'Distribution',en:'Distribution'},
  Produkt: {sv:'Produkt',en:'Product'}, Fördjupning: {sv:'Fördjupning',en:'Further reading'}, Budskap: {sv:'Budskap',en:'Messaging'},
  Ledarskap: {sv:'Ledarskap',en:'Leadership'}, Kundinsikt: {sv:'Kundinsikt',en:'Customer insight'}, Svenska: {sv:'Svenska',en:'Swedish writing'},
  Utvärdering: {sv:'Utvärdering',en:'Evaluation'},
};
/** Adds categoryLabel next to every category id in a response, so English clients never see Swedish ids alone. */
export function withCategoryLabels<T>(value: T, language: Language): T {
  if (Array.isArray(value)) return value.map(item => withCategoryLabels(item, language)) as T;
  if (!value || typeof value !== 'object') return value;
  const entries = Object.entries(value).map(([key, item]) => [key, withCategoryLabels(item, language)]);
  const category = (value as {category?: unknown}).category;
  if (typeof category === 'string' && categoryLabels[category]) entries.push(['categoryLabel', categoryLabels[category][language]]);
  return Object.fromEntries(entries) as T;
}
