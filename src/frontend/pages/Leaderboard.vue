<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getLeaderboard } from '../api'

const props = defineProps<{ round: any }>()

const teams = ref<any[]>([])
const expandedTeamId = ref<number | null>(null)
let interval: ReturnType<typeof setInterval> | null = null

function vsParClass(vsPar: number) {
  if (vsPar < 0) return 'under'
  if (vsPar > 0) return 'over'
  return 'even'
}

function holesPlayed(team: any) {
  return Object.values(team.holes).filter((h: any) => h.strokes > 0).length
}

function formatVsPar(vsPar: number) {
  if (vsPar === 0) return 'E'
  return vsPar > 0 ? `+${vsPar}` : `${vsPar}`
}

async function load() {
  try {
    const data = await getLeaderboard(props.round.id)
    teams.value = data.teams
  } catch (e) {
    console.error('Leaderboard load failed', e)
  }
}

function toggleTeam(id: number) {
  expandedTeamId.value = expandedTeamId.value === id ? null : id
}

onMounted(() => {
  load()
  interval = setInterval(load, 10000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div class="leaderboard">
    <div class="header">
      <h2>Leaderboard</h2>
      <span class="live-badge">● LIVE</span>
    </div>

    <div class="round-name">{{ round.name }}</div>

    <div class="cards">
      <div v-for="(team, idx) in teams" :key="team.id" class="team-card" @click="toggleTeam(team.id)">
        <div class="team-row">
          <span class="position">{{ idx + 1 }}</span>
          <div class="team-info">
            <span class="team-name">{{ team.name }}</span>
            <span class="team-thru">Thru {{ holesPlayed(team) || '-' }} holes &middot; Round {{ formatVsPar(team.roundVsPar) }}</span>
          </div>
          <div class="total-column">
            <span class="team-total">{{ team.total }}</span>
            <span class="team-vs-par" :class="vsParClass(team.roundVsPar)">{{ formatVsPar(team.roundVsPar) }}</span>
          </div>
        </div>

        <div v-if="expandedTeamId === team.id" class="breakdown">
          <div class="breakdown-row">
            <span class="bd-label">Hole</span>
            <span v-for="h in 18" :key="h" class="bd-cell dim">{{ h }}</span>
          </div>
          <div class="breakdown-row">
            <span class="bd-label">Par</span>
            <span v-for="h in 18" :key="h" class="bd-cell dim">{{ team.holes[h]?.par || '-' }}</span>
          </div>
          <div class="breakdown-row">
            <span class="bd-label">Score</span>
            <span
              v-for="h in 18" :key="h"
              class="bd-cell score"
              :class="team.holes[h]?.strokes > 0 ? vsParClass(team.holes[h].vsPar) : ''"
            >
              {{ team.holes[h]?.strokes || '-' }}
            </span>
          </div>
          <div class="breakdown-row">
            <span class="bd-label">Total</span>
            <span v-for="h in 18" :key="h" class="bd-cell total">{{ team.holes[h]?.roundTotal || '-' }}</span>
          </div>
        </div>
      </div>

      <div v-if="teams.length === 0" class="empty">
        <p>No scores yet.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.header h2 {
  font-size: 22px;
  font-weight: 700;
}

.live-badge {
  font-size: 12px;
  font-weight: 600;
  color: #22c55e;
}

.round-name {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 16px;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.team-card {
  background: #1e293b;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.team-row {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}

.position {
  font-size: 20px;
  font-weight: 700;
  color: #64748b;
  min-width: 28px;
}

.team-info {
  flex: 1;
}

.team-name {
  font-size: 17px;
  font-weight: 600;
  display: block;
}

.team-thru {
  font-size: 12px;
  color: #64748b;
}

.total-column {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.team-total {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.team-vs-par {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.team-vs-par.under { color: #22c55e; }
.team-vs-par.over { color: #ef4444; }
.team-vs-par.even { color: #64748b; }

.breakdown {
  border-top: 1px solid #334155;
  padding: 12px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.breakdown-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 4px;
}

.bd-label {
  min-width: 36px;
  color: #64748b;
  font-weight: 600;
  flex-shrink: 0;
}

.bd-cell {
  min-width: 24px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.bd-cell.dim { color: #64748b; }
.bd-cell.total { color: #94a3b8; }

.bd-cell.score { font-weight: 600; }
.bd-cell.score.under { color: #22c55e; }
.bd-cell.score.over { color: #ef4444; }
.bd-cell.score.even { color: #e2e8f0; }

.empty {
  text-align: center;
  color: #64748b;
  padding: 48px 0;
}
</style>
