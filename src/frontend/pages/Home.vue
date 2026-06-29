<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getActiveRound, getRounds, createRound } from '../api'

const emit = defineEmits<{ 'round-selected': [any] }>()

const loading = ref(true)
const roundName = ref('')
const existingRounds = ref<any[]>([])

onMounted(async () => {
  const active = await getActiveRound()
  if (active) {
    emit('round-selected', active)
    return
  }
  existingRounds.value = await getRounds()
  loading.value = false
})

async function handleCreate() {
  if (!roundName.value.trim()) return
  loading.value = true
  const round = await createRound(roundName.value.trim())
  emit('round-selected', round)
}

function selectRound(round: any) {
  emit('round-selected', round)
}
</script>

<template>
  <div class="home">
    <div class="home-content">
      <h1 class="title"><span class="title-purple">Golf</span> Scorekeeper</h1>
      <p class="subtitle">Copper Point — Round 1</p>

      <div class="create-section">
        <input
          v-model="roundName"
          placeholder="Round name (e.g. Copper Point)"
          class="input"
          @keyup.enter="handleCreate"
        />
        <button class="btn-primary" @click="handleCreate" :disabled="loading">
          Start Round
        </button>
      </div>

      <div v-if="existingRounds.length > 0" class="existing">
        <h3>Previous Rounds</h3>
        <div
          v-for="r in existingRounds"
          :key="r.id"
          class="round-card"
          @click="selectRound(r)"
        >
          <span>{{ r.name }}</span>
          <span class="date">{{ new Date(r.createdAt).toLocaleDateString() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
}

.home-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  max-width: 360px;
  margin: 0 auto;
  width: 100%;
}

.title {
  font-size: 28px;
  font-weight: 800;
  text-align: center;
}

.title-purple {
  color: var(--accent);
}

.subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: -16px;
}

.create-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 16px;
  outline: none;
  transition: border-color 0.15s;
}

.input:focus {
  border-color: var(--accent);
}

.btn-primary {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: var(--accent);
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:active {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
}

.existing {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.existing h3 {
  font-size: 13px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.round-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--bg-card);
  cursor: pointer;
  transition: background 0.15s;
}

.round-card:active {
  background: var(--bg-elevated);
}

.date {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
