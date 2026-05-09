import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, "data", "raw");

const TEAMS = [
  ["Argentina", "CONMEBOL", "CONMEBOL qualification", "qualified"],
  ["Brazil", "CONMEBOL", "CONMEBOL qualification", "qualified"],
  ["Ecuador", "CONMEBOL", "CONMEBOL qualification", "qualified"],
  ["Uruguay", "CONMEBOL", "CONMEBOL qualification", "qualified"],
  ["Canada", "Host", "Host nation", "qualified"],
  ["Mexico", "Host", "Host nation", "qualified"],
  ["United States", "Host", "Host nation", "qualified"],
  ["Japan", "AFC", "AFC qualification", "qualified"],
  ["South Korea", "AFC", "AFC qualification", "qualified"],
  ["Iran", "AFC", "AFC qualification", "qualified"],
  ["Australia", "AFC", "AFC qualification", "qualified"],
  ["Uzbekistan", "AFC", "AFC qualification", "qualified"],
  ["Jordan", "AFC", "AFC qualification", "qualified"],
  ["New Zealand", "OFC", "OFC qualification", "qualified"],
  ["France", "UEFA", "UEFA qualification", "tracked"],
  ["England", "UEFA", "UEFA qualification", "tracked"],
  ["Spain", "UEFA", "UEFA qualification", "tracked"],
  ["Portugal", "UEFA", "UEFA qualification", "tracked"],
  ["Germany", "UEFA", "UEFA qualification", "tracked"],
  ["Italy", "UEFA", "UEFA qualification", "tracked"],
  ["Morocco", "CAF", "CAF qualification", "tracked"],
  ["Senegal", "CAF", "CAF qualification", "tracked"],
  ["Egypt", "CAF", "CAF qualification", "tracked"],
  ["Nigeria", "CAF", "CAF qualification", "tracked"],
];

const corePlayers = {
  Argentina: ["Emiliano Martinez", "Cristian Romero", "Nicolas Otamendi", "Enzo Fernandez", "Alexis Mac Allister", "Rodrigo De Paul", "Lionel Messi", "Julian Alvarez", "Lautaro Martinez"],
  Brazil: ["Alisson", "Marquinhos", "Gabriel Magalhaes", "Bruno Guimaraes", "Joao Gomes", "Raphinha", "Vinicius Junior", "Rodrygo", "Endrick"],
  Ecuador: ["Hernan Galindez", "Piero Hincapie", "Felix Torres", "Pervis Estupinan", "Moises Caicedo", "Alan Franco", "Kendry Paez", "Enner Valencia"],
  Uruguay: ["Sergio Rochet", "Ronald Araujo", "Jose Maria Gimenez", "Federico Valverde", "Manuel Ugarte", "Nicolas de la Cruz", "Darwin Nunez", "Facundo Pellistri"],
  Canada: ["Dayne St. Clair", "Alphonso Davies", "Alistair Johnston", "Derek Cornelius", "Stephen Eustaquio", "Ismael Kone", "Jonathan David", "Cyle Larin"],
  Mexico: ["Luis Malagon", "Johan Vazquez", "Cesar Montes", "Edson Alvarez", "Luis Chavez", "Orbelin Pineda", "Hirving Lozano", "Santiago Gimenez"],
  "United States": ["Matt Turner", "Sergino Dest", "Chris Richards", "Antonee Robinson", "Tyler Adams", "Weston McKennie", "Christian Pulisic", "Folarin Balogun"],
  Japan: ["Zion Suzuki", "Ko Itakura", "Takehiro Tomiyasu", "Wataru Endo", "Hidemasa Morita", "Kaoru Mitoma", "Takefusa Kubo", "Ayase Ueda"],
  "South Korea": ["Jo Hyeon-woo", "Kim Min-jae", "Kim Young-gwon", "Hwang In-beom", "Lee Kang-in", "Son Heung-min", "Hwang Hee-chan", "Cho Gue-sung"],
  Iran: ["Alireza Beiranvand", "Shoja Khalilzadeh", "Saeid Ezatolahi", "Mehdi Taremi", "Sardar Azmoun"],
  Australia: ["Mathew Ryan", "Harry Souttar", "Aziz Behich", "Jackson Irvine", "Aiden O'Neill", "Craig Goodwin", "Mitchell Duke"],
  Uzbekistan: ["Utkir Yusupov", "Rustam Ashurmatov", "Abdukodir Khusanov", "Odiljon Hamrobekov", "Jaloliddin Masharipov", "Eldor Shomurodov"],
  Jordan: ["Yazeed Abu Laila", "Abdallah Nasib", "Yazan Al Arab", "Mousa Al-Taamari", "Yazan Al Naimat"],
  "New Zealand": ["Max Crocombe", "Liberato Cacace", "Tommy Smith", "Marko Stamenic", "Joe Bell", "Chris Wood"],
  France: ["Mike Maignan", "William Saliba", "Jules Kounde", "Theo Hernandez", "Aurelien Tchouameni", "Eduardo Camavinga", "Antoine Griezmann", "Kylian Mbappe"],
  England: ["Jordan Pickford", "John Stones", "Declan Rice", "Jude Bellingham", "Bukayo Saka", "Phil Foden", "Harry Kane"],
  Spain: ["Unai Simon", "Aymeric Laporte", "Rodri", "Pedri", "Gavi", "Lamine Yamal", "Alvaro Morata"],
  Portugal: ["Diogo Costa", "Ruben Dias", "Joao Cancelo", "Bruno Fernandes", "Bernardo Silva", "Rafael Leao", "Cristiano Ronaldo"],
  Germany: ["Marc-Andre ter Stegen", "Antonio Rudiger", "Joshua Kimmich", "Ilkay Gundogan", "Jamal Musiala", "Kai Havertz", "Florian Wirtz"],
  Italy: ["Gianluigi Donnarumma", "Alessandro Bastoni", "Federico Dimarco", "Nicolo Barella", "Lorenzo Pellegrini", "Federico Chiesa", "Giacomo Raspadori"],
  Morocco: ["Yassine Bounou", "Achraf Hakimi", "Nayef Aguerd", "Sofyan Amrabat", "Azzedine Ounahi", "Hakim Ziyech", "Youssef En-Nesyri"],
  Senegal: ["Edouard Mendy", "Kalidou Koulibaly", "Abdou Diallo", "Idrissa Gueye", "Pape Sarr", "Sadio Mane", "Nicolas Jackson"],
  Egypt: ["Mohamed El Shenawy", "Ahmed Hegazi", "Omar Marmoush", "Trezeguet", "Mohamed Salah", "Mostafa Mohamed"],
  Nigeria: ["Maduka Okoye", "William Troost-Ekong", "Calvin Bassey", "Alex Iwobi", "Wilfred Ndidi", "Victor Osimhen", "Ademola Lookman"],
};

const fallbackLastNames = [
  "Silva", "Santos", "Costa", "Fernandez", "Lopez", "Torres", "Mendes", "Ibrahim", "Diallo", "Ahmed", "Hassan", "Kim", "Sato", "Nguyen", "Ali", "Khan", "Smith", "Johnson", "Brown", "Miller",
];

function buildRoster(team) {
  const core = [...(corePlayers[team] || [])];
  const roster = [];
  // Position assignment for core by rough order.
  core.forEach((p, idx) => {
    const pos = idx === 0 ? "GK" : idx <= 3 ? "DF" : idx <= 5 ? "MF" : "FW";
    roster.push({ player: p, position: pos, rank: idx + 1 });
  });

  const needed = 40 - roster.length;
  for (let i = 0; i < needed; i += 1) {
    const n = fallbackLastNames[i % fallbackLastNames.length];
    const player = `${team.split(" ")[0]} ${n} ${String(i + 1).padStart(2, "0")}`;
    const slot = i % 4;
    const position = slot === 0 ? "GK" : slot === 1 ? "DF" : slot === 2 ? "MF" : "FW";
    roster.push({ player, position, rank: core.length + i + 1 });
  }
  return roster;
}

function chooseSelected(roster, matchIndex, competitionType) {
  const sorted = [...roster].sort((a, b) => a.rank - b.rank);
  const offset = (matchIndex * 3) % 10;
  const starters = sorted.slice(0 + offset, 11 + offset);
  const bench = sorted.slice(11 + (offset % 6), 23 + (offset % 6));
  const selected = [...new Map([...starters, ...bench].map((p) => [p.player, p])).values()];
  return selected.map((p) => {
    const isStarter = starters.some((s) => s.player === p.player);
    const baseMinutes = isStarter ? 90 : 20 + ((matchIndex + p.rank) % 36);
    const competitionFactor = competitionType === "qualifier" ? 1 : 0.86;
    return {
      ...p,
      starts: isStarter ? 1 : 0,
      minutes: Math.max(0, Math.round(baseMinutes * competitionFactor)),
      selected: 1,
    };
  });
}

function isoDay(offset) {
  const d = new Date(Date.UTC(2025, 0, 1));
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function main() {
  await fs.mkdir(RAW_DIR, { recursive: true });
  const teams = TEAMS.map(([team, confederation, qualifiedVia, qualificationStatus]) => ({
    team,
    confederation,
    qualifiedVia,
    qualificationStatus,
  }));

  const matches = [];
  const callups = [];

  teams.forEach((teamMeta, idx) => {
    const roster = buildRoster(teamMeta.team);
    const opponents = teams.filter((t) => t.team !== teamMeta.team).map((t) => t.team);
    for (let i = 0; i < 10; i += 1) {
      const matchId = `${teamMeta.team.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-q-${i + 1}`;
      const opponent = opponents[(idx + i) % opponents.length];
      const date = isoDay(idx * 14 + i * 21);
      matches.push({ matchId, date, competitionType: "qualifier", team: teamMeta.team, opponent });
      const selected = chooseSelected(roster, i, "qualifier");
      selected.forEach((s) =>
        callups.push({
          matchId,
          team: teamMeta.team,
          player: s.player,
          position: s.position,
          selected: s.selected,
          starts: s.starts,
          minutes: s.minutes,
          date,
        }),
      );
    }
    for (let i = 0; i < 5; i += 1) {
      const matchId = `${teamMeta.team.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-f-${i + 1}`;
      const opponent = opponents[(idx + i + 10) % opponents.length];
      const date = isoDay(260 + idx * 9 + i * 15);
      matches.push({ matchId, date, competitionType: "friendly", team: teamMeta.team, opponent });
      const selected = chooseSelected(roster, i + 10, "friendly");
      selected.forEach((s) =>
        callups.push({
          matchId,
          team: teamMeta.team,
          player: s.player,
          position: s.position,
          selected: s.selected,
          starts: s.starts,
          minutes: s.minutes,
          date,
        }),
      );
    }
  });

  const availabilityOverrides = [
    { team: "Brazil", player: "Neymar Jr", status: "doubtful", reason: "fitness management" },
    { team: "France", player: "William Saliba", status: "injured", reason: "hamstring recovery" },
    { team: "England", player: "Luke Shaw", status: "doubtful", reason: "returning from injury" },
    { team: "Nigeria", player: "Victor Osimhen", status: "available", reason: "fully fit" },
  ];

  await Promise.all([
    fs.writeFile(path.join(RAW_DIR, "teams.json"), JSON.stringify(teams, null, 2)),
    fs.writeFile(path.join(RAW_DIR, "matches.json"), JSON.stringify(matches, null, 2)),
    fs.writeFile(path.join(RAW_DIR, "callups_or_appearances.json"), JSON.stringify(callups, null, 2)),
    fs.writeFile(path.join(RAW_DIR, "availability-overrides.json"), JSON.stringify(availabilityOverrides, null, 2)),
  ]);

  console.log(`Seeded ${teams.length} teams, ${matches.length} matches, ${callups.length} callup rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
