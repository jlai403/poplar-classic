import { Hono } from 'hono'
import { getLeaderboardData } from '../db'

export const leaderboardRoute = new Hono()

leaderboardRoute.get('/:roundId', (c) => {
  const roundId = Number(c.req.param('roundId'))
  return c.json(getLeaderboardData(roundId))
})
