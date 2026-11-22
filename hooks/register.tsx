import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'
import type { Limit } from '../types'

const PANE = 'usage-pace'
const limits = atom({ plugin: 'usage-pace', key: 'limits' } as const, [] as Limit[], { shape: 'limits-1' })

const HOUR = 3600_000
const WINDOW: Record<string, { label: string; ms: number; unit: number; unitName: string; total: number }> = {
  five_hour: { label: '5-hour usage', ms: 5 * HOUR, unit: HOUR, unitName: 'Hour', total: 5 },
  seven_day: { label: 'Weekly usage', ms: 7 * 24 * HOUR, unit: 24 * HOUR, unitName: 'Day', total: 7 },
}

// Fraction of the window elapsed, from its reset time; null when unknown.
export const pace = (l: Limit, now: number): number | null => {
  const w = WINDOW[l.kind]!
  if (!w || !l.resetsAt) return null
  const left = Date.parse(l.resetsAt) - now
  return Number.isFinite(left) ? Math.min(1, Math.max(0, 1 - left / w.ms)) : null
}

// Rounded track + fill + "now" marker, drawn as SVG since Box has no corner radius.
export const barSvg = (used: number, p: number | null, w: number): string => {
  const h = 22, y = 18, r = h / 2
  const fill = Math.max(0, Math.min(1, used / 100)) * w
  const x = p === null ? null : Math.min(w - 2, Math.max(2, p * w))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${y + h + 4}" viewBox="0 0 ${w} ${y + h + 4}">
<defs><clipPath id="c"><rect x="0" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath></defs>
<rect x="0" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#8A8A8A" fill-opacity="0.22"/>
<rect x="0" y="${y}" width="${fill}" height="${h}" clip-path="url(#c)" fill="#D97757"/>
${x === null ? '' : `<rect x="${x - 1.5}" y="${y - 3}" width="3" height="${h + 6}" rx="1.5" fill="#2B2A27" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="0.75"/>
<text x="${x}" y="12" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#7A8699">now</text>`}
</svg>`
}

const resetText = (iso?: string) =>
  iso ? `Resets ${new Date(iso).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}` : ''

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'usage-pace', description: 'Show plan usage with week-progress markers' })
    await update($, limits, () => [])
    void $.session.usage().then(u => update($, limits, () => u.rateLimits))
    void $.ui.open({ id: PANE, title: 'Plan usage' })
    return next(e)
  })

  on('command.run', { command: 'usage-pace' }, async $ => {
    const u = await $.session.usage()
    await update($, limits, () => u.rateLimits)
    await $.ui.open({ id: PANE, title: 'Plan usage' })
    return { text: 'Plan usage pane opened.' }
  })

  on('session.measure', async ($, e, next) => {
    await update($, limits, () => e.rateLimits)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Progress } = ui
    // Weekly first, as in the reference layout.
    const list = (await read($, limits)).filter(l => WINDOW[l.kind]).sort((a, b) => (a.kind === 'seven_day' ? -1 : b.kind === 'seven_day' ? 1 : 0))
    const now = Date.now()
    if (list.length === 0) return <Text dimColor>No plan usage yet (subscription only; updates after a turn).</Text>
    // shortcut: bodyColumns×7px guesses the pane's pixel width; upgrade if the pane reports pixels.
    const width = Math.max(220, Math.min(640, ((e.props as { bodyColumns?: number }).bodyColumns ?? 60) * 7))

    return (
      <Box flexDirection="column" gap={2} paddingX={1}>
        {list.map(l => {
          const w = WINDOW[l.kind]!
          const p = pace(l, now)
          const elapsed = p === null ? '' : `${w.unitName} ${((p * w.ms) / w.unit).toFixed(1)} of ${w.total} · ${Math.round(p * 100)}% of ${l.kind === 'seven_day' ? 'week' : 'window'}`
          return (
            <Box flexDirection="column" key={l.kind}>
              <Box justifyContent="space-between">
                <Text bold>{w.label}</Text>
                <Text bold>{Math.round(l.percentUsed)}%</Text>
              </Box>
              {'Svg' in ui ? (
                <ui.Svg source={barSvg(l.percentUsed, p, width)} alt={`${w.label}: ${Math.round(l.percentUsed)}% used${elapsed ? `, ${elapsed}` : ''}`} />
              ) : (
                <Progress label={w.label} value={l.percentUsed / 100} />
              )}
              <Box justifyContent="space-between">
                <Text dimColor>{elapsed}</Text>
                <Text dimColor>{resetText(l.resetsAt)}</Text>
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  })
}
