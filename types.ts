export enum ProcessingMode {
  VIDEOCHAMADA = 1,
  VISITA_INTIMA = 2,
  VISITA_PRESENCIAL = 3,
}

export interface RawRow {
  [key: string]: string;
}

export interface ProcessedStats {
  totalRecords: number;
  galleryCounts: Record<string, number>;
  timeSlots: Record<string, number>;
}
