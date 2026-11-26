import { fetchCsrf } from './auth.ts'

export type CommunityPostResponse = {
  id: number
  title: string
  body: string
  authorLoginId: string
  createdAt: string
}

const credentials = 'include' as const

export async function fetchCommunityPosts(): Promise<CommunityPostResponse[]> {
  const response = await fetch('/api/community/posts', { credentials })
  if (!response.ok) {
    throw new Error('community-list-failed')
  }
  return (await response.json()) as CommunityPostResponse[]
}

export type CreateCommunityPostResult =
  | { ok: true; data: CommunityPostResponse }
  | { ok: false; status: number; message: string | null }

export async function createCommunityPost(
  title: string,
  body: string,
): Promise<CreateCommunityPostResult> {
  try {
    const csrf = await fetchCsrf()
    const response = await fetch('/api/community/posts', {
      method: 'POST',
      credentials,
      headers: {
        'Content-Type': 'application/json',
        [csrf.headerName]: csrf.token,
      },
      body: JSON.stringify({ title, body }),
    })
    if (response.status === 201) {
      return { ok: true, data: (await response.json()) as CommunityPostResponse }
    }
    let message: string | null = null
    try {
      const data: unknown = await response.json()
      if (typeof data === 'object' && data !== null && 'message' in data) {
        const value = (data as { message: unknown }).message
        message = typeof value === 'string' ? value : null
      }
    } catch {
      // ignore
    }
    if (response.status === 400) {
      return { ok: false, status: 400, message: '제목과 본문을 입력해 주세요.' }
    }
    return { ok: false, status: response.status, message: message ?? '게시글 작성에 실패했습니다.' }
  } catch {
    return { ok: false, status: 0, message: '서버에 연결할 수 없습니다.' }
  }
}