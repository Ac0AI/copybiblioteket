# Profile portraits

All 59 catalogue identities have a locally served image in `public/portraits/`.
56 files were retrieved from the matching The Brains profile on 2026-10-28.
Elon Musk, Naval Ravikant and Paul Buchheit use attributed Commons portraits
instead of a rocket, a sketch and a sideways avatar. Alex (alexxgrowth) retains
his public abstract avatar with initials overlaid, without inventing a likeness.
`docs/portrait-sources.json` records the original URL, upstream profile, retrieval
date, checksum, and licence when the source states one. `data/portraits.json`
contains the display metadata bundled into the people page.

The browser requests the pictures from Sigge, without third-party image requests.
Cards lazy-load images with reserved dimensions. The detail dialog uses the same
file with a larger display crop and links to the image source. Initials remain
visible if an image fails. Portraits are decorative next to the person's name, so
screen readers do not announce that name twice. Existing profile notices continue
to state that these are unofficial applications, without endorsement.

These photographs are not licensed by the repository's MIT licence. Most are
public profile pictures whose upstream manifests do not specify a reuse licence;
source attribution must not be interpreted as an independent licence grant.
Known Commons credits are displayed alongside the portrait, including Eric Gaba
(Sting), CC BY-SA 2.5 for Socrates, Bernard Gotfryd for Steve Jobs, and the USA
International Trade Administration for Warren Buffett. Source pixels are kept
unchanged; CSS supplies the display crop.

Additional Commons credits: The Royal Society / Debbie Rowe (uploaded by Duncan
Hull), CC BY-SA 3.0 for Elon Musk; Elias Bizannes, CC BY-SA 2.0 for Naval Ravikant;
Robert Scoble, CC BY 2.0 for Paul Buchheit. Each source and licence is linked in
the profile dialog. Each photograph retains its own licence.

To replace a portrait, update its file and both metadata records. Keep the person
ID stable, record the new source and licence, and check the face crop in both the
list and dialog at mobile and desktop widths. Run `npm run build` before release.
