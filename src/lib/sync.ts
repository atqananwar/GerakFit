import { db } from './db'
import { supabase } from './supabase'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline'

let syncInProgress = false

// ─── Push all unsynced local data to Supabase ─────────────

export async function syncToSupabase(
  onStatus?: (status: SyncStatus, count?: number) => void
): Promise<{ synced: number; errors: number }> {
  if (syncInProgress) return { synced: 0, errors: 0 }
  if (!navigator.onLine) { onStatus?.('offline'); return { synced: 0, errors: 0 } }

  syncInProgress = true
  onStatus?.('syncing')

  let synced = 0
  let errors = 0

  try {
    // 1. Sync unsynced sessions
    const unsyncedSessions = await db.sessions.where('synced').equals(0).toArray()
    for (const session of unsyncedSessions) {
      try {
        const { error } = await supabase.from('workout_sessions').upsert({
          id: session.id,
          user_id: session.user_id,
          workout_date: session.workout_date,
          status: session.status,
          started_at: session.started_at,
          ended_at: session.ended_at ?? null,
          duration_seconds: session.duration_seconds ?? null,
          notes: session.notes ?? null,
        }, { onConflict: 'id' })

        if (!error) {
          await db.sessions.update(session.id, { synced: true })
          synced++
        } else {
          errors++
        }
      } catch { errors++ }
    }

    // 2. Sync unsynced session exercises
    
    

    // Also get recently synced ones
    const allSessions = await db.sessions.toArray()
    const allSessionIds = allSessions.map(s => s.id)

    const sessionExercises = await db.session_exercises
      .filter(se => allSessionIds.includes(se.session_id))
      .toArray()

    for (const se of sessionExercises) {
      try {
        const { error } = await supabase.from('session_exercises').upsert({
          id: se.id,
          session_id: se.session_id,
          exercise_id: se.exercise_id,
          sort_order: se.sort_order,
          notes: se.notes ?? null,
          pain_flag: se.pain_flag,
        }, { onConflict: 'id' })

        if (!error) synced++
        else errors++
      } catch { errors++ }
    }

    // 3. Sync unsynced sets
    const unsyncedSets = await db.sets.where('synced').equals(0).toArray()
    for (const set of unsyncedSets) {
      try {
        const { error } = await supabase.from('exercise_sets').upsert({
          id: set.id,
          session_exercise_id: set.session_exercise_id,
          set_number: set.set_number,
          weight_kg: set.weight_kg,
          reps: set.reps,
          rpe: set.rpe,
          is_warmup: set.is_warmup,
          is_failure: set.is_failure,
          completed_at: set.completed_at,
        }, { onConflict: 'id' })

        if (!error) {
          await db.sets.update(set.id, { synced: true })
          synced++
        } else {
          errors++
        }
      } catch { errors++ }
    }

    onStatus?.(synced > 0 ? 'success' : 'idle', synced)
  } catch {
    errors++
    onStatus?.('error')
  } finally {
    syncInProgress = false
  }

  return { synced, errors }
}

// ─── Listen for online event and auto-sync ────────────────

export function startSyncListener(onStatus?: (status: SyncStatus, count?: number) => void) {
  const handler = () => {
    setTimeout(() => syncToSupabase(onStatus), 1000)
  }
  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}

// ─── Get pending sync count ───────────────────────────────

export async function getPendingSyncCount(): Promise<number> {
  const [sessions, sets] = await Promise.all([
    db.sessions.where('synced').equals(0).count(),
    db.sets.where('synced').equals(0).count(),
  ])
  return sessions + sets
}