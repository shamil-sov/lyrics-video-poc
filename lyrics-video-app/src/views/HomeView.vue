<template>
  <v-container class="py-6" style="max-width: 1100px">
    <!-- Generate Section -->
    <v-card class="mb-6">
      <v-card-title class="text-h6 pb-0 pt-4 px-4">
        <v-icon class="mr-2" color="primary">mdi-video-plus</v-icon>
        Generate Lyrics Video
      </v-card-title>

      <v-tabs v-model="inputTab" color="primary" class="px-4">
        <v-tab value="url">
          <v-icon start>mdi-link</v-icon>
          Track URL
        </v-tab>
        <v-tab value="file">
          <v-icon start>mdi-upload</v-icon>
          Upload File
        </v-tab>
      </v-tabs>

      <v-card-text>
        <!-- URL Tab -->
        <v-form ref="urlForm" v-if="inputTab === 'url'" @submit.prevent="handleUrlSubmit" class="d-flex align-center ga-3">
          <v-text-field
            v-model="trackUrl"
            label="BandLab Track URL"
            placeholder="https://www.bandlab.com/post/..."
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, rules.url]"
            :disabled="submitting"
            prepend-inner-icon="mdi-link"
            class="flex-grow-1"
          />
          <v-btn
            type="submit"
            color="primary"
            size="large"
            :loading="submitting"
            :disabled="!isValidUrl"
            prepend-icon="mdi-creation"
          >
            Generate
          </v-btn>
        </v-form>

        <!-- File Upload Tab -->
        <div v-else class="d-flex align-center ga-3">
          <v-file-input
            v-model="selectedFile"
            label="Audio file"
            placeholder="Select an audio file (mp3, m4a, wav, ogg, flac...)"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            accept="audio/*"
            :disabled="submitting"
            prepend-icon=""
            prepend-inner-icon="mdi-music-box"
            class="flex-grow-1"
          />
          <v-btn
            color="primary"
            size="large"
            :loading="submitting"
            :disabled="!selectedFile"
            prepend-icon="mdi-creation"
            @click="handleFileSubmit"
          >
            Generate
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Jobs List -->
    <template v-else>
      <div class="jobs-layout" :class="{ 'jobs-layout--with-sidebar': hasGlobalScores }">
        <div class="jobs-main">
          <div class="jobs-toolbar mb-4">
            <div class="d-flex align-center ga-2 flex-wrap">
              <h2 class="text-h6">
                <v-icon class="mr-1">mdi-format-list-bulleted</v-icon>
                Jobs
              </h2>
              <v-chip size="small" color="primary" variant="tonal">
                {{ filteredJobs.length }}
              </v-chip>
              <v-chip v-if="selectedGenreFilter !== ALL_GENRES" size="small" variant="text">
                {{ jobs.length }} total
              </v-chip>
            </div>

            <div class="jobs-toolbar-actions">
              <v-select
                v-model="selectedGenreFilter"
                :items="genreFilterOptions"
                item-title="title"
                item-value="value"
                label="Filter by genre"
                variant="outlined"
                density="comfortable"
                hide-details
                class="jobs-genre-filter"
              />

              <v-btn
                variant="text"
                size="small"
                icon="mdi-refresh"
                @click="loadJobs"
                :loading="loading"
              />
            </div>
          </div>

          <div v-if="genreCounts.length" class="genre-filter-chips mb-4">
            <v-chip
              v-for="genre in genreFilterOptions"
              :key="genre.value"
              :color="selectedGenreFilter === genre.value ? 'primary' : undefined"
              :variant="selectedGenreFilter === genre.value ? 'flat' : 'tonal'"
              size="small"
              class="genre-filter-chip"
              @click="selectedGenreFilter = genre.value"
            >
              {{ genre.genreName }} ({{ genre.count }})
            </v-chip>
          </div>

          <div v-if="jobs.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="64" class="mb-4" color="grey-lighten-1">mdi-video-off-outline</v-icon>
            <p class="text-body-1">No jobs yet. Paste a track URL or upload an audio file to get started.</p>
          </div>

          <div v-else-if="filteredJobs.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="64" class="mb-4" color="grey-lighten-1">mdi-filter-outline</v-icon>
            <p class="text-body-1">No jobs match the selected genre.</p>
          </div>

          <div v-else class="d-flex flex-column ga-4">
            <JobCard
              v-for="job in filteredJobs"
              :key="job.id"
              :job="job"
              :deleting="deletingJobId === job.id"
              @remove="handleDelete"
              @genre-updated="handleGenreUpdated"
            />
          </div>
        </div>

        <aside v-if="hasGlobalScores" class="jobs-sidebar">
          <v-sheet
            class="pa-4 scores-overview"
            border
            rounded="xl"
          >
            <div class="d-flex align-center ga-2 flex-wrap mb-3">
              <v-icon color="primary">mdi-chart-box-outline</v-icon>
              <span class="text-subtitle-2 font-weight-medium">Global AI evaluation scores</span>
            </div>

            <div class="scores-overview-grid">
              <div class="scores-overview-card">
                <span class="scores-overview-label">OpenAI average</span>
                <span class="scores-overview-value">{{ formatAverage(averages?.openAiAverage) }}</span>
              </div>
              <div class="scores-overview-card">
                <span class="scores-overview-label">Google average</span>
                <span class="scores-overview-value">{{ formatAverage(averages?.googleChirpAverage) }}</span>
              </div>
              <div class="scores-overview-card">
                <span class="scores-overview-label">Evaluated jobs</span>
                <span class="scores-overview-value">{{ averages?.evaluatedCount ?? 0 }}</span>
              </div>
            </div>
          </v-sheet>
        </aside>
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useLyricsJobs } from '@/composables/useLyricsJobs'
import JobCard from '@/components/JobCard.vue'
import type { LyricsVideoJob } from '@/types/lyricsVideo'

const { jobs, averages, loading, submitting, deletingJobId, error, loadJobs, submitJob, submitFile, removeJob } = useLyricsJobs()

const ALL_GENRES = '__all__'
const NO_GENRE = '__no-genre__'

const inputTab = ref('url')
const urlForm = ref<{ resetValidation: () => void } | null>(null)
const trackUrl = ref('')
const selectedFile = ref<File | undefined>()
const selectedGenreFilter = ref(ALL_GENRES)

const rules = {
  required: (v: string) => !!v || 'Track URL is required',
  url: (v: string) => /^https?:\/\/.+/.test(v) || 'Must be a valid URL',
}

const isValidUrl = computed(() => {
  return trackUrl.value.length > 0 && /^https?:\/\/.+/.test(trackUrl.value)
})

const hasGlobalScores = computed(() => {
  return averages.value?.openAiAverage != null
    || averages.value?.googleChirpAverage != null
    || averages.value?.evaluatedCount != null
})

const genreCounts = computed(() => {
  const counts = new Map<string, { value: string; genreName: string; count: number }>()

  for (const job of jobs.value) {
    const value = job.metadata?.genreSlug ?? NO_GENRE
    const genreName = job.metadata?.genreName ?? 'No genre'
    const existing = counts.get(value)

    if (existing) {
      existing.count += 1
      continue
    }

    counts.set(value, { value, genreName, count: 1 })
  }

  return Array.from(counts.values()).sort((left, right) => {
    if (left.value === NO_GENRE) return 1
    if (right.value === NO_GENRE) return -1
    return left.genreName.localeCompare(right.genreName)
  })
})

const genreFilterOptions = computed(() => {
  return [
    {
      title: `All genres (${jobs.value.length})`,
      value: ALL_GENRES,
      genreName: 'All genres',
      count: jobs.value.length,
    },
    ...genreCounts.value.map(genre => ({
      title: `${genre.genreName} (${genre.count})`,
      value: genre.value,
      genreName: genre.genreName,
      count: genre.count,
    })),
  ]
})

const filteredJobs = computed(() => {
  if (selectedGenreFilter.value === ALL_GENRES) {
    return jobs.value
  }

  return jobs.value.filter(job => {
    const genreSlug = job.metadata?.genreSlug ?? NO_GENRE
    return genreSlug === selectedGenreFilter.value
  })
})

function formatAverage(value?: number | null): string {
  return value == null ? '--' : `${value.toFixed(1)}/10`
}

async function handleUrlSubmit() {
  if (!isValidUrl.value) return
  const submitted = await submitJob(trackUrl.value)
  if (!submitted) return

  trackUrl.value = ''
  await nextTick()
  urlForm.value?.resetValidation()
}

async function handleFileSubmit() {
  if (!selectedFile.value) return
  const submitted = await submitFile(selectedFile.value)
  if (!submitted) return

  selectedFile.value = undefined
}

async function handleDelete(jobId: string) {
  const confirmed = window.confirm('Delete this lyrics video job? This cannot be undone.')
  if (!confirmed) return

  await removeJob(jobId)
}

function handleGenreUpdated(payload: { jobId: string; genreSlug: string; genreName: string }) {
  jobs.value = jobs.value.map((job: LyricsVideoJob) => {
    if (job.id !== payload.jobId) {
      return job
    }

    return {
      ...job,
      metadata: {
        ...(job.metadata ?? {}),
        genreSlug: payload.genreSlug,
        genreName: payload.genreName,
      },
    }
  })
}

onMounted(loadJobs)
</script>

<style scoped>
.jobs-layout {
  display: block;
}

.jobs-layout--with-sidebar {
  position: relative;
  overflow: visible;
}

.jobs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.jobs-toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.jobs-genre-filter {
  min-width: 240px;
  max-width: 320px;
}

.genre-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.genre-filter-chip {
  cursor: pointer;
}

.jobs-sidebar {
  position: absolute;
  top: 24px;
  left: calc(100% + 20px);
  width: 280px;
}

.scores-overview {
  background: rgba(var(--v-theme-surface), 0.98);
}

.scores-overview-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.scores-overview-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.scores-overview-label {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-weight: 600;
}

.scores-overview-value {
  font-size: 18px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 700;
}

@media (max-width: 1460px) {
  .jobs-layout--with-sidebar {
    display: block;
  }

  .jobs-sidebar {
    position: static;
    width: auto;
    margin-top: 16px;
  }
}

@media (max-width: 720px) {
  .jobs-toolbar,
  .jobs-toolbar-actions {
    align-items: stretch;
  }

  .jobs-genre-filter {
    min-width: 0;
    max-width: none;
    width: 100%;
  }
}
</style>
