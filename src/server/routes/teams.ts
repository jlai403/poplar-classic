import { Hono } from 'hono'
import { getTeams, getPlayers } from '../db'

export const teamsRoute = new Hono()

teamsRoute.get('/', (c) => c.json(getTeams()))

teamsRoute.get('/players', (c) => c.json(getPlayers()))
