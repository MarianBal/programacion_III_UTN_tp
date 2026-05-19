// Datos que recibimos de la api: World-Cup-Api para el endpoint de journey, crudos...
// creamos dos interfaces para poner todos los resultados en los maches...
// tenemos una composicion para guardar individualmente cada partido en JourneyMatchApiItem...
// y luego la respuesta completa del endpoint de journey que incluye un array de esos partidos...
// que van como composición dentro de JourneyApiResponse...

/** Respuesta completa del endpoint de journey */
export interface JourneyApiResponse {
  worldCupId: string; // ID del mundial actual
  teamId: string; // ID del equipo consultado
  teamName: string; // Nombre del equipo
  lang: string; // Idioma de la respuesta
  worldCupStatus: string; // Estado del mundial
  stageReached: string; // Etapa alcanzada
  isChampion: boolean; // true si el equipo fue campeon
  isFinalPending: boolean; // true si la final aún no se jugo
  eliminatedByTeamId: string | null; // ID del equipo que lo elimino
  eliminatedByTeamName: string | null; // Nombre del equipo que lo elimino
  summary: string; // Resumen narrativo en español
  matches: JourneyMatchApiItem[]; // Lista de partidos jugados
}

/** Un partido individual en el camino del equipo */
export interface JourneyMatchApiItem {
  stage: string; // Ej: "QUARTER_FINALS"
  matchCode: string; // Ej: "QF-2"
  opponentTeamId: string; // Ej: "sco", "uru"
  opponentTeamName: string; // Ej: "Scotland", "Uruguay"
  goalsFor: number; // Goles a favor
  goalsAgainst: number; // Goles en contra
  result: "WIN" | "LOSS" | "DRAW"; // Resultado del partido
  resolution: string; // Ej: "REGULAR_TIME", "PENALTIES"
  isPending: boolean; // false si el partido termino y true no se ha jugado aun
}
