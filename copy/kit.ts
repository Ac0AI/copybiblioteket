import type { CopyLibrary } from './library.js';
import { selectPerspectives } from './brief.js';
import type { Language } from './locale.js';

// One call that hands an AI client everything it needs to start a writing task:
// the working order, the few frameworks that fit, the channel's demands and the
// writing guide. It replaces the list → search → get → guide round trips, which
// clients often cut short. Facts stay in the chat; the kit only needs the task.

export const channels = ['web', 'email', 'ad', 'linkedin', 'product', 'other'] as const;
export type Channel = (typeof channels)[number];
export type KitInput = { task: string; audience?: string; channel?: Channel; language: Language; person?: string };

// The Swedish guide is always part of the kit, so the framework that summarises it would only repeat it.
const COVERED_BY_GUIDE = 'swedish-original';
const FALLBACK = ['schwartz-awareness', 'hormozi-offer', 'copy-structure'];
// brief.ts keeps the channel ids the web workshop has always used.
const briefChannel: Record<Channel, string> = { web: 'webb', email: 'mejl', ad: 'annons', linkedin: 'linkedin', product: 'produkt', other: '' };

const text = {
  sv: {
    steps: [
      'Samla underlaget ur samtalet: vem som läser, vad som erbjuds, vad läsaren ska göra härnäst, vilka fakta och villkor som gäller och hur avsändaren låter. Saknas något som avgör texten, ställ högst tre korta frågor och vänta på svar. Är underlaget tillräckligt, skriv direkt.',
      'Välj en vinkel med hjälp av ramverken nedan: läsarens situation, resultatet som spelar roll, skälet att tro på det och nästa steg. Ramverken styr resonemanget och nämns inte i texten.',
      'Skriv direkt på svenska enligt skrivguiden, i avsändarens egen röst. Använd bara fakta som användaren har gett. Hitta inte på siffror, kundomdömen, garantier eller tidsgränser.',
      'Kör check_ai_patterns på utkastet och gör minsta möjliga ändring där något hittas.',
      'Lämna den färdiga texten först. Lägg sedan till, kort: antaganden du gjort och uppgifter som behöver kontrolleras. Hoppa över den delen om den är tom.',
    ],
    askAudience: 'Vem läser texten, och i vilken situation?',
    askFacts: 'Vilka fakta och villkor gäller: pris, vad som ingår, tider, belägg? Fråga bara om det inte redan står i samtalet.',
    askVoice: 'Finns det en text som låter som avsändaren? Be om ett exempel om rösten är oklar.',
    channel: {
      web: 'Webbsida: gör erbjudandet och vem det är till för begripligt högst upp. En huvudhandling. Belägg intill påståendet det stöder. Knappen säger vad som händer vid klick.',
      email: 'Mejl: ämnesrad och brödtext. Ett ärende per mejl och ett tydligt skäl att svara eller klicka. Antyd aldrig en relation eller ett samtal som inte har funnits.',
      ad: 'Annons: kroken ska hänga ihop med erbjudandet och sidan annonsen leder till. Ber användaren om flera varianter ska argumenten skilja sig åt, inte bara orden.',
      linkedin: 'LinkedIn: första raden avgör om resten läses. En tanke per inlägg, skriven som en person och inte som ett företag. Sluta med poängen eller en fråga du vill ha svar på.',
      product: 'Produkttext: säg vad produkten gör och för vem innan egenskaperna. Koppla varje egenskap till vad läsaren får ut av den. Villkor och begränsningar ska stå med.',
      other: '',
    },
    general: 'Inget ramverk matchade uppgiftens ordalydelse. De här tre är allmänna utgångspunkter, inte träffar.',
    perspectives: 'Perspektiven är våra egna tillämpningar. De är inte citat och inte godkända av personerna. Använd deras frågor, inte deras röst.',
    more: 'Mer finns: search_copy_knowledge och get_copy_framework för fler ramverk, search_copy_people och get_copy_person för perspektiv, search_copy_sources för originalkällor.',
  },
  en: {
    steps: [
      'Gather the brief from the conversation: who reads it, what is offered, what the reader should do next, which facts and terms apply, and how the sender sounds. If something that decides the copy is missing, ask at most three short questions and wait. If the brief is enough, write.',
      'Choose an angle with the frameworks below: the reader\'s situation, the outcome that matters, the reason to believe it and the next step. Frameworks guide the reasoning and are not named in the copy.',
      'Write directly in English following the writing guide, in the sender\'s own voice. Use only facts the user has given. Do not invent numbers, testimonials, guarantees or deadlines.',
      'Run check_ai_patterns on the draft and make the minimum edit wherever it finds something.',
      'Give the finished copy first. Then add, briefly: assumptions you made and details that need checking. Skip that part if it is empty.',
    ],
    askAudience: 'Who reads this, and in what situation?',
    askFacts: 'Which facts and terms apply: price, what is included, timings, proof? Ask only if they are not already in the conversation.',
    askVoice: 'Is there a text that sounds like the sender? Ask for a sample if the voice is unclear.',
    channel: {
      web: 'Web page: make the offer and who it is for clear at the top. One primary action. Proof next to the claim it supports. The button says what happens on click.',
      email: 'Email: subject line and body. One purpose per email and a clear reason to reply or click. Never imply a relationship or conversation that did not happen.',
      ad: 'Ad: the hook must connect to the offer and to the page the ad leads to. If the user asks for several versions, vary the argument, not just the wording.',
      linkedin: 'LinkedIn: the first line decides whether the rest is read. One idea per post, written as a person and not as a company. End on the point or on a question you want answered.',
      product: 'Product copy: say what the product does and for whom before the features. Connect each feature to what the reader gets from it. Include terms and limits.',
      other: '',
    },
    general: 'No framework matched the wording of the task. These three are general starting points, not matches.',
    perspectives: 'Perspectives are our own applications. They are not quotes and are not endorsed by the people named. Use their questions, not their voice.',
    more: 'There is more: search_copy_knowledge and get_copy_framework for further frameworks, search_copy_people and get_copy_person for perspectives, search_copy_sources for original sources.',
  },
};

export function buildCopyKit(library: CopyLibrary, input: KitInput) {
  const localized = library.forLanguage(input.language), t = text[input.language];
  const query = [input.task, input.audience ?? ''].join(' ');
  const found = localized.search(query, localized.frameworks.length).results.filter(f => f.id !== COVERED_BY_GUIDE);
  const fallback = FALLBACK.map(id => localized.get(id)).filter(f => f !== null);
  const frameworks = [...found, ...fallback.filter(f => !found.includes(f))].slice(0, 3);
  const people = selectPerspectives({
    task: input.task, audience: input.audience ?? '', channel: briefChannel[input.channel ?? 'other'],
    length: '', tone: '', voice: '', facts: '', mustKeep: '', language: input.language, perspective: input.person,
  }, localized.people).slice(0, input.person ? 1 : 2);
  const channel = input.channel ? t.channel[input.channel] : '';
  return {
    language: input.language,
    steps: t.steps,
    askIfMissing: [...(input.audience ? [] : [t.askAudience]), t.askFacts, t.askVoice],
    ...(channel ? { channel } : {}),
    ...(found.length ? {} : { frameworksNote: t.general }),
    frameworks: frameworks.map(({ id, title, author, useWhen, principles, questions, example }) =>
      ({ id, title, author, useWhen, principles, questions, example: { before: example.before, after: example.after } })),
    // Perspectives are a second opinion, so they come as questions. get_copy_person has the full profile.
    perspectives: people.map(({ id, name, summary, questions }) => ({ id, name, summary, questions })),
    perspectivesNotice: t.perspectives,
    writingGuide: localized.writingGuide,
    notice: localized.notice.native,
    more: t.more,
  };
}
