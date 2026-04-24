import { ref, onUnmounted } from 'vue'
import type { LyricsVideoJob } from '@/types/lyricsVideo'
import { isJobComplete } from '@/types/lyricsVideo'
import { getAllJobs, triggerGeneration } from '@/services/api'

const POLL_INTERVAL_MS = 5000

export function useLyricsJobs() {
  const jobs = ref<LyricsVideoJob[]>([])
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)

  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function fetchJobs() {
    try {
      jobs.value = await getAllJobs()
      error.value = null
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch jobs'
    }
  }

  async function loadJobs() {
    loading.value = true
    await fetchJobs()
    loading.value = false
    managePoll()
  }

  async function submitJob(trackUrl: string) {
    submitting.value = true
    error.value = null
    try {
      await triggerGeneration(trackUrl)
      await fetchJobs()
      managePoll()
    } catch (e: any) {
      error.value = e.message || 'Failed to submit job'
    } finally {
      submitting.value = false
    }
  }

  function managePoll() {
    const hasActiveJobs = jobs.value.some(j => !isJobComplete(j))
    if (hasActiveJobs && !pollTimer) {
      pollTimer = setInterval(async () => {
        await fetchJobs()
        if (!jobs.value.some(j => !isJobComplete(j))) {
          stopPoll()
        }
      }, POLL_INTERVAL_MS)
    } else if (!hasActiveJobs && pollTimer) {
      stopPoll()
    }
  }

  function stopPoll() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  onUnmounted(stopPoll)

  return {
    jobs,
    loading,
    submitting,
    error,
    loadJobs,
    submitJob,
  }
}
