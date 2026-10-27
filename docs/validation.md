# Validering

27 oktober 2026, fristående version 1.0.

- `npm run build`: TypeScript-kontroll och 20 automatiska tester godkända lokalt.
- Svenska och engelska sökfrågor, källhänvisningar, svenska tecken, tomma träffar, indata och HTTP testas.
- En riktig MCP-klient startar stdio-servern från en annan arbetskatalog och läser verktyg och resultat.
- Produktionsstarten testas med en ogiltig lokal källkatalog i miljön: den använder ändå endast egna tillämpningar och källänkar.
- `npm install --ignore-scripts` rapporterade noll kända sårbarheter. Detta är inte en fullständig säkerhetsrevision.
- Skrivproven i examples/ kommer från det tidigare lokala experimentet och är märkta som samma assistents bedömning.

Webb- och domänverifiering dokumenteras efter första publiceringen. En lyckad lokal testkörning är inte bevis för fungerande drift.

## Begränsningar

Ingen jämförelse med Hormozis egen AI eller mätning av konverteringseffekt har gjorts. Begreppssökning är inte generell semantisk förståelse. Missade träffar behöver omformulering eller ramverkslistan. En valfri lokal ärvd samling har inte verifierats i sin helhet mot originalen och ingår inte i publik drift.

Sajten skriver inte färdig copy med en inbyggd modell. Den ger underlag till din AI-klient och Copy Operator-skillen. Skillens strukturella validering bevisar inte språklig kvalitet.
