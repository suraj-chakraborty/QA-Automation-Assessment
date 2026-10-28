/**
 * Standalone Automated Smoke Test Verification Script for S03 API
 * Run via: npx tsx api/scripts/smoke-test.ts
 */

import request from 'supertest';
import { createApp } from '../src/app';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

interface MetaPayload {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface PlayerRecord {
  id: number;
  name: string;
  team: string;
  role: string;
  total_runs: number;
}

async function runSmokeTests(): Promise<void> {
  const app = createApp();
  const results: TestResult[] = [];
  let createdPlayerId: number | null = null;

  console.log('🚀 Running S03 API Automated Smoke Test Gate...\n');

  async function check(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ name, passed: false, error: msg });
      console.error(`  ❌ [FAIL] ${name}: ${msg}`);
    }
  }

  // Checkpoint 1: Health check at /health
  await check('1. GET /health returns 200 with status "ok"', async () => {
    const res = await request(app).get('/health').expect(200);
    if (res.body.status !== 'ok' || res.body.success !== true) {
      throw new Error(`Unexpected health payload: ${JSON.stringify(res.body)}`);
    }
  });

  // Checkpoint 2: Health check at /api/health
  await check('2. GET /api/health returns 200 with status "ok"', async () => {
    const res = await request(app).get('/api/health').expect(200);
    if (res.body.status !== 'ok' || res.body.success !== true) {
      throw new Error('Expected status ok and success true');
    }
  });

  // Checkpoint 3: List players default
  await check('3. GET /api/players returns 200 with 10 players and meta', async () => {
    const res = await request(app).get('/api/players').expect(200);
    const data = res.body.data as PlayerRecord[];
    const meta = res.body.meta as MetaPayload;
    if (!Array.isArray(data) || data.length !== 10) {
      throw new Error(`Expected 10 players, got ${data?.length}`);
    }
    if (meta.total < 40 || meta.page !== 1) {
      throw new Error(`Invalid pagination meta: ${JSON.stringify(meta)}`);
    }
  });

  // Checkpoint 4: Filter players by team and role
  await check('4. GET /api/players?team=CSK&role=batter returns filtered results', async () => {
    const res = await request(app).get('/api/players?team=CSK&role=batter').expect(200);
    const data = res.body.data as PlayerRecord[];
    if (data.length === 0) throw new Error('Expected at least 1 CSK batter');
    for (const p of data) {
      if (p.team !== 'CSK' || p.role !== 'batter') {
        throw new Error(`Player violates filter: ${JSON.stringify(p)}`);
      }
    }
  });

  // Checkpoint 5: Search players by name substring
  await check('5. GET /api/players?q=ar returns matching players', async () => {
    const res = await request(app).get('/api/players?q=ar').expect(200);
    const data = res.body.data as PlayerRecord[];
    if (data.length === 0) throw new Error('Expected at least 1 match');
    for (const p of data) {
      if (!p.name.toLowerCase().includes('ar')) {
        throw new Error(`Player name does not contain 'ar': ${p.name}`);
      }
    }
  });

  // Checkpoint 6: Get player by ID
  await check('6. GET /api/players/1 returns player with id 1', async () => {
    const res = await request(app).get('/api/players/1').expect(200);
    if (res.body.data.id !== 1) {
      throw new Error(`Expected id 1, got ${res.body.data.id}`);
    }
  });

  // Checkpoint 7: Create player (POST)
  await check('7. POST /api/players creates player and returns 201', async () => {
    const newPlayer = {
      name: 'Smoke Test Player',
      team: 'RCB',
      role: 'all-rounder',
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm medium',
      total_runs: 175,
      total_wickets: 5,
      matches_played: 6,
    };
    const res = await request(app).post('/api/players').send(newPlayer).expect(201);
    if (!res.body.data?.id || res.body.data.name !== 'Smoke Test Player') {
      throw new Error(`Invalid created player payload: ${JSON.stringify(res.body)}`);
    }
    if (!res.headers.location) {
      throw new Error('Expected Location header on 201 response');
    }
    createdPlayerId = res.body.data.id;
  });

  // Checkpoint 8: Update player (PUT)
  await check('8. PUT /api/players/:id updates player and returns 200', async () => {
    if (!createdPlayerId) throw new Error('No createdPlayerId from POST');
    const updatePayload = {
      total_runs: 250,
      matches_played: 8,
    };
    const res = await request(app)
      .put(`/api/players/${createdPlayerId}`)
      .send(updatePayload)
      .expect(200);
    if (res.body.data?.total_runs !== 250 || res.body.data?.matches_played !== 8) {
      throw new Error(`Player update failed: ${JSON.stringify(res.body)}`);
    }
  });

  // Checkpoint 9: Delete player (DELETE)
  await check('9. DELETE /api/players/:id deletes player and returns 200', async () => {
    if (!createdPlayerId) throw new Error('No createdPlayerId from POST');
    const res = await request(app).delete(`/api/players/${createdPlayerId}`).expect(200);
    if (res.body.success !== true || res.body.data?.deleted !== true) {
      throw new Error(`Delete failed: ${JSON.stringify(res.body)}`);
    }
    // Verify player is indeed gone (404)
    await request(app).get(`/api/players/${createdPlayerId}`).expect(404);
  });

  // Checkpoint 10: List matches
  await check('10. GET /api/matches returns 200 with matches and meta', async () => {
    const res = await request(app).get('/api/matches').expect(200);
    if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error('Expected matches array');
    }
    if (!res.body.meta?.total) {
      throw new Error('Expected meta.total on matches response');
    }
  });

  // Checkpoint 11: Get match by ID
  await check('11. GET /api/matches/1 returns match 1', async () => {
    const res = await request(app).get('/api/matches/1').expect(200);
    if (res.body.data.id !== 1) {
      throw new Error(`Expected id 1, got ${res.body.data.id}`);
    }
  });

  // Checkpoint 12: List performances & nested player performances
  await check('12. GET /api/performances returns 200 with performances', async () => {
    const res = await request(app).get('/api/performances').expect(200);
    if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error('Expected performances array');
    }
    const nestedRes = await request(app).get('/api/players/1/performances').expect(200);
    if (!Array.isArray(nestedRes.body.data)) {
      throw new Error('Expected nested performances array');
    }
  });

  // Checkpoint 13: Analytical streaks
  await check('13. GET /api/streaks returns 200 with streak records', async () => {
    const res = await request(app).get('/api/streaks').expect(200);
    if (!Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error('Expected non-empty array of streak records');
    }
    const firstStreak = res.body.data[0];
    if (!firstStreak.player_id || !firstStreak.streak_length || !firstStreak.match_ids) {
      throw new Error(`Invalid streak record: ${JSON.stringify(firstStreak)}`);
    }
  });

  // Checkpoint 14: Negative: 404 RESOURCE_NOT_FOUND & ROUTE_NOT_FOUND
  await check('14. 404 handling: RESOURCE_NOT_FOUND and ROUTE_NOT_FOUND', async () => {
    const resResource = await request(app).get('/api/players/999999').expect(404);
    if (resResource.body.error?.code !== 'RESOURCE_NOT_FOUND') {
      throw new Error(`Expected code RESOURCE_NOT_FOUND, got ${resResource.body.error?.code}`);
    }
    const resRoute = await request(app).get('/api/unknown-route').expect(404);
    if (resRoute.body.error?.code !== 'ROUTE_NOT_FOUND') {
      throw new Error(`Expected code ROUTE_NOT_FOUND, got ${resRoute.body.error?.code}`);
    }
  });

  // Checkpoint 15: Negative: 400 validation, 422 date semantics, and 405 Method Not Allowed
  await check('15. Error status codes: 400, 422, and 405 with Allow header', async () => {
    // 400 Bad Request on invalid limit
    const res400 = await request(app).get('/api/players?limit=999').expect(400);
    if (res400.body.error?.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected code VALIDATION_ERROR, got ${res400.body.error?.code}`);
    }

    // 422 Unprocessable Entity on date_from > date_to
    const res422 = await request(app)
      .get('/api/matches?date_from=2024-05-15&date_to=2024-05-01')
      .expect(422);
    if (res422.body.error?.code !== 'UNPROCESSABLE_ENTITY') {
      throw new Error(`Expected UNPROCESSABLE_ENTITY, got ${res422.body.error?.code}`);
    }

    // 405 Method Not Allowed on DELETE /api/matches/1
    const res405 = await request(app).delete('/api/matches/1').expect(405);
    if (!res405.headers.allow) {
      throw new Error('Expected Allow header on 405 response');
    }
    if (res405.body.error?.code !== 'METHOD_NOT_ALLOWED') {
      throw new Error(`Expected METHOD_NOT_ALLOWED, got ${res405.body.error?.code}`);
    }
  });

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  console.log(`\n📊 Smoke Verification Summary: ${passedCount}/${results.length} checks passed.`);

  if (passedCount !== results.length) {
    console.error('❌ Smoke verification failed!');
    process.exit(1);
  } else {
    console.log('🎉 All 15 S03 Smoke Verification Gate checkpoints passed cleanly!\n');
  }
}

void runSmokeTests();
