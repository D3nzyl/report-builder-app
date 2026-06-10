import type { Collection, CollectionRow, CollectionColumn, CollectionCellValue } from "./types";

export const sampleCollections: Collection[] = [
  {
    id: "workers",
    name: "workers",
    variableKey: "workers",
    columns: [
      { key: "name",        label: "Name",        type: "text" },
      { key: "id",          label: "Worker ID",   type: "text" },
      { key: "trade",       label: "Trade",       type: "text" },
      { key: "ppe_ok",      label: "PPE OK",      type: "boolean" },
      { key: "temperature", label: "Temperature", type: "number" },
    ],
    rows: [
      { name: "John Tan",   id: "W001", trade: "Electrician",   ppe_ok: true,  temperature: 36.5 },
      { name: "Sarah Lim",  id: "W002", trade: "Supervisor",    ppe_ok: true,  temperature: 36.8 },
      { name: "Raj Kumar",  id: "W003", trade: "Rigger",        ppe_ok: false, temperature: 37.1 },
      { name: "Ali Hassan", id: "W004", trade: "Welder",        ppe_ok: true,  temperature: 36.6 },
      { name: "Chen Wei",   id: "W005", trade: "Scaffolder",    ppe_ok: true,  temperature: 36.4 },
    ],
  },
  {
    id: "col_equipment",
    name: "Equipment Checklist",
    variableKey: "equipment",
    columns: [
      { key: "item",        label: "Item",         type: "text" },
      { key: "serial",      label: "Serial No.",   type: "text" },
      { key: "status",      label: "Status",       type: "text" },
      { key: "last_checked", label: "Last Checked", type: "date" },
      { key: "next_due",    label: "Next Due",     type: "date" },
    ],
    rows: [
      { item: "Safety Harness",     serial: "SH-001", status: "Pass",    last_checked: "2026-05-15", next_due: "2026-08-15" },
      { item: "Fire Extinguisher",  serial: "FE-003", status: "Pass",    last_checked: "2026-05-10", next_due: "2026-11-10" },
      { item: "First Aid Kit",      serial: "FA-007", status: "Pass",    last_checked: "2026-05-22", next_due: "2026-08-22" },
      { item: "Gas Detector",       serial: "GD-012", status: "Fail",    last_checked: "2026-05-01", next_due: "2026-06-01" },
      { item: "Scaffolding Clamps", serial: "SC-044", status: "Pass",    last_checked: "2026-05-20", next_due: "2026-08-20" },
    ],
  },
  {
    id: "col_hazards",
    name: "Hazard Observations",
    variableKey: "hazards",
    columns: [
      { key: "location",    label: "Location",    type: "text" },
      { key: "description", label: "Description", type: "text" },
      { key: "severity",    label: "Severity",    type: "text" },
      { key: "reported_by", label: "Reported By", type: "text" },
      { key: "resolved",    label: "Resolved",    type: "boolean" },
    ],
    rows: [
      { location: "Level 3 - Zone A", description: "Loose scaffold board",          severity: "High",   reported_by: "John Tan",  resolved: false },
      { location: "Site Entry",       description: "Missing safety signage",         severity: "Medium", reported_by: "Sarah Lim", resolved: true  },
      { location: "Level 2 - Zone C", description: "Exposed electrical cable",       severity: "High",   reported_by: "Raj Kumar", resolved: false },
      { location: "Storage Area",     description: "Chemical containers unlabelled", severity: "Low",    reported_by: "Ali Hassan", resolved: true },
    ],
  },
];

// ─── Simple SQL executor ──────────────────────────────────────────────────────

export interface QueryResult {
  columns: CollectionColumn[];
  rows: CollectionRow[];
  error?: string;
}

function tokenize(sql: string): string[] {
  // Split by whitespace, commas, preserve quoted strings
  const tokens: string[] = [];
  let i = 0;
  while (i < sql.length) {
    if (sql[i] === " " || sql[i] === "\n" || sql[i] === "\r" || sql[i] === "\t") { i++; continue; }
    if (sql[i] === ",") { tokens.push(","); i++; continue; }
    if (sql[i] === "'" || sql[i] === '"') {
      const q = sql[i]; let s = ""; i++;
      while (i < sql.length && sql[i] !== q) s += sql[i++];
      i++; tokens.push(s);
      continue;
    }
    let word = "";
    while (i < sql.length && sql[i] !== " " && sql[i] !== "\n" && sql[i] !== "\t" && sql[i] !== "," && sql[i] !== "'" && sql[i] !== '"') {
      word += sql[i++];
    }
    if (word) tokens.push(word);
  }
  return tokens;
}

export function executeQuery(sql: string, collections: Collection[]): QueryResult {
  try {
    const tokens = tokenize(sql.trim());
    const upper = tokens.map(t => t.toUpperCase());

    // Must start with SELECT
    if (upper[0] !== "SELECT") return { columns: [], rows: [], error: "Query must start with SELECT" };

    // Find FROM index
    const fromIdx = upper.indexOf("FROM");
    if (fromIdx === -1) return { columns: [], rows: [], error: "Missing FROM clause" };

    // Parse column expressions between SELECT and FROM, splitting on commas
    // Each expression may be: col | col AS alias
    const colTokens = tokens.slice(1, fromIdx);
    const colExprs: string[][] = [];
    let cur: string[] = [];
    for (const tok of colTokens) {
      if (tok === ",") { if (cur.length) { colExprs.push(cur); cur = []; } }
      else cur.push(tok);
    }
    if (cur.length) colExprs.push(cur);

    type ParsedCol = { sourceKey: string; label: string | null };
    const parsedCols: ParsedCol[] = colExprs.map(expr => {
      if (expr.length === 3 && expr[1].toUpperCase() === "AS") {
        return { sourceKey: expr[0].toLowerCase(), label: expr[2] };
      }
      return { sourceKey: expr[0]?.toLowerCase() ?? "", label: null };
    });

    const isSelectAll = parsedCols.length === 1 && parsedCols[0].sourceKey === "*";

    // Table name
    const tableNameRaw = tokens[fromIdx + 1];
    if (!tableNameRaw) return { columns: [], rows: [], error: "Missing table name after FROM" };
    const tableName = tableNameRaw.toLowerCase();

    const collection = collections.find(c => c.variableKey.toLowerCase() === tableName);
    if (!collection) return { columns: [], rows: [], error: `Unknown table "${tableName}"` };

    // Find WHERE / LIMIT indices
    const whereIdx = upper.indexOf("WHERE", fromIdx);
    const limitIdx = upper.indexOf("LIMIT", fromIdx);

    // Parse WHERE (simple: col = value, col != value)
    type WhereClause = { col: string; op: "=" | "!="; val: string };
    const whereClauses: WhereClause[] = [];
    if (whereIdx !== -1) {
      const endIdx = limitIdx !== -1 ? limitIdx : tokens.length;
      const whereParts = tokens.slice(whereIdx + 1, endIdx);
      // Support: col = val AND col2 = val2
      let wi = 0;
      while (wi < whereParts.length) {
        const col = whereParts[wi]?.toLowerCase();
        const op = whereParts[wi + 1];
        const val = whereParts[wi + 2]?.toLowerCase();
        if (col && (op === "=" || op === "!=") && val !== undefined) {
          whereClauses.push({ col, op: op as "=" | "!=", val });
          wi += 3;
          if (whereParts[wi]?.toUpperCase() === "AND") wi++;
        } else break;
      }
    }

    // Parse LIMIT
    let limit: number | null = null;
    if (limitIdx !== -1 && tokens[limitIdx + 1]) {
      const n = parseInt(tokens[limitIdx + 1], 10);
      if (!isNaN(n)) limit = n;
    }

    // Resolve columns — keep sourceKey for row projection, apply alias as label
    let resolvedColumns: CollectionColumn[];
    let sourceKeys: string[];
    if (isSelectAll) {
      resolvedColumns = collection.columns;
      sourceKeys = collection.columns.map(c => c.key);
    } else {
      resolvedColumns = parsedCols.map(({ sourceKey, label }) => {
        const found = collection.columns.find(c => c.key.toLowerCase() === sourceKey);
        return found
          ? { ...found, label: label ?? found.label }
          : { key: sourceKey, label: label ?? sourceKey, type: "text" as const };
      });
      sourceKeys = parsedCols.map(p => p.sourceKey);
    }

    // Filter rows
    let rows = collection.rows.filter(row =>
      whereClauses.every(({ col, op, val }) => {
        const cellVal = String(row[col] ?? "").toLowerCase();
        return op === "=" ? cellVal === val : cellVal !== val;
      })
    );

    // Apply LIMIT
    if (limit !== null) rows = rows.slice(0, limit);

    // Project columns — use sourceKey for lookup, store under the resolved column key
    const projectedRows: CollectionRow[] = rows.map(row => {
      const out: CollectionRow = {};
      resolvedColumns.forEach((c, i) => { out[c.key] = row[sourceKeys[i]] ?? ""; });
      return out;
    });

    return { columns: resolvedColumns, rows: projectedRows };
  } catch (e) {
    return { columns: [], rows: [], error: String(e) };
  }
}
