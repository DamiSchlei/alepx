import express, { type Request, type Response } from 'express'
import path from 'path'
import { createServer as createViteServer } from 'vite'
import { GoogleGenAI } from '@google/genai'

const PORT = 3000

let aiClient: GoogleGenAI | null = null

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  }
  return aiClient
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AssistantContext {
  characterName: string
  characterLevel: number
  characterXp: number
  characterXpToNext: number
  characterMoney: number
  skills: Array<{ name: string; level: number; xp: number }>
  results: Array<{ id: string; name: string; progress?: number; isKey?: boolean }>
  objectives: Array<{ id: string; name: string; status: string; resultId: string }>
  todayTasks: Array<{ id: string; title: string; status: string; estimatedHours?: number; actualHours?: number; completedAt?: string }>
  plannedHours: number
  dailyHourCap: number
  recentJournalComments: Array<{ body: string; createdAt: string; originType: string }>
}

function buildSystemInstruction(ctx?: AssistantContext): string {
  let contextInfo = ''
  if (ctx) {
    const tasksSummary = ctx.todayTasks.length > 0
      ? ctx.todayTasks.map((t) => `- [${t.status === 'done' || t.status === 'closed' ? 'X' : ' '}] ${t.title} (${t.estimatedHours ?? 0.5}h)`).join('\n')
      : 'No hay tareas registradas para hoy aún.'

    const objectivesSummary = ctx.objectives.length > 0
      ? ctx.objectives.map((o) => `- [${o.status}] ${o.name}`).join('\n')
      : 'No hay objetivos activos.'

    const resultsSummary = ctx.results.length > 0
      ? ctx.results.map((r) => `- ${r.name} (${r.isKey ? 'Clave' : 'Secundario'})`).join('\n')
      : 'Sin resultados definidos.'

    const recentJournal = ctx.recentJournalComments.length > 0
      ? ctx.recentJournalComments.slice(0, 3).map((c) => `> "${c.body}" (${c.originType})`).join('\n')
      : 'Bitácora sin entradas recientes.'

    contextInfo = `
ESTADO ACTUAL DEL PERSONAJE:
- Nombre: ${ctx.characterName || 'El Personaje'}
- Nivel: ${ctx.characterLevel} (XP: ${ctx.characterXp}/${ctx.characterXpToNext})
- Monedas: ${ctx.characterMoney}
- Capacidad diaria: ${ctx.dailyHourCap} horas (planificadas hoy: ${ctx.plannedHours}h)

RESULTADOS / PROYECTOS:
${resultsSummary}

OBJETIVOS:
${objectivesSummary}

TAREAS DE HOY:
${tasksSummary}

ÚLTIMAS ENTRADAS DE BITÁCORA:
${recentJournal}
`
  }

  return `Eres el Mentor Personal y Consejero de Vida de Aleph, integrado directamente en el apartado del Personaje.
Tu misión es:
1. Dar seguimiento empático y lúcido a las tareas del usuario, ayudándole a destrabar bloqueos, evaluar su carga horaria y celebrar lo completado.
2. Impulsar al usuario hacia nuevos objetivos claros, retadores y alcanzables conectados a sus Resultados ("La Obra").
3. Brindar un espacio de Bitácora y escucha activa donde el usuario pueda hablar de sí mismo, sus emociones, dudas, virtudes y la relación entre sus tareas diarias y su visión de vida.
4. Mantener un tono sobrio, elegante, inspirador, reflexivo y cercano, acorde a la estética literaria y filosófica de Aleph.

Instrucciones de formato:
- Responde en español (o en inglés si el usuario escribe en inglés).
- Usa formato Markdown con viñetas claras y párrafos concisos.
- Al final de reflexiones importantes, puedes sugerir una pregunta reflexiva para la bitácora o una acción concreta para sus objetivos.
${contextInfo}`
}

async function startServer() {
  const app = express()

  app.use(express.json())

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash',
    })
  })

  // Chat endpoint for Personal Assistant & Journal
  app.post('/api/assistant/chat', async (req: Request, res: Response) => {
    try {
      const { messages, context } = req.body as {
        messages: ChatMessage[]
        context?: AssistantContext
      }

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages array is required' })
      }

      const ai = getAiClient()
      const systemInstruction = buildSystemInstruction(context)

      if (!ai) {
        // Fallback response if GEMINI_API_KEY is not yet attached
        const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() ?? ''
        let fallbackReply = `**Mentor de Aleph:**\n\nEstoy aquí contigo para acompañar tu camino. `

        if (lastUserMsg.includes('tarea') || lastUserMsg.includes('hoy')) {
          fallbackReply += `Veo que hoy tienes planificadas ${context?.plannedHours ?? 0} horas de tu capacidad de ${context?.dailyHourCap ?? 5} h. La clave de la obra no es la velocidad, sino la continuidad ininterrumpida.\n\n¿Cuál de tus tareas actuales representa el paso más decisivo para tu día?`
        } else if (lastUserMsg.includes('objetivo') || lastUserMsg.includes('meta')) {
          fallbackReply += `Tus objetivos son los hitos que dan forma al resultado final. Te sugiero definir un objetivo de avance tangible para esta semana que mueva la aguja en tu proyecto principal.\n\n¿Qué resultado sientes que requiere tu mayor foco ahora?`
        } else {
          fallbackReply += `La bitácora es el espejo de tu personaje: aquí reflexionamos sobre cómo cada pequeña acción se conecta con quién estás construyendo.\n\n*(Nota: Puedes conectar tu clave de Gemini API en la configuración para habilitar respuestas profundas y personalizadas en tiempo real con Gemini 3.8 Flash).*`
        }

        return res.json({ reply: fallbackReply })
      }

      // Convert messages to Gemini format: role 'user' | 'model'
      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

      let replyText = ''
      const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          })
          if (response.text) {
            replyText = response.text
            break
          }
        } catch (genErr: unknown) {
          console.warn(`Attempt with ${model} failed, trying next candidate if available:`, genErr)
          // Continue to next candidate model
        }
      }

      if (!replyText) {
        // Contextual fallback response if API is temporarily unreachable
        replyText = `**Mentor de Aleph:**\n\nEstoy aquí contigo, reflexionando sobre tu camino y tu obra. Actualmente el servicio de IA está experimentando alta demanda, pero quiero recordarte:\n\n- Tu personaje está en **Nivel ${context?.characterLevel ?? 1}** con **${context?.dailyHourCap ?? 18} horas** disponibles.\n- Tu obra no depende de un solo día acelerado, sino de la disciplina serena de cada bloque completado.\n\n¿Qué tarea u objetivo sientes que te dará mayor paz al cerrar hoy?`
      }

      return res.json({ reply: replyText })
    } catch (err: unknown) {
      console.error('Error in /api/assistant/chat:', err)
      const message = err instanceof Error ? err.message : 'Error desconocido al consultar el asistente'
      return res.status(500).json({ error: message })
    }
  })

  // Vite development middleware or production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get('*all', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`)
  })
}

startServer()
