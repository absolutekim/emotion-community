import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { createDiary, fetchDiaries, type DiaryResponse } from './api/diaries.ts'
import DiaryListSection from './DiaryListSection.tsx'
import type { UserResponse } from './api/auth.ts'

type DiaryPageProps = {
  authUser: UserResponse | null
  registerClear: (fn: () => void) => void
}

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

export default function DiaryPage({ authUser, registerClear }: DiaryPageProps) {
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

  useEffect(() => {
    registerClear(clearDiary)
  }, [clearDiary, registerClear])

  useEffect(() => {
    listOwnerRef.current = authUser?.id ?? null
    setDiaries([])
    if (authUser) {
      void loadDiariesForUser(authUser.id)
    }
  }, [authUser, loadDiariesForUser])

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
    <main className="app-main-inner">
      <h1 className="page-title">일기 쓰기</h1>
      <div className="card card--composer">
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="diary-content">
            일기 내용
          </label>
          <textarea
            id="diary-content"
            className="field"
            value={content}
            onChange={handleContentChange}
            rows={8}
            placeholder="오늘 있었던 일을 편하게 적어 보세요."
          />
          {resultVisible && emotion && (
            <p className="emotion-result" aria-live="polite">
              대표 감정: {emotion}
            </p>
          )}
          {error && (
            <p className="alert alert--error" role="alert">
              {error}
            </p>
          )}
          {authUser && (
            <p className="composer-hint status-muted">
              <strong className="composer-hint__label">대표 감정 확인</strong>은 저장 없이 미리보기,
              <strong className="composer-hint__label"> 분석하고 저장</strong>은 내 일기에 남겨요.
            </p>
          )}
          <div className="btn-row">
            {authUser ? (
              <>
                <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={!canSave}>
                  {saving ? '저장 중…' : '분석하고 저장'}
                </button>
                <button type="submit" className="btn btn-secondary" disabled={!canAnalyze}>
                  {loading ? '분석 중…' : '대표 감정 확인'}
                </button>
              </>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={!canAnalyze}>
                {loading ? '분석 중…' : '대표 감정 확인'}
              </button>
            )}
          </div>
        </form>
      </div>

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