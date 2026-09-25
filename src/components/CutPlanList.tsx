import { cutPlan } from '#/lib/cutMarks'
import type { Rect } from '#/lib/layout'

/** The same numbered cuts drawn on the preview, as a checklist for a paper trimmer. */
export function CutPlanList({ cells }: { cells: Rect[] }) {
  const lines = cutPlan(cells)
  return (
    <section className="bg-background rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Cut layout</h2>
      <p className="text-muted-foreground mb-3 text-xs">
        Make the vertical cuts first, edge to edge, then the horizontal cuts on
        each strip. Distances are from the sheet's left or top edge.
      </p>
      <ol className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2 tabular-nums">
            <span className="w-5 font-semibold text-red-600">{i + 1}</span>
            <span className="text-muted-foreground w-20 capitalize">
              {line.axis}
            </span>
            <span>
              {line.at.toFixed(1)} mm from{' '}
              {line.axis === 'vertical' ? 'left' : 'top'}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
