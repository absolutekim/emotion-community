import { useCallback, useRef, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, Link } from 'react-router-dom'
import AuthSection from './AuthSection.tsx'
import CommunityPage from './CommunityPage.tsx'
import DiaryPage from './DiaryPage.tsx'
import HomePage from './HomePage.tsx'
import type { UserResponse } from './api/auth.ts'
import './app-layout.css'

export default function App() {
  const [authUser, setAuthUser] = useState<UserResponse | null>(null)
  const clearDiaryRef = useRef<(() => void) | null>(null)

  const handleAuthChange = useCallback((user: UserResponse | null) => {
    setAuthUser(user)
  }, [])

  const handleLogoutSuccess = useCallback(() => {
    clearDiaryRef.current?.()
  }, [])

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header__row">
            <Link to="/" className="app-header__brand">
              Emotion Community
            </Link>
            <nav className="app-tabs" aria-label="주요 메뉴">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `app-tab${isActive ? ' app-tab--active' : ''}`}
              >
                홈
              </NavLink>
              <NavLink
                to="/mypage"
                className={({ isActive }) => `app-tab${isActive ? ' app-tab--active' : ''}`}
              >
                마이페이지
              </NavLink>
              <NavLink
                to="/community"
                className={({ isActive }) => `app-tab${isActive ? ' app-tab--active' : ''}`}
              >
                커뮤니티
              </NavLink>
            </nav>
            <div className="app-header__auth-block">
              <AuthSection onLogoutSuccess={handleLogoutSuccess} onAuthChange={handleAuthChange} />
            </div>
          </div>
        </header>
        <div className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/mypage"
              element={
                <DiaryPage
                  authUser={authUser}
                  registerClear={(fn) => {
                    clearDiaryRef.current = fn
                  }}
                />
              }
            />
            <Route path="/community" element={<CommunityPage authUser={authUser} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}