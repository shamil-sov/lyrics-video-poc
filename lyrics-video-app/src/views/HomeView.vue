<template>
  <v-container class="py-6" style="max-width: 1100px">
    <!-- Generate Section -->
    <v-card class="mb-6 pa-4">
      <v-card-title class="text-h6 pb-2">
        <v-icon class="mr-2" color="primary">mdi-video-plus</v-icon>
        Generate Lyrics Video
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit" class="d-flex align-center ga-3">
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

      <div v-if="jobs.length === 0" class="text-center py-12 text-medium-emphasis">
        <v-icon size="64" class="mb-4" color="grey-lighten-1">mdi-video-off-outline</v-icon>
        <p class="text-body-1">No jobs yet. Paste a track URL above to get started.</p>
      </div>

      <div v-else class="d-flex flex-column ga-4">
        <JobCard v-for="job in jobs" :key="job.id" :job="job" />
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLyricsJobs } from '@/composables/useLyricsJobs'
import JobCard from '@/components/JobCard.vue'

const { jobs, loading, submitting, error, loadJobs, submitJob } = useLyricsJobs()

const trackUrl = ref('')

const rules = {
  required: (v: string) => !!v || 'Track URL is required',
  url: (v: string) => /^https?:\/\/.+/.test(v) || 'Must be a valid URL',
}

const isValidUrl = computed(() => {
  return trackUrl.value.length > 0 && /^https?:\/\/.+/.test(trackUrl.value)
})

async function handleSubmit() {
  if (!isValidUrl.value) return
  await submitJob(trackUrl.value)
  trackUrl.value = ''
}

onMounted(loadJobs)
</script>
