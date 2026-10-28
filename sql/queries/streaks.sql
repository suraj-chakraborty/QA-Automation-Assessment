-- Query 2: Deterministic IPL Streak Analysis (B4 Scenario 2)
-- Business Objective: Identify players scoring 30+ runs in >= 3 consecutive appearances in 2024.
WITH appearances AS (
  SELECT
    perf.player_id,
    perf.match_id,
    m.date AS match_date,
    perf.runs,
    ROW_NUMBER() OVER (
      PARTITION BY perf.player_id
      ORDER BY m.date ASC, m.id ASC
    ) AS app_seq
  FROM performances perf
  JOIN matches m ON m.id = perf.match_id
  WHERE m.season = 2024
),
qualifying AS (
  SELECT
    a.*,
    a.app_seq - ROW_NUMBER() OVER (
      PARTITION BY a.player_id
      ORDER BY a.app_seq ASC
    ) AS grp
  FROM appearances a
  WHERE COALESCE(a.runs, 0) >= 30
)
SELECT
  p.name AS player_name,
  MIN(q.match_date) AS streak_start_date,
  MAX(q.match_date) AS streak_end_date,
  COUNT(*) AS streak_length
FROM qualifying q
JOIN players p ON p.id = q.player_id
GROUP BY q.player_id, q.grp
HAVING COUNT(*) >= 3
ORDER BY p.name ASC, streak_start_date ASC;

