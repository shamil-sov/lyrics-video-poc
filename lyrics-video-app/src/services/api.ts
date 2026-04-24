import type { LyricsVideoJob, TriggerResponse } from '@/types/lyricsVideo'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bl-uat-fn-video-previews.azurewebsites.net/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`
  const response = await fetch(url, options)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`API error ${response.status}: ${text || response.statusText}`)
  }
  return response.json()
}

export async function triggerGeneration(trackUrl: string): Promise<TriggerResponse> {
  return request<TriggerResponse>('/lyrics-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackUrl }),
  })
}

export async function triggerFromFile(file: File): Promise<TriggerResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return request<TriggerResponse>('/lyrics-video/from-file', {
    method: 'POST',
    body: formData,
  })
}

export async function getAllJobs(): Promise<LyricsVideoJob[]> {
  const data = await request<{ items: LyricsVideoJob[] }>('/lyrics-videos')
  return data.items
}

export async function getJobById(jobId: string): Promise<LyricsVideoJob> {
  return request<LyricsVideoJob>(`/lyrics-video/${jobId}`)
}
