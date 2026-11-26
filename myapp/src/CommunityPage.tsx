import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { createCommunityPost, fetchCommunityPosts, type CommunityPostResponse } from './api/community.ts'
import type { UserResponse } from './api/auth.ts'

type CommunityPageProps = {
  authUser: UserResponse | null
}

function formatCreatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return date.toLocaleString('ko-KR')
}

export default function CommunityPage({ authUser }: CommunityPageProps) {
  const [posts, setPosts] = useState<CommunityPostResponse[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const listRevisionRef = useRef(0)

  const loadPosts = useCallback(async () => {
    const revision = listRevisionRef.current
    setListLoading(true)
    setListError(null)
    try {
      const data = await fetchCommunityPosts()
      if (revision === listRevisionRef.current) {
        setPosts(data)
      }
    } catch {
      if (revision === listRevisionRef.current) {
        setListError('공개 글 목록을 불러올 수 없습니다.')
      }
    } finally {
      if (revision === listRevisionRef.current) {
        setListLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  useEffect(() => {
    setTitle('')
    setBody('')
    setFormError(null)
    setSubmitting(false)
  }, [authUser?.id])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!authUser || submitting) return

    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    if (!trimmedTitle || !trimmedBody) {
      setFormError('제목과 본문을 입력해 주세요.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const result = await createCommunityPost(trimmedTitle, trimmedBody)
    setSubmitting(false)

    if (!result.ok) {
      setFormError(result.message ?? '게시글 작성에 실패했습니다.')
      return
    }

    setPosts((prev) => {
      if (prev.some((post) => post.id === result.data.id)) {
        return prev
      }
      return [result.data, ...prev]
    })
    setTitle('')
    setBody('')
  }

  return (
    <main style={{ maxWidth: '32rem', margin: '2rem auto', padding: '0 1rem' }}>
      <h1>커뮤니티</h1>

      {authUser ? (
        <form onSubmit={(e) => void handleSubmit(e)} style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <label htmlFor="community-title">제목</label>
          <input
            id="community-title"
            type="text"
            maxLength={200}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setFormError(null)
            }}
            disabled={submitting}
            style={{ display: 'block', width: '100%', marginBottom: '0.75rem' }}
          />
          <label htmlFor="community-body">본문</label>
          <textarea
            id="community-body"
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              setFormError(null)
            }}
            rows={6}
            disabled={submitting}
            style={{ display: 'block', width: '100%', marginBottom: '0.75rem' }}
          />
          {formError && (
            <p role="alert" style={{ color: 'crimson' }}>
              {formError}
            </p>
          )}
          <button type="submit" disabled={submitting || !title.trim() || !body.trim()}>
            {submitting ? '올리는 중…' : '공개 글 올리기'}
          </button>
        </form>
      ) : (
        <p style={{ marginBottom: '2rem' }}>공개 글을 올리려면 로그인해 주세요.</p>
      )}

      <section style={{ textAlign: 'left' }}>
        <h2>공개 글</h2>
        {listLoading && <p>목록을 불러오는 중…</p>}
        {listError && (
          <p role="alert" style={{ color: 'crimson' }}>
            {listError}
          </p>
        )}
        {!listLoading && !listError && posts.length === 0 && <p>아직 공개 글이 없습니다.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {posts.map((post) => (
            <li
              key={post.id}
              style={{ borderTop: '1px solid var(--border)', padding: '1rem 0' }}
            >
              <p style={{ marginBottom: '0.25rem', color: 'var(--text-h)' }}>
                <strong>{post.title}</strong>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                  {post.authorLoginId} · {formatCreatedAt(post.createdAt)}
                </span>
              </p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{post.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}