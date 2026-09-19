import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { cx } from '@/components/ui/primitives'
import { renameCharacter, setCharacterLocale } from '@/data/actions'
import { useAleph } from '@/data/store'
import { applyLocale } from '@/i18n'
import type { Locale } from '@/domain/types'

export function OnboardingCharacterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { character } = useAleph()
  const [name, setName] = useState(character.name === 'Aleph' ? '' : character.name)
  const [locale, setLocale] = useState<Locale>(character.locale)

  const canContinue = name.trim().length > 0

  const selectLocale = (nextLocale: Locale) => {
    setLocale(nextLocale)
    applyLocale(nextLocale)
    setCharacterLocale(nextLocale)
  }

  const confirm = () => {
    if (!canContinue) return
    renameCharacter(name.trim())
    setCharacterLocale(locale)
    applyLocale(locale)
    navigate('/onboarding/result')
  }

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div>
        {/* Top bar with indicator */}
        <header className="flex min-h-[44px] items-center justify-between">
          <div className="w-12" aria-hidden="true" />
          <span className="text-[13px] font-medium text-ink-3">1 / 3</span>
        </header>

        {/* Title & subtitle */}
        <div className="mt-4 space-y-2">
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-ink">
            {t('onboarding.character.title', 'Cómo te llamamos')}
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-3">
            {t('onboarding.character.subtitle', 'Aleph es el tablero de tu obra. Primero, un nombre.')}
          </p>
        </div>

        {/* Avatar 88px centrado (simple, no editor) */}
        <div className="my-7 flex justify-center">
          <div className="flex size-[88px] items-center justify-center overflow-hidden rounded-[16px] border border-line bg-subtle">
            <Avatar avatar={character.avatar} size={74} className="pointer-events-none scale-95" />
          </div>
        </div>

        {/* Primary input & language toggle */}
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('onboarding.character.namePlaceholder', 'Tu nombre o alias')}
              autoFocus
              className="h-12 w-full rounded-[16px] border border-line bg-white px-4 text-[15px] text-ink placeholder:text-ink-4 outline-none transition-all focus:border-[#7a3fe0] focus:ring-2 focus:ring-[#7a3fe0]/15"
            />
          </label>

          {/* Dos opciones de idioma: Español / English */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => selectLocale('es')}
              className={cx(
                'flex h-11 min-h-[44px] items-center justify-center rounded-[16px] border text-[14px] font-medium transition-colors',
                locale === 'es'
                  ? 'border-[#7a3fe0] bg-[#f5f0ff] text-[#7a3fe0]'
                  : 'border-line bg-white text-ink-2 hover:border-line-strong',
              )}
            >
              Español
            </button>
            <button
              type="button"
              onClick={() => selectLocale('en')}
              className={cx(
                'flex h-11 min-h-[44px] items-center justify-center rounded-[16px] border text-[14px] font-medium transition-colors',
                locale === 'en'
                  ? 'border-[#7a3fe0] bg-[#f5f0ff] text-[#7a3fe0]'
                  : 'border-line bg-white text-ink-2 hover:border-line-strong',
              )}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* CTA inferior fijo 44px */}
      <div className="sticky bottom-0 left-0 right-0 mt-8 bg-white/95 pb-2 pt-4 backdrop-blur-xs">
        <button
          type="button"
          disabled={!canContinue}
          onClick={confirm}
          className="flex h-[44px] min-h-[44px] w-full items-center justify-center rounded-[16px] bg-[#7a3fe0] text-[15px] font-medium text-white transition-all hover:bg-[#6c35cc] active:bg-[#5f2cb8] disabled:cursor-not-allowed disabled:opacity-35"
        >
          {t('onboarding.character.cta', 'Seguir')}
        </button>
      </div>
    </div>
  )
}

