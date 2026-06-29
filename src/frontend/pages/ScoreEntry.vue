<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getPlayers, getScores, getCourse, upsertScore } from '../api'

const props = defineProps<{ round: any }>()

const players = ref<Array<{ id: number; name: string; teamId: number; teamName: string }>>([])
const scores = ref<Record<string, number>>({})
const currentHole = ref(1)
const coursePar = ref<number[]>([])
const loading = ref(true)

const TEAM_ORDER = ['Showie', 'Dan', 'Smott']

const teamGroups = computed(() => {
  const map = new Map<string, { name: string; players: typeof players.value }>()
  for (const p of players.value) {
    if (!map.has(p.teamName)) {
      map.set(p.teamName, { name: p.teamName, players: [] })
    }
    map.get(p.teamName)!.players.push(p)
  }
  return TEAM_ORDER.map(name => map.get(name)).filter(Boolean) as Array<{ name: string; players: typeof players.value }>
})

const STARTING_TOTALS: Record<string, number> = { Showie: 138, Dan: 147, Smott: 142 }

const teamTotals = computed(() => {
  return teamGroups.value.map(team => {
    let roundTotal = 0
    for (let h = 1; h <= 18; h++) {
      for (const p of team.players) {
        roundTotal += scores.value[`${p.id}-${h}`] || 0
      }
    }
    const starting = STARTING_TOTALS[team.name] ?? 0
    return { name: team.name, roundTotal, grandTotal: starting + roundTotal }
  })
})

const currentPar = computed(() => coursePar.value[currentHole.value - 1] ?? 4)

function scoreClass(playerId: number) {
  const strokes = getStroke(playerId)
  if (strokes === 0) return ''
  const par = currentPar.value
  if (strokes < par) return 'under'
  if (strokes > par) return 'over'
  return 'even'
}

function getStroke(playerId: number) {
  return scores.value[`${playerId}-${currentHole.value}`] || 0
}

let saveChain = Promise.resolve()

function scheduleSave(playerId: number, strokes: number) {
  const hole = currentHole.value
  const roundId = props.round.id
  saveChain = saveChain.then(() =>
    upsertScore(roundId, hole, playerId, strokes).catch(e =>
      console.error('Save failed', e)
    )
  )
}

function addStroke(playerId: number) {
  const key = `${playerId}-${currentHole.value}`
  scores.value[key] = (scores.value[key] || 0) + 1
  scheduleSave(playerId, scores.value[key])
}

function subStroke(playerId: number) {
  const key = `${playerId}-${currentHole.value}`
  const current = scores.value[key] || 0
  if (current <= 0) return
  scores.value[key] = current - 1
  scheduleSave(playerId, scores.value[key])
}

function prevHole() {
  if (currentHole.value > 1) currentHole.value--
}

function nextHole() {
  if (currentHole.value < 18) currentHole.value++
}

onMounted(async () => {
  players.value = await getPlayers()
  const [allScores, course] = await Promise.all([
    getScores(props.round.id),
    getCourse(),
  ])
  coursePar.value = course.par
  for (const s of allScores) {
    scores.value[`${s.playerId}-${s.holeNumber}`] = s.strokes
  }
  loading.value = false
})
</script>

<template>
  <div class="score-entry">
    <div class="hole-nav">
      <button class="hole-arrow" @click="prevHole">◀</button>
      <span class="hole-label">Hole {{ currentHole }} <span class="hole-par">Par {{ currentPar }}</span></span>
      <button class="hole-arrow" @click="nextHole">▶</button>
    </div>

    <div class="player-list">
      <div v-for="team in teamGroups" :key="team.name" class="team-group">
        <div class="team-header">{{ team.name }}</div>
        <div v-for="p in team.players" :key="p.id" class="player-row">
          <span class="player-name">{{ p.name }}</span>
          <div class="score-controls">
            <button class="btn-minus" @click="subStroke(p.id)">−</button>
            <span class="score-display" :class="scoreClass(p.id)">{{ getStroke(p.id) || '-' }}</span>
            <button class="btn-plus" @click="addStroke(p.id)">+</button>
          </div>
        </div>
      </div>
    </div>

    <div class="totals-bar">
      <div v-for="team in teamTotals" :key="team.name" class="total-item">
        <span class="total-name">{{ team.name }}</span>
        <span class="total-score">{{ team.grandTotal }}</span>
        <span class="total-round">+{{ team.roundTotal }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.score-entry {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hole-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 12px 16px;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;
}

.hole-arrow {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #334155;
  background: #1e293b;
  color: #e2e8f0;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.hole-arrow:active {
  background: #334155;
}

.hole-label {
  font-size: 18px;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hole-par {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.player-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.team-group {
  margin-bottom: 12px;
}

.team-header {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 8px 0 4px;
}

.player-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}

.player-name {
  font-size: 17px;
  font-weight: 500;
  min-width: 80px;
}

.score-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-minus, .btn-plus {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  font-size: 24px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.btn-minus {
  background: #450a0a;
  color: #fca5a5;
}

.btn-minus:active {
  background: #7f1d1d;
}

.btn-plus {
  background: #052e16;
  color: #86efac;
}

.btn-plus:active {
  background: #14532d;
}

.score-display {
  font-size: 24px;
  font-weight: 700;
  min-width: 32px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.score-display.under { color: #22c55e; }
.score-display.over { color: #ef4444; }
.score-display.even { color: #e2e8f0; }

.totals-bar {
  display: flex;
  border-top: 1px solid #334155;
  background: #1e293b;
  padding: 10px 16px;
  flex-shrink: 0;
}

.total-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.total-name {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.total-score {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.total-round {
  font-size: 10px;
  color: #64748b;
}
</style>
