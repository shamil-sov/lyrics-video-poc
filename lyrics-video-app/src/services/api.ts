import type {
  LyricsVideoInsightsResponse,
  LyricsVideoProviderReview,
  LyricsVideoJob,
  LyricsVideoListResponse,
  ProviderReviewStatus,
  TriggerResponse,
} from '@/types/lyricsVideo'

export type ReviewProvider = 'openai' | 'google-cloud'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bl-uat-fn-video-previews.azurewebsites.net/api'

interface UploadUrlResponse {
  jobId: string
  uploadUrl: string
  blobUrl: string
  expiresOn: string
}

interface GenreUpdateResponse {
  genreSlug: string
  genreName: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`
  const response = await fetch(url, options)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`API error ${response.status}: ${text || response.statusText}`)
  }
  return response.json()
}

async function requestVoid(path: string, options?: RequestInit): Promise<void> {
  const url = `${BASE_URL}${path}`
  const response = await fetch(url, options)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`API error ${response.status}: ${text || response.statusText}`)
  }
}

export async function triggerGeneration(trackUrl: string): Promise<TriggerResponse> {
  return request<TriggerResponse>('/lyrics-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackUrl }),
  })
}

export async function triggerFromFile(file: File): Promise<TriggerResponse> {
  const fileName = file.name || 'audio.bin'
  const params = new URLSearchParams({ fileName })
  const upload = await request<UploadUrlResponse>(`/lyrics-video/upload-url?${params.toString()}`, {
    method: 'POST',
  })

  const uploadResponse = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text().catch(() => '')
    throw new Error(`Blob upload failed ${uploadResponse.status}: ${text || uploadResponse.statusText}`)
  }

  return request<TriggerResponse>(`/lyrics-video/from-upload/${upload.jobId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blobUrl: upload.blobUrl }),
  })
}

export async function getAllJobs(): Promise<LyricsVideoListResponse> {
  return request<LyricsVideoListResponse>('/lyrics-videos')
}

export async function getInsights(): Promise<LyricsVideoInsightsResponse> {
  return request<LyricsVideoInsightsResponse>('/lyrics-videos/insights')
}

export async function getJobById(jobId: string): Promise<LyricsVideoJob> {
  return request<LyricsVideoJob>(`/lyrics-video/${jobId}`)
}

export async function deleteJob(jobId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/lyrics-video/${jobId}`, {
    method: 'DELETE',
  })
}

export async function updateGenre(
  jobId: string,
  payload: { genreSlug: string },
): Promise<GenreUpdateResponse> {
  return request<GenreUpdateResponse>(`/lyrics-video/${jobId}/genre`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function setProviderReview(
  jobId: string,
  provider: ReviewProvider,
  payload: { status: ProviderReviewStatus; text?: string },
): Promise<LyricsVideoProviderReview> {
  return request<LyricsVideoProviderReview>(`/lyrics-video/${jobId}/approval/${provider}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function clearProviderReview(jobId: string, provider: ReviewProvider): Promise<void> {
  await requestVoid(`/lyrics-video/${jobId}/approval/${provider}`, {
    method: 'DELETE',
  })
}
