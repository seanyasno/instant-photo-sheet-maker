import { FORMATS, FORMAT_IDS } from '#/config/dimensions'
import { FAQ, REPO_URL } from '#/config/site'

function mm(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

const STEPS = [
  'Drop in your photos (JPEG, PNG or HEIC).',
  'Pick a film format: Instax Mini, Square, Wide, Polaroid Go or Polaroid.',
  'Click any print to crop, zoom or rotate the photo inside its frame.',
  'Download the sheets as 300 DPI JPEG, PNG or a ZIP of all sheets.',
  'Print at 100% on 4×6 in paper, then cut along the marks.',
]

/** Crawlable explainer below the tool: what it is, how to use it, sizes and FAQ. */
export function AboutSection() {
  return (
    <article className="text-foreground mx-auto max-w-4xl space-y-10 px-6 pt-4 pb-16 text-sm leading-relaxed">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          Print Instax and Polaroid-style photos at home
        </h2>
        <p className="text-muted-foreground">
          Instant Photo Sheet Maker lays out your photos as real-size instant
          film prints on a 4×6 in (152.4 × 101.6 mm) postcard sheet. It adds the
          classic white or black border with the thick bottom edge and prints
          cut marks in the gutters. Print on a Canon SELPHY CP1500 or any 4×6
          photo printer, trim the prints out, and you get Instax and Polaroid
          lookalikes without film. Everything runs in your browser, so your
          photos never leave your device.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="text-muted-foreground list-decimal space-y-1 pl-5">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Supported print sizes</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-3 py-2 font-medium">Format</th>
                <th className="px-3 py-2 font-medium">Card size</th>
                <th className="px-3 py-2 font-medium">Photo size</th>
              </tr>
            </thead>
            <tbody>
              {FORMAT_IDS.map((id) => {
                const f = FORMATS[id]
                return (
                  <tr key={id} className="border-t">
                    <td className="px-3 py-2">{f.label}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {mm(f.card.w)} × {mm(f.card.h)} mm
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {mm(f.image.w)} × {mm(f.image.h)} mm
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3" id="faq">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>
        <div className="divide-y rounded-lg border">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group px-4 py-3">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="text-muted-foreground mt-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="text-muted-foreground border-t pt-6 text-xs">
        Free and open source.{' '}
        <a className="underline" href={REPO_URL}>
          View on GitHub
        </a>
        . Made by{' '}
        <a className="underline" href="https://seanyasno.com">
          Sean Yasno
        </a>
        .
      </footer>
    </article>
  )
}
