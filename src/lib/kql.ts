/**
 * Tiny, safe pseudo-KQL evaluator shared by Defender Advanced Hunting and
 * Sentinel Logs. NEVER calls eval / external services — it parses a small,
 * deterministic teaching subset of Kusto and runs it against in-memory tables.
 *
 * Supported pipeline:
 *   TableName
 *   | where <col> (== | != | =~ | contains | !contains | has | startswith | endswith) "value"
 *   | where <col> (> | >= | < | <=) <number>
 *       (conditions may be joined with `and` / `or`)
 *   | summarize [Alias =] count() by <col>[, <col2>]
 *   | project <col>[, <col2> ...]
 *   | distinct <col>[, <col2> ...]
 *   | order by <col> [asc|desc]   (alias: sort by)
 *   | top <N> by <col> [asc|desc]
 *   | limit <N>                   (alias: take)
 *   | count
 */

export type KqlValue = string | number | boolean;
export type KqlRow = Record<string, KqlValue>;
export type KqlTables = Record<string, KqlRow[]>;

export interface KqlResult {
  columns: string[];
  rows: KqlRow[];
  rowsScanned: number;
  error?: string;
  tableName?: string;
}

export interface KqlTableSchema {
  name: string;
  description: string;
  columns: { name: string; type: "string" | "int" | "datetime" | "bool" }[];
}

function columnsOf(rows: KqlRow[]): string[] {
  const set = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
  return [...set];
}

function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

type Condition = { col: string; op: string; value: string };

function parseCondition(raw: string): Condition | null {
  // order matters: multi-char operators first
  const ops = ["!contains", ">=", "<=", "==", "!=", "=~", ">", "<", "contains", "startswith", "endswith", "has"];
  const lower = raw.toLowerCase();
  for (const op of ops) {
    // word operators need surrounding spaces; symbol operators don't
    const isWord = /[a-z]/.test(op);
    const idx = isWord ? lower.indexOf(` ${op} `) : lower.indexOf(op);
    if (idx >= 0) {
      const col = raw.slice(0, idx).trim();
      const value = raw.slice(idx + (isWord ? op.length + 2 : op.length)).trim();
      if (col) return { col, op, value };
    }
  }
  return null;
}

function evalCondition(row: KqlRow, cond: Condition): boolean {
  const cell = row[cond.col];
  const cellStr = cell === undefined || cell === null ? "" : String(cell);
  const valStr = stripQuotes(cond.value);
  const numCell = typeof cell === "number" ? cell : Number(cellStr);
  const numVal = Number(valStr);
  switch (cond.op) {
    case "==":
      return cellStr === valStr;
    case "!=":
      return cellStr !== valStr;
    case "=~":
      return cellStr.toLowerCase() === valStr.toLowerCase();
    case "contains":
      return cellStr.toLowerCase().includes(valStr.toLowerCase());
    case "!contains":
      return !cellStr.toLowerCase().includes(valStr.toLowerCase());
    case "has": {
      const tokens = cellStr.toLowerCase().split(/[^a-z0-9._-]+/);
      return tokens.includes(valStr.toLowerCase());
    }
    case "startswith":
      return cellStr.toLowerCase().startsWith(valStr.toLowerCase());
    case "endswith":
      return cellStr.toLowerCase().endsWith(valStr.toLowerCase());
    case ">":
      return numCell > numVal;
    case ">=":
      return numCell >= numVal;
    case "<":
      return numCell < numVal;
    case "<=":
      return numCell <= numVal;
    default:
      return false;
  }
}

function evalWhere(row: KqlRow, expr: string): boolean {
  // OR has the lowest precedence
  const orParts = expr.split(/\s+or\s+/i);
  return orParts.some((orPart) => {
    const andParts = orPart.split(/\s+and\s+/i);
    return andParts.every((andPart) => {
      const cond = parseCondition(andPart.trim());
      if (!cond) return true; // unparseable condition is ignored (lenient teaching mode)
      return evalCondition(row, cond);
    });
  });
}

export function runKql(query: string, tables: KqlTables): KqlResult {
  const cleaned = query
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, "").trim())
    .filter(Boolean)
    .join(" ");
  if (!cleaned.trim()) {
    return { columns: [], rows: [], rowsScanned: 0, error: "Enter a query to run." };
  }

  const segments = cleaned.split("|").map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) {
    return { columns: [], rows: [], rowsScanned: 0, error: "Empty query." };
  }

  const tableName = segments[0];
  // Common typo: SecurityEvents instead of SecurityEvent
  const actualTableName = tableName.toLowerCase() === "securityevents" ? "SecurityEvent" : tableName;
  const sourceRows = tables[actualTableName];
  if (!sourceRows) {
    const available = Object.keys(tables).join(", ");
    return {
      columns: [],
      rows: [],
      rowsScanned: 0,
      error: `Syntax Error: Every KQL query must start with a valid table name (e.g., SecurityEvent). Unknown table "${tableName}". Available tables: ${available}`,
    };
  }

  let rows: KqlRow[] = sourceRows.map((r) => ({ ...r }));
  const rowsScanned = rows.length;
  let columns = columnsOf(rows);

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const lower = seg.toLowerCase();

    try {
      if (lower.startsWith("where ")) {
        const expr = seg.slice("where ".length);
        rows = rows.filter((r) => evalWhere(r, expr));
      } else if (lower.startsWith("search ")) {
        const keyword = stripQuotes(seg.slice("search ".length));
        rows = rows.filter((r) => {
          return Object.values(r).some(v => String(v).toLowerCase().includes(keyword.toLowerCase()));
        });
      } else if (lower.startsWith("summarize ")) {
        const body = seg.slice("summarize ".length);
        const byIdx = body.toLowerCase().indexOf(" by ");
        const aggPart = (byIdx >= 0 ? body.slice(0, byIdx) : body).trim();
        const byCols = byIdx >= 0 ? body.slice(byIdx + 4).split(",").map((c) => c.trim()).filter(Boolean) : [];
        // alias for count()
        let alias = "count_";
        const eqIdx = aggPart.indexOf("=");
        if (eqIdx >= 0) alias = aggPart.slice(0, eqIdx).trim() || "count_";
        const groups = new Map<string, KqlRow>();
        rows.forEach((r) => {
          const key = byCols.map((c) => String(r[c] ?? "")).join("||");
          const existing = groups.get(key);
          if (existing) {
            (existing[alias] as number) = (existing[alias] as number) + 1;
          } else {
            const base: KqlRow = {};
            byCols.forEach((c) => (base[c] = r[c] ?? ""));
            base[alias] = 1;
            groups.set(key, base);
          }
        });
        rows = [...groups.values()];
        columns = [...byCols, alias];
      } else if (lower.startsWith("project ")) {
        const cols = seg.slice("project ".length).split(",").map((c) => c.trim()).filter(Boolean);
        rows = rows.map((r) => {
          const out: KqlRow = {};
          cols.forEach((c) => (out[c] = r[c] ?? ""));
          return out;
        });
        columns = cols;
      } else if (lower.startsWith("distinct ")) {
        const cols = seg.slice("distinct ".length).split(",").map((c) => c.trim()).filter(Boolean);
        const seen = new Set<string>();
        const out: KqlRow[] = [];
        rows.forEach((r) => {
          const key = cols.map((c) => String(r[c] ?? "")).join("||");
          if (!seen.has(key)) {
            seen.add(key);
            const o: KqlRow = {};
            cols.forEach((c) => (o[c] = r[c] ?? ""));
            out.push(o);
          }
        });
        rows = out;
        columns = cols;
      } else if (lower.startsWith("order by ") || lower.startsWith("sort by ")) {
        const body = seg.slice(lower.startsWith("order by ") ? "order by ".length : "sort by ".length);
        const tokens = body.trim().split(/\s+/);
        const col = tokens[0];
        const desc = (tokens[1] ?? "desc").toLowerCase() !== "asc";
        rows = [...rows].sort((a, b) => cmp(a[col], b[col], desc));
      } else if (lower.startsWith("top ")) {
        const m = seg.match(/^top\s+(\d+)\s+by\s+(\S+)(?:\s+(asc|desc))?/i);
        if (m) {
          const n = parseInt(m[1], 10);
          const col = m[2];
          const desc = (m[3] ?? "desc").toLowerCase() !== "asc";
          rows = [...rows].sort((a, b) => cmp(a[col], b[col], desc)).slice(0, n);
        }
      } else if (lower.startsWith("limit ") || lower.startsWith("take ")) {
        const n = parseInt(seg.replace(/[^0-9]/g, ""), 10);
        if (!Number.isNaN(n)) rows = rows.slice(0, n);
      } else if (lower === "count") {
        rows = [{ count_: rows.length }];
        columns = ["count_"];
      } else if (lower.startsWith("extend ")) {
        const body = seg.slice("extend ".length).trim();
        const eqIdx = body.indexOf("=");
        if (eqIdx > 0) {
          const newCol = body.slice(0, eqIdx).trim();
          const expr = body.slice(eqIdx + 1).trim();
          if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
             const val = stripQuotes(expr);
             rows = rows.map(r => ({...r, [newCol]: val}));
          } else if (!isNaN(Number(expr))) {
             const val = Number(expr);
             rows = rows.map(r => ({...r, [newCol]: val}));
          } else {
             rows = rows.map(r => ({...r, [newCol]: r[expr] ?? ""}));
          }
          if (!columns.includes(newCol)) columns.push(newCol);
        }
      } else if (lower.startsWith("project-away ")) {
        const colsToRemove = seg.slice("project-away ".length).split(",").map((c) => c.trim()).filter(Boolean);
        rows = rows.map((r) => {
          const out = { ...r };
          colsToRemove.forEach((c) => delete out[c]);
          return out;
        });
        columns = columns.filter((c) => !colsToRemove.includes(c));
      } else {
        return { columns, rows: [], rowsScanned, error: `Unsupported operator: "${seg}"`, tableName };
      }
    } catch (e) {
      return { columns, rows: [], rowsScanned, error: `Error in "${seg}": ${(e as Error).message}`, tableName };
    }
  }

  // recompute columns if a project/summarize didn't fix them
  if (columns.length === 0 && rows.length > 0) columns = columnsOf(rows);
  return { columns, rows, rowsScanned, tableName };
}

function cmp(a: KqlValue | undefined, b: KqlValue | undefined, desc: boolean): number {
  const an = typeof a === "number" ? a : Number(a);
  const bn = typeof b === "number" ? b : Number(b);
  let result: number;
  if (!Number.isNaN(an) && !Number.isNaN(bn)) {
    result = an - bn;
  } else {
    result = String(a ?? "").localeCompare(String(b ?? ""));
  }
  return desc ? -result : result;
}
