import { supabase } from './supabase'

export interface LastPerformance {
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  sets_completed: number
}

export interface OverloadSuggestion {
  action: 'increase' | 'maintain' | 'reduce'
  suggested_weight: number | null
  suggested_reps: number | null
  reason: string
}

// ─── Fetch last performance for an exercise ───────────────
export async function getLastPerformance(
  userId: string,
  exerciseId: string
): Promise<LastPerformance | null> {
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('workout_date', { ascending: false })
    .limit(5)

  if (!sessions || sessions.length === 0) return null

  const sessionIds = sessions.map(s => s.id)

  const { data: seData } = await supabase
    .from('session_exercises')
    .select('id')
    .eq('exercise_id', exerciseId)
    .in('session_id', sessionIds)
    .order('id', { ascending: false })
    .limit(1)

  if (!seData || seData.length === 0) return null

  const { data: sets } = await supabase
    .from('exercise_sets')
    .select('weight_kg, reps, rpe')
    .eq('session_exercise_id', seData[0].id)
    .eq('is_warmup', false)
    .order('set_number', { ascending: true })

  if (!sets || sets.length === 0) return null

  const workingSets = sets.filter(s => s.weight_kg !== null && s.reps !== null)
  if (workingSets.length === 0) return null

  const avgWeight = workingSets.reduce((a, s) => a + (s.weight_kg ?? 0), 0) / workingSets.length
  const avgReps = workingSets.reduce((a, s) => a + (s.reps ?? 0), 0) / workingSets.length
  const avgRpe = workingSets.some(s => s.rpe !== null)
    ? workingSets.filter(s => s.rpe !== null).reduce((a, s) => a + (s.rpe ?? 0), 0) / workingSets.filter(s => s.rpe !== null).length
    : null

  return {
    weight_kg: Math.round(avgWeight * 4) / 4,
    reps: Math.round(avgReps),
    rpe: avgRpe ? Math.round(avgRpe * 10) / 10 : null,
    sets_completed: workingSets.length,
  }
}

// ─── Suggest next weight / reps ───────────────────────────
export function suggestOverload(
  last: LastPerformance,
  targetMinReps = 8,
  targetMaxReps = 12
): OverloadSuggestion {
  const { weight_kg, reps, rpe } = last

  if (weight_kg === null || reps === null) {
    return { action: 'maintain', suggested_weight: null, suggested_reps: targetMinReps, reason: 'No previous data. Start with a comfortable weight.' }
  }

  // RPE too high — reduce
  if (rpe !== null && rpe >= 9.5) {
    const reduced = Math.max(weight_kg - smallestJump(weight_kg), 0)
    return { action: 'reduce', suggested_weight: reduced, suggested_reps: reps, reason: `RPE was ${rpe} — reduce weight slightly and focus on form.` }
  }

  // Hit top of rep range — increase weight
  if (reps >= targetMaxReps) {
    const increased = weight_kg + smallestJump(weight_kg)
    return { action: 'increase', suggested_weight: increased, suggested_reps: targetMinReps, reason: `Hit ${reps} reps last time — time to add weight!` }
  }

  // Below min rep range — reduce
  if (reps < targetMinReps - 2) {
    const reduced = Math.max(weight_kg - smallestJump(weight_kg), 0)
    return { action: 'reduce', suggested_weight: reduced, suggested_reps: targetMinReps, reason: `Only got ${reps} reps — drop weight slightly.` }
  }

  // In range — try to add reps
  return {
    action: 'maintain',
    suggested_weight: weight_kg,
    suggested_reps: Math.min(reps + 1, targetMaxReps),
    reason: `Good work at ${weight_kg}kg × ${reps}. Try one more rep this session.`,
  }
}

// Round to nearest 1.25kg increment
function smallestJump(weight: number): number {
  if (weight < 20) return 1.25
  if (weight < 60) return 2.5
  return 5
}

// ─── PR Detection ─────────────────────────────────────────
export interface PRResult {
  exercise_id: string
  exercise_name: string
  record_type: 'heaviest_weight' | 'most_reps' | 'estimated_1rm' | 'total_volume'
  weight_kg: number | null
  reps: number | null
  volume: number | null
  is_new_pr: boolean
}

export async function detectAndSavePRs(
  userId: string,
  sessionExercises: Array<{
    exercise_id: string
    exercise_name: string
    sets: Array<{ weight_kg: number | null; reps: number | null; is_warmup: boolean; completed: boolean }>
  }>
): Promise<PRResult[]> {
  const results: PRResult[] = []

  for (const se of sessionExercises) {
    const workingSets = se.sets.filter(s => !s.is_warmup && s.completed && s.weight_kg !== null && s.reps !== null)
    if (workingSets.length === 0) continue

    const heaviest = workingSets.reduce((best, s) => (s.weight_kg ?? 0) > (best.weight_kg ?? 0) ? s : best)
    const mostReps = workingSets.reduce((best, s) => (s.reps ?? 0) > (best.reps ?? 0) ? s : best)
    const totalVolume = workingSets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)
    const best1RM = workingSets.reduce((best, s) => {
      const estimated = (s.weight_kg ?? 0) * (1 + (s.reps ?? 0) / 30)
      return estimated > best ? estimated : best
    }, 0)

    // Check existing PRs
    const { data: existingPRs } = await supabase
      .from('personal_records')
      .select('record_type, weight_kg, reps, volume')
      .eq('user_id', userId)
      .eq('exercise_id', se.exercise_id)

    const existing = {
      heaviest_weight: existingPRs?.find(p => p.record_type === 'heaviest_weight'),
      most_reps: existingPRs?.find(p => p.record_type === 'most_reps'),
      estimated_1rm: existingPRs?.find(p => p.record_type === 'estimated_1rm'),
      total_volume: existingPRs?.find(p => p.record_type === 'total_volume'),
    }

    const newPRs: Array<{ record_type: PRResult['record_type']; weight_kg: number | null; reps: number | null; volume: number | null }> = []

    if ((heaviest.weight_kg ?? 0) > (existing.heaviest_weight?.weight_kg ?? 0)) {
      newPRs.push({ record_type: 'heaviest_weight', weight_kg: heaviest.weight_kg, reps: heaviest.reps, volume: null })
    }
    if ((mostReps.reps ?? 0) > (existing.most_reps?.reps ?? 0)) {
      newPRs.push({ record_type: 'most_reps', weight_kg: mostReps.weight_kg, reps: mostReps.reps, volume: null })
    }
    if (best1RM > (existing.estimated_1rm?.weight_kg ?? 0)) {
      newPRs.push({ record_type: 'estimated_1rm', weight_kg: Math.round(best1RM * 10) / 10, reps: null, volume: null })
    }
    if (totalVolume > (existing.total_volume?.volume ?? 0)) {
      newPRs.push({ record_type: 'total_volume', weight_kg: null, reps: null, volume: Math.round(totalVolume) })
    }

    for (const pr of newPRs) {
      await supabase.from('personal_records').upsert({
        user_id: userId,
        exercise_id: se.exercise_id,
        record_type: pr.record_type,
        weight_kg: pr.weight_kg,
        reps: pr.reps,
        volume: pr.volume,
        achieved_at: new Date().toISOString(),
      }, { onConflict: 'user_id,exercise_id,record_type' })

      results.push({ exercise_id: se.exercise_id, exercise_name: se.exercise_name, ...pr, is_new_pr: true })
    }
  }

  return results
}