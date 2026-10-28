-- Query 5: Round-Trip Financial Transfers (B4 Scenario 1)
-- Business Objective: Identify reciprocal transfers within 10% amount occurring within a 24-hour window.
SELECT
  a.txn_id AS txn_a_id,
  b.txn_id AS txn_b_id,
  a.from_account AS account_a,
  a.to_account AS account_b,
  a.amount AS amount_a_to_b,
  b.amount AS amount_b_to_a,
  ROUND(ABS(b.amount - a.amount) * 100.0 / a.amount, 2) AS pct_diff,
  a.txn_ts AS sent_at,
  b.txn_ts AS returned_at,
  ROUND((julianday(b.txn_ts) - julianday(a.txn_ts)) * 24, 2) AS hours_between
FROM transactions a
JOIN transactions b
  ON  b.from_account = a.to_account
  AND b.to_account   = a.from_account
  AND b.txn_ts       > a.txn_ts                        -- A->B happens first; prevents mirrored duplicates
  AND b.txn_ts      <= datetime(a.txn_ts, '+24 hours') -- inclusive 24h window
  AND ABS(b.amount - a.amount) * 10 <= a.amount        -- within 10% of A's amount
ORDER BY a.txn_ts ASC;

