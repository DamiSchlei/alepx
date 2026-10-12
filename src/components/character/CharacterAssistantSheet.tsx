import { useState } from 'react'
import { BookOpen, FolderGit2 } from 'lucide-react'
import { CharacterJournalView } from '@/components/journal/CharacterJournalView'
import { ProjectJournalView } from '@/components/journal/ProjectJournalView'
import { Sheet } from '@/components/ui/Sheet'
import { useAleph } from '@/data/store'
import { cx } from '@/components/ui/primitives'

export type BitacoraTab = 'character' | 'projects'

export function CharacterAssistantSheet({
  open,
  onClose,
  initialTab = 'character',
}: {
  open: boolean
  onClose: () => void
  initialTab?: 'assistant' | 'journal' | 'character' | 'projects' | 'project'
}) {
  const { character } = useAleph()
  const resolvedInitialTab: BitacoraTab =
    initialTab === 'projects' || initialTab === 'project' ? 'projects' : 'character'
  const [tab, setTab] = useState<BitacoraTab>(resolvedInitialTab)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Bitácora · ${tab === 'character' ? 'Personaje (' + (character.name || 'Aleph') + ')' : 'Proyectos'}`}
      className="flex flex-col h-dvh max-h-dvh sm:h-[88dvh] sm:max-h-[88dvh]"
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Segmented Tab control: Bitácora del Personaje ↔ Bitácora de Proyectos */}
        <div className="flex border-b border-line px-3 pt-2 pb-2 bg-subtle/30">
          <div className="flex w-full rounded-xl bg-subtle p-1 border border-line">
            <button
              type="button"
              onClick={() => setTab('character')}
              className={cx(
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold transition-all',
                tab === 'character'
                  ? 'bg-surface text-ink shadow-xs border border-line'
                  : 'text-ink-3 hover:text-ink',
              )}
            >
              <BookOpen className="size-4 text-violet" />
              <span>Bitácora del Personaje</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('projects')}
              className={cx(
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold transition-all',
                tab === 'projects'
                  ? 'bg-surface text-ink shadow-xs border border-line'
                  : 'text-ink-3 hover:text-ink',
              )}
            >
              <FolderGit2 className="size-4 text-violet" />
              <span>Bitácora de Proyectos</span>
            </button>
          </div>
        </div>

        {/* Tab contents */}
        <div className="flex-1 min-h-0 flex flex-col">
          {tab === 'character' ? (
            <CharacterJournalView />
          ) : (
            <ProjectJournalView />
          )}
        </div>
      </div>
    </Sheet>
  )
}
