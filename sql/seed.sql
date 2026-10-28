-- ==============================================================================
-- Streamhub SQLite Seed SQL (Milestone S07 - Requirement B4)
-- Engine: SQLite >= 3.25
-- Usage: sqlite3 data/streamhub.db < sql/seed.sql
-- Note: Use 'npm run db:seed' for full ingestion of JSON and transactions.
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- Transactions Seed Data (B4-S1 Round-Trip Financial Test Cases)
-- ------------------------------------------------------------------------------
DELETE FROM transactions;

-- Qualifying 5 Matches:
-- Match 1: normal 5% diff, 8h interval
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_ts) VALUES
  (1, 'ACC_100', 'ACC_200', 1000.0, '2024-06-01 10:00:00'),
  (2, 'ACC_200', 'ACC_100', 950.0,  '2024-06-01 18:00:00');

-- Match 2: exactly 24.0h boundary, 5% diff
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_ts) VALUES
  (3, 'ACC_101', 'ACC_201', 500.0,  '2024-06-02 09:00:00'),
  (4, 'ACC_201', 'ACC_101', 525.0,  '2024-06-03 09:00:00');

-- Match 3: exactly +10.0% boundary
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_ts) VALUES
  (5, 'ACC_102', 'ACC_202', 200.0,  '2024-06-04 12:00:00'),
  (6, 'ACC_202', 'ACC_102', 220.0,  '2024-06-04 15:00:00');

-- Match 4: exactly -10.0% boundary
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_ts) VALUES
  (7, 'ACC_103', 'ACC_203', 300.0,  '2024-06-05 08:00:00'),
  (8, 'ACC_203', 'ACC_103', 270.0,  '2024-06-05 14:00:00');

-- Match 5: float boundary (70 vs 77, exactly +10%)
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_ts) VALUES
  (9,  'ACC_104', 'ACC_204', 70.0,   '2024-06-06 09:00:00'),
  (10, 'ACC_204', 'ACC_104', 77.0,   '2024-06-06 13:00:00');

-- Non-Qualifying Cases:
-- 20% difference (>10%)
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_ts) VALUES
  (11, 'ACC_105', 'ACC_205', 100.0,  '2024-06-07 10:00:00'),
  (12, 'ACC_205', 'ACC_105', 120.0,  '2024-06-07 12:00:00');

-- 24h + 1 second (exceeds 24h window)
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_ts) VALUES
  (13, 'ACC_106', 'ACC_206', 400.0,  '2024-06-08 10:00:00'),
  (14, 'ACC_206', 'ACC_106', 400.0,  '2024-06-09 10:00:01');

-- No return transaction (unilateral transfer)
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_ts) VALUES
  (15, 'ACC_107', 'ACC_207', 150.0,  '2024-06-10 12:00:00');

-- Non-reciprocal return (A->B, but third party C->A)
INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_ts) VALUES
  (16, 'ACC_108', 'ACC_208', 250.0,  '2024-06-11 10:00:00'),
  (17, 'ACC_999', 'ACC_108', 250.0,  '2024-06-11 12:00:00');

