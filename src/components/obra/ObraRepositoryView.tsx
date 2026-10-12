import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Plus,
  Compass,
  LayoutGrid,
  Map,
  X,
  BookOpen,
} from 'lucide-react'
import { ObraArtifactCard } from './ObraArtifactCard'
import { ObraArtifactFormSheet } from './ObraArtifactFormSheet'
import { ObraCanvasView } from './ObraCanvasView'
import { filterArtifacts } from '@/data/selectors'
import { TERRENO_MAP, TERRENOS } from '@/domain/terrenos'
import type {
  ObraArtifact,
  ObraArtifactType,
  Objective,
  Task,
  Terreno,
} from '@/domain/types'

interface ObraRepositoryViewProps {
  artifacts: ObraArtifact[]
  objectives?: Objective[]
  tasks?: Task[]
  projectId?: string
  resultId?: string
  objectiveId?: string
  projectColor?: string
}

export function ObraRepositoryView({
  artifacts,
  objectives = [],
  tasks = [],
  projectId,
  resultId,
  objectiveId,
  projectColor = '#7a3fe0',
}: ObraRepositoryViewProps) {
  const { t } = useTranslation()

  const [activeTab, setActiveTab] = useState<'cards' | 'canvas'>('cards')
  const [selectedTerreno, setSelectedTerreno] = useState<Terreno | 'all'>('all')
  const [selectedType, setSelectedType] = useState<ObraArtifactType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Form sheet state
  const [formOpen, setFormOpen] = useState(false)
  const [editingArtifact, setEditingArtifact] = useState<ObraArtifact | undefined>()

  const filtered = useMemo(() => {
    return filterArtifacts(artifacts, {
      terreno: selectedTerreno,
      type: selectedType,
      query: searchQuery,
    })
  }, [artifacts, selectedTerreno, selectedType, searchQuery])

  const handleOpenNew = (_position?: { x: number; y: number }) => {
    setEditingArtifact(undefined)
    setFormOpen(true)
  }

  const handleEdit = (art: ObraArtifact) => {
    setEditingArtifact(art)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-[18px] font-bold text-ink leading-tight">
            {t('obra.repositoryTitle')}
          </h3>
          <p className="mt-0.5 text-[12px] text-ink-3">
            {t('obra.repositorySubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle (Cards vs Canvas) */}
          <div className="flex rounded-xl border border-line bg-surface p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('cards')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
                activeTab === 'cards'
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>{t('obra.viewTabs.repository')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('canvas')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
                activeTab === 'canvas'
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Map className="size-3.5" />
              <span>{t('obra.viewTabs.canvas')}</span>
            </button>
          </div>

          {/* Add New Artifact button */}
          <button
            type="button"
            onClick={() => handleOpenNew()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-3 py-1.5 text-[13px] font-semibold text-white shadow-xs hover:bg-violet-dark transition-all"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t('obra.newArtifact')}</span>
            <span className="sm:hidden">{t('common.add')}</span>
          </button>
        </div>
      </div>

      {activeTab === 'cards' ? (
        <div className="flex flex-col gap-3.5">
          {/* Search & Filters */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-3 shadow-xs">
            {/* Search Box */}
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-ink-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('obra.searchPlaceholder')}
                className="w-full rounded-xl border border-line bg-bg pl-9 pr-8 py-2 text-[13px] text-ink placeholder:text-ink-3 focus:border-violet focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-ink-3 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Terreno Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setSelectedTerreno('all')}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  selectedTerreno === 'all'
                    ? 'bg-ink text-white'
                    : 'bg-surface-2 text-ink-3 hover:text-ink'
                }`}
              >
                {t('obra.filterAllTerrenos')}
              </button>

              {TERRENOS.map((terr) => {
                const meta = TERRENO_MAP[terr]
                const isSelected = selectedTerreno === terr
                return (
                  <button
                    key={terr}
                    type="button"
                    onClick={() => setSelectedTerreno(terr)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors"
                    style={{
                      backgroundColor: isSelected ? meta.color : `${meta.color}18`,
                      color: isSelected ? '#ffffff' : meta.color,
                      fontWeight: isSelected ? 600 : 500,
                    }}
                  >
                    <Compass className="size-3" />
                    <span>{meta.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Type Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-line/40">
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-colors ${
                  selectedType === 'all'
                    ? 'bg-ink text-white'
                    : 'bg-surface-2 text-ink-3 hover:text-ink'
                }`}
              >
                {t('obra.filterAllTypes')}
              </button>
              {(['note', 'decision', 'reference', 'deliverable', 'snippet'] as ObraArtifactType[]).map((tKey) => {
                const isSelected = selectedType === tKey
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setSelectedType(tKey)}
                    className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-colors ${
                      isSelected
                        ? 'bg-violet text-white font-semibold'
                        : 'bg-surface-2 text-ink-3 hover:text-ink'
                    }`}
                  >
                    {t(`obra.types.${tKey}`)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cards Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filtered.map((art) => (
                <ObraArtifactCard
                  key={art.id}
                  artifact={art}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-line/80 bg-surface/40 p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-violet/10 text-violet mb-3">
                <BookOpen className="size-6" />
              </div>
              <h4 className="font-serif text-[16px] font-bold text-ink">
                {t('obra.emptyRepositoryTitle')}
              </h4>
              <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-3">
                {t('obra.emptyRepositoryBody')}
              </p>
              <button
                type="button"
                onClick={() => handleOpenNew()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet px-3.5 py-2 text-[13px] font-semibold text-white shadow-xs hover:bg-violet-dark transition-all"
              >
                <Plus className="size-4" />
                <span>{t('obra.newArtifact')}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Spatial Canvas View */
        <ObraCanvasView
          artifacts={artifacts}
          objectives={objectives}
          tasks={tasks}
          onAddArtifact={handleOpenNew}
          onEditArtifact={handleEdit}
          projectColor={projectColor}
        />
      )}

      {/* Form Sheet */}
      <ObraArtifactFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        artifact={editingArtifact}
        defaultProjectId={projectId}
        defaultResultId={resultId}
        defaultObjectiveId={objectiveId}
      />
    </div>
  )
}
