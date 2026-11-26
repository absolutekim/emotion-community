import { useEffect, useState, type ChangeEvent, type MutableRefObject } from 'react'
import {
  deleteCommunityPost,
  updateCommunityPost,
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
  }, [authUser?.id])

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
  }

  const isOwnPost = (post: CommunityPostResponse) =>
    authUser !== null && post.authorLoginId === authUser.loginId

  return (
    <>
      {editError && editingId === null && (
        <p className="alert alert--error" role="alert">
          {editError}
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