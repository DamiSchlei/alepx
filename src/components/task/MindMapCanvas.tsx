import { useState } from 'react'
import { Plus, Trash2, Star, Sparkles } from 'lucide-react'
import { newId } from '@/data/store'
import type { ThoughtMap, ThoughtNode } from '@/domain/types'

interface MindMapCanvasProps {
  map?: ThoughtMap
  defaultTitle: string
  onChange: (newMap: ThoughtMap) => void
  accentColor?: string
}

const COLOR_PALETTE = [
  '#7a3fe0', // Purple
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#db2777', // Pink
  '#4b5563', // Gray
]

export function MindMapCanvas({
  map,
  defaultTitle,
  onChange,
  accentColor = '#7a3fe0',
}: MindMapCanvasProps) {
  const centralIdea = map?.centralIdea || defaultTitle
  const nodes = map?.nodes || []

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [newIdeaText, setNewIdeaText] = useState('')
  const [newIdeaColor, setNewIdeaColor] = useState(accentColor)
  const [targetParentId, setTargetParentId] = useState<string | null>(null)

  const handleSetCentralIdea = (title: string) => {
    onChange({
      centralIdea: title,
      nodes,
    })
  }

  const handleAddNode = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newIdeaText.trim()
    if (!trimmed) return

    const newNode: ThoughtNode = {
      id: newId('node'),
      parentId: targetParentId || undefined,
      text: trimmed,
      color: newIdeaColor,
      isKeyIdea: false,
    }

    onChange({
      centralIdea,
      nodes: [...nodes, newNode],
    })

    setNewIdeaText('')
    setSelectedNodeId(newNode.id)
  }

  const handleToggleKeyIdea = (nodeId: string) => {
    onChange({
      centralIdea,
      nodes: nodes.map((n) => (n.id === nodeId ? { ...n, isKeyIdea: !n.isKeyIdea } : n)),
    })
  }

  const handleDeleteNode = (nodeId: string) => {
    // Delete node and reparent or delete child nodes
    onChange({
      centralIdea,
      nodes: nodes.filter((n) => n.id !== nodeId && n.parentId !== nodeId),
    })
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
  }

  const handleUpdateNodeText = (nodeId: string, text: string) => {
    onChange({
      centralIdea,
      nodes: nodes.map((n) => (n.id === nodeId ? { ...n, text } : n)),
    })
  }

  // Group nodes into Level 1 (connected to center) and Level 2 (connected to Level 1)
  const rootNodes = nodes.filter((n) => !n.parentId || !nodes.some((p) => p.id === n.parentId))
  const childNodesOf = (parentId: string) => nodes.filter((n) => n.parentId === parentId)

  // Layout calculation for visually pleasing thought map diagram
  // Center is at (300, 200) inside a 600x400 SVG or relative container
  const width = 600
  const height = 400
  const centerX = width / 2
  const centerY = height / 2

  // Position root nodes in an ellipse around center
  const rootPositions = rootNodes.map((node, i) => {
    const total = rootNodes.length
    const angle = (i / Math.max(1, total)) * 2 * Math.PI - Math.PI / 2
    const radiusX = Math.min(180, 140 + total * 8)
    const radiusY = Math.min(130, 95 + total * 6)
    const x = centerX + radiusX * Math.cos(angle)
    const y = centerY + radiusY * Math.sin(angle)
    return { node, x, y }
  })

  // Selected node details
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Input bar to add thoughts / ideas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-subtle/70 rounded-2xl border border-line">
        <div className="flex items-center gap-1.5 flex-1">
          <Sparkles className="size-4 text-purple-600 shrink-0 ml-1" />
          <input
            type="text"
            value={newIdeaText}
            onChange={(e) => setNewIdeaText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddNode()
            }}
            placeholder={
              targetParentId
                ? `Sub-idea de "${nodes.find((n) => n.id === targetParentId)?.text || 'rama'}"...`
                : 'Nueva idea o ramificación de pensamiento...'
            }
            className="w-full bg-white rounded-xl border border-line px-3 py-1.5 text-[13px] text-ink placeholder:text-ink-4 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/20"
          />
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* Color selector */}
          <div className="flex items-center gap-1">
            {COLOR_PALETTE.slice(0, 5).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewIdeaColor(color)}
                className={`size-5 rounded-full transition-transform ${
                  newIdeaColor === color ? 'scale-125 ring-2 ring-offset-1 ring-ink' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Ramificar desde... selector */}
          {nodes.length > 0 && (
            <select
              value={targetParentId || ''}
              onChange={(e) => setTargetParentId(e.target.value || null)}
              className="text-[11px] font-medium bg-white rounded-lg border border-line px-2 py-1 text-ink-2"
            >
              <option value="">Centro: {centralIdea.slice(0, 16)}...</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  Rama: {n.text.slice(0, 16)}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => handleAddNode()}
            disabled={!newIdeaText.trim()}
            className="flex items-center gap-1 bg-[#111318] text-white px-3 py-1.5 rounded-xl text-[12px] font-bold hover:bg-black disabled:opacity-40 transition-all shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Sumar idea</span>
          </button>
        </div>
      </div>

      {/* Visual Mind Map Canvas with SVG connections */}
      <div className="relative w-full h-[320px] sm:h-[380px] bg-gradient-to-b from-slate-50/70 to-white rounded-2xl border border-line overflow-hidden select-none shadow-inner">
        {/* Background grid dots */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#475569" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Connecting curves from center to root nodes */}
          {rootPositions.map(({ node, x, y }) => {
            const dx = x - centerX
            const dy = y - centerY
            const cx1 = centerX + dx * 0.4
            const cy1 = centerY + dy * 0.1
            const cx2 = centerX + dx * 0.6
            const cy2 = y
            const isSelected = selectedNodeId === node.id

            return (
              <g key={`curve-${node.id}`}>
                <path
                  d={`M ${centerX} ${centerY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x} ${y}`}
                  fill="none"
                  stroke={node.color || accentColor}
                  strokeWidth={isSelected ? 3.5 : 2}
                  strokeOpacity={isSelected ? 1 : 0.6}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </g>
            )
          })}

          {/* Connecting lines from root nodes to child nodes */}
          {nodes
            .filter((n) => Boolean(n.parentId))
            .map((child) => {
              const parentPos = rootPositions.find((r) => r.node.id === child.parentId)
              if (!parentPos) return null
              // Child offset
              const siblings = childNodesOf(child.parentId!)
              const idx = siblings.indexOf(child)
              const spread = (idx - (siblings.length - 1) / 2) * 45
              const childX = parentPos.x + (parentPos.x > centerX ? 65 : -65)
              const childY = parentPos.y + spread

              return (
                <g key={`child-link-${child.id}`}>
                  <path
                    d={`M ${parentPos.x} ${parentPos.y} Q ${parentPos.x + (childX - parentPos.x) / 2} ${childY}, ${childX} ${childY}`}
                    fill="none"
                    stroke={child.color || parentPos.node.color || '#94a3b8'}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    strokeOpacity={0.7}
                  />
                  {/* Child node bubble */}
                  <g
                    onClick={() => setSelectedNodeId(child.id)}
                    className="cursor-pointer group"
                  >
                    <rect
                      x={childX - 45}
                      y={childY - 14}
                      width={90}
                      height={28}
                      rx={14}
                      fill="#ffffff"
                      stroke={child.color || '#94a3b8'}
                      strokeWidth={selectedNodeId === child.id ? 2.5 : 1.2}
                      className="drop-shadow-xs transition-all"
                    />
                    <text
                      x={childX}
                      y={childY + 4}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-ink select-none"
                    >
                      {child.text.length > 13 ? `${child.text.slice(0, 11)}…` : child.text}
                    </text>
                  </g>
                </g>
              )
            })}

          {/* Center Hub: The root task / central thought */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedNodeId(null)}
          >
            <rect
              x={centerX - 85}
              y={centerY - 24}
              width={170}
              height={48}
              rx={24}
              fill="#111318"
              stroke="#7a3fe0"
              strokeWidth={3}
              className="drop-shadow-md"
            />
            <text
              x={centerX}
              y={centerY + 5}
              textAnchor="middle"
              className="text-[12px] font-black fill-white tracking-wide select-none"
            >
              {centralIdea.length > 20 ? `${centralIdea.slice(0, 19)}…` : centralIdea}
            </text>
          </g>

          {/* Root Node Bubbles */}
          {rootPositions.map(({ node, x, y }) => {
            const isSelected = selectedNodeId === node.id
            const nodeColor = node.color || accentColor

            return (
              <g
                key={`bubble-${node.id}`}
                onClick={() => setSelectedNodeId(node.id)}
                className="cursor-pointer group"
              >
                {/* Outer halo when selected */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={32}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    className="animate-spin-slow"
                  />
                )}

                {/* Node circle / pill */}
                <rect
                  x={x - 55}
                  y={y - 18}
                  width={110}
                  height={36}
                  rx={18}
                  fill="#ffffff"
                  stroke={nodeColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="drop-shadow-sm transition-transform hover:scale-105"
                />

                {node.isKeyIdea && (
                  <circle
                    cx={x - 44}
                    cy={y - 10}
                    r={7}
                    fill="#f59e0b"
                  />
                )}

                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  className="text-[11px] font-bold fill-ink select-none"
                >
                  {node.text.length > 15 ? `${node.text.slice(0, 13)}…` : node.text}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Empty state overlay when no ideas yet */}
        {nodes.length === 0 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
            <div className="rounded-full bg-white/90 backdrop-blur-md px-4 py-1.5 text-[11px] font-medium text-ink-3 shadow-xs border border-line flex items-center gap-1.5">
              <span>Escribí arriba para ramificar ideas o pensamientos sobre esta tarea</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected node inspector / editor */}
      {selectedNode && (
        <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-line shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="size-3 rounded-full shrink-0"
              style={{ backgroundColor: selectedNode.color || accentColor }}
            />
            <input
              type="text"
              value={selectedNode.text}
              onChange={(e) => handleUpdateNodeText(selectedNode.id, e.target.value)}
              className="flex-1 text-[13px] font-semibold text-ink bg-transparent border-b border-dashed border-line focus:border-purple-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle key idea */}
            <button
              type="button"
              onClick={() => handleToggleKeyIdea(selectedNode.id)}
              className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all ${
                selectedNode.isKeyIdea
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'border-line text-ink-3 hover:text-amber-600'
              }`}
              title="Marcar como idea clave"
            >
              <Star className={`size-3.5 ${selectedNode.isKeyIdea ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span className="hidden sm:inline">Clave</span>
            </button>

            {/* Set as parent for next idea */}
            <button
              type="button"
              onClick={() => setTargetParentId(selectedNode.id)}
              className="p-1.5 rounded-lg border border-line text-[11px] font-bold text-ink-2 hover:bg-subtle transition-all"
              title="Ramificar nueva idea desde este nodo"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Ramificar</span>
            </button>

            {/* Delete node */}
            <button
              type="button"
              onClick={() => handleDeleteNode(selectedNode.id)}
              className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all"
              title="Eliminar idea"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Central title editor if needed */}
      <div className="flex items-center justify-between text-[11px] text-ink-3 px-1">
        <span>Núcleo: <strong className="text-ink">{centralIdea}</strong> ({nodes.length} ideas ramificadas)</span>
        <button
          type="button"
          onClick={() => {
            const newTitle = prompt('Nombre del núcleo del mapa mental:', centralIdea)
            if (newTitle?.trim()) handleSetCentralIdea(newTitle.trim())
          }}
          className="text-purple-600 hover:underline font-semibold"
        >
          Editar núcleo
        </button>
      </div>
    </div>
  )
}
