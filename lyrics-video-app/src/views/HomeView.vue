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
      <div class="d-flex align-center mb-4">
        <h2 class="text-h6">
          <v-icon class="mr-1">mdi-format-list-bulleted</v-icon>
          Jobs
        </h2>
        <v-chip class="ml-2" size="small" color="primary" variant="tonal">
          {{ jobs.length }}
        </v-chip>
        <v-spacer />
        <v-btn
          variant="text"
          size="small"
          icon="mdi-refresh"
          @click="loadJobs"
          :loading="loading"
        />
      </div>

      <v-sheet
        v-if="hasGlobalScores"
        class="mb-4 pa-4 scores-overview"
        border
        rounded="xl"
      >
        <div class="d-flex align-center ga-2 flex-wrap mb-3">
          <v-icon color="primary">mdi-chart-box-outline</v-icon>
          <span class="text-subtitle-2 font-weight-medium">Global evaluation scores</span>
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

      <div v-if="jobs.length === 0" class="text-center py-12 text-medium-emphasis">
        <v-icon size="64" class="mb-4" color="grey-lighten-1">mdi-video-off-outline</v-icon>
        <p class="text-body-1">No jobs yet. Paste a track URL or upload an audio file to get started.</p>
      </div>

      <div v-else class="d-flex flex-column ga-4">
        <JobCard
          v-for="job in jobs"
          :key="job.id"
          :job="job"
          :deleting="deletingJobId === job.id"
          @remove="handleDelete"
        />
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useLyricsJobs } from '@/composables/useLyricsJobs'
import JobCard from '@/components/JobCard.vue'

const { jobs, averages, loading, submitting, deletingJobId, error, loadJobs, submitJob, submitFile, removeJob } = useLyricsJobs()

const inputTab = ref('url')
const urlForm = ref<{ resetValidation: () => void } | null>(null)
const trackUrl = ref('')
const selectedFile = ref<File | undefined>()

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

onMounted(loadJobs)
</script>

<style scoped>
.scores-overview {
  background: rgba(var(--v-theme-surface), 0.98);
}

.scores-overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

@media (max-width: 800px) {
  .scores-overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
