export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  isDefault: boolean;
  threshold?: number;
  color?: string;
}

export interface Observation {
  id: string;
  text: string;
  date: string;
}

export interface EvaluationMetrics {
  chapa: number;
  peito: number;
  ombro: number;
  defesa: number;
  ataque: number;
  recepcao: number;
  levantamento: number;
}

export type UserRole = 'ADMIN' | 'GESTAO' | 'ALUNO';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
}

export interface Goal {
  id: string;
  description: string;
  completed: boolean;
  createdAt: string;
}

export interface Athlete {
  id: string;
  name: string;
  categoryId: CategoryId;
  side: 'ESQUERDA' | 'DIREITA' | 'AMBOS';
  startDate: string;
  monthlyFee: number;
  observations: Observation[];
  evaluation: EvaluationMetrics;
  goals?: Goal[];
}

export interface PaymentStatus {
  [athleteId: string]: {
    [year: number]: {
      [month: number]: boolean; // 0-11
    };
  };
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'estreante', name: 'ESTREANTES', isDefault: true, color: '#10B981' }, // Green
  { id: 'iniciante-b', name: 'INICIANTE B', isDefault: true, color: '#3B82F6' }, // Blue
  { id: 'iniciante-a', name: 'INICIANTE A', isDefault: true, color: '#6366F1' }, // Indigo
  { id: 'intermediario', name: 'INTERMEDIARIO', isDefault: true, color: '#F59E0B' }, // Amber
  { id: 'amador-b', name: 'AMADOR B', isDefault: true, color: '#8B5CF6' }, // Violet
  { id: 'amador-a', name: 'AMADOR A', isDefault: true, color: '#EC4899' }, // Pink
  { id: 'profissional', name: 'PROFISSIONAL', isDefault: true, color: '#EF4444' }, // Red
];

export interface TrainingSession {
  id: string;
  type: 'RECURRING' | 'PERSONALIZED';
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  date?: string; // For personalized/one-time sessions
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  description: string;
  categoryId?: CategoryId;
  athleteIds?: string[];
}

export const EVALUATION_LABELS: Record<keyof EvaluationMetrics, string> = {
  chapa: 'CHAPA',
  peito: 'PEITO',
  ombro: 'OMBRO',
  defesa: 'DEFESA',
  ataque: 'ATAQUE',
  recepcao: 'RECEPÇÃO',
  levantamento: 'LEVANTAMENTO',
};
