import { useState, type ChangeEvent, type MutableRefObject } from 'react'
import { deleteDiary, updateDiary, type DiaryResponse } from './api/diaries.ts'

type DiaryListSectionProps = {
  diaries: DiaryResponse[]
  listLoading: boolean
  listOwnerRef: MutableRefObject<number | null>
  onDiaryUpdated: (entry: DiaryResponse) => void
  onDiaryRemoved: (id: number) => void
  onAuthCleared: () => void
}

function formatCreatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return date.toLocaleString('ko-KR')
}

export default function DiaryListSection({
  diaries,
  listLoading,
  listOwnerRef,
  onDiaryUpdated,
  onDiaryRemoved,
  onAuthCleared,
}: DiaryListSectionProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function cancelEdit() {
    setEditingId(null)
    setEditContent('')
    setEditError(null)
    setEditSaving(false)
  }

  function startEdit(entry: DiaryResponse) {
    setEditingId(entry.id)
    setEditContent(entry.content)
    setEditError(null)
  }

  async function handleEditSave(entryId: number) {
    if (editSaving) return
    const trimmed = editContent.trim()
    if (!trimmed) {
      setEditError('일기 내용을 입력해 주세요.')
      return
    }

    const ownerAtStart = listOwnerRef.current
    if (ownerAtStart === null) {
      onAuthCleared()
      return
    }

    setEditSaving(true)
    setEditError(null)

    const result = await updateDiary(entryId, trimmed)
    setEditSaving(false)

    if (listOwnerRef.current !== ownerAtStart) {
      return
    }

    if (!result.ok) {
      setEditError(result.message ?? '일기 수정에 실패했습니다.')
      return
    }

    onDiaryUpdated(result.data)
    cancelEdit()
  }

  async function handleDelete(entryId: number) {
    if (deletingId !== null) return
    if (!window.confirm('이 일기를 삭제할까요?')) {
      return
    }

    const ownerAtStart = listOwnerRef.current
    if (ownerAtStart === null) {
      onAuthCleared()
      return
    }

    setDeletingId(entryId)
    setEditError(null)

    const result = await deleteDiary(entryId)
    setDeletingId(null)

    if (listOwnerRef.current !== ownerAtStart) {
      return
    }

    if (!result.ok) {
      setEditError(result.message ?? '일기 삭제에 실패했습니다.')
      return
    }

    if (editingId === entryId) {
      cancelEdit()
    }
    onDiaryRemoved(entryId)
  }

  return (
    <section className="card">
      <h2 className="section-title">저장한 일기</h2>
      {editError && editingId === null && (
        <p className="alert alert--error" role="alert">
          {editError}
        </p>
      )}
      {listLoading && <p className="status-muted">목록을 불러오는 중…</p>}
      {!listLoading && diaries.length === 0 && (
        <p className="empty-state">저장된 일기가 없습니다.</p>
      )}
      <ul className="diary-list">
        {diaries.map((entry) => (
          <li key={entry.id} className="diary-item">
            <div className="item-meta">
              {editingId === entry.id ? (
                <span className="emotion-badge">편집 중</span>
              ) : (
                <span className="emotion-badge">{entry.emotion}</span>
              )}
              <time className="item-date" dateTime={entry.createdAt}>
                {formatCreatedAt(entry.createdAt)}
              </time>
            </div>

            {editingId === entry.id ? (
              <>
                <textarea
                  id={`edit-${entry.id}`}
                  className="field"
                  aria-label="일기 본문 수정"
                  value={editContent}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                    setEditContent(event.target.value)
                    setEditError(null)
                  }}
                  rows={6}
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
                    onClick={() => void handleEditSave(entry.id)}
                    disabled={editSaving || editContent.trim().length === 0}
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
                <p className="item-body">{entry.content}</p>
                <div className="btn-row btn-row--start">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => startEdit(entry)}
                    disabled={deletingId !== null || editingId !== null}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void handleDelete(entry.id)}
                    disabled={deletingId === entry.id || editingId !== null}
                  >
                    {deletingId === entry.id ? '삭제 중…' : '삭제'}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}