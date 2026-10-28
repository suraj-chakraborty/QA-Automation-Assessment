-- Query 1: Top 5 Run Scorers in Season 2024
-- Business Objective: Determine tournament leading run scorers for the Orange Cap race.
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.team AS team_code,
  SUM(perf.runs) AS total_runs,
  COUNT(perf.id) AS innings_batted,
  MAX(perf.runs) AS highest_score,
  ROUND(AVG(perf.runs), 2) AS batting_average
FROM performances perf
JOIN matches m ON m.id = perf.match_id
JOIN players p ON p.id = perf.player_id
WHERE m.season = 2024
GROUP BY p.id, p.name, p.team
ORDER BY total_runs DESC, p.id ASC
LIMIT 5;

