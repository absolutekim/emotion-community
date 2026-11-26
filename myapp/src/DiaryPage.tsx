import { useCallback, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import AuthSection from './AuthSection.tsx'
import { createDiary, fetchDiaries, type DiaryResponse } from './api/diaries.ts'
import DiaryListSection from './DiaryListSection.tsx'
import type { UserResponse } from './api/auth.ts'

type AnalyzeEmotionRequest = {
  content: string
}

function parseEmotionFromResponse(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) {
    return null
  }
  if (!('emotion' in data)) {
    return null
  }
  const emotion = (data as { emotion: unknown }).emotion
  if (typeof emotion !== 'string') {
    return null
  }
  return emotion
}

export default function DiaryPage() {
  const [authUser, setAuthUser] = useState<UserResponse | null>(null)
  const [diaries, setDiaries] = useState<DiaryResponse[]>([])
  const [listLoading, setListLoading] = useState(false)

  const [content, setContent] = useState('')
  const [resultVisible, setResultVisible] = useState(false)
  const [emotion, setEmotion] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contentRevisionRef = useRef(0)
  const listOwnerRef = useRef<number | null>(null)

  const clearDiary = useCallback(() => {
    setContent('')
    setResultVisible(false)
    setEmotion(null)
    setError(null)
    setLoading(false)
    setSaving(false)
    setDiaries([])
    contentRevisionRef.current += 1
  }, [])

  const loadDiariesForUser = useCallback(async (userId: number) => {
    const ownerAtStart = userId
    listOwnerRef.current = userId
    setListLoading(true)
    setDiaries([])

    const result = await fetchDiaries()
    setListLoading(false)

    if (listOwnerRef.current !== ownerAtStart) {
      return
    }
    if (result.ok) {
      setDiaries(result.data)
    }
  }, [])

  const handleAuthChange = useCallback(
    (user: UserResponse | null) => {
      listOwnerRef.current = user?.id ?? null
      setAuthUser(user)
      setDiaries([])
      if (user) {
        void loadDiariesForUser(user.id)
      }
    },
    [loadDiariesForUser],
  )

  const trimmed = content.trim()
  const busy = loading || saving
  const canAnalyze = trimmed.length > 0 && !busy
  const canSave = trimmed.length > 0 && !busy && authUser !== null

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value)
    setResultVisible(false)
    setEmotion(null)
    setError(null)
    setLoading(false)
    setSaving(false)
    contentRevisionRef.current += 1
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmed || busy) return

    const revisionAtSubmit = contentRevisionRef.current
    setLoading(true)
    setError(null)
    setResultVisible(false)
    setEmotion(null)

    const requestBody: AnalyzeEmotionRequest = { content: trimmed }

    try {
      const response = await fetch('/api/emotions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (revisionAtSubmit !== contentRevisionRef.current) {
        return
      }

      if (!response.ok) {
        if (response.status === 503) {
          setError('감정 분석 서버를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.')
        } else {
          setError('감정 분석에 실패했습니다. 다시 시도해 주세요.')
        }
        return
      }

      const data: unknown = await response.json()

      if (revisionAtSubmit !== contentRevisionRef.current) {
        return
      }

      const parsedEmotion = parseEmotionFromResponse(data)
      if (parsedEmotion === null) {
        setError('감정 분석에 실패했습니다. 다시 시도해 주세요.')
        return
      }

      setEmotion(parsedEmotion)
      setResultVisible(true)
    } catch {
      if (revisionAtSubmit === contentRevisionRef.current) {
        setError('서버에 연결할 수 없습니다. 다시 시도해 주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!trimmed || busy || !authUser) return

    const revisionAtSave = contentRevisionRef.current
    const ownerAtSave = listOwnerRef.current
    if (ownerAtSave === null) {
      return
    }

    setSaving(true)
    setError(null)

    const result = await createDiary(trimmed)
    setSaving(false)

    if (revisionAtSave !== contentRevisionRef.current) {
      return
    }
    if (listOwnerRef.current !== ownerAtSave) {
      return
    }

    if (!result.ok) {
      setError(result.message ?? '일기 저장에 실패했습니다.')
      return
    }

    setDiaries((prev) => {
      if (prev.some((entry) => entry.id === result.data.id)) {
        return prev
      }
      return [result.data, ...prev]
    })
    setContent('')
    setResultVisible(false)
    setEmotion(null)
    contentRevisionRef.current += 1
  }

  return (
    <main style={{ maxWidth: '32rem', margin: '2rem auto', padding: '0 1rem' }}>
      <AuthSection onLogoutSuccess={clearDiary} onAuthChange={handleAuthChange} />
      <h1>오늘의 일기</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="diary-content">일기 내용</label>
        <textarea
          id="diary-content"
          value={content}
          onChange={handleContentChange}
          rows={8}
          style={{ display: 'block', width: '100%', marginTop: '0.5rem', marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
          <button type="submit" disabled={!canAnalyze}>
            {loading ? '분석 중…' : '대표 감정 확인'}
          </button>
          {authUser && (
            <button type="button" onClick={() => void handleSave()} disabled={!canSave}>
              {saving ? '저장 중…' : '분석하고 저장'}
            </button>
          )}
        </div>
      </form>
      {error && (
        <p role="alert" style={{ marginTop: '1rem', color: 'crimson' }}>
          {error}
        </p>
      )}
      {resultVisible && emotion && (
        <p aria-live="polite" style={{ marginTop: '1.5rem' }}>
          대표 감정: {emotion}
        </p>
      )}

      {authUser && (
        <DiaryListSection
          key={authUser.id}
          diaries={diaries}
          listLoading={listLoading}
          listOwnerRef={listOwnerRef}
          onDiaryUpdated={(entry) => {
            setDiaries((prev) => prev.map((item) => (item.id === entry.id ? entry : item)))
          }}
          onDiaryRemoved={(id) => {
            setDiaries((prev) => prev.filter((item) => item.id !== id))
          }}
          onAuthCleared={clearDiary}
        />
      )}
    </main>
  )
}