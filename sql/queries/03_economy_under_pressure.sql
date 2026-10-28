-- Query 3: Economy Rate Under Pressure
-- Business Objective: Identify most economical bowlers in season 2024 with >= 20 overs bowled.
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.team AS team_code,
  ROUND(SUM(perf.overs_bowled), 1) AS total_overs,
  SUM(perf.runs_conceded) AS runs_conceded,
  SUM(perf.wickets) AS wickets_taken,
  ROUND(CAST(SUM(perf.runs_conceded) AS REAL) / SUM(perf.overs_bowled), 2) AS economy_rate
FROM performances perf
JOIN matches m ON m.id = perf.match_id
JOIN players p ON p.id = perf.player_id
WHERE m.season = 2024
GROUP BY p.id, p.name, p.team
HAVING SUM(perf.overs_bowled) >= 20.0
ORDER BY economy_rate ASC, wickets_taken DESC, p.id ASC
LIMIT 5;

