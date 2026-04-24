import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Exercise {
  id: string
  name: string
  primary_muscle: string
  secondary_muscles: string[] | null
  equipment: string[] | null
  movement_pattern: string | null
  difficulty: string | null
  instructions: string | null
  common_mistakes: string | null
}

interface Props {
  onBack: () => void
}

const MUSCLES = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs/Core', 'Cardio', 'Mobility']
const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced']

const MUSCLE_COLORS: Record<string, { bg: string; text: string }> = {
  Chest:     { bg: '#E1F5EE', text: '#085041' },
  Back:      { bg: '#E6F1FB', text: '#0C447C' },
  Shoulders: { bg: '#FAECE7', text: '#712B13' },
  Biceps:    { bg: '#FAEEDA', text: '#633806' },
  Triceps:   { bg: '#FBEAF0', text: '#72243E' },
  Legs:      { bg: '#EAF3DE', text: '#27500A' },
  'Abs/Core':{ bg: '#EEEDFE', text: '#3C3489' },
  Cardio:    { bg: '#FCEBEB', text: '#791F1F' },
  Mobility:  { bg: '#F1EFE8', text: '#444441' },
}

export default function ExerciseLibrary({ onBack }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filtered, setFiltered] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadExercises() }, [])

  useEffect(() => {
    let res = exercises
    if (muscle !== 'All') res = res.filter(e => e.primary_muscle === muscle)
    if (difficulty !== 'All') res = res.filter(e => e.difficulty === difficulty)
    if (search) res = res.filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.secondary_muscles ?? []).join(' ').toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(res)
  }, [exercises, muscle, difficulty, search])

  async function loadExercises() {
    const { data } = await supabase
      .from('exercises')
      .select('id, name, primary_muscle, secondary_muscles, equipment, movement_pattern, difficulty, instructions, common_mistakes')
      .eq('is_active', true)
      .order('name')
    if (data) setExercises(data)
    setLoading(false)
  }

  // ── Detail view ──────────────────────────────────────────
  if (selected) {
    const colors = MUSCLE_COLORS[selected.primary_muscle] ?? { bg: '#f3f4f6', text: '#374151' }
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSelected(null)} style={btnStyle}>← Back</button>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</div>
        </div>

        <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto' }}>
          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: colors.bg, color: colors.text }}>{selected.primary_muscle}</span>
            {selected.difficulty && (
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#f3f4f6', color: '#6b7280' }}>{selected.difficulty}</span>
            )}
            {selected.movement_pattern && (
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#f3f4f6', color: '#6b7280' }}>{selected.movement_pattern}</span>
            )}
          </div>

          {/* Equipment */}
          {selected.equipment && selected.equipment.length > 0 && (
            <div style={sectionCard}>
              <div style={sectionLabel}>Equipment needed</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {selected.equipment.map(eq => (
                  <span key={eq} style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '12px', background: '#E6F1FB', color: '#185FA5' }}>{eq}</span>
                ))}
              </div>
            </div>
          )}

          {/* Secondary muscles */}
          {selected.secondary_muscles && selected.secondary_muscles.length > 0 && (
            <div style={sectionCard}>
              <div style={sectionLabel}>Also works</div>
              <div style={{ fontSize: '14px', color: '#374151', marginTop: '6px' }}>{selected.secondary_muscles.join(', ')}</div>
            </div>
          )}

          {/* Instructions */}
          {selected.instructions && (
            <div style={sectionCard}>
              <div style={sectionLabel}>How to do it</div>
              <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7', marginTop: '8px' }}>{selected.instructions}</div>
            </div>
          )}

          {/* Common mistakes */}
          {selected.common_mistakes && (
            <div style={{ ...sectionCard, borderLeft: '3px solid #ef4444', borderRadius: '0 12px 12px 0' }}>
              <div style={{ ...sectionLabel, color: '#991b1b' }}>Common mistakes</div>
              <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7', marginTop: '8px' }}>{selected.common_mistakes}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '20px' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={btnStyle}>← Back</button>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Exercise library</div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px 0' }}>
        <input
          type="text" placeholder="Search exercises..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box', color: '#111827' }}
        />
      </div>

      {/* Muscle filter */}
      <div style={{ padding: '10px 16px 0', display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {MUSCLES.map(m => (
          <div key={m} onClick={() => setMuscle(m)} style={{
            flexShrink: 0, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
            border: '1px solid ' + (muscle === m ? '#1D9E75' : '#e5e7eb'),
            background: muscle === m ? '#E1F5EE' : '#fff',
            color: muscle === m ? '#085041' : '#6b7280',
          }}>{m}</div>
        ))}
      </div>

      {/* Difficulty filter */}
      <div style={{ padding: '8px 16px 0', display: 'flex', gap: '6px' }}>
        {DIFFICULTIES.map(d => (
          <div key={d} onClick={() => setDifficulty(d)} style={{
            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer',
            border: '1px solid ' + (difficulty === d ? '#378ADD' : '#e5e7eb'),
            background: difficulty === d ? '#E6F1FB' : '#fff',
            color: difficulty === d ? '#185FA5' : '#9ca3af',
            textTransform: 'capitalize',
          }}>{d}</div>
        ))}
      </div>

      {/* Results */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
          {loading ? 'Loading...' : `${filtered.length} exercises`}
        </div>

        {filtered.map(ex => {
          const colors = MUSCLE_COLORS[ex.primary_muscle] ?? { bg: '#f3f4f6', text: '#374151' }
          return (
            <div
              key={ex.id}
              onClick={() => setSelected(ex)}
              style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{ex.name}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: colors.bg, color: colors.text }}>{ex.primary_muscle}</span>
                  {ex.difficulty && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: '#f3f4f6', color: '#6b7280', textTransform: 'capitalize' }}>{ex.difficulty}</span>}
                  {ex.equipment && ex.equipment.length > 0 && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: '#f3f4f6', color: '#9ca3af' }}>{ex.equipment[0]}</span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '14px', color: '#d1d5db', marginLeft: '8px' }}>›</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb',
  background: '#fff', fontSize: '13px', color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap',
}
const sectionCard: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
  padding: '14px 16px', marginBottom: '12px',
}
const sectionLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.5px',
}