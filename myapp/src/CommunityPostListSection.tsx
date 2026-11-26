import { useEffect, useState, type ChangeEvent, type MutableRefObject } from 'react'
import {
  createCommunityPostComment,
  deleteCommunityPost,
  deleteCommunityPostComment,
  fetchCommunityPostComments,
  updateCommunityPost,
  type CommunityPostCommentResponse,
  type CommunityPostResponse,
} from './api/community.ts'
import type { UserResponse } from './api/auth.ts'

type CommunityPostListSectionProps = {
  posts: CommunityPostResponse[]
  authUser: UserResponse | null
  listOwnerRef: MutableRefObject<number | null>
  onPostUpdated: (post: CommunityPostResponse) => void
  onPostRemoved: (id: number) => void
  onAuthCleared: () => void
}

function formatCreatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return date.toLocaleString('ko-KR')
}

export default function CommunityPostListSection({
  posts,
  authUser,
  listOwnerRef,
  onPostUpdated,
  onPostRemoved,
  onAuthCleared,
}: CommunityPostListSectionProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<number | null>(null)
  const [commentsByPostId, setCommentsByPostId] = useState<Record<number, CommunityPostCommentResponse[]>>({})
  const [commentsLoadingPostId, setCommentsLoadingPostId] = useState<number | null>(null)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [commentDraftByPostId, setCommentDraftByPostId] = useState<Record<number, string>>({})
  const [commentSubmittingPostId, setCommentSubmittingPostId] = useState<number | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)

  function cancelEdit() {
    setEditingId(null)
    setEditTitle('')
    setEditBody('')
    setEditError(null)
    setEditSaving(false)
  }

  useEffect(() => {
    cancelEdit()
    setDeletingId(null)
    setExpandedCommentsPostId(null)
    setCommentsByPostId({})
    setCommentsLoadingPostId(null)
    setCommentsError(null)
    setCommentDraftByPostId({})
    setCommentSubmittingPostId(null)
    setDeletingCommentId(null)
  }, [authUser?.id])

  async function loadComments(postId: number) {
    setCommentsLoadingPostId(postId)
    setCommentsError(null)
    try {
      const list = await fetchCommunityPostComments(postId)
      setCommentsByPostId((prev) => ({ ...prev, [postId]: list }))
    } catch {
      setCommentsError('댓글을 불러오지 못했습니다.')
    } finally {
      setCommentsLoadingPostId(null)
    }
  }

  async function toggleComments(postId: number) {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null)
      setCommentsError(null)
      return
    }
    setExpandedCommentsPostId(postId)
    if (!(postId in commentsByPostId)) {
      await loadComments(postId)
    }
  }

  async function handleCommentSubmit(postId: number) {
    if (commentSubmittingPostId !== null) return
    const draft = (commentDraftByPostId[postId] ?? '').trim()
    if (!draft) return

    const ownerAtStart = listOwnerRef.current
    if (ownerAtStart === null) {
      onAuthCleared()
      return
    }

    setCommentSubmittingPostId(postId)
    setCommentsError(null)

    const result = await createCommunityPostComment(postId, draft)
    setCommentSubmittingPostId(null)

    if (listOwnerRef.current !== ownerAtStart) {
      return
    }

    if (!result.ok) {
      setCommentsError(result.message ?? '댓글 작성에 실패했습니다.')
      return
    }

    setCommentDraftByPostId((prev) => ({ ...prev, [postId]: '' }))
    setCommentsByPostId((prev) => {
      const existing = prev[postId] ?? []
      return { ...prev, [postId]: [...existing, result.data] }
    })
  }

  async function handleCommentDelete(commentId: number, postId: number) {
    if (deletingCommentId !== null) return
    if (!window.confirm('이 댓글을 삭제할까요?')) {
      return
    }

    const ownerAtStart = listOwnerRef.current
    if (ownerAtStart === null) {
      onAuthCleared()
      return
    }

    setDeletingCommentId(commentId)
    setCommentsError(null)

    const result = await deleteCommunityPostComment(commentId)
    setDeletingCommentId(null)

    if (listOwnerRef.current !== ownerAtStart) {
      return
    }

    if (!result.ok) {
      setCommentsError(result.message ?? '댓글 삭제에 실패했습니다.')
      return
    }

    setCommentsByPostId((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? []).filter((c) => c.id !== commentId),
    }))
  }

  function startEdit(post: CommunityPostResponse) {
    setEditingId(post.id)
    setEditTitle(post.title)
    setEditBody(post.body)
    setEditError(null)
  }

  async function handleEditSave(postId: number) {
    if (editSaving) return
    const trimmedTitle = editTitle.trim()
    const trimmedBody = editBody.trim()
    if (!trimmedTitle || !trimmedBody) {
      setEditError('제목과 본문을 입력해 주세요.')
      return
    }

    const ownerAtStart = listOwnerRef.current
    if (ownerAtStart === null) {
      onAuthCleared()
      return
    }

    setEditSaving(true)
    setEditError(null)

    const result = await updateCommunityPost(postId, trimmedTitle, trimmedBody)
    setEditSaving(false)

    if (listOwnerRef.current !== ownerAtStart) {
      return
    }

    if (!result.ok) {
      setEditError(result.message ?? '게시글 수정에 실패했습니다.')
      return
    }

    onPostUpdated(result.data)
    cancelEdit()
  }

  async function handleDelete(postId: number) {
    if (deletingId !== null) return
    if (!window.confirm('이 공개 글을 삭제할까요?')) {
      return
    }

    const ownerAtStart = listOwnerRef.current
    if (ownerAtStart === null) {
      onAuthCleared()
      return
    }

    setDeletingId(postId)
    if (editingId !== postId) {
      setEditError(null)
    }

    const result = await deleteCommunityPost(postId)
    setDeletingId(null)

    if (listOwnerRef.current !== ownerAtStart) {
      return
    }

    if (!result.ok) {
      setEditError(result.message ?? '게시글 삭제에 실패했습니다.')
      return
    }

    if (editingId === postId) {
      cancelEdit()
    }
    onPostRemoved(postId)
    setCommentsByPostId((prev) => {
      const next = { ...prev }
      delete next[postId]
      return next
    })
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null)
    }
  }

  const isOwnComment = (comment: CommunityPostCommentResponse) =>
    authUser !== null && comment.authorLoginId === authUser.loginId

  const isOwnPost = (post: CommunityPostResponse) =>
    authUser !== null && post.authorLoginId === authUser.loginId

  return (
    <>
      {editError && editingId === null && (
        <p className="alert alert--error" role="alert">
          {editError}
        </p>
      )}
      {commentsError && (
        <p className="alert alert--error" role="alert">
          {commentsError}
        </p>
      )}
      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.id} className="post-item">
            {editingId === post.id ? (
              <>
                <span className="emotion-badge">편집 중</span>
                <label className="field-label" htmlFor={`edit-title-${post.id}`}>
                  제목
                </label>
                <input
                  id={`edit-title-${post.id}`}
                  className="field"
                  type="text"
                  maxLength={200}
                  value={editTitle}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setEditTitle(e.target.value)
                    setEditError(null)
                  }}
                  disabled={editSaving}
                />
                <label className="field-label" htmlFor={`edit-body-${post.id}`}>
                  본문
                </label>
                <textarea
                  id={`edit-body-${post.id}`}
                  className="field"
                  value={editBody}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                    setEditBody(e.target.value)
                    setEditError(null)
                  }}
                  rows={5}
                  disabled={editSaving}
                />
                {editError && (
                  <p className="alert alert--error" role="alert">
                    {editError}
                  </p>
                )}
                <div className="btn-row btn-row--start">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void handleEditSave(post.id)}
                    disabled={editSaving || !editTitle.trim() || !editBody.trim()}
                  >
                    {editSaving ? '저장 중…' : '저장'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cancelEdit} disabled={editSaving}>
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="post-title">{post.title}</h3>
                <p className="post-meta">
                  {post.authorLoginId} · {formatCreatedAt(post.createdAt)}
                </p>
                <p className="post-body">{post.body}</p>
                <div className="btn-row btn-row--start post-item__actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => void toggleComments(post.id)}
                    disabled={deletingId === post.id || editingId !== null}
                    aria-expanded={expandedCommentsPostId === post.id}
                  >
                    {expandedCommentsPostId === post.id ? '댓글 접기' : '댓글'}
                  </button>
                </div>
                {expandedCommentsPostId === post.id && (
                  <section className="post-comments" aria-label="댓글">
                    {commentsLoadingPostId === post.id && (
                      <p className="post-comments__status">댓글 불러오는 중…</p>
                    )}
                    {commentsLoadingPostId !== post.id && (
                      <ul className="post-comments__list">
                        {(commentsByPostId[post.id] ?? []).map((comment) => (
                          <li key={comment.id} className="post-comments__item">
                            <p className="post-comments__meta">
                              {comment.authorLoginId} · {formatCreatedAt(comment.createdAt)}
                            </p>
                            <p className="post-comments__body">{comment.body}</p>
                            {isOwnComment(comment) && (
                              <button
                                type="button"
                                className="btn btn-ghost btn--compact"
                                onClick={() => void handleCommentDelete(comment.id, post.id)}
                                disabled={deletingCommentId === comment.id}
                              >
                                {deletingCommentId === comment.id ? '삭제 중…' : '삭제'}
                              </button>
                            )}
                          </li>
                        ))}
                        {(commentsByPostId[post.id] ?? []).length === 0 && (
                          <li className="post-comments__empty">아직 댓글이 없습니다.</li>
                        )}
                      </ul>
                    )}
                    {authUser !== null && (
                      <div className="post-comments__form">
                        <label className="field-label" htmlFor={`comment-body-${post.id}`}>
                          댓글 작성
                        </label>
                        <textarea
                          id={`comment-body-${post.id}`}
                          className="field"
                          rows={3}
                          value={commentDraftByPostId[post.id] ?? ''}
                          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                            setCommentDraftByPostId((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                            setCommentsError(null)
                          }}
                          disabled={commentSubmittingPostId === post.id}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => void handleCommentSubmit(post.id)}
                          disabled={
                            commentSubmittingPostId === post.id ||
                            !(commentDraftByPostId[post.id] ?? '').trim()
                          }
                        >
                          {commentSubmittingPostId === post.id ? '등록 중…' : '댓글 등록'}
                        </button>
                      </div>
                    )}
                  </section>
                )}
                {isOwnPost(post) && (
                  <div className="btn-row btn-row--start post-item__actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => startEdit(post)}
                      disabled={deletingId !== null || editingId !== null}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void handleDelete(post.id)}
                      disabled={deletingId === post.id || editingId !== null}
                    >
                      {deletingId === post.id ? '삭제 중…' : '삭제'}
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}