import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onBack: () => void
  onSaved: () => void
}

interface RoutineExercise {
  exerciseId: string
  name: string
  muscle: string
  sets: number
}

interface DBExercise {
  id: string
  name: string
  primary_muscle: string
}

export default function CreateRoutineScreen({ onBack, onSaved }: Props) {
  const { user } = useAuth()
  const [routineName, setRoutineName] = useState('')
  const [exercises, setExercises] = useState<RoutineExercise[]>([])
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [saving, setSaving] = useState(false)

  // Picker state
  const [allExercises, setAllExercises] = useState<DBExercise[]>([])
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerLoading, setPickerLoading] = useState(false)

  useEffect(() => {
    document.body.style.background = '#0d0d0d'
  }, [])

  useEffect(() => {
    if (showExercisePicker && allExercises.length === 0) {
      setPickerLoading(true)
      supabase
        .from('exercises')
        .select('id, name, primary_muscle')
        .eq('is_active', true)
        .order('name')
        .then(({ data }) => {
          if (data) setAllExercises(data)
          setPickerLoading(false)
        })
    }
  }, [showExercisePicker])

  function addExercise(ex: DBExercise) {
    if (exercises.some(e => e.exerciseId === ex.id)) return
    setExercises(prev => [...prev, { exerciseId: ex.id, name: ex.name, muscle: ex.primary_muscle, sets: 3 }])
    setShowExercisePicker(false)
    setPickerSearch('')
  }

  function updateSets(exerciseId: string, delta: number) {
    setExercises(prev => prev.map(e =>
      e.exerciseId === exerciseId ? { ...e, sets: Math.max(1, e.sets + delta) } : e
    ))
  }

  function removeExercise(exerciseId: string) {
    setExercises(prev => prev.filter(e => e.exerciseId !== exerciseId))
  }

  async function saveRoutine() {
    if (!user || !routineName.trim()) return
    setSaving(true)

    const { data: template } = await supabase
      .from('workout_templates')
      .insert({ user_id: user.id, name: routineName.trim(), split_type: 'custom' })
      .select()
      .single()

    if (!template) { setSaving(false); return }

    if (exercises.length > 0) {
      const rows = exercises.map((ex, i) => ({
        template_id: template.id,
        exercise_id: ex.exerciseId,
        exercise_order: i,
        sets_data: Array(ex.sets).fill({ weight_kg: 0, reps: 0 }),
      }))
      await supabase.from('template_exercises').insert(rows)
    }

    setSaving(false)
    onSaved()
    onBack()
  }

  const filteredExercises = allExercises.filter(ex =>
    !pickerSearch || ex.name.toLowerCase().includes(pickerSearch.toLowerCase()) || ex.primary_muscle.toLowerCase().includes(pickerSearch.toLowerCase())
  )

  // Exercise Picker overlay
  if (showExercisePicker) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000000', zIndex: 100, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
        {/* Picker header */}
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '0.5px solid #1c1c1e' }}>
          <button
            onClick={() => { setShowExercisePicker(false); setPickerSearch('') }}
            style={{ background: 'none', border: 'none', color: '#888888', fontSize: '15px', cursor: 'pointer', padding: 0 }}
          >
            Cancel
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Add Exercise</div>
          <div style={{ width: '56px' }} />
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px' }}>
          <input
            type="text"
            placeholder="Search exercises..."
            value={pickerSearch}
            onChange={e => setPickerSearch(e.target.value)}
            autoFocus
            style={{ width: '100%', background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: '#ffffff', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>
          {pickerLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '13px', color: '#666666' }}>Loading...</div>
          ) : filteredExercises.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '13px', color: '#666666' }}>No exercises found</div>
          ) : filteredExercises.map(ex => {
            const alreadyAdded = exercises.some(e => e.exerciseId === ex.id)
            return (
              <div
                key={ex.id}
                onClick={() => !alreadyAdded && addExercise(ex)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '0.5px solid #1a1a1a', cursor: alreadyAdded ? 'default' : 'pointer', opacity: alreadyAdded ? 0.4 : 1 }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>{ex.name}</div>
                  <div style={{ fontSize: '11px', color: '#888888', marginTop: '2px' }}>{ex.primary_muscle}</div>
                </div>
                {alreadyAdded
                  ? <span style={{ fontSize: '11px', color: '#666666' }}>Added</span>
                  : <span style={{ fontSize: '20px', color: '#1D9E75', fontWeight: 700 }}>+</span>
                }
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Main screen
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#888888', fontSize: '15px', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          Cancel
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>New Routine</div>
        <button
          onClick={saveRoutine}
          disabled={!routineName.trim() || saving}
          style={{ background: '#1D9E75', border: 'none', color: '#ffffff', fontSize: '14px', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', cursor: routineName.trim() ? 'pointer' : 'default', opacity: routineName.trim() ? 1 : 0.4, flexShrink: 0 }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '20px' }}>

        {/* Routine name */}
        <input
          type="text"
          placeholder="Routine name e.g. Push Day"
          value={routineName}
          onChange={e => setRoutineName(e.target.value)}
          style={{ background: 'transparent', border: 'none', borderBottom: '0.5px solid #2a2a2a', fontSize: '22px', fontWeight: 800, color: '#ffffff', width: '100%', padding: '0 0 12px', marginBottom: '24px', outline: 'none', boxSizing: 'border-box' }}
        />

        {/* Empty state */}
        {exercises.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0 32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏋️</div>
            <div style={{ fontSize: '14px', color: '#888888' }}>Add exercises to your routine</div>
          </div>
        )}

        {/* Exercise list */}
        {exercises.map(ex => (
          <div
            key={ex.exerciseId}
            style={{ background: '#1c1c1e', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{ex.name}</div>
                <div style={{ fontSize: '11px', color: '#888888', marginTop: '2px' }}>{ex.muscle}</div>
              </div>
              <button
                onClick={() => removeExercise(ex.exerciseId)}
                style={{ background: 'none', border: 'none', color: '#666666', fontSize: '18px', cursor: 'pointer', padding: '0 0 0 8px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <span style={{ fontSize: '12px', color: '#888888' }}>Sets</span>
              <button
                onClick={() => updateSets(ex.exerciseId, -1)}
                style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: '18px', fontWeight: 700, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
              >
                −
              </button>
              <span style={{ fontSize: '14px', color: '#ffffff', minWidth: '20px', textAlign: 'center' }}>{ex.sets}</span>
              <button
                onClick={() => updateSets(ex.exerciseId, 1)}
                style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: '18px', fontWeight: 700, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
              >
                +
              </button>
            </div>
          </div>
        ))}

        {/* Add Exercise button */}
        <button
          onClick={() => setShowExercisePicker(true)}
          style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '10px', padding: '14px', width: '100%', color: '#1D9E75', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: exercises.length > 0 ? '8px' : '0' }}
        >
          + Add Exercise
        </button>

      </div>
    </div>
  )
}
