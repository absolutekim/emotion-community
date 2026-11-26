import { fetchCsrf, type UserResponse } from './auth.ts'

export type DiaryResponse = {
  id: number
  content: string
  emotion: string
  createdAt: string
}

const credentials = 'include' as const

export type DiaryListResult =
  | { ok: true; data: DiaryResponse[] }
  | { ok: false; status: number }

export async function fetchDiaries(): Promise<DiaryListResult> {
  try {
    const response = await fetch('/api/diaries', { credentials })
    if (response.status === 401) {
      return { ok: false, status: 401 }
    }
    if (!response.ok) {
      return { ok: false, status: response.status }
    }
    return { ok: true, data: (await response.json()) as DiaryResponse[] }
  } catch {
    return { ok: false, status: 0 }
  }
}

export type CreateDiaryResult =
  | { ok: true; data: DiaryResponse }
  | { ok: false; status: number; message: string | null }

export async function createDiary(content: string): Promise<CreateDiaryResult> {
  try {
    const csrf = await fetchCsrf()
    const response = await fetch('/api/diaries', {
      method: 'POST',
      credentials,
      headers: {
        'Content-Type': 'application/json',
        [csrf.headerName]: csrf.token,
      },
      body: JSON.stringify({ content }),
    })
    if (response.status === 201) {
      return { ok: true, data: (await response.json()) as DiaryResponse }
    }
    let message: string | null = null
    try {
      const body: unknown = await response.json()
      if (typeof body === 'object' && body !== null && 'message' in body) {
        const value = (body as { message: unknown }).message
        message = typeof value === 'string' ? value : null
      }
    } catch {
      // ignore
    }
    if (response.status === 503) {
      return {
        ok: false,
        status: 503,
        message: '감정 분석 서버를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      }
    }
    if (response.status === 400) {
      return { ok: false, status: 400, message: '일기 내용을 입력해 주세요.' }
    }
    return { ok: false, status: response.status, message: message ?? '일기 저장에 실패했습니다.' }
  } catch {
    return { ok: false, status: 0, message: '서버에 연결할 수 없습니다.' }
  }
}

export type AuthUser = UserResponse