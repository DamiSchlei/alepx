import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from './Avatar'
import { Field, Input } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { renameCharacter, setCharacterLocale } from '@/data/actions'
import { useAleph } from '@/data/store'
import type { Locale } from '@/domain/types'

/**
 * Avatar del pill:
 * Sheet con nombre e idioma. No editor de cara gigante.
 */
export function CustomizeSheet({
  open,
  onClose,
  pulseKey,
}: {
  open: boolean
  onClose: () => void
  pulseKey?: number
}) {
  const { i18n } = useTranslation()
  const { character } = useAleph()
  const [name, setName] = useState(character.name)

  const handleLanguageChange = (loc: Locale) => {
    setCharacterLocale(loc)
    i18n.changeLanguage(loc === 'en' ? 'en' : 'es')
  }

  return (
    <Sheet open={open} onClose={onClose} title="Tu perfil">
      <div className="flex flex-col gap-5 pt-2 pb-6">
        {/* Avatar sutil */}
        <div className="flex items-center gap-3.5 rounded-[16px] border border-line bg-subtle p-3.5">
          <div className="size-14 overflow-hidden rounded-full ring-2 ring-line-strong">
            <Avatar avatar={character.avatar} size={56} pulseKey={pulseKey} className="rounded-full" />
          </div>
          <div>
            <p className="text-[16px] font-bold text-ink">{character.name || 'Sin nombre'}</p>
            <p className="text-[13px] text-ink-3">Aleph · Tablero de tu obra</p>
          </div>
        </div>

        {/* Campo Nombre */}
        <Field label="Nombre">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => renameCharacter(name)}
            placeholder="Cómo te llamamos"
            className="h-11 rounded-[12px]"
          />
        </Field>

        {/* Selector de idioma: Español / English */}
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-ink-2">
            Idioma
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleLanguageChange('es')}
              className={`flex h-11 items-center justify-center rounded-[12px] border text-[14px] font-medium transition-all active:scale-95 ${
                character.locale === 'es'
                  ? 'border-[#7a3fe0] bg-[#f5f0ff] font-semibold text-[#7a3fe0]'
                  : 'border-line bg-white text-ink-2 hover:border-line-strong'
              }`}
            >
              Español
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`flex h-11 items-center justify-center rounded-[12px] border text-[14px] font-medium transition-all active:scale-95 ${
                character.locale === 'en'
                  ? 'border-[#7a3fe0] bg-[#f5f0ff] font-semibold text-[#7a3fe0]'
                  : 'border-line bg-white text-ink-2 hover:border-line-strong'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
