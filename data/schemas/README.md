# Canonical Schema Documentation

This folder defines the normalized, ID-driven data model for the World Cup Squads pipeline.

## Source mapping

Base schema source:
- `gemini-code-1778318603266.json`

Project extensions:
- `qualification_status` in `teams`
- `competition_type`, `source_tier`, and optional `source_id` in `matches`
- `projected_squad_date`, optional `source_id`, and optional `squad_position_group` (`GK`|`DF`|`MF`|`FW`) in `callups_or_appearances`
- `status` in `availability_overrides`

Source allowlist:
- `data/sources/sources.json` enumerates allowed `source_id` values and tier/weight metadata.

## Enum definitions

- `confederation`: `UEFA`, `CAF`, `AFC`, `CONMEBOL`, `CONCACAF`, `OFC`, `Host`
- `qualification_status`: `qualified`, `tracked`
- `competition_type`: `qualifier`, `friendly`
- `source_tier`: `gold`, `silver`, `bronze`, `fallback`
- `callup status`: `starter`, `substitute`, `bench`, `withdrawn`
- `availability status`: `available`, `doubtful`, `injured`, `suspended`, `unavailable`
- `availability reason`: `injury`, `suspension`, `personal`, `other`

## Field intent

- `projected_squad_date`: timestamp-style marker for editorial separation between projected and confirmed squads.
- `source_tier`: legacy match-level quality band (gold/silver/bronze/fallback) retained for pipeline compatibility.
- `source_id`: references an entry in `data/sources/sources.json`; drives **sourcesAuthorityMultiplier** in projections (conservative `min` across observed rows).

## Referential integrity

The following links must remain valid:

- `players_master.team_id` -> `teams.team_id`
- `player_aliases.player_id` -> `players_master.player_id`
- `callups_or_appearances.player_id` -> `players_master.player_id`
- `callups_or_appearances.team_id` -> `teams.team_id`
- `callups_or_appearances.match_id` -> `matches.match_id`
- `availability_overrides.player_id` -> `players_master.player_id`
