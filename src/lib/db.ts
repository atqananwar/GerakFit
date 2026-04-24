import Dexie, { type Table } from 'dexie'

export interface LocalSession {
  id: string
  user_id: string
  workout_date: string
  status: 'in_progress' | 'completed' | 'cancelled'
  started_at: string
  ended_at?: string
  duration_seconds?: number
  notes?: string
  synced: boolean
}

export interface LocalSessionExercise {
  id: string
  session_id: string
  exercise_id: string
  exercise_name: string
  primary_muscle: string
  sort_order: number
  notes?: string
  pain_flag: boolean
}

export interface LocalSet {
  id: string
  session_exercise_id: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  is_warmup: boolean
  is_failure: boolean
  completed_at: string
  synced: boolean
}

export interface SyncQueueItem {
  id?: number
  table_name: string
  record_id: string
  operation: 'insert' | 'update' | 'delete'
  payload: string
  created_at: string
}

class GerakFitDB extends Dexie {
  sessions!: Table<LocalSession>
  session_exercises!: Table<LocalSessionExercise>
  sets!: Table<LocalSet>
  sync_queue!: Table<SyncQueueItem>

  constructor() {
    super('GerakFitDB')
    this.version(1).stores({
      sessions: 'id, user_id, status, synced',
      session_exercises: 'id, session_id, sort_order',
      sets: 'id, session_exercise_id, set_number, synced',
      sync_queue: '++id, table_name, created_at',
    })
  }
}

export const db = new GerakFitDB()