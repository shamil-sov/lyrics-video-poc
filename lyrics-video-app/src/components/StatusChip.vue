<template>
  <v-chip :color="color" :prepend-icon="icon" size="small" variant="tonal" label>
    <template v-if="isProcessing">
      <v-progress-circular
        indeterminate
        size="12"
        width="2"
        class="mr-1"
      />
    </template>
    {{ label }}
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LyricsVideoStatus } from '@/types/lyricsVideo'

const props = defineProps<{
  status: LyricsVideoStatus
}>()

const PROCESSING_STATUSES: LyricsVideoStatus[] = [
  'Transcribing',
  'GeneratingVideo',
]

const isProcessing = computed(() => PROCESSING_STATUSES.includes(props.status))

const color = computed(() => {
  switch (props.status) {
    case 'Completed': return 'success'
    case 'Failed': return 'error'
    case 'Pending': return 'warning'
    default: return 'info'
  }
})

const icon = computed(() => {
  switch (props.status) {
    case 'Completed': return 'mdi-check-circle'
    case 'Failed': return 'mdi-alert-circle'
    case 'Pending': return 'mdi-clock-outline'
    case 'Transcribing': return 'mdi-text-recognition'
    case 'GeneratingVideo': return 'mdi-movie-open'
    default: return 'mdi-help-circle'
  }
})

const label = computed(() => {
  switch (props.status) {
    case 'Pending': return 'Queued'
    case 'Transcribing': return 'Creating subtitles'
    case 'GeneratingVideo': return 'Generating video'
    case 'Completed': return 'Ready'
    case 'Failed': return 'Generation failed'
    default: return props.status
  }
})
</script>
