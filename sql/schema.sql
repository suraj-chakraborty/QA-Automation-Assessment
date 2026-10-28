-- ==============================================================================
-- Streamhub SQLite Schema DDL (Milestone S07 - Requirement B4)
-- Engine: SQLite >= 3.25 (better-sqlite3)
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Teams Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id          INTEGER PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  city        TEXT    NOT NULL,
  coach       TEXT,
  home_venue  TEXT
);

-- ------------------------------------------------------------------------------
-- 2. Players Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS players (
  id              INTEGER PRIMARY KEY,
  name            TEXT    NOT NULL,
  team            TEXT    NOT NULL,
  team_id         INTEGER REFERENCES teams(id) ON DELETE RESTRICT,
  role            TEXT    NOT NULL CHECK(role IN ('batter', 'bowler', 'all-rounder', 'wicketkeeper')),
  batting_style   TEXT,
  bowling_style   TEXT,
  is_overseas     INTEGER NOT NULL DEFAULT 0 CHECK(is_overseas IN (0, 1)),
  total_runs      INTEGER NOT NULL DEFAULT 0 CHECK(total_runs >= 0),
  total_wickets   INTEGER NOT NULL DEFAULT 0 CHECK(total_wickets >= 0),
  matches_played  INTEGER NOT NULL DEFAULT 0 CHECK(matches_played >= 0),

  -- Virtual generated column for reference query compatibility
  player_id       INTEGER GENERATED ALWAYS AS (id) VIRTUAL
);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON players (team_id);
CREATE INDEX IF NOT EXISTS idx_players_role ON players (role);

-- ------------------------------------------------------------------------------
-- 3. Matches Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
  id                  INTEGER PRIMARY KEY,
  match_no            INTEGER NOT NULL,
  season              INTEGER NOT NULL CHECK(season BETWEEN 2000 AND 2100),
  date                TEXT    NOT NULL CHECK(date LIKE '____-__-__'),
  venue               TEXT    NOT NULL,
  home_team_id        INTEGER REFERENCES teams(id) ON DELETE RESTRICT,
  away_team_id        INTEGER REFERENCES teams(id) ON DELETE RESTRICT,
  home_team           TEXT    NOT NULL,
  away_team           TEXT    NOT NULL,
  toss_winner         TEXT,
  toss_decision       TEXT    CHECK(toss_decision IS NULL OR toss_decision IN ('bat', 'field')),
  winner              TEXT,
  win_margin          INTEGER CHECK(win_margin IS NULL OR win_margin >= 0),
  win_type            TEXT    CHECK(win_type IS NULL OR win_type IN ('runs', 'wickets', 'super_over', 'no_result')),
  player_of_match_id  INTEGER REFERENCES players(id) ON DELETE SET NULL,
  
  -- Virtual generated columns for reference query compatibility
  match_id            INTEGER GENERATED ALWAYS AS (id) VIRTUAL,
  match_date          TEXT    GENERATED ALWAYS AS (date) VIRTUAL,
  CHECK (home_team <> away_team)
);

CREATE INDEX IF NOT EXISTS idx_matches_season ON matches (season);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches (date);
CREATE INDEX IF NOT EXISTS idx_matches_season_date ON matches (season, date, id);

-- ------------------------------------------------------------------------------
-- 4. Performances Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS performances (
  id              INTEGER PRIMARY KEY,
  player_id       INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  match_id        INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  match_no        INTEGER,
  date            TEXT    NOT NULL CHECK(date LIKE '____-__-__'),
  runs            INTEGER NOT NULL DEFAULT 0 CHECK(runs >= 0),
  balls_faced     INTEGER NOT NULL DEFAULT 0 CHECK(balls_faced >= 0),
  fours           INTEGER NOT NULL DEFAULT 0 CHECK(fours >= 0),
  sixes           INTEGER NOT NULL DEFAULT 0 CHECK(sixes >= 0),
  strike_rate     REAL    NOT NULL DEFAULT 0.0 CHECK(strike_rate >= 0.0),
  wickets         INTEGER NOT NULL DEFAULT 0 CHECK(wickets >= 0),
  overs_bowled    REAL    NOT NULL DEFAULT 0.0 CHECK(overs_bowled >= 0.0),
  maidens         INTEGER NOT NULL DEFAULT 0 CHECK(maidens >= 0),
  runs_conceded   INTEGER NOT NULL DEFAULT 0 CHECK(runs_conceded >= 0),
  economy_rate    REAL    NOT NULL DEFAULT 0.0 CHECK(economy_rate >= 0.0),
  catches         INTEGER NOT NULL DEFAULT 0 CHECK(catches >= 0),
  run_outs        INTEGER NOT NULL DEFAULT 0 CHECK(run_outs >= 0),
  stumpings       INTEGER NOT NULL DEFAULT 0 CHECK(stumpings >= 0),
  is_out          INTEGER NOT NULL DEFAULT 0 CHECK(is_out IN (0, 1)),
  dismissal_type  TEXT,
  UNIQUE(player_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_perf_player_id ON performances (player_id);
CREATE INDEX IF NOT EXISTS idx_perf_match_id ON performances (match_id);
CREATE INDEX IF NOT EXISTS idx_perf_player_date ON performances (player_id, date, match_id);
CREATE INDEX IF NOT EXISTS idx_perf_runs ON performances (runs);
CREATE INDEX IF NOT EXISTS idx_perf_bowling ON performances (overs_bowled, runs_conceded, wickets);

-- ------------------------------------------------------------------------------
-- 5. Player Match Stats Compatibility View (for Master Prompt §7.3 queries)
-- ------------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS player_match_stats AS
SELECT
  player_id,
  match_id,
  runs
FROM performances;

-- ------------------------------------------------------------------------------
-- 6. Transactions Table (for B4-S1 Round-Trip Financial Transfers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  txn_id        INTEGER PRIMARY KEY,
  from_account  TEXT    NOT NULL,
  to_account    TEXT    NOT NULL,
  amount        NUMERIC NOT NULL CHECK (amount > 0),
  txn_ts        TEXT    NOT NULL,            -- 'YYYY-MM-DD HH:MM:SS' (UTC)
  CHECK (from_account <> to_account)
);

CREATE INDEX IF NOT EXISTS idx_txn_pair_ts ON transactions (from_account, to_account, txn_ts);

