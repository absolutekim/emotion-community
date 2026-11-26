import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'

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
  const [content, setContent] = useState('')
  const [resultVisible, setResultVisible] = useState(false)
  const [emotion, setEmotion] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contentRevisionRef = useRef(0)

  const trimmed = content.trim()
  const canSubmit = trimmed.length > 0 && !loading

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value)
    setResultVisible(false)
    setEmotion(null)
    setError(null)
    setLoading(false)
    contentRevisionRef.current += 1
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmed || loading) return

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
        setError('감정 분석에 실패했습니다. 다시 시도해 주세요.')
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

  return (
    <main style={{ maxWidth: '32rem', margin: '2rem auto', padding: '0 1rem' }}>
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
        <button type="submit" disabled={!canSubmit}>
          {loading ? '분석 중…' : '대표 감정 확인'}
        </button>
      </form>
      {error && (
        <p role="alert" style={{ marginTop: '1rem', color: 'crimson' }}>
          {error}
        </p>
      )}
      {resultVisible && emotion && (
        <p aria-live="polite" style={{ marginTop: '1.5rem' }}>
          대표 감정: {emotion} (예시)
        </p>
      )}
    </main>
  )
}