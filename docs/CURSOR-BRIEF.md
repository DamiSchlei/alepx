CURSOR-BRIEF — Aleph

docs/ALEPH.md wins on domain (economy, stages, 4-objective cap).
This file wins on UI, color, copy placement, and the weekly-series slice.

A Block is a Task scheduled on a day. Never create a Block entity.

Hard rules

One existing Vite + React app. No second scaffold.
Code / types / filenames / comments / commits: English.
All UI strings in src/locales/en.json and es.json.
  es = Rioplatense (vos, completá, proponé, querés, anotá, sostuviste).
Exactly 3 tabs: Planning, Home, Tracking. Home is primary.
Economy untouched in formula. Paid once. No second currency.
No teams, no night/neon theme, no infinite recurrence, no “edit entire series”.
Empty sample = empty UI. Never draw 0%.
Do not seed XP, money, or completed work as a payout showcase.
After every slice the app runs.

UI lock — paper

Quiet gray page. White day cards lift. One violet accent. Ink is dark.

Ground lives in `src/index.css` `@theme` (paper tokens). Do not reintroduce night hex.

- Page: `--color-bg` `#f4f5f8`
- Cards: `--color-surface` white, `--shadow-paper`
- Ink: `--color-ink` `#111113`, meta `--color-ink-3`
- Accent / today / ISO chip: `--color-violet` `#7a3fe0`
- Mint: done. Amber: loose / overdue. Rose: blocked.

Display font (Fraunces) ONLY on:
Home week-range is not display; keep it sans.
Planning project titles may use display.
Tracking week sentence uses display.

page            max-w-lg (already in Shell)
hit targets     min 44px
tab bar         fixed, content padded above it

Home structure — only legal tree

Page
  HomeStickyChrome
    ISO week number + range
    ‹ › shift ISO week (lands on Monday)
    Hoy if activeDay !== today
    WeekStrip LUN–DOM (today pip + max 3 project color dots, no 2/2 rings)
  One DayCard (full width, no peek)
    day title + Hoy badge
    12h AM/PM analog, civil hands + digital time on today
    obra line: planned / cap · free hours for the work
    composer + Task + Plan the day

Illegal on Home:
Day / Week / Month granularity tabs
Month grid
Neighbor day peek / carousel snap
Idle-hour chips (“16h inactivo”)
Bring-from-planning icon on the card edge
0% on an empty sample
Character journal covering the Plan-the-day button (pip only)

Planning

Same four-level tree as Home’s Plan-the-day overlay: Project → Result → Objective → Task.
All user-visible strings through i18n (en + Rioplatense es).
Tracking

Same ISO week chrome as Home: week number + range, ‹ ›, Hoy.
First content = week sentence (ink, display 22px).
If no completed work this week and no history: tracking.weekSentenceNone. No 0%.
WeekChart: empty days are ticks, not fake bars.
Then existing KPIs / chart.

Weekly series (Block = Task)

types.ts Task optional:
seriesId?: string
seriesWeekdays?: number[] // ISO 1=Mon … 7=Sun

createTaskSeries(input):
TaskInput + weekdays[] + hoursPerBlock + horizon 'week' | 'month'
week = today → end of current week
month = today → last day of month
skip dates with existing task for same seriesId+day
Cap 20 blocks. No past dates. Tests for createTaskSeries.

TaskForm: toggle for series, weekday chips, hoursPerBlock, horizon week|month, live preview count×hours. Composer stays single-task only.

Series pulse

Selector weekSeriesPulse(state, weekStart):
{ seriesId, title, planned, done, missed }[]
missed = scheduled this week with day < today and status not done
Copy:
missed>0 amber: "Se cayeron {{count}} bloque(s) esta semana."
missed===0 && done>0 mint: "Esta semana sostuviste los bloques."
else hide

Tracking list: "{{title}}: {{done}}/{{planned}} · {{missed}} abajo"
No bar when planned===0.

i18n keys to add (en + es)

home.greeting
home.stepToday
home.stepTodayEmpty
home.seeDay
home.writingTitle
home.writingHint
home.activeEnterprises
home.completeCta
home.moveCta
home.seriesMissed
home.seriesHeld
planning.tasks.seriesTitle
planning.tasks.seriesHint
planning.tasks.seriesWeek
planning.tasks.seriesMonth
planning.tasks.seriesPreview
planning.tasks.seriesCapped
planning.tasks.seriesPart
planning.tasks.executeTitle
planning.tasks.executeComment
planning.tasks.closeTitle
planning.tasks.closeHours
planning.tasks.closeComment
planning.openFilters
tracking.weekSentenceMoved
tracking.weekSentenceMovedOnly
tracking.weekSentenceNone
tracking.seriesPulse
onboarding keys only if you touch onboarding (do not in slices 1–5)

Update home.agendaEmpty to drop Plan Total.

Forbidden

4th tab, extra tab bar items from any mockup
photoreal avatar (keep SVG Avatar.tsx)
Block / Recurrence / CalendarMonth entities
applying series edits to all
Composer creating series
light mode
ink-400 titles
equal-weight Card stack on Home
paying rewards twice
0% empty rings

Prompts — un turno cada uno

1. Tokens + primitives

Read @docs/CURSOR-BRIEF.md @docs/ALEPH.md
Slice 1 only: color + type tokens.

Edit src/index.css and index.html (load Fraunces).
Update src/components/ui/primitives.tsx so Card, Button primary/secondary, Chip, Input, Textarea, Select, ProgressBar, Badge use the locked tokens (white titles, accent primary, surface cards).

Do not edit pages.
Do not add features.
Paste the @theme block you shipped. Stop.

2. Home lock

Read @docs/CURSOR-BRIEF.md. Slice 2 only: Home structure.

Rewrite src/pages/HomePage.tsx to the legal tree in the brief.
New files allowed: TodayStep.tsx, WritingFold.tsx only under src/components/home/.
Avatar 136 + glow wrapper. Display name 38px white.
ONE raised TodayStep card. Agenda as rows not Cards, max 4.
Fold PlanTotal / Walker / Literature.
Delete brand stack and the dual Customize/Skills buttons.
Skills = ghost text. Avatar tap = CustomizeSheet.
featuredAgendaTask selector if missing: first non-done agendaTasks, prefer in_progress.
i18n en+es for new home keys.
Do not do series or close-sheet yet.
Paste the Home JSX tree and the three className strings: hero, today card, agenda row. Stop.

3. Planning + Tracking look like Home

Slice 3 only: apply tokens to Planning and Tracking. No new features.

Planning result cards: display white title, StagePath (3 stations), health ≤2 lines, no 0% bar.
Task filters move into a sheet.
Tracking: week sentence first, white. Empty days in chart = ticks.
Keep 3 tabs.
i18n for any new strings.
Paste StagePath JSX. Stop.

4. Weekly series

Slice 4 only: weekly blocks as Tasks. Follow CURSOR-BRIEF section Weekly series exactly.

types + createTaskSeries + tests + selectors weekSeriesPulse + TaskForm UI.
Cap 20. No past dates. Composer stays single-task.
No Block entity.
Paste createTaskSeries signature and a screenshot-level description of the form section. Stop.

5. Execute / close + pulse

Slice 5 only: mandatory execute sheet and close sheet. Series pulse line on Home and list on Tracking.

Same hook for Home and Planning. actualHours flows into completeTask.
One comment, not two prompts.
Economy formulas unchanged.
Tests: paid once; actualHours used; comment persisted.
Paste sheet fields. Stop.

Rechazo (si se sale)

Rejected. You violated CURSOR-BRIEF.

Likely fails — fix ALL that apply:
titles still muted / ink-400
Home still a stack of equal Cards
agenda rows wrapped in Card
brand stack or dual CTAs still on Home
avatar < 128 or no glow
4th tab or extra nav items
Block entity or recurrence table
0% on empty
close without required hours+comment
series created from Composer

Change the files. Do not explain theory. Re-paste the JSX you changed.
