export type ThoughtTheme =
  | 'obra'
  | 'tiempo'
  | 'atencion'
  | 'silencio'
  | 'voluntad'
  | 'perspectiva'
  | 'memoria'

export interface DailyThought {
  id: string
  text: string
  author: string
  work?: string
  theme: ThoughtTheme
  reflectionPrompt: string
  source?: 'curated' | 'remote'
}

interface LocalizedThoughtSeed {
  id: string
  theme: ThoughtTheme
  author: string
  work: { es: string; en: string }
  text: { es: string; en: string }
  prompt: { es: string; en: string }
}

/**
 * Curated literary and philosophical anthology for Aleph.
 * Rooted in Jorge Luis Borges, Stoicism, existentialism, and contemplative literature.
 */
export const THOUGHTS_ANTHOLOGY: LocalizedThoughtSeed[] = [
  {
    id: 'borges-aleph',
    theme: 'perspectiva',
    author: 'Jorge Luis Borges',
    work: { es: 'El Aleph', en: 'The Aleph' },
    text: {
      es: 'Vi el populoso mar, vi el alba y la tarde, vi las muchedumbres de América, vi una plateada telaraña en el centro de una negra pirámide, vi un laberinto roto.',
      en: 'I saw the populous sea, I saw dawn and evening, I saw the multitudes of America, I saw a silvery cobweb at the center of a black pyramid, I saw a broken labyrinth.',
    },
    prompt: {
      es: '¿Desde qué ángulo estás mirando tu problema de hoy? Cambiá el punto de vista.',
      en: 'From what vantage point are you observing today’s challenge? Shift the angle.',
    },
  },
  {
    id: 'borges-tiempo',
    theme: 'tiempo',
    author: 'Jorge Luis Borges',
    work: { es: 'Otras inquisiciones', en: 'Other Inquisitions' },
    text: {
      es: 'El tiempo es la sustancia de que estoy hecho. El tiempo es un río que me arrebata, pero yo soy el río; es un tigre que me destroza, pero yo soy el tigre.',
      en: 'Time is the substance from which I am made. Time is a river which sweeps me along, but I am the river; it is a tiger which mangles me, but I am the tiger.',
    },
    prompt: {
      es: 'No pelees contra las horas del día; hacete cargo del cauce en el que estás.',
      en: 'Do not fight against the hours of the day; take custody of the stream you embody.',
    },
  },
  {
    id: 'seneca-lucilio',
    theme: 'tiempo',
    author: 'Séneca',
    work: { es: 'Cartas a Lucilio', en: 'Letters from a Stoic' },
    text: {
      es: 'No nos falta tiempo, sino que perdemos mucho. La vida es bastante larga si sabemos cómo invertirla.',
      en: 'It is not that we have a short time to live, but that we waste a lot of it. Life is long enough if it is well invested.',
    },
    prompt: {
      es: '¿Qué tarea secundaria estás usando para evitar la obra principal de hoy?',
      en: 'What secondary task are you using to postpone today’s essential work?',
    },
  },
  {
    id: 'marcus-aurelius-accion',
    theme: 'obra',
    author: 'Marco Aurelio',
    work: { es: 'Meditaciones', en: 'Meditations' },
    text: {
      es: 'Al amanecer, cuando te cueste levantarte, ten presente este pensamiento: Me levanto para hacer la obra de un ser humano.',
      en: 'At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work—as a human being.',
    },
    prompt: {
      es: '¿Cuál es el único paso que le da sentido a tu mañana hoy?',
      en: 'What single deliberate action gives purpose to your morning today?',
    },
  },
  {
    id: 'pessoa-desasosiego',
    theme: 'silencio',
    author: 'Fernando Pessoa',
    work: { es: 'El libro del desasosiego', en: 'The Book of Disquiet' },
    text: {
      es: 'Llevar a cabo una obra, aunque sea pequeña, es ganar un poco de inmortalidad. La pereza es la muerte anticipada.',
      en: 'To complete a piece of work, however small, is to win a sliver of immortality. Sloth is death in advance.',
    },
    prompt: {
      es: 'Concluí una pequeña cosa antes del mediodía. Cerrá el círculo.',
      en: 'Bring one small task to full completion before noon. Close the loop.',
    },
  },
  {
    id: 'montaigne-ensayos',
    theme: 'atencion',
    author: 'Michel de Montaigne',
    work: { es: 'Ensayos', en: 'Essays' },
    text: {
      es: 'Nuestra gran y gloriosa obra maestra es vivir apropiadamente. Todo lo demás no es más que un pequeño apéndice.',
      en: 'Our great and glorious masterpiece is to live appropriately. All other things are at best little extras.',
    },
    prompt: {
      es: 'Observá tu ritmo. ¿Estás viviendo tu jornada o sólo apurándola?',
      en: 'Notice your pace. Are you inhabiting your day or merely rushing through it?',
    },
  },
  {
    id: 'calvino-visibilidad',
    theme: 'perspectiva',
    author: 'Italo Calvino',
    work: { es: 'Seis propuestas para el próximo milenio', en: 'Six Memos for the Next Millennium' },
    text: {
      es: 'Tomad la vida con ligereza, que ligereza no es superficialidad, sino planear sobre las cosas desde lo alto, no tener pesos en el corazón.',
      en: 'Take life lightly, for lightness is not superficiality, but gliding over things from above, not having boulders on your heart.',
    },
    prompt: {
      es: '¿Qué gravedad innecesaria le estás cargando a la tarea que tenés por delante?',
      en: 'What unnecessary solemnity are you projecting onto the task ahead?',
    },
  },
  {
    id: 'woolf-cuarto-propio',
    theme: 'obra',
    author: 'Virginia Woolf',
    work: { es: 'Un cuarto propio', en: 'A Room of One’s Own' },
    text: {
      es: 'Escribir lo que uno desea es lo único que importa; y si durará o no a través de los siglos, a nadie le incumbe.',
      en: 'To write what one desires is all that matters; and whether it will endure through the centuries or not, is no one’s business.',
    },
    prompt: {
      es: 'Hacé tu trabajo hoy por la verdad del acto, sin medir la aprobación ajena.',
      en: 'Do your work today for the truth of the act, without calculating external approval.',
    },
  },
  {
    id: 'epicteto-control',
    theme: 'voluntad',
    author: 'Epicteto',
    work: { es: 'Manual de vida', en: 'Enchiridion' },
    text: {
      es: 'De las cosas que existen, unas dependen de nosotros y otras no. Centrate exclusivamente en aquellas que podés gobernar.',
      en: 'Some things are in our control and others not. Focus entirely upon what you have power to govern.',
    },
    prompt: {
      es: 'Identificá qué parte de tu preocupación depende 100% de vos y soltá el resto.',
      en: 'Identify which fraction of your concern is within your hands, and release the rest.',
    },
  },
  {
    id: 'cortazar-rayuela',
    theme: 'memoria',
    author: 'Julio Cortázar',
    work: { es: 'Rayuela', en: 'Hopscotch' },
    text: {
      es: 'Andábamos sin buscarnos pero sabiendo que andábamos para encontrarnos.',
      en: 'We walked without looking for each other, but knowing that we walked to meet.',
    },
    prompt: {
      es: 'Dejá un margen de azar en tu planificación de hoy. No todo debe estar blindado.',
      en: 'Leave room for serendipity in today’s plan. Not every hour must be armored.',
    },
  },
  {
    id: 'camus-sisifo',
    theme: 'voluntad',
    author: 'Albert Camus',
    work: { es: 'El mito de Sísifo', en: 'The Myth of Sisyphus' },
    text: {
      es: 'La lucha hacia las cumbres basta para llenar el corazón de un hombre. Hay que imaginarse a Sísifo dichoso.',
      en: 'The struggle itself towards the heights is enough to fill a man’s heart. One must imagine Sisyphus happy.',
    },
    prompt: {
      es: 'Encontrá goce en la repetición del esfuerzo diario, no sólo en la meta final.',
      en: 'Find joy in the repetition of daily effort, not only in the finish line.',
    },
  },
  {
    id: 'kafka-cuadernos',
    theme: 'silencio',
    author: 'Franz Kafka',
    work: { es: 'Aforismos de Zürau', en: 'The Zürau Aphorisms' },
    text: {
      es: 'No necesitas salir de tu habitación. Quédate sentado a tu mesa y escucha. Ni siquiera escuches, sólo espera. El mundo se te ofrecerá libremente.',
      en: 'You do not need to leave your room. Remain sitting at your table and listen. Do not even listen, simply wait. The world will freely offer itself to you.',
    },
    prompt: {
      es: 'Antes de abrir otra pestaña, regalate sesenta segundos de silencio absoluto.',
      en: 'Before opening another browser tab, give yourself sixty seconds of unhurried silence.',
    },
  },
  {
    id: 'machado-camino',
    theme: 'obra',
    author: 'Antonio Machado',
    work: { es: 'Proverbios y cantares', en: 'Proverbs and Songs' },
    text: {
      es: 'Caminante, no hay camino, se hace camino al andar. Al andar se hace camino y al volver la vista atrás se ve la senda que nunca se ha de volver a pisar.',
      en: 'Traveler, there is no path, the path is made by walking. By walking you make the path, and looking back you see the path you will never step upon again.',
    },
    prompt: {
      es: 'El plan es una hipótesis; la realidad se construye con el primer paso de hoy.',
      en: 'The plan is a hypothesis; reality is constructed with your first step today.',
    },
  },
]

/**
 * Returns a simple 32-bit hash code from a string.
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Resolves a deterministic daily thought based on the dayKey (e.g. "2026-09-21").
 */
export function getDailyThought(dayKey: string, locale: 'es' | 'en' = 'es'): DailyThought {
  const lang = locale.startsWith('en') ? 'en' : 'es'
  const index = hashString(dayKey) % THOUGHTS_ANTHOLOGY.length
  const seed = THOUGHTS_ANTHOLOGY[index] ?? THOUGHTS_ANTHOLOGY[0]!

  return {
    id: `${seed.id}-${dayKey}`,
    text: seed.text[lang],
    author: seed.author,
    work: seed.work[lang],
    theme: seed.theme,
    reflectionPrompt: seed.prompt[lang],
    source: 'curated',
  }
}

/**
 * Returns a randomized thought from the curated anthology.
 */
export function getRandomCuratedThought(
  excludeId?: string,
  locale: 'es' | 'en' = 'es',
): DailyThought {
  const lang = locale.startsWith('en') ? 'en' : 'es'
  const candidates = THOUGHTS_ANTHOLOGY.filter((t) => t.id !== excludeId)
  const pool = candidates.length > 0 ? candidates : THOUGHTS_ANTHOLOGY
  const randomSeed = pool[Math.floor(Math.random() * pool.length)] ?? THOUGHTS_ANTHOLOGY[0]!

  return {
    id: `${randomSeed.id}-${Date.now()}`,
    text: randomSeed.text[lang],
    author: randomSeed.author,
    work: randomSeed.work[lang],
    theme: randomSeed.theme,
    reflectionPrompt: randomSeed.prompt[lang],
    source: 'curated',
  }
}

/**
 * Attempts to fetch a philosophical or literary quote from a public endpoint,
 * with graceful fallback to the local anthology if offline or if the API fails.
 */
export async function fetchRemoteThought(
  currentLocale: 'es' | 'en' = 'es',
): Promise<DailyThought> {
  const lang = currentLocale.startsWith('en') ? 'en' : 'es'

  try {
    // Attempt open stoic/quotes API with a short timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2600)

    const res = await fetch('https://dummyjson.com/quotes/random', {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (data && typeof data.quote === 'string' && typeof data.author === 'string') {
        const theme: ThoughtTheme = 'perspectiva'
        return {
          id: `remote-${data.id ?? Date.now()}`,
          text: data.quote,
          author: data.author,
          work: lang === 'es' ? 'Pensamiento clásico' : 'Philosophical excerpt',
          theme,
          reflectionPrompt:
            lang === 'es'
              ? '¿Cómo ilumina esta idea la tarea o decisión que tenés por delante hoy?'
              : 'How does this idea illuminate the task or decision before you today?',
          source: 'remote',
        }
      }
    }
  } catch {
    // Ignore network failures and fall back seamlessly
  }

  // Fallback to random curated thought
  return getRandomCuratedThought(undefined, currentLocale)
}
