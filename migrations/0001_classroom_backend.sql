CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_name ON students(name);

CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  amp_seed TEXT NOT NULL DEFAULT '',
  xdr_seed TEXT NOT NULL DEFAULT '',
  defender_seed TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  start_path TEXT
);

CREATE TABLE IF NOT EXISTS student_activity (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_activity_student ON student_activity(student_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_student_activity_at ON student_activity(at DESC);

CREATE TABLE IF NOT EXISTS seen_scenarios (
  student_id TEXT PRIMARY KEY,
  seen_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS grades (
  student_id TEXT PRIMARY KEY,
  score INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS response_actions (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL,
  host_line TEXT NOT NULL,
  node_label TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  source TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_response_actions_incident ON response_actions(incident_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_response_actions_actor ON response_actions(actor, at DESC);

CREATE TABLE IF NOT EXISTS lab_state (
  scope TEXT NOT NULL,
  state_key TEXT NOT NULL,
  json_value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (scope, state_key)
);
