import { TERRENO_MAP } from '@/domain/terrenos'
import type { Task, Terreno } from '@/domain/types'

interface DayCellPreviewProps {
  tasks: Task[]
  cap?: number
  compact?: boolean
  className?: string
}

/**
 * Vista previa visual de la "Célula Latente" del día.
 * Muestra el núcleo de la obra y los 3 satélites de terreno (Literatura, Arte, Empresa),
 * encendiéndose según las actividades activas del día.
 */
export function DayCellPreview({
  tasks,
  compact = false,
  className = '',
}: DayCellPreviewProps) {
  // Count tasks and hours by terrain
  const counts: Record<Terreno, { count: number; hours: number; done: boolean }> = {
    literatura: { count: 0, hours: 0, done: true },
    arte: { count: 0, hours: 0, done: true },
    empresa: { count: 0, hours: 0, done: true },
  }

  tasks.forEach((t) => {
    const terr = t.terreno ?? 'literatura'
    counts[terr].count += 1
    counts[terr].hours += t.actualHours ?? t.estimatedHours ?? 1
    if (t.status !== 'done_on_time' && t.status !== 'done_late') {
      counts[terr].done = false
    }
  })

  const hasAny = tasks.length > 0
  const size = compact ? 120 : 160
  const center = size / 2
  const orbitRadius = compact ? 38 : 52

  // Coordinates for the 3 terrain satellites (120 deg apart)
  // Top: Literatura (-90 deg = -PI/2)
  // Bottom-Left: Arte (150 deg = 5*PI/6)
  // Bottom-Right: Empresa (30 deg = PI/6)
  const satellites: Array<{ id: Terreno; x: number; y: number; angle: number }> = [
    {
      id: 'literatura',
      x: center,
      y: center - orbitRadius,
      angle: -90,
    },
    {
      id: 'arte',
      x: center - orbitRadius * Math.cos(Math.PI / 6),
      y: center + orbitRadius * Math.sin(Math.PI / 6),
      angle: 150,
    },
    {
      id: 'empresa',
      x: center + orbitRadius * Math.cos(Math.PI / 6),
      y: center + orbitRadius * Math.sin(Math.PI / 6),
      angle: 30,
    },
  ]

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Orbit ring guide */}
        <circle
          cx={center}
          cy={center}
          r={orbitRadius}
          fill="none"
          stroke="#e6e8ee"
          strokeWidth="1"
          strokeDasharray="3 3"
          className="opacity-70"
        />

        {/* Filaments from center to satellites */}
        {satellites.map((sat) => {
          const info = TERRENO_MAP[sat.id]
          const active = counts[sat.id].count > 0
          return (
            <line
              key={`line-${sat.id}`}
              x1={center}
              y1={center}
              x2={sat.x}
              y2={sat.y}
              stroke={active ? info.color : '#d0d4dc'}
              strokeWidth={active ? 2 : 1}
              strokeDasharray={active ? undefined : '2 2'}
              className="transition-all duration-300"
              opacity={active ? 0.8 : 0.35}
            />
          )
        })}

        {/* Center Seed (Núcleo de la Obra) */}
        <g>
          {/* Subtle pulse ring around center if active */}
          {hasAny && (
            <circle
              cx={center}
              cy={center}
              r={compact ? 18 : 24}
              fill="#7a3fe0"
              opacity="0.08"
              className="animate-pulse"
            />
          )}
          <circle
            cx={center}
            cy={center}
            r={compact ? 12 : 16}
            fill={hasAny ? '#111113' : '#f6f7f9'}
            stroke={hasAny ? '#111113' : '#d0d4dc'}
            strokeWidth="1.5"
            className="transition-colors duration-300"
          />
          {/* Center icon or dot */}
          <circle
            cx={center}
            cy={center}
            r={compact ? 3 : 4}
            fill={hasAny ? '#ffffff' : '#9aa0ae'}
          />
        </g>

        {/* Satellites */}
        {satellites.map((sat) => {
          const info = TERRENO_MAP[sat.id]
          const data = counts[sat.id]
          const active = data.count > 0
          const r = compact ? (active ? 9 : 6) : active ? 13 : 8

          return (
            <g key={sat.id} className="transition-all duration-300">
              {/* Active glow */}
              {active && (
                <circle
                  cx={sat.x}
                  cy={sat.y}
                  r={r + 4}
                  fill={info.color}
                  opacity="0.15"
                  className="animate-pulse"
                />
              )}
              {/* Satellite body */}
              <circle
                cx={sat.x}
                cy={sat.y}
                r={r}
                fill={active ? info.color : '#ffffff'}
                stroke={active ? info.color : '#d0d4dc'}
                strokeWidth={active ? '2' : '1.5'}
              />
              {/* Count label or inner dot */}
              {active ? (
                <text
                  x={sat.x}
                  y={sat.y + (compact ? 3 : 4)}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={compact ? '9' : '11'}
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {data.count}
                </text>
              ) : (
                <circle cx={sat.x} cy={sat.y} r={2} fill="#d0d4dc" />
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
