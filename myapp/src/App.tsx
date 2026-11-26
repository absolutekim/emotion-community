import { useCallback, useRef, useState } from 'react'
import AuthSection from './AuthSection.tsx'
import CommunityPage from './CommunityPage.tsx'
import DiaryPage from './DiaryPage.tsx'
import type { UserResponse } from './api/auth.ts'

type AppView = 'diary' | 'community'

export default function App() {
  const [view, setView] = useState<AppView>('diary')
  const [authUser, setAuthUser] = useState<UserResponse | null>(null)
  const clearDiaryRef = useRef<(() => void) | null>(null)

  const handleAuthChange = useCallback((user: UserResponse | null) => {
    setAuthUser(user)
  }, [])

  const handleLogoutSuccess = useCallback(() => {
    clearDiaryRef.current?.()
  }, [])

  const navStyle = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    justifyContent: 'center',
    margin: '1rem 0',
  }

  return (
    <>
      <AuthSection onLogoutSuccess={handleLogoutSuccess} onAuthChange={handleAuthChange} />
      <nav style={navStyle} aria-label="주요 메뉴">
        <button
          type="button"
          onClick={() => setView('diary')}
          aria-current={view === 'diary' ? 'page' : undefined}
        >
          내 일기
        </button>
        <button
          type="button"
          onClick={() => setView('community')}
          aria-current={view === 'community' ? 'page' : undefined}
        >
          커뮤니티
        </button>
      </nav>
      {view === 'diary' ? (
        <DiaryPage authUser={authUser} registerClear={(fn) => { clearDiaryRef.current = fn }} />
      ) : (
        <CommunityPage authUser={authUser} />
      )}
    </>
  )
}