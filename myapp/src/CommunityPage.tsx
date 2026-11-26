import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { createCommunityPost, fetchCommunityPosts, type CommunityPostResponse } from './api/community.ts'
import CommunityPostListSection from './CommunityPostListSection.tsx'
import type { UserResponse } from './api/auth.ts'

type CommunityPageProps = {
  authUser: UserResponse | null
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
  const listOwnerRef = useRef<number | null>(null)

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
    listOwnerRef.current = authUser?.id ?? null
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
    <main className="app-main-inner">
      <h1 className="page-title">커뮤니티</h1>

      <section className="card community-feed">
        <h2 className="section-title">공개 글</h2>
        {listLoading && <p className="status-muted">목록을 불러오는 중…</p>}
        {listError && (
          <p className="alert alert--error" role="alert">
            {listError}
          </p>
        )}
        {!listLoading && !listError && posts.length === 0 && (
          <p className="empty-state">아직 공개 글이 없습니다.</p>
        )}
        {!listLoading && !listError && posts.length > 0 && (
          <CommunityPostListSection
            posts={posts}
            authUser={authUser}
            listOwnerRef={listOwnerRef}
            onPostUpdated={(post) => {
              setPosts((prev) => prev.map((item) => (item.id === post.id ? post : item)))
            }}
            onPostRemoved={(id) => {
              setPosts((prev) => prev.filter((item) => item.id !== id))
            }}
            onAuthCleared={() => {
              listOwnerRef.current = null
            }}
          />
        )}
      </section>

      {authUser ? (
        <form className="card card--composer" onSubmit={(e) => void handleSubmit(e)}>
          <h2 className="section-title">글 올리기</h2>
          <label className="field-label" htmlFor="community-title">
            제목
          </label>
          <input
            id="community-title"
            className="field"
            type="text"
            maxLength={200}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setFormError(null)
            }}
            disabled={submitting}
          />
          <label className="field-label" htmlFor="community-body">
            본문
          </label>
          <textarea
            id="community-body"
            className="field"
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              setFormError(null)
            }}
            rows={6}
            disabled={submitting}
          />
          {formError && (
            <p className="alert alert--error" role="alert">
              {formError}
            </p>
          )}
          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={submitting || !title.trim() || !body.trim()}>
              {submitting ? '올리는 중…' : '공개 글 올리기'}
            </button>
          </div>
        </form>
      ) : (
        <p className="community-hint">공개 글을 올리려면 로그인해 주세요.</p>
      )}
    </main>
  )
}