import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'
import { getLastPerformance, suggestOverload, detectAndSavePRs } from '../lib/overload'
import type { LastPerformance, OverloadSuggestion, PRResult } from '../lib/overload'

interface Exercise {
  id: string
  name: string
  primary_muscle: string
  secondary_muscles: string[] | null
  equipment: string[] | null
  difficulty: string | null
}

interface SetLog {
  id: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  is_warmup: boolean
  is_failure: boolean
  completed: boolean
}

interface SessionExercise {
  localId: string
  exercise: Exercise
  sets: SetLog[]
  notes: string
  pain_flag: boolean
}

interface Props {
  onBack: () => void
}

function genId() {
  return crypto.randomUUID()
}

function newSet(num: number): SetLog {
  return { id: genId(), set_number: num, weight_kg: null, reps: null, rpe: null, is_warmup: false, is_failure: false, completed: false }
}

export default function WorkoutLogger({ onBack }: Props) {
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') === 'true')
  useEffect(() => { document.body.style.background = darkMode ? '#111827' : '#f9fafb' }, [darkMode])
  const { user } = useAuth()
  const [phase, setPhase] = useState<'pick' | 'session'>('pick')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('All')
  const [subMuscleFilter, setSubMuscleFilter] = useState<string | null>(null)
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([])
  const [sessionId] = useState(genId)
  const [startTime] = useState(new Date())
  const [elapsed, setElapsed] = useState(0)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restActive, setRestActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newPRs, setNewPRs] = useState<PRResult[]>([])
  const [showPRCelebration, setShowPRCelebration] = useState(false)
  const [, setLastPerformances] = useState<Record<string, LastPerformance | null>>({})
  const [suggestions, setSuggestions] = useState<Record<string, OverloadSuggestion>>({})
  const [expandedEx, setExpandedEx] = useState<string | null>(null)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const MUSCLE_GROUPS = [
    { label: 'All', values: [] },
    { label: 'Chest', values: ['Upper Chest', 'Mid Chest', 'Lower Chest'] },
    { label: 'Back', values: ['Lats', 'Mid Back', 'Lower Back', 'Traps'] },
    { label: 'Shoulders', values: ['Shoulders', 'Side Delt', 'Rear Delt'] },
    { label: 'Biceps', values: ['Biceps Long Head', 'Biceps Short Head', 'Brachialis'] },
    { label: 'Triceps', values: ['Triceps Long Head', 'Triceps Lateral Head'] },
    { label: 'Legs', values: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
    { label: 'Abs/Core', values: ['Abs', 'Obliques'] },
    { label: 'Forearms', values: ['Forearms', 'Brachioradialis'] },
    { label: 'Cardio', values: ['Cardio'] },
  ]

  useEffect(() => {
    loadExercises()
  }, [])

  useEffect(() => {
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current) }
  }, [])

  useEffect(() => {
    let filtered = exercises
    if (muscleFilter !== 'All') {
      const group = MUSCLE_GROUPS.find(g => g.label === muscleFilter)
      const muscles = group?.values ?? [muscleFilter]
      if (subMuscleFilter) {
        filtered = filtered.filter(e => e.primary_muscle === subMuscleFilter)
      } else {
        filtered = filtered.filter(e => muscles.includes(e.primary_muscle))
      }
    }
    if (searchQuery) filtered = filtered.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredExercises(filtered)
  }, [exercises, muscleFilter, searchQuery])

  async function loadExercises() {
    const { data } = await supabase.from('exercises').select('id, name, primary_muscle, secondary_muscles, equipment, difficulty').eq('is_active', true).order('name')
    if (data) setExercises(data)
  }

  function formatElapsed(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  async function addExercise(ex: Exercise) {
    const newEx: SessionExercise = {
      localId: genId(),
      exercise: ex,
      sets: [newSet(1)],
      notes: '',
      pain_flag: false,
    }
    setSessionExercises(prev => [...prev, newEx])
    setExpandedEx(newEx.localId)
    setPhase('session')

    // Load last performance and suggestion
    if (user) {
      const last = await getLastPerformance(user.id, ex.id)
      setLastPerformances(prev => ({ ...prev, [ex.id]: last }))
      if (last) {
        const suggestion = suggestOverload(last)
        setSuggestions(prev => ({ ...prev, [ex.id]: suggestion }))
        // Pre-fill first set with suggested weight
        setSessionExercises(prev => prev.map(se =>
          se.localId === newEx.localId
            ? { ...se, sets: [{ ...se.sets[0], weight_kg: suggestion.suggested_weight, reps: suggestion.suggested_reps }] }
            : se
        ))
      }
    }
  }

  function addSet(localId: string) {
    setSessionExercises(prev => prev.map(se => {
      if (se.localId !== localId) return se
      const nextNum = se.sets.length + 1
      return { ...se, sets: [...se.sets, newSet(nextNum)] }
    }))
  }

  function removeSet(localId: string, setId: string) {
    setSessionExercises(prev => prev.map(se => {
      if (se.localId !== localId) return se
      const filtered = se.sets.filter(s => s.id !== setId).map((s, i) => ({ ...s, set_number: i + 1 }))
      return { ...se, sets: filtered }
    }))
  }

  function updateSet(localId: string, setId: string, field: keyof SetLog, value: unknown) {
    setSessionExercises(prev => prev.map(se => {
      if (se.localId !== localId) return se
      return { ...se, sets: se.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) }
    }))
  }

  function completeSet(localId: string, setId: string) {
    updateSet(localId, setId, 'completed', true)
    startRest(90)
  }

  function startRest(seconds: number) {
    if (restRef.current) clearInterval(restRef.current)
    setRestTimer(seconds)
    setRestActive(true)
    restRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(restRef.current!)
          setRestActive(false)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  function skipRest() {
    if (restRef.current) clearInterval(restRef.current)
    setRestTimer(null)
    setRestActive(false)
  }

  async function saveSetLocally(se: SessionExercise, set: SetLog) {
    if (!user) return
    const seId = se.localId

    // Upsert session exercise locally
    await db.session_exercises.put({
      id: seId,
      session_id: sessionId,
      exercise_id: se.exercise.id,
      exercise_name: se.exercise.name,
      primary_muscle: se.exercise.primary_muscle,
      sort_order: sessionExercises.findIndex(x => x.localId === seId),
      notes: se.notes,
      pain_flag: se.pain_flag,
    })

    await db.sets.put({
      id: set.id,
      session_exercise_id: seId,
      set_number: set.set_number,
      weight_kg: set.weight_kg,
      reps: set.reps,
      rpe: set.rpe,
      is_warmup: set.is_warmup,
      is_failure: set.is_failure,
      completed_at: new Date().toISOString(),
      synced: false,
    })
  }

  async function finishWorkout() {
    if (!user) return
    setSaving(true)
    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    try {
      // Save session to Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          id: sessionId,
          user_id: user.id,
          workout_date: startTime.toISOString().split('T')[0],
          status: 'completed',
          started_at: startTime.toISOString(),
          ended_at: endTime.toISOString(),
          duration_seconds: duration,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Save each exercise and its completed sets
      for (const se of sessionExercises) {
        const { data: seData, error: seError } = await supabase
          .from('session_exercises')
          .insert({
            id: se.localId,
            session_id: sessionData.id,
            exercise_id: se.exercise.id,
            sort_order: sessionExercises.indexOf(se),
            notes: se.notes || null,
            pain_flag: se.pain_flag,
          })
          .select()
          .single()

        if (seError) throw seError

        const completedSets = se.sets.filter(s => s.completed && (s.weight_kg !== null || s.reps !== null))
        if (completedSets.length > 0) {
          await supabase.from('exercise_sets').insert(
            completedSets.map(s => ({
              id: s.id,
              session_exercise_id: seData.id,
              set_number: s.set_number,
              weight_kg: s.weight_kg,
              reps: s.reps,
              rpe: s.rpe,
              is_warmup: s.is_warmup,
              is_failure: s.is_failure,
              completed_at: new Date().toISOString(),
            }))
          )
        }
      }

      // Detect PRs
      const prPayload = sessionExercises.map(se => ({
        exercise_id: se.exercise.id,
        exercise_name: se.exercise.name,
        sets: se.sets.map(s => ({ weight_kg: s.weight_kg, reps: s.reps, is_warmup: s.is_warmup, completed: s.completed })),
      }))
      const detectedPRs = await detectAndSavePRs(user.id, prPayload)
      if (detectedPRs.length > 0) {
        setNewPRs(detectedPRs)
        setShowPRCelebration(true)
      } else {
        onBack()
      }
    } catch {
      // Offline fallback — save to Dexie
      await db.sessions.put({
        id: sessionId,
        user_id: user.id,
        workout_date: startTime.toISOString().split('T')[0],
        status: 'completed',
        started_at: startTime.toISOString(),
        ended_at: endTime.toISOString(),
        duration_seconds: duration,
        synced: false,
      })
      onBack()
    } finally {
      setSaving(false)
    }
  }

  const backBtnStyle: React.CSSProperties = {
    padding: '6px 12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
    background: darkMode ? '#1f2937' : '#fff', fontSize: '13px', color: darkMode ? '#d1d5db' : '#374151', cursor: 'pointer',
  }
  const setInputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 6px', borderRadius: '7px',
    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '13px', textAlign: 'center',
    boxSizing: 'border-box', color: darkMode ? '#f9fafb' : '#111827',
  }

  const totalCompletedSets = sessionExercises.reduce((acc, se) => acc + se.sets.filter(s => s.completed).length, 0)

  // ─── PR Celebration ──────────────────────────────────────
  if (showPRCelebration) {
    return (
      <div style={{ minHeight: '100vh', background: darkMode ? '#111827' : '#f9fafb', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: darkMode ? '#1f2937' : '#fff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, borderRadius: '20px', padding: '32px 24px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: darkMode ? '#f9fafb' : '#111827', marginBottom: '6px' }}>New personal records!</div>
          <div style={{ fontSize: '13px', color: darkMode ? '#9ca3af' : '#6b7280', marginBottom: '24px' }}>You crushed it today.</div>
          {newPRs.map((pr, i) => (
            <div key={i} style={{ background: '#E1F5EE', borderRadius: '12px', padding: '12px 16px', marginBottom: '10px', textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#085041' }}>{pr.exercise_name}</div>
              <div style={{ fontSize: '12px', color: '#0F6E56', marginTop: '3px', textTransform: 'capitalize' }}>
                {pr.record_type.replace(/_/g, ' ')} —{' '}
                {pr.weight_kg ? `${pr.weight_kg}kg` : ''}{pr.weight_kg && pr.reps ? ' × ' : ''}{pr.reps ? `${pr.reps} reps` : ''}{pr.volume ? `${pr.volume}kg total volume` : ''}
              </div>
            </div>
          ))}
          <button onClick={onBack} style={{ marginTop: '8px', width: '100%', padding: '13px', borderRadius: '12px', background: '#1D9E75', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  // ─── Exercise picker ───────────────────────────────────────
  if (phase === 'pick') {
    return (
      <div style={{ minHeight: '100vh', background: darkMode ? '#111827' : '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '20px' }}>
        <div style={{ background: darkMode ? '#1f2937' : '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => sessionExercises.length > 0 ? setPhase('session') : onBack()} style={backBtnStyle}>← Back</button>
          <div style={{ fontSize: '16px', fontWeight: 600, color: darkMode ? '#f9fafb' : '#111827' }}>Add exercise</div>
        </div>

        <div style={{ padding: '14px 16px 0' }}>
          <input
            type="text" placeholder="Search exercises..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ padding: '10px 16px 0', display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {MUSCLE_GROUPS.map(g => (
            <div key={g.label} onClick={() => { setMuscleFilter(g.label); setSubMuscleFilter(null) }} style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
              border: '1px solid ' + (muscleFilter === g.label ? '#1D9E75' : '#e5e7eb'),
              background: muscleFilter === g.label ? '#E1F5EE' : '#fff',
              color: muscleFilter === g.label ? '#085041' : '#6b7280',
            }}>{g.label}</div>
          ))}
        </div>
        {/* Sub-muscle filter */}
        {muscleFilter !== 'All' && (MUSCLE_GROUPS.find(g => g.label === muscleFilter)?.values.length ?? 0) > 1 && (
          <div style={{ padding: '6px 16px 0', display: 'flex', gap: '5px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            <div onClick={() => setSubMuscleFilter(null)} style={{ flexShrink: 0, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', border: `1px solid ${subMuscleFilter === null ? '#378ADD' : '#e5e7eb'}`, background: subMuscleFilter === null ? '#E6F1FB' : '#fff', color: subMuscleFilter === null ? '#185FA5' : '#9ca3af' }}>All {muscleFilter}</div>
            {MUSCLE_GROUPS.find(g => g.label === muscleFilter)?.values.map(sub => (
              <div key={sub} onClick={() => setSubMuscleFilter(sub)} style={{ flexShrink: 0, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', border: `1px solid ${subMuscleFilter === sub ? '#378ADD' : '#e5e7eb'}`, background: subMuscleFilter === sub ? '#E6F1FB' : '#fff', color: subMuscleFilter === sub ? '#185FA5' : '#9ca3af' }}>{sub}</div>
            ))}
          </div>
        )}

        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '12px', color: darkMode ? '#6b7280' : '#9ca3af', marginBottom: '10px' }}>{filteredExercises.length} exercises</div>
          {filteredExercises.map(ex => (
            <div key={ex.id} style={{ background: darkMode ? '#1f2937' : '#fff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: darkMode ? '#f9fafb' : '#111827' }}>{ex.name}</div>
                <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', background: '#E1F5EE', color: '#085041', padding: '2px 7px', borderRadius: '8px' }}>{ex.primary_muscle}</span>
                  {ex.difficulty && <span style={{ fontSize: '11px', background: darkMode ? '#374151' : '#f3f4f6', color: darkMode ? '#9ca3af' : '#6b7280', padding: '2px 7px', borderRadius: '8px', textTransform: 'capitalize' }}>{ex.difficulty}</span>}
                </div>
                {ex.secondary_muscles && ex.secondary_muscles.length > 0 && (
                  <div style={{ fontSize: '11px', color: darkMode ? '#6b7280' : '#9ca3af', marginTop: '3px' }}>
                    Also hits: {ex.secondary_muscles.slice(0, 3).join(', ')}
                  </div>
                )}
              </div>
              <button onClick={() => addExercise(ex)} style={{ padding: '7px 14px', borderRadius: '8px', background: '#1D9E75', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Active session ────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: darkMode ? '#111827' : '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '100px' }}>

      {/* Session header */}
      <div style={{ background: darkMode ? '#1f2937' : '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => { if (confirm('Leave workout? Progress will be lost.')) onBack() }}
              style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, background: darkMode ? '#1f2937' : '#fff', fontSize: '13px', color: darkMode ? '#d1d5db' : '#374151', cursor: 'pointer' }}
            >← Back</button>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: darkMode ? '#f9fafb' : '#111827' }}>Active workout</div>
              <div style={{ fontSize: '12px', color: darkMode ? '#9ca3af' : '#6b7280', marginTop: '1px' }}>{formatElapsed(elapsed)} · {totalCompletedSets} sets done</div>
            </div>
          </div>
          <button
            onClick={finishWorkout}
            disabled={saving || totalCompletedSets === 0}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: totalCompletedSets > 0 ? 'pointer' : 'not-allowed',
              background: totalCompletedSets > 0 ? '#1D9E75' : '#9FE1CB', color: '#fff',
            }}
          >
            {saving ? 'Saving...' : 'Finish'}
          </button>
        </div>
      </div>

      {/* Rest timer banner */}
      {restActive && restTimer !== null && (
        <div style={{ background: '#1D9E75', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>Rest · {restTimer}s</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => startRest((restTimer ?? 0) + 30)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>+30s</button>
            <button onClick={skipRest} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Skip</button>
          </div>
        </div>
      )}

      <div style={{ padding: '14px 16px' }}>
        {sessionExercises.map(se => (
          <div key={se.localId} style={{ background: darkMode ? '#1f2937' : '#fff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, borderRadius: '14px', marginBottom: '12px', overflow: 'hidden' }}>
            {/* Exercise header */}
            <div
              onClick={() => setExpandedEx(expandedEx === se.localId ? null : se.localId)}
              style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: darkMode ? '#f9fafb' : '#111827' }}>{se.exercise.name}</div>
                <div style={{ fontSize: '12px', color: darkMode ? '#9ca3af' : '#6b7280', marginTop: '2px' }}>
                  {se.sets.filter(s => s.completed).length}/{se.sets.length} sets · {se.exercise.primary_muscle}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: darkMode ? '#6b7280' : '#9ca3af' }}>{expandedEx === se.localId ? '▲' : '▼'}</div>
            </div>

            {/* Overload suggestion */}
            {expandedEx === se.localId && suggestions[se.exercise.id] && (
              <div style={{
                margin: '0 16px 10px',
                padding: '8px 12px',
                background: suggestions[se.exercise.id].action === 'increase' ? '#E1F5EE' : suggestions[se.exercise.id].action === 'reduce' ? '#fef2f2' : '#f3f4f6',
                borderLeft: '3px solid ' + (suggestions[se.exercise.id].action === 'increase' ? '#1D9E75' : suggestions[se.exercise.id].action === 'reduce' ? '#ef4444' : '#9ca3af'),
                borderRadius: '0 8px 8px 0',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: suggestions[se.exercise.id].action === 'increase' ? '#085041' : suggestions[se.exercise.id].action === 'reduce' ? '#991b1b' : '#374151', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {suggestions[se.exercise.id].action === 'increase' ? 'Progress' : suggestions[se.exercise.id].action === 'reduce' ? 'Reduce' : 'Maintain'}
                </div>
                <div style={{ fontSize: '12px', color: darkMode ? '#d1d5db' : '#374151', marginTop: '2px' }}>{suggestions[se.exercise.id].reason}</div>
              </div>
            )}

            {/* Sets */}
            {expandedEx === se.localId && (
              <div style={{ padding: '0 16px 14px' }}>
                {/* Set header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr 36px', gap: '6px', marginBottom: '6px' }}>
                  {['Set', 'kg', 'Reps', 'RPE', ''].map(h => (
                    <div key={h} style={{ fontSize: '10px', fontWeight: 500, color: darkMode ? '#6b7280' : '#9ca3af', textAlign: 'center' }}>{h}</div>
                  ))}
                </div>

                {se.sets.map(set => (
                  <div key={set.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr 36px', gap: '6px', marginBottom: '6px', alignItems: 'center', opacity: set.completed ? 0.6 : 1 }}>
                    <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 500, color: set.completed ? '#1D9E75' : '#374151' }}>
                      {set.completed ? '✓' : set.set_number}
                    </div>
                    <input
                      type="number" placeholder="0" value={set.weight_kg ?? ''} disabled={set.completed}
                      onChange={e => updateSet(se.localId, set.id, 'weight_kg', e.target.value ? Number(e.target.value) : null)}
                      style={setInputStyle}
                    />
                    <input
                      type="number" placeholder="0" value={set.reps ?? ''} disabled={set.completed}
                      onChange={e => updateSet(se.localId, set.id, 'reps', e.target.value ? Number(e.target.value) : null)}
                      style={setInputStyle}
                    />
                    <input
                      type="number" placeholder="—" min="1" max="10" value={set.rpe ?? ''} disabled={set.completed}
                      onChange={e => updateSet(se.localId, set.id, 'rpe', e.target.value ? Number(e.target.value) : null)}
                      style={setInputStyle}
                    />
                    <button
                      onClick={() => set.completed ? removeSet(se.localId, set.id) : (saveSetLocally(se, set), completeSet(se.localId, set.id))}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px',
                        background: set.completed ? '#fef2f2' : '#E1F5EE',
                        color: set.completed ? '#ef4444' : '#1D9E75',
                      }}
                    >
                      {set.completed ? '×' : '✓'}
                    </button>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => addSet(se.localId)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px dashed #d1d5db', background: darkMode ? '#1f2937' : '#fff', fontSize: '13px', color: darkMode ? '#9ca3af' : '#6b7280', cursor: 'pointer' }}>
                    + Add set
                  </button>
                  <button
                    onClick={() => setSessionExercises(prev => prev.filter(x => x.localId !== se.localId))}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #fee2e2', background: darkMode ? '#1f2937' : '#fff', fontSize: '13px', color: '#ef4444', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add more exercises */}
        <button
          onClick={() => setPhase('pick')}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px dashed #d1d5db', background: darkMode ? '#1f2937' : '#fff', fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280', cursor: 'pointer' }}
        >
          + Add exercise
        </button>
      </div>
    </div>
  )
}
