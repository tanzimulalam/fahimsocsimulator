/**
 * Cloudflare Worker for the SOC Simulator.
 *
 * Routes:
 * - POST /           -> OpenAI tutor proxy (backward compatible with VITE_TUTOR_API_URL)
 * - POST /v1/tutor   -> OpenAI tutor proxy
 * - /api/*           -> Classroom/lab persistence API backed by Cloudflare D1
 */

function cors(origin) {
  const o = origin ?? "";
  const allow =
    o.includes("localhost") ||
    o.includes("127.0.0.1") ||
    o.endsWith(".github.io") ||
    o === "null" ||
    o === "";
  const v = allow && o ? o : "*";
  return {
    "Access-Control-Allow-Origin": v,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Class-Code",
  };
}

function json(data, init = {}, ch = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...ch,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function requireDb(env, ch) {
  if (!env.DB) {
    return json({ error: "D1 binding DB is not configured on this Worker" }, { status: 500 }, ch);
  }
  return null;
}

async function rows(stmt) {
  const res = await stmt.all();
  return res.results ?? [];
}

async function handleTutor(request, env, ch) {
  if (request.method !== "POST") {
    return json({ error: "Use POST" }, { status: 405 }, ch);
  }

  const key = env.OPENAI_API_KEY;
  if (!key) {
    return json({ error: "OPENAI_API_KEY not set on worker" }, { status: 500 }, ch);
  }

  const body = await request.text();
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body,
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      ...ch,
      "Content-Type": "application/json",
    },
  });
}

async function getClassroom(env, ch) {
  const students = await rows(
    env.DB.prepare("SELECT id, name, created_at AS createdAt FROM students ORDER BY created_at ASC")
  );
  const scenarios = await rows(
    env.DB.prepare(
      "SELECT id, title, instructions, amp_seed AS ampSeed, xdr_seed AS xdrSeed, defender_seed AS defenderSeed, created_at AS createdAt, created_by AS createdBy, start_path AS startPath FROM scenarios ORDER BY created_at DESC LIMIT 200"
    )
  );
  const activities = await rows(
    env.DB.prepare(
      "SELECT id, student_id AS studentId, student_name AS studentName, action, details, at FROM student_activity ORDER BY at DESC LIMIT 2000"
    )
  );
  const seenRows = await rows(env.DB.prepare("SELECT student_id AS studentId, seen_at AS seenAt FROM seen_scenarios"));
  const gradeRows = await rows(
    env.DB.prepare("SELECT student_id AS studentId, score, comment, updated_at AS updatedAt FROM grades")
  );

  const seenScenarioAt = Object.fromEntries(seenRows.map((r) => [r.studentId, r.seenAt]));
  const grades = Object.fromEntries(
    gradeRows.map((r) => [r.studentId, { score: r.score, comment: r.comment, updatedAt: r.updatedAt }])
  );

  return json({ students, scenarios, activities, seenScenarioAt, grades }, {}, ch);
}

async function registerStudent(request, env, ch) {
  const body = await readJson(request);
  const name = String(body.name ?? "").trim();
  if (!name) return json({ error: "Student name is required" }, { status: 400 }, ch);

  const existing = await env.DB.prepare("SELECT id, name, created_at AS createdAt FROM students WHERE lower(name) = lower(?)")
    .bind(name)
    .first();
  if (existing) return json(existing, {}, ch);

  const requestedId = String(body.id ?? "").trim();
  const requestedCreatedAt = Number(body.createdAt ?? Date.now());
  const student = {
    id: requestedId || uid("stu"),
    name,
    createdAt: Number.isFinite(requestedCreatedAt) ? requestedCreatedAt : Date.now(),
  };
  await env.DB.prepare("INSERT INTO students (id, name, created_at) VALUES (?, ?, ?)")
    .bind(student.id, student.name, student.createdAt)
    .run();
  return json(student, { status: 201 }, ch);
}

async function publishScenario(request, env, ch) {
  const body = await readJson(request);
  const scenario = {
    id: String(body.id ?? "").trim() || uid("scn"),
    title: String(body.title ?? "Untitled Scenario").trim() || "Untitled Scenario",
    instructions: String(body.instructions ?? "Follow instructor guidance.").trim() || "Follow instructor guidance.",
    ampSeed: String(body.ampSeed ?? ""),
    xdrSeed: String(body.xdrSeed ?? ""),
    defenderSeed: String(body.defenderSeed ?? ""),
    createdAt: Number.isFinite(Number(body.createdAt)) ? Number(body.createdAt) : Date.now(),
    createdBy: String(body.createdBy ?? "Instructor"),
    startPath: body.startPath ? String(body.startPath) : null,
  };
  await env.DB.prepare(
    "INSERT INTO scenarios (id, title, instructions, amp_seed, xdr_seed, defender_seed, created_at, created_by, start_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      scenario.id,
      scenario.title,
      scenario.instructions,
      scenario.ampSeed,
      scenario.xdrSeed,
      scenario.defenderSeed,
      scenario.createdAt,
      scenario.createdBy,
      scenario.startPath
    )
    .run();
  return json(scenario, { status: 201 }, ch);
}

async function addActivity(request, env, ch) {
  const body = await readJson(request);
  const activity = {
    id: String(body.id ?? "").trim() || uid("act"),
    studentId: String(body.studentId ?? ""),
    studentName: String(body.studentName ?? ""),
    action: String(body.action ?? ""),
    details: String(body.details ?? ""),
    at: Number.isFinite(Number(body.at)) ? Number(body.at) : Date.now(),
  };
  if (!activity.studentId || !activity.studentName || !activity.action) {
    return json({ error: "studentId, studentName, and action are required" }, { status: 400 }, ch);
  }
  await env.DB.prepare(
    "INSERT INTO student_activity (id, student_id, student_name, action, details, at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(activity.id, activity.studentId, activity.studentName, activity.action, activity.details, activity.at)
    .run();
  return json(activity, { status: 201 }, ch);
}

async function gradeStudent(request, env, ch) {
  const body = await readJson(request);
  const studentId = String(body.studentId ?? "");
  const score = Number(body.score ?? 0);
  const comment = String(body.comment ?? "");
  if (!studentId || !Number.isFinite(score)) return json({ error: "studentId and score are required" }, { status: 400 }, ch);
  const updatedAt = Date.now();
  await env.DB.prepare(
    "INSERT INTO grades (student_id, score, comment, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(student_id) DO UPDATE SET score = excluded.score, comment = excluded.comment, updated_at = excluded.updated_at"
  )
    .bind(studentId, Math.round(score), comment, updatedAt)
    .run();
  return json({ studentId, score: Math.round(score), comment, updatedAt }, {}, ch);
}

async function markSeen(request, env, ch) {
  const body = await readJson(request);
  const studentId = String(body.studentId ?? "");
  if (!studentId) return json({ error: "studentId is required" }, { status: 400 }, ch);
  const seenAt = Date.now();
  await env.DB.prepare(
    "INSERT INTO seen_scenarios (student_id, seen_at) VALUES (?, ?) ON CONFLICT(student_id) DO UPDATE SET seen_at = excluded.seen_at"
  )
    .bind(studentId, seenAt)
    .run();
  return json({ studentId, seenAt }, {}, ch);
}

async function deleteStudent(request, env, ch, id) {
  if (!id) return json({ error: "student id is required" }, { status: 400 }, ch);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM students WHERE id = ?").bind(id),
    env.DB.prepare("DELETE FROM student_activity WHERE student_id = ?").bind(id),
    env.DB.prepare("DELETE FROM grades WHERE student_id = ?").bind(id),
    env.DB.prepare("DELETE FROM seen_scenarios WHERE student_id = ?").bind(id),
  ]);
  return json({ ok: true }, {}, ch);
}

async function getResponseActions(env, ch) {
  const actions = await rows(
    env.DB.prepare(
      "SELECT id, incident_id AS incidentId, host_line AS hostLine, node_label AS nodeLabel, sha256, source, action, actor, at FROM response_actions ORDER BY at DESC LIMIT 1000"
    )
  );
  return json(actions, {}, ch);
}

async function addResponseAction(request, env, ch) {
  const body = await readJson(request);
  const action = {
    id: String(body.id ?? "").trim() || uid("rsp"),
    incidentId: String(body.incidentId ?? ""),
    hostLine: String(body.hostLine ?? ""),
    nodeLabel: String(body.nodeLabel ?? ""),
    sha256: String(body.sha256 ?? ""),
    source: String(body.source ?? ""),
    action: String(body.action ?? ""),
    actor: String(body.actor ?? "Analyst"),
    at: Number.isFinite(Number(body.at)) ? Number(body.at) : Date.now(),
  };
  if (!action.incidentId || !action.action) return json({ error: "incidentId and action are required" }, { status: 400 }, ch);
  await env.DB.prepare(
    "INSERT INTO response_actions (id, incident_id, host_line, node_label, sha256, source, action, actor, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      action.id,
      action.incidentId,
      action.hostLine,
      action.nodeLabel,
      action.sha256,
      action.source,
      action.action,
      action.actor,
      action.at
    )
    .run();
  return json(action, { status: 201 }, ch);
}

async function clearResponseActions(env, ch) {
  await env.DB.prepare("DELETE FROM response_actions").run();
  return json({ ok: true }, {}, ch);
}

function stateParts(url) {
  const rest = url.pathname.replace(/^\/api\/lab-state\/?/, "");
  const [scope, ...keyParts] = rest.split("/").filter(Boolean).map(decodeURIComponent);
  return { scope: scope || "default", key: keyParts.join("/") || "state" };
}

async function getLabState(url, env, ch) {
  const { scope, key } = stateParts(url);
  const row = await env.DB.prepare("SELECT json_value AS jsonValue, updated_at AS updatedAt FROM lab_state WHERE scope = ? AND state_key = ?")
    .bind(scope, key)
    .first();
  if (!row) return json({ value: null, updatedAt: 0 }, {}, ch);
  return json({ value: JSON.parse(row.jsonValue), updatedAt: row.updatedAt }, {}, ch);
}

async function putLabState(request, url, env, ch) {
  const { scope, key } = stateParts(url);
  const body = await readJson(request);
  const updatedAt = Date.now();
  await env.DB.prepare(
    "INSERT INTO lab_state (scope, state_key, json_value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(scope, state_key) DO UPDATE SET json_value = excluded.json_value, updated_at = excluded.updated_at"
  )
    .bind(scope, key, JSON.stringify(body.value ?? null), updatedAt)
    .run();
  return json({ scope, key, updatedAt }, {}, ch);
}

async function handleApi(request, env, ch) {
  const dbError = requireDb(env, ch);
  if (dbError) return dbError;

  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "GET" && path === "/api/health") return json({ ok: true }, {}, ch);
  if (request.method === "GET" && path === "/api/classroom") return getClassroom(env, ch);
  if (request.method === "POST" && path === "/api/students") return registerStudent(request, env, ch);
  if (request.method === "DELETE" && path.startsWith("/api/students/")) {
    return deleteStudent(request, env, ch, decodeURIComponent(path.replace("/api/students/", "")));
  }
  if (request.method === "POST" && path === "/api/scenarios") return publishScenario(request, env, ch);
  if (request.method === "POST" && path === "/api/activity") return addActivity(request, env, ch);
  if (request.method === "POST" && path === "/api/grades") return gradeStudent(request, env, ch);
  if (request.method === "POST" && path === "/api/seen-scenarios") return markSeen(request, env, ch);
  if (request.method === "GET" && path === "/api/response-actions") return getResponseActions(env, ch);
  if (request.method === "POST" && path === "/api/response-actions") return addResponseAction(request, env, ch);
  if (request.method === "DELETE" && path === "/api/response-actions") return clearResponseActions(env, ch);
  if (request.method === "GET" && path.startsWith("/api/lab-state/")) return getLabState(url, env, ch);
  if (request.method === "PUT" && path.startsWith("/api/lab-state/")) return putLabState(request, url, env, ch);

  return json({ error: "Not found" }, { status: 404 }, ch);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const ch = cors(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: ch });
    }

    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, ch);
    }
    if (url.pathname === "/v1/tutor" || url.pathname === "/") {
      return handleTutor(request, env, ch);
    }

    return json({ error: "Not found" }, { status: 404 }, ch);
  },
};
