/**
 * Parses World Cup Wiki–style squad PDF (non-official aggregation; see PDF disclaimer)
 * into canonical JSON. Provenance: matches.source_id / callups.source_id =
 * "worldcupwiki_squad_hub".
 */
import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const ROOT = process.cwd();
const CANON = path.join(ROOT, "data", "canonical");
const SOURCE_ID = "worldcupwiki_squad_hub";
const WINDOW_ISO = "2026-03-25T14:00:00.000Z";
const UNKNOWN_DOB = "1900-01-01";

const PDF_TEAM_MAP = {
  Algeria: "t31",
  Argentina: "t17",
  Australia: "t32",
  Austria: "t33",
  Belgium: "t34",
  "Bosnia & Herzegovina": "t06",
  Brazil: "t18",
  Canada: "t03",
  "Cape Verde": "t27",
  Colombia: "t20",
  Croatia: "t35",
  Curaçao: "t12",
  Czechia: "t36",
  "DR Congo": "t28",
  Ecuador: "t21",
  Egypt: "t26",
  England: "t39",
  France: "t30",
  Germany: "t37",
  Ghana: "t38",
  Haiti: "t13",
  Iran: "t40",
  Iraq: "t16",
  "Ivory Coast": "t41",
  Japan: "t09",
  Jordan: "t15",
  Mexico: "t01",
  Morocco: "t24",
  Netherlands: "t08",
  "New Zealand": "t23",
  Norway: "t42",
  Panama: "t43",
  Paraguay: "t22",
  Portugal: "t44",
  Qatar: "t05",
  "Saudi Arabia": "t45",
  Scotland: "t46",
  Senegal: "t25",
  "South Africa": "t02",
  "South Korea": "t47",
  Spain: "t29",
  Sweden: "t07",
  Switzerland: "t04",
  Tunisia: "t10",
  Türkiye: "t48",
  "United States": "t11",
  Uruguay: "t19",
  Uzbekistan: "t14",
};

const COUNTRY_ORDER = [
  "Algeria",
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Bosnia & Herzegovina",
  "Brazil",
  "Canada",
  "Cape Verde",
  "Colombia",
  "Croatia",
  "Curaçao",
  "Czechia",
  "DR Congo",
  "Ecuador",
  "Egypt",
  "England",
  "France",
  "Germany",
  "Ghana",
  "Haiti",
  "Iran",
  "Iraq",
  "Ivory Coast",
  "Japan",
  "Jordan",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Norway",
  "Panama",
  "Paraguay",
  "Portugal",
  "Qatar",
  "Saudi Arabia",
  "Scotland",
  "Senegal",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Tunisia",
  "Türkiye",
  "United States",
  "Uruguay",
  "Uzbekistan",
];

const NAT_BY_TEAM = {
  t01: "MEX",
  t02: "RSA",
  t03: "CAN",
  t04: "CHE",
  t05: "QAT",
  t06: "BIH",
  t07: "SWE",
  t08: "NED",
  t09: "JPN",
  t10: "TUN",
  t11: "USA",
  t12: "CUW",
  t13: "HAI",
  t14: "UZB",
  t15: "JOR",
  t16: "IRQ",
  t17: "ARG",
  t18: "BRA",
  t19: "URU",
  t20: "COL",
  t21: "ECU",
  t22: "PAR",
  t23: "NZL",
  t24: "MAR",
  t25: "SEN",
  t26: "EGY",
  t27: "CPV",
  t28: "COD",
  t29: "ESP",
  t30: "FRA",
  t31: "ALG",
  t32: "AUS",
  t33: "AUT",
  t34: "BEL",
  t35: "CRO",
  t36: "CZE",
  t37: "GER",
  t38: "GHA",
  t39: "ENG",
  t40: "IRN",
  t41: "CIV",
  t42: "NOR",
  t43: "PAN",
  t44: "POR",
  t45: "KSA",
  t46: "SCO",
  t47: "KOR",
  t48: "TUR",
};

const NEW_TEAMS = [
  {
    team_id: "t31",
    name: "Algeria",
    short_name: "ALG",
    confederation: "CAF",
    qualification_method: "CAF Qualifier",
    qualification_status: "qualified",
    fifa_rank: 32,
    world_cup_group: "J",
  },
  {
    team_id: "t32",
    name: "Australia",
    short_name: "AUS",
    confederation: "AFC",
    qualification_method: "AFC Qualifier",
    qualification_status: "qualified",
    fifa_rank: 24,
    world_cup_group: "D",
  },
  {
    team_id: "t33",
    name: "Austria",
    short_name: "AUT",
    confederation: "UEFA",
    qualification_method: "UEFA Qualifier",
    qualification_status: "qualified",
    fifa_rank: 22,
    world_cup_group: "J",
  },
  {
    team_id: "t34",
    name: "Belgium",
    short_name: "BEL",
    confederation: "UEFA",
    qualification_method: "UEFA Qualifier",
    qualification_status: "qualified",
    fifa_rank: 5,
    world_cup_group: "G",
  },
  {
    team_id: "t35",
    name: "Croatia",
    short_name: "CRO",
    confederation: "UEFA",
    qualification_method: "UEFA Qualifier",
    qualification_status: "qualified",
    fifa_rank: 10,
    world_cup_group: "L",
  },
  {
    team_id: "t36",
    name: "Czechia",
    short_name: "CZE",
    confederation: "UEFA",
    qualification_method: "UEFA Playoff",
    qualification_status: "qualified",
    fifa_rank: 31,
    world_cup_group: "A",
  },
  {
    team_id: "t37",
    name: "Germany",
    short_name: "GER",
    confederation: "UEFA",
    qualification_method: "UEFA Qualifier",
    qualification_status: "qualified",
    fifa_rank: 9,
    world_cup_group: "E",
  },
  {
    team_id: "t38",
    name: "Ghana",
    short_name: "GHA",
    confederation: "CAF",
    qualification_method: "CAF Qualifier",
    qualification_status: "qualified",
    fifa_rank: 68,
    world_cup_group: "L",
  },
  {
    team_id: "t39",
    name: "England",
    short_name: "ENG",
    confederation: "UEFA",
    qualification_method: "UEFA Qualifier",
    qualification_status: "qualified",
    fifa_rank: 4,
    world_cup_group: "L",
  },
  {
    team_id: "t40",
    name: "Iran",
    short_name: "IRN",
    confederation: "AFC",
    qualification_method: "AFC Qualifier",
    qualification_status: "qualified",
    fifa_rank: 21,
    world_cup_group: "G",
  },
  {
    team_id: "t41",
    name: "Ivory Coast",
    short_name: "CIV",
    confederation: "CAF",
    qualification_method: "CAF Qualifier",
    qualification_status: "qualified",
    fifa_rank: 36,
    world_cup_group: "E",
  },
  {
    team_id: "t42",
    name: "Norway",
    short_name: "NOR",
    confederation: "UEFA",
    qualification_method: "UEFA Qualifier",
    qualification_status: "qualified",
    fifa_rank: 43,
    world_cup_group: "I",
  },
  {
    team_id: "t43",
    name: "Panama",
    short_name: "PAN",
    confederation: "CONCACAF",
    qualification_method: "CONCACAF Qualifier",
    qualification_status: "qualified",
    fifa_rank: 41,
    world_cup_group: "L",
  },
  {
    team_id: "t44",
    name: "Portugal",
    short_name: "POR",
    confederation: "UEFA",
    qualification_method: "UEFA Qualifier",
    qualification_status: "qualified",
    fifa_rank: 6,
    world_cup_group: "K",
  },
  {
    team_id: "t45",
    name: "Saudi Arabia",
    short_name: "KSA",
    confederation: "AFC",
    qualification_method: "AFC Qualifier",
    qualification_status: "qualified",
    fifa_rank: 58,
    world_cup_group: "H",
  },
  {
    team_id: "t46",
    name: "Scotland",
    short_name: "SCO",
    confederation: "UEFA",
    qualification_method: "UEFA Qualifier",
    qualification_status: "qualified",
    fifa_rank: 39,
    world_cup_group: "C",
  },
  {
    team_id: "t47",
    name: "South Korea",
    short_name: "KOR",
    confederation: "AFC",
    qualification_method: "AFC Qualifier",
    qualification_status: "qualified",
    fifa_rank: 23,
    world_cup_group: "A",
  },
  {
    team_id: "t48",
    name: "Turkey",
    short_name: "TUR",
    confederation: "UEFA",
    qualification_method: "UEFA Playoff",
    qualification_status: "qualified",
    fifa_rank: 35,
    world_cup_group: "D",
  },
];

function normalizeText(s) {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/g, "\n")
    .replace(/FIFAWORLDCUP2026[\s\S]*?ALL48TEAMS/g, "\n")
    .replace(/26PLAYERSPERTEAM[\s\S]*?TOT/g, "\n");
}

function splitCsvRespectingParens(s) {
  const out = [];
  let buf = "";
  let depth = 0;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function extractPositionBlock(flat, label) {
  const re = new RegExp(
    `${label}:\\s*(.+?)(?=\\s*(?:Goalkeepers|Defenders|Midfielders|Forwards):|$)`,
    "is",
  );
  const m = flat.match(re);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

function parsePlayerEntry(raw, pos) {
  const m = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!m) return null;
  let name = m[1].trim().replace(/\s+/g, " ");
  const clubRaw = m[2].trim();
  let availNote = "";
  if (
    /ruled out|achilles rupture|acl tear|torn acl|hamstring surgery,\s*doubt|world cup dream is over/i.test(
      clubRaw,
    )
  ) {
    availNote = "injured_out";
  } else if (
    /doubt|uncertain|fitness watch|recovering|major doubt|injury doubt|hamstring injury/i.test(
      clubRaw,
    )
  ) {
    availNote = "doubtful_inline";
  }
  name = name.replace(/, captain$/i, "").replace(/, vice-captain$/i, "").trim();
  return { name, clubRaw, pos, availNote };
}

function jaroWinkler(s1, s2) {
  const norm = (t) =>
    t
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  const a = norm(s1);
  const b = norm(s2);
  if (a === b) return 1;
  if (!a || !b) return 0;
  const mDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatch = new Array(a.length).fill(false);
  const bMatch = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i += 1) {
    const start = Math.max(0, i - mDist);
    const end = Math.min(i + mDist + 1, b.length);
    for (let j = start; j < end; j += 1) {
      if (bMatch[j] || a[i] !== b[j]) continue;
      aMatch[i] = true;
      bMatch[j] = true;
      matches += 1;
      break;
    }
  }
  if (!matches) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (!aMatch[i]) continue;
    while (!bMatch[k]) k += 1;
    if (a[i] !== b[k]) t += 1;
    k += 1;
  }
  const transpositions = t / 2;
  const jaro =
    (matches / a.length + matches / b.length + (matches - transpositions) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i += 1) {
    if (a[i] === b[i]) prefix += 1;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

function extractCountrySection(full, country, nextCountry) {
  const anchored = `\n${country}\nManager:`;
  let bodyStart = -1;
  const i0 = full.indexOf(anchored);
  if (i0 !== -1) {
    bodyStart = i0 + `\n${country}\n`.length;
  } else {
    const fb = `\n${country}\n`;
    const i1 = full.indexOf(fb);
    if (i1 === -1) return "";
    bodyStart = i1 + fb.length;
  }
  let end = -1;
  if (nextCountry) {
    const nextA = `\n${nextCountry}\nManager:`;
    const nextB = `\n${nextCountry}\n`;
    const eA = full.indexOf(nextA, bodyStart);
    const eB = full.indexOf(nextB, bodyStart);
    const candidates = [eA, eB].filter((x) => x !== -1);
    end = candidates.length ? Math.min(...candidates) : -1;
  }
  if (end === -1) end = full.indexOf("\nFIFA World Cup 2026 Squads FAQ", bodyStart);
  if (end === -1) end = full.length;
  return full.slice(bodyStart, end);
}

function parseInjuryLines(section) {
  const blocks = [];
  const re = /Injury updates[^:]*:\s*([\s\S]+?)(?=Goalkeepers:|$)/gi;
  let m;
  while ((m = re.exec(section)) !== null) {
    blocks.push(m[1].replace(/\s+/g, " ").trim());
  }
  const entries = [];
  for (const b of blocks) {
    const parts = b.split(/\),\s+/).map((p) => (p.endsWith(")") ? p : `${p})`));
    for (let part of parts) {
      part = part.trim();
      if (!part) continue;
      const mm = part.match(/^(.+?)\s*\((.+)\)\s*$/);
      if (!mm) continue;
      const name = mm[1].trim();
      const detail = mm[2].trim();
      let status = "doubtful";
      let reason = "injury";
      if (
        /ruled out|ACL tear|rupture|World Cup dream is over/i.test(detail) ||
        (/out for the season/i.test(detail) && !/serious doubt|in serious doubt|fitness watch/i.test(detail))
      ) {
        status = "unavailable";
        reason = "injury";
      } else if (
        /doubt|uncertain|recovering|watch|scare|slim|race against time|expected to be fit/i.test(detail)
      ) {
        status = "doubtful";
        reason = "injury";
      }
      entries.push({ name, detail, status, reason });
    }
  }
  return entries;
}

function findPlayerId(name, teamId, pool) {
  let bestId = null;
  let best = 0;
  for (const row of pool) {
    if (row.team_id !== teamId) continue;
    const sc = jaroWinkler(name, row.canonical_name);
    if (sc > best) {
      best = sc;
      bestId = row.player_id;
    }
  }
  return best >= 0.88 ? bestId : null;
}

async function loadTeamsBase() {
  const p = path.join(CANON, "teams.json");
  const existing = JSON.parse(await fs.readFile(p, "utf-8"));
  const byId = new Map(existing.map((t) => [t.team_id, t]));
  for (const nt of NEW_TEAMS) {
    byId.set(nt.team_id, nt);
  }
  return [...byId.values()].sort((a, b) => a.team_id.localeCompare(b.team_id));
}

async function main() {
  const pdfPath =
    process.argv[2] ||
    process.env.WC_WIKI_PDF ||
    path.join(ROOT, "data", "raw", "worldcupwiki-squads-2026.pdf");

  const buf = await fs.readFile(pdfPath);
  const parser = new PDFParse({ data: buf });
  const extracted = await parser.getText();
  await parser.destroy();
  const full = normalizeText(extracted.text);

  const teams = await loadTeamsBase();
  const teamIds = new Set(teams.map((t) => t.team_id));

  const squadRows = [];
  for (let i = 0; i < COUNTRY_ORDER.length; i += 1) {
    const c = COUNTRY_ORDER[i];
    const next = COUNTRY_ORDER[i + 1];
    const teamId = PDF_TEAM_MAP[c];
    if (!teamId || !teamIds.has(teamId)) {
      console.warn(`Skip unknown team mapping: ${c}`);
      continue;
    }
    const section = extractCountrySection(full, c, next);
    if (!section.includes("Goalkeepers:")) {
      console.warn(`No roster in PDF for ${c} (${teamId})`);
      continue;
    }
    const flat = section.replace(/\n+/g, " ");
    for (const label of ["Goalkeepers", "Defenders", "Midfielders", "Forwards"]) {
      const block = extractPositionBlock(flat, label);
      if (!block) continue;
      const pos = label === "Goalkeepers" ? "GK" : label === "Defenders" ? "DF" : label === "Midfielders" ? "MF" : "FW";
      for (const piece of splitCsvRespectingParens(block)) {
        const pRow = parsePlayerEntry(piece, pos);
        if (pRow) squadRows.push({ ...pRow, teamId, country: c });
      }
    }
  }

  const dedup = new Map();
  for (const row of squadRows) {
    const key = `${row.teamId}::${row.name.toLowerCase()}`;
    if (!dedup.has(key)) dedup.set(key, row);
  }
  const unique = [...dedup.values()];

  const playersMaster = [];
  const seenIds = new Map();
  let pid = 1;
  for (const row of unique.sort((a, b) => a.teamId.localeCompare(b.teamId) || a.name.localeCompare(b.name))) {
    const player_id = `p${String(pid).padStart(4, "0")}`;
    pid += 1;
    seenIds.set(`${row.teamId}::${row.name.toLowerCase()}`, player_id);
    playersMaster.push({
      player_id,
      canonical_name: row.name,
      dob: UNKNOWN_DOB,
      nationality_iso3: NAT_BY_TEAM[row.teamId] || "UNK",
      team_id: row.teamId,
    });
  }

  const matches = [];
  const callups = [];
  let cid = 1;
  const matchTeams = new Set(unique.map((u) => u.teamId));
  for (const tid of matchTeams) {
    const match_id = `m_wiki_${tid}`;
    matches.push({
      match_id,
      date: WINDOW_ISO,
      home_team_id: tid,
      away_team_id: tid,
      stage: "group",
      group_name: null,
      status: "scheduled",
      competition_type: "friendly",
      source_tier: "bronze",
      source_confidence_multiplier: 0.82,
      source_id: SOURCE_ID,
    });
  }

  for (const row of unique) {
    const player_id = seenIds.get(`${row.teamId}::${row.name.toLowerCase()}`);
    callups.push({
      record_id: `c_wiki_${String(cid).padStart(5, "0")}`,
      player_id,
      match_id: `m_wiki_${row.teamId}`,
      team_id: row.teamId,
      status: "bench",
      minutes_played: 0,
      projected_squad_date: "2026-06-11",
      squad_position_group: row.pos,
      source_id: SOURCE_ID,
    });
    cid += 1;
  }

  const OVERRIDE_RANK = { unavailable: 4, injured: 3, doubtful: 2, suspended: 3, available: 0 };

  const overridesDraft = [];

  for (const row of unique) {
    const player_id = seenIds.get(`${row.teamId}::${row.name.toLowerCase()}`);
    if (row.availNote === "injured_out") {
      overridesDraft.push({
        player_id,
        start_date: "2026-03-01",
        end_date: null,
        reason: "injury",
        status: "injured",
        notes: "Marked on WorldCupWiki-style squad list source",
      });
    } else if (row.availNote === "doubtful_inline") {
      overridesDraft.push({
        player_id,
        start_date: "2026-03-01",
        end_date: null,
        reason: "injury",
        status: "doubtful",
        notes: "Inline fitness note from WorldCupWiki-style squad list",
      });
    }
  }

  for (let i = 0; i < COUNTRY_ORDER.length; i += 1) {
    const c = COUNTRY_ORDER[i];
    const next = COUNTRY_ORDER[i + 1];
    const teamId = PDF_TEAM_MAP[c];
    if (!teamId || !matchTeams.has(teamId)) continue;
    const section = extractCountrySection(full, c, next);
    const inj = parseInjuryLines(section);
    for (const e of inj) {
      const pool = playersMaster.filter((p) => p.team_id === teamId);
      const id = findPlayerId(e.name, teamId, pool);
      if (!id) continue;
      overridesDraft.push({
        player_id: id,
        start_date: "2026-03-01",
        end_date: null,
        reason: e.reason,
        status: e.status === "unavailable" ? "unavailable" : "doubtful",
        notes: e.detail.slice(0, 200),
      });
    }
  }

  const byPid = new Map();
  for (const o of overridesDraft) {
    const r = OVERRIDE_RANK[o.status] ?? 0;
    const prev = byPid.get(o.player_id);
    const pr = prev ? OVERRIDE_RANK[prev.status] ?? 0 : -1;
    if (!prev || r > pr || (r === pr && (o.notes?.length ?? 0) > (prev.notes?.length ?? 0))) {
      byPid.set(o.player_id, o);
    }
  }
  const overrides = [...byPid.values()].map((o, i) => ({
    override_id: `o_wiki_${String(i + 1).padStart(4, "0")}`,
    ...o,
  }));

  const aliases = [];

  await fs.mkdir(CANON, { recursive: true });
  await fs.mkdir(path.join(ROOT, "data", "raw"), { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(CANON, "teams.json"), JSON.stringify(teams, null, 2)),
    fs.writeFile(path.join(CANON, "players_master.json"), JSON.stringify(playersMaster, null, 2)),
    fs.writeFile(path.join(CANON, "player_aliases.json"), JSON.stringify(aliases, null, 2)),
    fs.writeFile(path.join(CANON, "matches.json"), JSON.stringify(matches, null, 2)),
    fs.writeFile(path.join(CANON, "callups_or_appearances.json"), JSON.stringify(callups, null, 2)),
    fs.writeFile(path.join(CANON, "availability_overrides.json"), JSON.stringify(overrides, null, 2)),
  ]);

  console.log(
    `Ingest complete: ${teams.length} teams, ${playersMaster.length} players, ${matches.length} synthetic window matches, ${callups.length} call-ups, ${overrides.length} availability rows, ${aliases.length} aliases.`,
  );
  console.log(`Source: ${SOURCE_ID} | PDF: ${pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
