import { Sparkles, Compass, Target, Footprints, Lightbulb } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/primitives'

interface PlanningPhilosophyModalProps {
  open: boolean
  onClose: () => void
}

export function PlanningPhilosophyModal({ open, onClose }: PlanningPhilosophyModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="El Campo de Planificación: Crear más allá del presente"
    >
      <div className="flex flex-col gap-5 py-2 text-ink max-h-[75vh] overflow-y-auto pr-1">
        {/* Intro Manifesto */}
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 leading-relaxed">
          <div className="flex items-center gap-2 text-accent font-bold text-[14px]">
            <Sparkles className="size-4 shrink-0" />
            <span>¿Por qué planificar? El arte de no quedar atrapado en el presente</span>
          </div>
          <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">
            Planificar no es redactar una agenda burocrática ni encadenarte a un calendario inflexible.
            Es el <strong>acto soberano de decidir hacia dónde fluye tu energía</strong> antes de que
            las urgencias cotidianas decidan por vos.
          </p>
        </div>

        {/* 3 Pillars of Planning */}
        <div className="flex flex-col gap-4">
          {/* Pillar 1: El Resultado Deseado */}
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface/40 p-4 transition-all hover:bg-surface">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              <Compass className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                Paso 1 · La Visión Magnética
              </span>
              <h4 className="text-[15px] font-bold text-ink mt-0.5">
                Decidir un Resultado más allá de mi realidad hoy
              </h4>
              <p className="mt-1.5 text-[13px] text-ink-2 leading-relaxed">
                Si solo planificás a partir de tus recursos, miedos o límites visibles de hoy, te limitás a
                <strong> reproducir tu realidad actual</strong>.
              </p>
              <p className="mt-1 text-[13px] text-ink-2 leading-relaxed">
                Decidir con claridad un <em>Resultado Deseado</em> que hoy parece lejano crea un punto
                magnético en el futuro. Esa distancia genera la <strong>tensión creativa</strong> que te
                obliga a inventar soluciones, buscar alianzas y aprender destrezas que hoy no tenés.
              </p>
            </div>
          </div>

          {/* Pillar 2: Los Objetivos Intermedios */}
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface/40 p-4 transition-all hover:bg-surface">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <Target className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Paso 2 · Los Vectores de Concreción
              </span>
              <h4 className="text-[15px] font-bold text-ink mt-0.5">
                Los Objetivos: Definir los "a dóndes" intermedios
              </h4>
              <p className="mt-1.5 text-[13px] text-ink-2 leading-relaxed">
                Nadie salta al resultado final en un solo movimiento. Para materializar esa visión,
                necesitamos trazar <strong>hitos intermedios</strong>: los "a dóndes" necesarios que
                nos aproximan a esa concreción.
              </p>
              <p className="mt-1 text-[13px] text-ink-2 leading-relaxed">
                Un objetivo no es una lista interminable de tareas; es un faro que te responde con nitidez:
                <em> "¿Hacia dónde necesito dirigir la proa esta semana para que el resultado se vuelva inevitable?"</em>
              </p>
            </div>
          </div>

          {/* Pillar 3: Las Tareas de Base */}
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface/40 p-4 transition-all hover:bg-surface">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Footprints className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Paso 3 · El Pulso Cotidiano
              </span>
              <h4 className="text-[15px] font-bold text-ink mt-0.5">
                Tareas de Base: El entrenamiento mental día a día
              </h4>
              <p className="mt-1.5 text-[13px] text-ink-2 leading-relaxed">
                La tarea de base es la <strong>unidad básica necesaria</strong> para ejecutar en el día a día.
                Es donde el pensamiento abstracto aterriza en la materia.
              </p>
              <p className="mt-1 text-[13px] text-ink-2 leading-relaxed">
                Decidir cada día cuáles son esos pasos concretos que vas a mover hacia tus objetivos es un
                <strong> entrenamiento en sí mismo</strong>: disciplina la voluntad, apaga la ansiedad de lo
                inabarcable y te demuestra en los hechos que tu obra avanza milímetro a milímetro.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic & Non-Rigid Tree Note */}
        <div className="rounded-xl border border-dashed border-line p-3.5 bg-subtle/60 flex items-start gap-3">
          <Lightbulb className="size-4 shrink-0 text-amber-500 mt-0.5" />
          <p className="text-[12px] text-ink-2 leading-relaxed">
            <strong>El árbol no es una jaula:</strong> Podés nombrar pasos libremente, ajustar los tiempos
            según el pulso de la realidad y mover tareas entre hoy y los días venideros. Lo esencial no es
            la rigidez del esquema, sino la coherencia entre el sueño que decidiste y el paso que das hoy.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-line/60">
          <Button type="button" onClick={onClose}>
            Entendido, volver a planificar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
