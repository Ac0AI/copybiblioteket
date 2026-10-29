// Finds common AI-writing patterns in a draft, in the browser. Like the detect mode in
// Peter Yang's no-ai-slop skill (MIT), it names patterns with evidence; it never guesses
// who wrote the text and never rewrites it.
const w = '[\\p{L}\\p{N}’\'-]';
const words = list => new RegExp(`(?<!${w})(?:${list.join('|')})(?!${w})`, 'giu');

export const slopPatterns = [
  {id:'buzzwords', re:words(['sömlös\\p{L}*','banbrytande','revolutioner\\p{L}*','skräddarsydd\\p{L}*','holistisk\\p{L}*','innovativ\\p{L}*','kraftfull\\p{L}*','spelförändrare','frigör\\p{L}* (?:din|er|ditt|hela) potential','(?:till|på) nästa nivå','i dagens (?:snabbrörliga|digitala|föränderliga|moderna) (?:värld|samhälle|landskap)','i en värld där','(?:din|er|vår) resa','navigera i','dyk(?:a|er)? (?:ner|djupare) i','transformera\\p{L}*','ta del av','sätta guldkant']),
    label:['Tomma ord','Empty words'], fix:['Skriv vad som faktiskt händer.','Write what actually happens.']},
  {id:'buzzwords-en', re:words(['delve\\p{L}*','leverag\\p{L}+','utiliz\\p{L}+','facilitat\\p{L}+','empower\\p{L}*','streamlin\\p{L}+','robust','cutting-edge','game[- ]changer','paradigm shift','tapestry','realm','beacon','multifaceted','meticulous\\p{L}*','paramount','transformative','elevate\\p{L}*','embark\\p{L}*','supercharg\\p{L}+','harness\\p{L}*','ever-evolving','seamless\\p{L}*','unlock (?:your|their|the) (?:full )?potential','in today(?:’|\')s (?:fast-paced |digital |ever-changing )?world','this changes everything','this is huge']),
    label:['Tomma ord','Empty words'], fix:['Skriv vad som faktiskt händer.','Write what actually happens.']},
  {id:'contrast', re:/(?:\b(?:det|detta|det här)(?: handlar)? (?:inte|aldrig) (?:bara |enbart )?om\b[^.!?\n]{1,80}?(?:[,–—-]\s*|\.\s+)(?:utan|det handlar om)\b|\binte bara\b[^.!?\n]{1,60}?\butan (?:också|även)\b|\b(?:it|this)(?:’|')?s not (?:just |only |about )?[^.!?\n]{1,60}?[,–—.-]\s*(?:it(?:’|')?s|but)\b|\bnot just\b[^.!?\n]{1,60}?\bbut\b)/giu,
    label:['Falsk kontrast','False contrast'], fix:['Säg det andra ledet direkt.','State the second half directly.']},
  {id:'throat', re:/(?:^|[.!?]\s+|\n)(?:här är grejen|låt oss|låt mig vara (?:ärlig|tydlig)|sanningen är att|faktum är att|det är värt att (?:notera|nämna)|det är viktigt att (?:notera|komma ihåg|förstå)|här är det ingen berättar|det de flesta missar|here(?:’|')?s the thing|let(?:’|')?s dive in|let me be (?:clear|honest)|the truth is|the reality is|it(?:’|')?s worth noting|it(?:’|')?s important to note|what most people get wrong|here(?:’|')?s what nobody tells you)/giu,
    label:['Harkling före poängen','Throat-clearing'], fix:['Stryk inledningen och börja med poängen.','Cut the opener and start with the point.']},
  {id:'colon', re:/\b(?:det bästa(?: av allt)?|grejen|hemligheten|poängen|skillnaden|resultatet|the best part|the secret|the catch|the result|the difference|here(?:’|')?s why)\s*:/giu,
    label:['Kolonavslöjande','Colon reveal'], fix:['Skriv det som en vanlig mening.','Rewrite it as a plain sentence.']},
  {id:'recap', re:/(?:^|[.!?]\s+|\n)(?:sammanfattningsvis|avslutningsvis|i slutändan|när allt kommer omkring|kort sagt|in conclusion|ultimately|at the end of the day|all in all)\b/giu,
    label:['Sammanfattande slut','Recap ending'], fix:['Sluta på den sista konkreta poängen eller nästa steg.','End on the last concrete point or next step.']},
  {id:'weasel', re:/\b(?:experter (?:menar|är överens|säger)|studier (?:visar|tyder på)|forskning visar|många (?:menar|anser)|enligt många|experts (?:agree|say)|studies (?:show|suggest)|research shows|many (?:argue|believe)|widely regarded as)\b/giu,
    label:['Vag källa','Vague source'], fix:['Namnge källan eller stryk påståendet.','Name the source or cut the claim.']},
  {id:'puffery', re:/\b(?:spelar en (?:avgörande|viktig|central) roll|spelar en nyckelroll|ett bevis på|markerar en (?:milstolpe|vändpunkt)|understryker (?:vikten|betydelsen)|stands as a testament|a testament to|marks a pivotal moment|plays a (?:vital|crucial|pivotal|key) role|underscores (?:its|the) (?:importance|significance))\b/giu,
    label:['Uppblåst betydelse','Importance puffery'], fix:['Skriv faktumet och låt läsaren bedöma.','State the fact and let the reader judge.']},
  {id:'rhetorical', re:/(?:^|[.!?]\s+|\n)(?:tänk dig|föreställ dig|vad skulle hända om|plot twist|what if i told you|think about it|imagine this)\b/giu,
    label:['Retorisk uppladdning','Rhetorical setup'], fix:['Stryk uppladdningen och gör poängen.','Drop the setup and make the point.']},
  {id:'negative-list', re:/(?:^|[.!?]\s+|\n)(?:inte|not) [^.!?\n]{1,40}\.\s+(?:inte|not) [^.!?\n]{1,40}\./giu,
    label:['Negativ uppräkning','Negative listing'], fix:['Säg bara vad det är.','Just say what it is.']},
  {id:'emoji', re:/\p{Extended_Pictographic}/gu,
    label:['Emoji','Emoji'], fix:['Behåll bara om det hör till varumärkets ton.','Keep only if it belongs to the brand’s tone.']},
];

/** Returns findings in text order. Dashes are counted, not matched one by one. */
export function findSlop(text) {
  const findings = [];
  for (const pattern of slopPatterns) {
    for (const match of text.matchAll(pattern.re)) {
      const lead = match[0].match(/^[.!?\s]*/u)[0].length;
      const start = match.index + lead, end = match.index + match[0].length;
      if (end > start) findings.push({id:pattern.id.replace(/-en$/,''), start, end, quote:text.slice(start, end).trim(), label:pattern.label, fix:pattern.fix});
    }
  }
  const dashes = [...text.matchAll(/\s[–—]\s|—/gu)];
  const limit = text.split(/\s+/u).length < 150 ? 1 : 3;
  if (dashes.length > limit) findings.push({id:'dashes', start:dashes[0].index, end:dashes[0].index + dashes[0][0].length, quote:`${dashes.length} ×  –`, label:['Många tankstreck','Many dashes'], fix:['Byt de flesta mot punkt, komma eller parentes.','Swap most for full stops, commas or brackets.']});
  return findings.sort((a, b) => a.start - b.start);
}
