-- Query 4: Impact All-Rounders
-- Business Objective: Identify dual-threat impact players with >= 100 runs and >= 7 wickets in season 2024.
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.team AS team_code,
  p.role AS declared_role,
  SUM(perf.runs) AS total_runs,
  SUM(perf.wickets) AS total_wickets,
  ROUND(SUM(perf.overs_bowled), 1) AS total_overs,
  ROUND(CAST(SUM(perf.runs_conceded) AS REAL) / NULLIF(SUM(perf.overs_bowled), 0), 2) AS bowling_economy
FROM performances perf
JOIN matches m ON m.id = perf.match_id
JOIN players p ON p.id = perf.player_id
WHERE m.season = 2024
GROUP BY p.id, p.name, p.team, p.role
HAVING SUM(perf.runs) >= 100 AND SUM(perf.wickets) >= 7
ORDER BY (SUM(perf.runs) + SUM(perf.wickets) * 20) DESC, p.id ASC;

