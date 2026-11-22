import { expect, test } from 'claude-code/testing'
import { barSvg, pace } from './register'

const DAY = 86400_000

test('weekly pace is elapsed fraction of the 7-day window', () => {
  const now = Date.parse('2026-11-22T12:00:00Z')
  const resetsAt = new Date(now + 3.5 * DAY).toISOString()
  expect(pace({ kind: 'seven_day', percentUsed: 15, resetsAt }, now)).toBe(0.5)
  expect(pace({ kind: 'seven_day', percentUsed: 15 }, now)).toBe(null)
  expect(pace({ kind: 'spend_limit', percentUsed: 15, resetsAt }, now)).toBe(null)
})

test('pane draws the weekly bar with its pace', async ($, on) => {
  const limits = [{ kind: 'seven_day', percentUsed: 15, resetsAt: new Date(Date.now() + 2 * DAY).toISOString() }]
  on('session.measure', (_, e) => ({ changed: e.changed }))
  await $.session.measure({ rateLimits: limits, changed: ['rateLimits'] } as never)
  const ui = await $.ui.mount({
    plugin: 'usage-pace', surface: 'desktop', component: 'Pane', requestId: 'usage-pace',
    props: { title: 'Plan usage', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
  })
  expect((await ui.find({ type: 'Text', text: /Weekly usage/ }))?.text).toBe('Weekly usage')
  expect((await ui.find({ type: 'Text', text: /of week/ }))?.text).toBe('Day 5.0 of 7 · 71% of week')
  await ui.unmount()
})

test('bar svg puts the marker at the window fraction', () => {
  const svg = barSvg(16, 0.5, 400)
  expect(svg.includes('x="198.5"')).toBe(true)
  expect(svg.includes('width="64"')).toBe(true)
  expect(barSvg(16, null, 400).includes('now')).toBe(false)
})
