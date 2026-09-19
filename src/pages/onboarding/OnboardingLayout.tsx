import { Navigate, Outlet } from 'react-router-dom'
import { useAleph } from '@/data/store'

/** First-run shell without the tab bar. */
export function OnboardingLayout() {
  const { character } = useAleph()
  if (character.onboarded) return <Navigate to="/" replace />

  return (
    <div className="min-h-dvh bg-white text-ink antialiased flex flex-col">
      <main className="safe-top safe-bottom mx-auto w-full max-w-[390px] min-h-dvh flex flex-col flex-1 px-5 py-4">
        <Outlet />
      </main>
    </div>
  )
}
