import type { CopyLibrary } from './library.js';
import type { Language } from './locale.js';

// One call that hands an AI client everything it needs to start a writing task:
// the working order, the few frameworks that fit, the channel's demands and the
// writing guide. It replaces the list → search → get → guide round trips, which
// clients often cut short. Facts stay in the chat; the kit only needs the task.

export const channels = ['web', 'email', 'ad', 'linkedin', 'product', 'other'] as const;
export type Channel = (typeof channels)[number];
export type KitInput = { task: string; audience?: string; channel?: Channel; language: Language; person?: string };

// The Swedish guide is always part of the kit, so the framework that summarises it would only repeat it.
// The writing guide and the pattern check are always part of the work, so the two cards that describe them would only repeat it.
const COVERED_BY_GUIDE = new Set(['swedish-original', 'ai-slop-edit']);
const FALLBACK = ['schwartz-awareness', 'hormozi-offer', 'copy-structure'];

const text = {
  sv: {
    steps: [
      'Läs det som finns: en varumärkesfil i samtalet eller projektet, den nuvarande texten och annat som användaren har pekat på. Fyra saker avgör texten: erbjudandet och villkoren, vad läsaren tvekar över, beläggen (kundernas egna ord och siffror företaget står för) och avsändarens röst. Saknas något av dem, ställ frågorna i ask i ett enda meddelande, högst fyra, och vänta på svar. Be om själva saken: ”klistra in ett omdöme” ger mer än ”beskriv era kunder”. Det användaren inte har sagt eller visat finns inte. Hitta inte på belägg, siffror, omdömen, garantier eller tidsgränser. Vill användaren ha ett utkast utan att svara, märk varje lucka med en synlig platshållare som [pris].',
      'Bestäm dig innan du skriver, en rad vardera: vem läsaren är och i vilket läge, vad hen redan vet, det enda tvivel som mest sannolikt stoppar hen, vilken uppgift i underlaget som svarar på tvivlet (finns ingen: lova mindre) och den enda handling texten ska leda till. Välj sedan ett eller två grepp ur ramverken nedan med hjälp av tabellen choose. Ramverken nämns inte i texten.',
      'Skriv. Börja med minst fem rubriker eller öppningar som använder olika grepp, och behåll den som en läsare som skummar skulle stanna vid och som säger något sant och konkret. Ordna resten efter läsarens frågor: vad är det, är det för mig, varför ska jag tro på det, vad kostar det, vad gör jag nu. Lägg belägget intill tvivlet det svarar på, och återge kundernas ord exakt. Skriv direkt på svenska enligt skrivguiden och i avsändarens röst: samma meningslängd, rakhet och humor som i röstprovet, utan att kopiera dess meningar.',
      'Redigera som en redaktör, rad för rad. Står varje siffra, namn, citat och löfte i underlaget? Skulle meningen passa oförändrad hos en konkurrent? Byt den då mot något bara den här avsändaren kan säga, eller stryk den. Besvaras tvivlet före uppmaningen? Stryk uppvärmning, upprepningar och adjektiv utan fakta. Låter det som avsändaren?',
      'Kör check_ai_patterns på texten och gör minsta möjliga ändring där något hittas.',
      'Lämna den färdiga texten först. Lägg sedan till, kort: vinkeln i en mening (vem texten är till för, vilket tvivel den svarar på och med vad) och det användaren behöver kontrollera. Har du lärt dig sådant om företaget som inte står i en varumärkesfil, erbjud en gång att spara det med get_brand_file, så att frågorna inte behöver ställas igen.',
    ],
    askAudience: 'Vem läser texten, och i vilket läge är hen?',
    ask: [
      'Vad säljer ni, vad kostar det och vad ingår? Vad händer när läsaren har klickat eller hört av sig?',
      'Vad tvekar folk över innan de köper, och vad frågar de alltid om?',
      'Vad säger era kunder? Klistra in ett omdöme, ett mejl eller en recension ordagrant. Finns det siffror ni står för, som antal kunder eller år i branschen?',
      'Klistra in något ni har skrivit själva som låter som ni: ett inlägg, ett mejl eller en skylt.',
    ],
    askNote: 'Ställ bara de frågor som samtalet eller varumärkesfilen inte redan har besvarat, högst fyra, och anpassa ordalydelsen till uppgiften.',
    channel: {
      web: 'Webbsida: gör erbjudandet och vem det är till för begripligt högst upp. En huvudhandling. Belägg intill påståendet det stöder. Knappen säger vad som händer vid klick.',
      email: 'Mejl: ämnesrad och brödtext. Ett ärende per mejl och ett tydligt skäl att svara eller klicka. Antyd aldrig en relation eller ett samtal som inte har funnits.',
      ad: 'Annons: kroken ska hänga ihop med erbjudandet och sidan annonsen leder till. Ber användaren om flera varianter ska argumenten skilja sig åt, inte bara orden.',
      linkedin: 'LinkedIn: första raden avgör om resten läses. En tanke per inlägg, skriven som en person och inte som ett företag. Sluta med poängen eller en fråga du vill ha svar på.',
      product: 'Produkttext: säg vad produkten gör och för vem innan egenskaperna. Koppla varje egenskap till vad läsaren får ut av den. Villkor och begränsningar ska stå med.',
      other: '',
    },
    examples: 'Greppens exempelrader och det hela exemplet är påhittade och visar arbetssättet. Skriv egna formuleringar från användarens fakta. Kopiera inte exemplens ord, siffror eller företag.',
    general: 'Inget ramverk matchade uppgiftens ordalydelse. De här tre är allmänna utgångspunkter, inte träffar.',
    perspectives: 'Perspektiven är våra egna tillämpningar. De är inte citat och inte godkända av personerna. Använd deras frågor, inte deras röst.',
    more: 'Mer finns: search_copy_knowledge och get_copy_framework för fler ramverk, search_copy_people och get_copy_person för perspektiv, search_copy_sources för originalkällor.',
  },
  en: {
    steps: [
      'Read what there is: a brand file in the conversation or the project, the current text and anything else the user pointed to. Four things decide the copy: the offer and its terms, what the reader hesitates over, the proof (customers\' own words and numbers the business stands behind) and the sender\'s voice. If any of them is missing, ask the questions in ask in a single message, at most four, and wait for the answers. Ask for the thing itself: “paste a review” gets more than “describe your customers.” What the user has not said or shown does not exist. Do not invent proof, numbers, testimonials, guarantees or deadlines. If the user wants a draft without answering, mark each gap with a visible placeholder such as [price].',
      'Decide before you draft, one line each: who the reader is and what situation they are in, what they already know, the one doubt most likely to stop them, which fact in the material answers that doubt (if there is none, promise less) and the one action the copy should lead to. Then pick one or two moves from the frameworks below, using the choose table. Frameworks are not named in the copy.',
      'Draft. Start with at least five headlines or openings that use different moves, and keep the one a skimming reader would stop for and that says something true and specific. Order the rest by the reader\'s questions: what is it, is it for me, why should I believe it, what does it cost, what do I do now. Put the proof next to the doubt it answers, and give customers\' words exactly. Write directly in English following the writing guide and in the sender\'s voice: the same sentence length, directness and humor as the sample, without copying its sentences.',
      'Edit as a copy chief, line by line. Is every number, name, quote and promise in the material? Would the sentence fit unchanged at a competitor? Then replace it with something only this sender can say, or cut it. Is the doubt answered before the call to action? Cut warm-up openings, repeated points and adjectives that carry no fact. Does it sound like the sender?',
      'Run check_ai_patterns on the copy and make the minimum edit wherever it finds something.',
      'Give the finished copy first. Then add, briefly: the angle in one sentence (who the copy is for, which doubt it answers and with what) and what the user needs to check. If you learned things about the business that are not in a brand file, offer once to save them with get_brand_file, so the questions do not have to be asked again.',
    ],
    askAudience: 'Who reads this, and what situation are they in?',
    ask: [
      'What do you sell, what does it cost and what is included? What happens after the reader clicks or gets in touch?',
      'What do people hesitate over before they buy, and what do they always ask?',
      'What do your customers say? Paste a review, an email or a testimonial word for word. Are there numbers you stand behind, such as how many customers you have or how long you have been doing this?',
      'Paste something you wrote yourselves that sounds like you: a post, an email or a sign.',
    ],
    askNote: 'Ask only the questions the conversation or the brand file has not already answered, at most four, and word them for the task.',
    channel: {
      web: 'Web page: make the offer and who it is for clear at the top. One primary action. Proof next to the claim it supports. The button says what happens on click.',
      email: 'Email: subject line and body. One purpose per email and a clear reason to reply or click. Never imply a relationship or conversation that did not happen.',
      ad: 'Ad: the hook must connect to the offer and to the page the ad leads to. If the user asks for several versions, vary the argument, not just the wording.',
      linkedin: 'LinkedIn: the first line decides whether the rest is read. One idea per post, written as a person and not as a company. End on the point or on a question you want answered.',
      product: 'Product copy: say what the product does and for whom before the features. Connect each feature to what the reader gets from it. Include terms and limits.',
      other: '',
    },
    examples: 'The example lines in the moves and the complete example are fictional and show the way of working. Write your own wording from the user\'s facts. Do not copy the examples\' words, numbers or businesses.',
    general: 'No framework matched the wording of the task. These three are general starting points, not matches.',
    perspectives: 'Perspectives are our own applications. They are not quotes and are not endorsed by the people named. Use their questions, not their voice.',
    more: 'There is more: search_copy_knowledge and get_copy_framework for further frameworks, search_copy_people and get_copy_person for perspectives, search_copy_sources for original sources.',
  },
};

export function buildCopyKit(library: CopyLibrary, input: KitInput) {
  const localized = library.forLanguage(input.language), t = text[input.language];
  const query = [input.task, input.audience ?? ''].join(' ');
  const found = localized.search(query, localized.frameworks.length).results.filter(f => !COVERED_BY_GUIDE.has(f.id));
  const fallback = FALLBACK.map(id => localized.get(id)).filter(f => f !== null);
  const frameworks = [...found, ...fallback.filter(f => !found.includes(f))].slice(0, 3);
  const chosen = input.person ? localized.getPerson(input.person) : null, people = chosen ? [chosen] : [];
  const channel = input.channel ? t.channel[input.channel] : '';
  return {
    language: input.language,
    steps: t.steps,
    ask: [...(input.audience ? [] : [t.askAudience]), ...t.ask],
    askNote: t.askNote,
    ...(channel ? { channel } : {}),
    ...(found.length ? {} : { frameworksNote: t.general }),
    // Moves and mistakes are what a framework adds beyond the model's general knowledge. The best match also brings its
    // whole worked example; the others have theirs in get_copy_framework, which keeps the kit short enough to read whole.
    frameworks: frameworks.map(({ id, title, author, useWhen, principles, choose, moves, questions, mistakes, worked }, index) =>
      ({ id, title, author, useWhen, principles, choose, moves, questions, mistakes, ...(index === 0 ? { worked } : {}) })),
    examplesNotice: t.examples,
    // A profile is two principles and two questions, too thin to pick by keyword. It comes along only when the user names the person.
    ...(input.person ? { perspectives: people.map(({ id, name, summary, principles, questions }) => ({ id, name, summary, principles, questions })), perspectivesNotice: t.perspectives } : {}),
    writingGuide: localized.writingGuide,
    notice: localized.notice.native,
    more: t.more,
  };
}

// The interview behind a brand file: what only the business knows, asked once and kept by the user.
const brandInterview = {
  sv: [
    'Vad säljer ni, vad kostar det och vad ingår?',
    'Vad hade oftast just hänt när en kund hörde av sig, och vad oroar sig folk för innan de köper?',
    'Klistra in två eller tre saker kunder har sagt eller skrivit, ordagrant. Får de citeras, med eller utan namn?',
    'Vilka siffror står ni för: antal kunder, år i branschen, resultat?',
    'Vad skulle kunden välja om ni inte fanns, och vad gör ni annorlunda?',
    'Vad kan ni inte lova, och vad erbjuder ni inte?',
    'Klistra in två eller tre texter ni har skrivit själva som låter som ni: ett inlägg, ett mejl, en skylt.',
  ],
  en: [
    'What do you sell, what does it cost and what is included?',
    'What had usually just happened when a customer got in touch, and what do people worry about before they buy?',
    'Paste two or three things customers have said or written, word for word. May they be quoted, with or without a name?',
    'What numbers can you stand behind: customers, years, results?',
    'What would the customer choose if you did not exist, and what do you do differently?',
    'What can you not promise, and what do you not offer?',
    'Paste two or three texts you wrote yourselves that sound like you: a post, an email, a sign.',
  ],
};
const brandSteps = {
  sv: [
    'Läs först det användaren redan har: webbplatsens text, tidigare texter, omdömen. Be hen klistra in material hellre än beskriva det.',
    'Ställ frågorna i interview i ett meddelande, bara de som materialet inte besvarar. Följ upp en gång om två eller tre avgörande saker saknas.',
    'Skriv varumärkesfilen enligt format, på användarens språk och med översatta rubriker. Behåll citat och röstprov ordagrant med källa. Märk antaganden som antaganden. Hitta inte på kunder, siffror eller citat; lämna hellre en rubrik tom och skriv vad som saknas under den sista rubriken.',
    'Ge hela filen i ett block och säg att användaren ska spara den i projektets kunskap eller instruktioner, eller klistra in den i början av ett samtal. Sigge sparar ingenting.',
  ],
  en: [
    'First read what the user already has: the website copy, earlier texts, reviews. Ask them to paste material rather than describe it.',
    'Ask the questions in interview in one message, only those the material does not answer. Follow up once if two or three decisive things are missing.',
    'Write the brand file in the given format, in the user\'s language with translated headings. Keep quotes and voice samples word for word, with their source. Mark assumptions as assumptions. Do not invent customers, numbers or quotes; leave a heading empty and list what is missing under the last heading.',
    'Give the whole file in one block and tell the user to keep it in the project\'s knowledge or instructions, or to paste it at the start of a conversation. Sigge stores nothing.',
  ],
};

export function buildBrandFileKit(library: CopyLibrary, language: Language) {
  return { language, steps: brandSteps[language], interview: brandInterview[language], format: library.brandFile };
}
