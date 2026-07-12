export interface MlbTeam {
  id: string
  name: string
  abbreviation: string
  aliases: string[]
}

export const MLB_TEAMS: MlbTeam[] = [
  { id: '108', name: 'Los Angeles Angels', abbreviation: 'LAA', aliases: ['angels'] },
  { id: '109', name: 'Arizona Diamondbacks', abbreviation: 'AZ', aliases: ['diamondbacks', 'dbacks'] },
  { id: '110', name: 'Baltimore Orioles', abbreviation: 'BAL', aliases: ['orioles'] },
  { id: '111', name: 'Boston Red Sox', abbreviation: 'BOS', aliases: ['red sox', 'redsox'] },
  { id: '112', name: 'Chicago Cubs', abbreviation: 'CHC', aliases: ['cubs'] },
  { id: '113', name: 'Cincinnati Reds', abbreviation: 'CIN', aliases: ['reds'] },
  { id: '114', name: 'Cleveland Guardians', abbreviation: 'CLE', aliases: ['guardians'] },
  { id: '115', name: 'Colorado Rockies', abbreviation: 'COL', aliases: ['rockies'] },
  { id: '116', name: 'Detroit Tigers', abbreviation: 'DET', aliases: ['tigers'] },
  { id: '117', name: 'Houston Astros', abbreviation: 'HOU', aliases: ['astros'] },
  { id: '118', name: 'Kansas City Royals', abbreviation: 'KC', aliases: ['royals'] },
  { id: '119', name: 'Los Angeles Dodgers', abbreviation: 'LAD', aliases: ['dodgers'] },
  { id: '120', name: 'Washington Nationals', abbreviation: 'WSH', aliases: ['nationals'] },
  { id: '121', name: 'New York Mets', abbreviation: 'NYM', aliases: ['mets'] },
  { id: '133', name: 'Oakland Athletics', abbreviation: 'OAK', aliases: ['athletics', 'as'] },
  { id: '134', name: 'Pittsburgh Pirates', abbreviation: 'PIT', aliases: ['pirates'] },
  { id: '135', name: 'San Diego Padres', abbreviation: 'SD', aliases: ['padres'] },
  { id: '136', name: 'Seattle Mariners', abbreviation: 'SEA', aliases: ['mariners'] },
  { id: '137', name: 'San Francisco Giants', abbreviation: 'SF', aliases: ['giants'] },
  { id: '138', name: 'St. Louis Cardinals', abbreviation: 'STL', aliases: ['cardinals'] },
  { id: '139', name: 'Tampa Bay Rays', abbreviation: 'TB', aliases: ['rays'] },
  { id: '140', name: 'Texas Rangers', abbreviation: 'TEX', aliases: ['rangers'] },
  { id: '141', name: 'Toronto Blue Jays', abbreviation: 'TOR', aliases: ['blue jays', 'bluejays', 'jays'] },
  { id: '142', name: 'Minnesota Twins', abbreviation: 'MIN', aliases: ['twins'] },
  { id: '143', name: 'Philadelphia Phillies', abbreviation: 'PHI', aliases: ['phillies'] },
  { id: '144', name: 'Atlanta Braves', abbreviation: 'ATL', aliases: ['braves'] },
  { id: '145', name: 'Chicago White Sox', abbreviation: 'CWS', aliases: ['white sox', 'whitesox'] },
  { id: '146', name: 'Miami Marlins', abbreviation: 'MIA', aliases: ['marlins'] },
  { id: '147', name: 'New York Yankees', abbreviation: 'NYY', aliases: ['yankees'] },
  { id: '158', name: 'Milwaukee Brewers', abbreviation: 'MIL', aliases: ['brewers'] },
]

function normalize(value: string): string {
  return value.toLowerCase().trim()
}

export function findMlbTeam(name: string | null | undefined): MlbTeam | null {
  if (!name) return null
  const query = normalize(name)
  return (
    MLB_TEAMS.find(
      (team) =>
        normalize(team.name) === query ||
        normalize(team.abbreviation) === query ||
        team.aliases.some((alias) => normalize(alias) === query) ||
        normalize(team.name).includes(query) ||
        query.includes(normalize(team.name))
    ) ?? null
  )
}

export function mlbTeamLogoUrl(teamId: string): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`
}
