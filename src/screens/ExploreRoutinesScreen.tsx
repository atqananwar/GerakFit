import { useState, useEffect } from 'react'
import { PRESET_ROUTINES } from '../data/presetRoutines'
import type { PresetRoutine } from '../data/presetRoutines'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onBack: () => void
  onRoutineSaved?: () => void
}

type Level = 'All' | 'Beginner' | 'Intermediate' | 'Advanced'
type Equipment = 'All' | 'Gym' | 'Dumbbells' | 'Bodyweight'
type Routine = PresetRoutine

const LEVEL_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  Beginner:     { bg: '#0f2a1a', color: '#1D9E75', border: '0.5px solid #1D9E75' },
  Intermediate: { bg: '#2a1f00', color: '#FFD60A', border: '0.5px solid #FFD60A' },
  Advanced:     { bg: '#2a0f0f', color: '#ef4444', border: '0.5px solid #ef4444' },
}

const EQUIP_BADGE = { bg: '#1a1a1a', color: '#888', border: '0.5px solid #2a2a2a' }

export default function ExploreRoutinesScreen({ onBack, onRoutineSaved }: Props) {
  const { user } = useAuth()
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')
  const [levelFilter, setLevelFilter] = useState<Level>('All')
  const [equipFilter, setEquipFilter] = useState<Equipment>('All')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.background = darkMode ? '#0d0d0d' : '#f9fafb'
  }, [darkMode])

  const filtered = PRESET_ROUTINES.filter(r => {
    const levelOk = levelFilter === 'All' || r.level === levelFilter
    const equipOk = equipFilter === 'All' || r.equipment === equipFilter
    return levelOk && equipOk
  })

  async function savePresetRoutine(routine: Routine) {
    console.log('Saving routine:', routine.name)
    console.log('[ExploreRoutines] savePresetRoutine called:', routine.name, 'user:', user?.id)

    if (!user) {
      alert('Please log in first')
      return
    }

    try {
      setSaving(routine.id.toString())

      const { data: template, error: templateError } = await supabase
        .from('workout_templates')
        .insert({
          user_id: user.id,
          name: routine.name,
          split_type: routine.equipment.toLowerCase(),
        })
        .select()
        .single()

      console.log('[ExploreRoutines] template created:', template, 'error:', templateError)

      if (!template) {
        console.log('[ExploreRoutines] template insert failed, aborting')
        setSaving(null)
        return
      }

      const allExerciseNames = routine.workouts.flatMap(w =>
        w.exercises.map(e =>
          e.split(' ')[0] === 'Warm' ? 'Warm Up' : e.replace(/\s+\d+x.+$/, '').trim()
        )
      )

      const { data: dbExercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('id, name')
        .in('name', allExerciseNames)

      console.log('[ExploreRoutines] exercises lookup error:', exercisesError, 'matched:', dbExercises?.length ?? 0, '/', allExerciseNames.length)

      const exerciseMap = Object.fromEntries((dbExercises ?? []).map(e => [e.name, e.id]))

      let order = 0
      const rows = routine.workouts.flatMap(w =>
        w.exercises.map(exStr => {
          const name = exStr.replace(/\s+\d+x.+$/, '').trim()
          const exerciseId = exerciseMap[name]
          if (!exerciseId) return null
          const setsMatch = exStr.match(/(\d+)x/)
          const sets = setsMatch ? parseInt(setsMatch[1]) : 3
          return {
            template_id: template.id,
            exercise_id: exerciseId,
            exercise_order: order++,
            sets_data: Array(sets).fill({ weight_kg: 0, reps: 0 }),
          }
        }).filter(Boolean)
      )

      if (rows.length > 0) {
        const { error: rowsError } = await supabase.from('template_exercises').insert(rows)
        console.log('[ExploreRoutines] template_exercises insert error:', rowsError)
      }

      setSaving(null)
      setSaved(routine.id.toString())
      setTimeout(() => {
        setSaved(null)
        setExpanded(null)
        onRoutineSaved?.()
        onBack()
      }, 1000)
    } catch (err) {
      console.log('[ExploreRoutines] savePresetRoutine error:', err)
      setSaving(null)
    }
  }

  const chipActive: React.CSSProperties = {
    padding: '6px 16px', borderRadius: '20px', border: 'none',
    background: '#1D9E75', color: '#ffffff', fontSize: '13px',
    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
  }
  const chipInactive: React.CSSProperties = {
    padding: '6px 16px', borderRadius: '20px', border: '0.5px solid #2a2a2a',
    background: '#1c1c1e', color: '#888', fontSize: '13px',
    fontWeight: 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', fontFamily: 'system-ui, sans-serif', paddingBottom: '32px' }}>

      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '0.5px solid #1c1c1e' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer', padding: '0 4px 0 0', lineHeight: 1 }}>←</button>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', flex: 1 }}>Explore Routines</div>
        <div style={{ fontSize: '12px', color: '#666' }}>{filtered.length} routines</div>
      </div>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: '8px', padding: '14px 16px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {(['All', 'Beginner', 'Intermediate', 'Advanced'] as Level[]).map(l => (
          <button key={l} onClick={() => setLevelFilter(l)} style={levelFilter === l ? chipActive : chipInactive}>{l}</button>
        ))}
      </div>

      {/* Equipment filter */}
      <div style={{ display: 'flex', gap: '8px', padding: '10px 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {(['All', 'Gym', 'Dumbbells', 'Bodyweight'] as Equipment[]).map(e => (
          <button key={e} onClick={() => setEquipFilter(e)} style={equipFilter === e ? chipActive : chipInactive}>{e}</button>
        ))}
      </div>

      {/* Routine list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(routine => {
          const isExpanded = expanded === routine.id
          const levelStyle = LEVEL_BADGE[routine.level] ?? EQUIP_BADGE
          const isSaving = saving === routine.id.toString()
          const isSaved = saved === routine.id.toString()

          return (
            <div
              key={routine.id}
              style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '14px', overflow: 'hidden' }}
            >
              {/* Card header row */}
              <div
                onClick={() => setExpanded(isExpanded ? null : routine.id)}
                style={{ padding: '16px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', flex: 1, lineHeight: 1.3 }}>{routine.name}</div>
                  <span style={{ fontSize: '20px', color: '#444', flexShrink: 0, lineHeight: 1, marginTop: '1px', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
                </div>
                <div style={{ fontSize: '13px', color: '#888', marginTop: '5px', lineHeight: 1.4 }}>{routine.description}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: levelStyle.color, background: levelStyle.bg, border: levelStyle.border, borderRadius: '20px', padding: '3px 8px' }}>{routine.level}</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: EQUIP_BADGE.color, background: EQUIP_BADGE.bg, border: EQUIP_BADGE.border, borderRadius: '20px', padding: '3px 8px' }}>{routine.equipment}</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: EQUIP_BADGE.color, background: EQUIP_BADGE.bg, border: EQUIP_BADGE.border, borderRadius: '20px', padding: '3px 8px' }}>{routine.days}d/wk</span>
                </div>
              </div>

              {/* Expanded section */}
              {isExpanded && (
                <div style={{ borderTop: '0.5px solid #2a2a2a', padding: '12px 16px 16px' }}>
                  {routine.workouts.map((workout, wi) => (
                    <div key={wi}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase', marginTop: wi > 0 ? '12px' : '0', letterSpacing: '0.4px' }}>{workout.name}</div>
                      {workout.exercises.map((ex, ei) => (
                        <div key={ei} style={{ fontSize: '13px', color: '#cccccc', padding: '5px 0', borderBottom: '0.5px solid #1a1a1a' }}>{ex}</div>
                      ))}
                    </div>
                  ))}
                  <button
                    onClick={() => savePresetRoutine(routine)}
                    disabled={isSaving || isSaved}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      background: isSaved ? '#0f2a1a' : '#1D9E75',
                      border: 'none',
                      color: isSaved ? '#1D9E75' : '#ffffff',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: isSaving || isSaved ? 'default' : 'pointer',
                      opacity: isSaving ? 0.7 : 1,
                      marginTop: '16px',
                    }}
                  >
                    {isSaved ? '✓ Saved!' : isSaving ? 'Saving...' : 'Save Routine'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
