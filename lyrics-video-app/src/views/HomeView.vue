<template>
  <v-container class="py-6" style="max-width: 1100px">
    <!-- Generate Section -->
    <v-card class="mb-6">
      <v-card-title class="text-h6 pb-0 pt-4 px-4">
        <v-icon class="mr-2" color="primary">mdi-video-plus</v-icon>
        Generate Lyrics Video
      </v-card-title>

      <v-card-text>
        <v-form ref="urlForm" @submit.prevent="handleUrlSubmit" class="d-flex align-center ga-3">
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

    <!-- Videos List -->
    <template v-else>
      <div class="jobs-layout">
        <div class="jobs-main">
          <div class="jobs-toolbar mb-4">
            <div class="d-flex align-center ga-2 flex-wrap">
              <h2 class="text-h6">
                <v-icon class="mr-1">mdi-format-list-bulleted</v-icon>
                Videos
              </h2>
              <v-chip size="small" color="primary" variant="tonal">
                {{ filteredJobs.length }}
              </v-chip>
              <v-chip v-if="hasActiveFilters" size="small" variant="text">
                {{ jobs.length }} total
              </v-chip>
            </div>

            <div class="jobs-toolbar-actions">
              <v-btn
                variant="text"
                size="small"
                icon="mdi-refresh"
                @click="loadJobs"
                :loading="loading"
              />
            </div>
          </div>

          <div v-if="genreCounts.length" class="mb-4">
            <div class="filter-chip-header mb-2">
              <span class="filter-chip-label">Filter by genre</span>
            </div>

            <div class="genre-filter-chips">
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
          </div>

          <div v-if="jobs.length" class="mb-4">
            <div class="filter-chip-header mb-2">
              <span class="filter-chip-label">Filter by review status</span>
            </div>

            <div class="genre-filter-chips">
              <v-chip
                v-for="review in humanReviewFilterOptions"
                :key="review.value"
                :color="selectedHumanReviewFilter === review.value ? 'primary' : undefined"
                :variant="selectedHumanReviewFilter === review.value ? 'flat' : 'tonal'"
                size="small"
                class="genre-filter-chip"
                @click="selectedHumanReviewFilter = review.value"
              >
                {{ review.label }} ({{ review.count }})
              </v-chip>
            </div>
          </div>

          <div v-if="jobs.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="64" class="mb-4" color="grey-lighten-1">mdi-video-off-outline</v-icon>
            <p class="text-body-1">No videos yet. Paste a track URL to get started.</p>
          </div>

          <div v-else-if="filteredJobs.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="64" class="mb-4" color="grey-lighten-1">mdi-filter-outline</v-icon>
            <p class="text-body-1">No videos match the selected filters.</p>
          </div>

          <div v-else class="d-flex flex-column ga-4">
            <JobCard
              v-for="job in filteredJobs"
              :key="job.id"
              :job="job"
              :deleting="deletingJobId === job.id"
              @remove="handleDelete"
              @review-updated="handleReviewUpdated"
            />
          </div>
        </div>
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useLyricsJobs } from '@/composables/useLyricsJobs'
import JobCard from '@/components/JobCard.vue'
import type {
  LyricsVideoJob,
  LyricsVideoProviderReview,
  ProviderReviewStatus,
} from '@/types/lyricsVideo'

const { jobs, loading, submitting, deletingJobId, error, loadJobs, submitJob, removeJob } = useLyricsJobs()

const ALL_GENRES = '__all__'
const NO_GENRE = '__no-genre__'
const ALL_HUMAN_REVIEWS = '__all-human-reviews__'
const NOT_REVIEWED = '__not-reviewed__'

type HumanReviewFilterValue = ProviderReviewStatus | typeof ALL_HUMAN_REVIEWS | typeof NOT_REVIEWED

const urlForm = ref<{ resetValidation: () => void } | null>(null)
const trackUrl = ref('')
const selectedGenreFilter = ref(ALL_GENRES)
const selectedHumanReviewFilter = ref<HumanReviewFilterValue>(ALL_HUMAN_REVIEWS)

const rules = {
  required: (v: string) => !!v || 'Track URL is required',
  url: (v: string) => /^https?:\/\/.+/.test(v) || 'Must be a valid URL',
}

const isValidUrl = computed(() => {
  return trackUrl.value.length > 0 && /^https?:\/\/.+/.test(trackUrl.value)
})

const hasActiveFilters = computed(() => {
  return selectedGenreFilter.value !== ALL_GENRES
    || selectedHumanReviewFilter.value !== ALL_HUMAN_REVIEWS
})

const genreCounts = computed(() => {
  const counts = new Map<string, { value: string; genreName: string; count: number }>()

  for (const job of jobs.value) {
    if (!matchesHumanReviewFilter(job, selectedHumanReviewFilter.value)) {
      continue
    }

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
      title: `All genres (${jobs.value.filter(job => matchesHumanReviewFilter(job, selectedHumanReviewFilter.value)).length})`,
      value: ALL_GENRES,
      genreName: 'All genres',
      count: jobs.value.filter(job => matchesHumanReviewFilter(job, selectedHumanReviewFilter.value)).length,
    },
    ...genreCounts.value.map(genre => ({
      title: `${genre.genreName} (${genre.count})`,
      value: genre.value,
      genreName: genre.genreName,
      count: genre.count,
    })),
  ]
})

const humanReviewFilterOptions = computed(() => {
  const jobsInSelectedGenre = jobs.value.filter(job => matchesGenreFilter(job, selectedGenreFilter.value))

  const options: Array<{ label: string; value: HumanReviewFilterValue; count: number }> = [
    {
      label: 'Any review status',
      value: ALL_HUMAN_REVIEWS,
      count: jobsInSelectedGenre.length,
    },
    {
      label: 'Approved',
      value: 'Approved',
      count: jobsInSelectedGenre.filter(job => matchesHumanReviewFilter(job, 'Approved')).length,
    },
    {
      label: 'Rejected',
      value: 'Rejected',
      count: jobsInSelectedGenre.filter(job => matchesHumanReviewFilter(job, 'Rejected')).length,
    },
    {
      label: 'Questionable',
      value: 'Questionable',
      count: jobsInSelectedGenre.filter(job => matchesHumanReviewFilter(job, 'Questionable')).length,
    },
    {
      label: 'Not reviewed',
      value: NOT_REVIEWED,
      count: jobsInSelectedGenre.filter(job => matchesHumanReviewFilter(job, NOT_REVIEWED)).length,
    },
  ]

  return options.map(option => ({
    ...option,
    title: `${option.label} (${option.count})`,
  }))
})

const filteredJobs = computed(() => {
  return jobs.value.filter(job => {
    return matchesGenreFilter(job, selectedGenreFilter.value)
      && matchesHumanReviewFilter(job, selectedHumanReviewFilter.value)
  })
})

function matchesGenreFilter(job: LyricsVideoJob, filterValue: string): boolean {
  if (filterValue === ALL_GENRES) {
    return true
  }

  const genreSlug = job.metadata?.genreSlug ?? NO_GENRE
  return genreSlug === filterValue
}

function matchesHumanReviewFilter(job: LyricsVideoJob, filterValue: HumanReviewFilterValue): boolean {
  if (filterValue === ALL_HUMAN_REVIEWS) {
    return true
  }

  const openAiReview = job.openAiApproval?.status ?? null
  const googleReview = job.googleCloudApproval?.status ?? null

  if (filterValue === NOT_REVIEWED) {
    return openAiReview == null || googleReview == null
  }

  return openAiReview === filterValue || googleReview === filterValue
}

async function handleUrlSubmit() {
  if (!isValidUrl.value) return
  const submitted = await submitJob(trackUrl.value)
  if (!submitted) return

  trackUrl.value = ''
  await nextTick()
  urlForm.value?.resetValidation()
}

async function handleDelete(jobId: string) {
  const confirmed = window.confirm('Delete this lyrics video job? This cannot be undone.')
  if (!confirmed) return

  await removeJob(jobId)
}

function handleReviewUpdated(payload: {
  jobId: string
  provider: 'openAi' | 'google'
  review: LyricsVideoProviderReview | null
}) {
  jobs.value = jobs.value.map((job: LyricsVideoJob) => {
    if (job.id !== payload.jobId) {
      return job
    }

    return {
      ...job,
      openAiApproval: payload.provider === 'openAi' ? payload.review : job.openAiApproval,
      googleCloudApproval: payload.provider === 'google' ? payload.review : job.googleCloudApproval,
    }
  })
}

onMounted(loadJobs)
</script>

<style scoped>
.jobs-layout {
  display: block;
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

.genre-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip-header {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.filter-chip-label {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.64);
  font-weight: 600;
}

.genre-filter-chip {
  cursor: pointer;
}

@media (max-width: 720px) {
  .jobs-toolbar,
  .jobs-toolbar-actions {
    align-items: stretch;
  }
}
</style>
