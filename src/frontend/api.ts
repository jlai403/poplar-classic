const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function getActiveRound() {
  return request<any>('/rounds/active')
}

export function getRounds() {
  return request<any[]>('/rounds')
}

export function createRound(name: string) {
  return request<any>('/rounds', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function getPlayers() {
  return request<Array<{ id: number; name: string; teamId: number; teamName: string }>>('/players')
}

export function getScores(roundId: number) {
  return request<Array<{ id: number; roundId: number; holeNumber: number; playerId: number; strokes: number }>>(`/scores/${roundId}`)
}

export function upsertScore(roundId: number, holeNumber: number, playerId: number, strokes: number) {
  return request<{ created?: boolean; updated?: boolean }>('/scores', {
    method: 'PUT',
    body: JSON.stringify({ roundId, holeNumber, playerId, strokes }),
  })
}

export function getLeaderboard(roundId: number) {
  return request<{ teams: Array<any> }>(`/leaderboard/${roundId}`)
}

export function getCourse() {
  return request<{ name: string; tees: string; par: number[]; totalPar: number; yardage: number }>('/course')
}
