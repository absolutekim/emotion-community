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

type MutationFailure = {
  ok: false
  status: number
  message: string | null
}

type MutationSuccess<T> = {
  ok: true
  data: T
}

export type UpdateCommunityPostResult = MutationSuccess<CommunityPostResponse> | MutationFailure
export type DeleteCommunityPostResult = { ok: true } | MutationFailure

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const value = (body as { message: unknown }).message
      return typeof value === 'string' ? value : null
    }
  } catch {
    // ignore
  }
  return null
}

export async function updateCommunityPost(
  id: number,
  title: string,
  body: string,
): Promise<UpdateCommunityPostResult> {
  try {
    const csrf = await fetchCsrf()
    const response = await fetch(`/api/community/posts/${id}`, {
      method: 'PUT',
      credentials,
      headers: {
        'Content-Type': 'application/json',
        [csrf.headerName]: csrf.token,
      },
      body: JSON.stringify({ title, body }),
    })
    if (response.ok) {
      return { ok: true, data: (await response.json()) as CommunityPostResponse }
    }
    const message = await readErrorMessage(response)
    if (response.status === 400) {
      return { ok: false, status: 400, message: '제목과 본문을 입력해 주세요.' }
    }
    if (response.status === 404) {
      return { ok: false, status: 404, message: '게시글을 찾을 수 없습니다.' }
    }
    return { ok: false, status: response.status, message: message ?? '게시글 수정에 실패했습니다.' }
  } catch {
    return { ok: false, status: 0, message: '서버에 연결할 수 없습니다.' }
  }
}

export async function deleteCommunityPost(id: number): Promise<DeleteCommunityPostResult> {
  try {
    const csrf = await fetchCsrf()
    const response = await fetch(`/api/community/posts/${id}`, {
      method: 'DELETE',
      credentials,
      headers: {
        'Content-Type': 'application/json',
        [csrf.headerName]: csrf.token,
      },
    })
    if (response.status === 204) {
      return { ok: true }
    }
    const message = await readErrorMessage(response)
    if (response.status === 404) {
      return { ok: false, status: 404, message: '게시글을 찾을 수 없습니다.' }
    }
    return { ok: false, status: response.status, message: message ?? '게시글 삭제에 실패했습니다.' }
  } catch {
    return { ok: false, status: 0, message: '서버에 연결할 수 없습니다.' }
  }
}