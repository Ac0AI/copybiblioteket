import { tokenize } from "../server/search.js";

// Explicit vocabulary support for this copy library, not general machine translation.
const concepts = [
  { cues: "pris priset priser prissättning prissatta kostnad kostar dyr dyrt price pricing expensive", terms: "price pricing value offer" },
  { cues: "erbjudande erbjudandet paket paketering bonus bonusar offer packaging", terms: "offer value bonus" },
  { cues: "väntan väntetid leveranstid tid resultat dröjer delay time", terms: "time delay outcome" },
  { cues: "ansträngning arbetsinsats krångel enkelt enkel enklare effort sacrifice friction", terms: "effort sacrifice friction" },
  { cues: "trovärdig trovärdighet bevis belägg sannolikhet omdöme omdömen kundomdömen recension recensioner trygghet förtroende credibility proof trust", terms: "proof trust testimonial perceived likelihood" },
  { cues: "knapp knappen boka bokning klick klickar klicka nästa cta action", terms: "call action prompt conversion" },
  { cues: "kund kunder kunden kundspråk kundintervju kundintervjuer intervju intervjuer recensioner voice research", terms: "customer research voice language" },
  { cues: "alternativ alternativet konkurrent konkurrenter skilja skillnad positionering positionera differentiering positioning differentiation alternatives", terms: "positioning alternative differentiation" },
  { cues: "medveten medvetenhet känner kännedom problemmedveten awareness", terms: "awareness problem solution product" },
  { cues: "förändring situation byta byte byter tvekar invändning invändningar jobb jtbd", terms: "jobs progress circumstances objection anxiety" },
  { cues: "rubrik rubriker öppning inledning headline hook", terms: "headline hook promise" },
  { cues: "test testa testar abtest experiment mätning mäta vinnare testing experiment", terms: "testing experiment evidence" },
  { cues: "svenska svenskt svensk svengelska översatt översättning anglicismer tonalitet ton röst klarspråk idiomatisk swedish voice", terms: "svenska klarspråk tonalitet" },
];

export function expandQuery(query: string): { original: string; expanded: string; addedTerms: string[] } {
  const input = new Set(tokenize(query));
  const added = new Set<string>();
  for (const concept of concepts) {
    if (tokenize(concept.cues).some((cue) => input.has(cue))) {
      for (const term of concept.terms.split(" ")) added.add(term);
    }
  }
  const addedTerms = [...added];
  return { original: query, expanded: [query, ...addedTerms].join(" "), addedTerms };
}
