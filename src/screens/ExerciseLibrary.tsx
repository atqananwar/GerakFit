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

const MUSCLE_GROUPS = [
  { label: 'All', values: [] as string[] },
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
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')
  useEffect(() => { document.body.style.background = darkMode ? '#0d0d0d' : '#f9fafb' }, [darkMode])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filtered, setFiltered] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('All')
  const [subMuscle, setSubMuscle] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState('All')
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadExercises() }, [])

  useEffect(() => {
    let res = exercises
    if (muscle !== 'All') {
      const group = MUSCLE_GROUPS.find(g => g.label === muscle)
      const muscles = group?.values ?? [muscle]
      if (subMuscle) {
        res = res.filter(e => e.primary_muscle === subMuscle)
      } else {
        res = res.filter(e => muscles.includes(e.primary_muscle))
      }
    }
    if (difficulty !== 'All') res = res.filter(e => e.difficulty === difficulty)
    if (search) res = res.filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.secondary_muscles ?? []).join(' ').toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(res)
  }, [exercises, muscle, subMuscle, difficulty, search])

  async function loadExercises() {
    const { data } = await supabase
      .from('exercises')
      .select('id, name, primary_muscle, secondary_muscles, equipment, movement_pattern, difficulty, instructions, common_mistakes')
      .eq('is_active', true)
      .order('name')
    if (data) setExercises(data)
    setLoading(false)
  }

  const btnStyle: React.CSSProperties = {
    background: 'none', border: 'none', fontSize: '14px', color: '#666', cursor: 'pointer', padding: '0',
  }
  const sectionCard: React.CSSProperties = {
    background: darkMode ? '#1c1c1e' : '#fff', border: darkMode ? '0.5px solid #2a2a2a' : '0.5px solid #e5e7eb', borderRadius: '12px',
    padding: '14px 16px', marginBottom: '12px',
  }
  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: '#666',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  }

  // ── Detail view ──────────────────────────────────────────
  if (selected) {
    const colors = MUSCLE_COLORS[selected.primary_muscle] ?? { bg: '#f3f4f6', text: '#2a2a2a' }
    return (
      <div style={{ minHeight: '100vh', background: darkMode ? '#0d0d0d' : '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: darkMode ? '#1c1c1e' : '#fff', borderBottom: '0.5px solid #2a2a2a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSelected(null)} style={btnStyle}>← Back</button>
          <div style={{ fontSize: '18px', fontWeight: 800, color: darkMode ? '#ffffff' : '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</div>
        </div>

        <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto' }}>
          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: colors.bg, color: colors.text }}>{selected.primary_muscle}</span>
            {selected.difficulty && (
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: darkMode ? '#2a2a2a' : '#f3f4f6', color: darkMode ? '#888888' : '#6b7280' }}>{selected.difficulty}</span>
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
              <div style={{ fontSize: '14px', color: darkMode ? '#cccccc' : '#374151', marginTop: '6px' }}>{selected.secondary_muscles.join(', ')}</div>
            </div>
          )}

          {/* Instructions */}
          {selected.instructions && (
            <div style={sectionCard}>
              <div style={sectionLabel}>How to do it</div>
              <div style={{ fontSize: '14px', color: darkMode ? '#cccccc' : '#374151', lineHeight: '1.7', marginTop: '8px' }}>{selected.instructions}</div>
            </div>
          )}

          {/* Common mistakes */}
          {selected.common_mistakes && (
            <div style={{ ...sectionCard, borderLeft: '3px solid #ef4444', borderRadius: '0 12px 12px 0' }}>
              <div style={{ ...sectionLabel, color: '#991b1b' }}>Common mistakes</div>
              <div style={{ fontSize: '14px', color: darkMode ? '#cccccc' : '#374151', lineHeight: '1.7', marginTop: '8px' }}>{selected.common_mistakes}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: darkMode ? '#0d0d0d' : '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '20px' }}>
      <div style={{ background: darkMode ? '#1c1c1e' : '#fff', borderBottom: '0.5px solid #2a2a2a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={btnStyle}>← Back</button>
        <div style={{ fontSize: '18px', fontWeight: 800, color: darkMode ? '#ffffff' : '#111827' }}>Exercise library</div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px 0' }}>
        <input
          type="text" placeholder="Search exercises..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: darkMode ? '0.5px solid #2a2a2a' : '0.5px solid #e5e7eb', background: darkMode ? '#1c1c1e' : '#fff', fontSize: '14px', boxSizing: 'border-box', color: darkMode ? '#ffffff' : '#111827' }}
        />
      </div>

      {/* Muscle group filter */}
      <div style={{ padding: '10px 16px 0', display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {MUSCLE_GROUPS.map(g => (
          <div key={g.label} onClick={() => { setMuscle(g.label); setSubMuscle(null) }} style={{
            flexShrink: 0, height: '36px', padding: '0 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center',
            border: muscle === g.label ? 'none' : (darkMode ? '0.5px solid #2a2a2a' : '1px solid #e5e7eb'),
            background: muscle === g.label ? '#1D9E75' : (darkMode ? '#1c1c1e' : '#fff'),
            color: muscle === g.label ? '#fff' : (darkMode ? '#666666' : '#6b7280'),
          }}>{g.label}</div>
        ))}
      </div>

      {/* Sub-muscle filter */}
      {muscle !== 'All' && (MUSCLE_GROUPS.find(g => g.label === muscle)?.values.length ?? 0) > 1 && (
        <div style={{ padding: '5px 16px 0', display: 'flex', gap: '5px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div onClick={() => setSubMuscle(null)} style={{ flexShrink: 0, height: '30px', padding: '0 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', border: subMuscle === null ? 'none' : (darkMode ? '0.5px solid #2a2a2a' : '1px solid #e5e7eb'), background: subMuscle === null ? '#1D9E75' : (darkMode ? '#1c1c1e' : '#fff'), color: subMuscle === null ? '#fff' : (darkMode ? '#666666' : '#6b7280') }}>All {muscle}</div>
          {MUSCLE_GROUPS.find(g => g.label === muscle)?.values.map(sub => (
            <div key={sub} onClick={() => setSubMuscle(sub)} style={{ flexShrink: 0, height: '30px', padding: '0 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', border: subMuscle === sub ? 'none' : (darkMode ? '0.5px solid #2a2a2a' : '1px solid #e5e7eb'), background: subMuscle === sub ? '#1D9E75' : (darkMode ? '#1c1c1e' : '#fff'), color: subMuscle === sub ? '#fff' : (darkMode ? '#666666' : '#6b7280') }}>{sub}</div>
          ))}
        </div>
      )}

      {/* Difficulty filter */}
      <div style={{ padding: '8px 16px 0', display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {DIFFICULTIES.map(d => (
          <div key={d} onClick={() => setDifficulty(d)} style={{
            flexShrink: 0, height: '30px', padding: '0 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            border: difficulty === d ? 'none' : (darkMode ? '0.5px solid #2a2a2a' : '1px solid #e5e7eb'),
            background: difficulty === d ? '#1D9E75' : (darkMode ? '#1c1c1e' : '#fff'),
            color: difficulty === d ? '#fff' : (darkMode ? '#666666' : '#6b7280'),
            textTransform: 'capitalize',
          }}>{d}</div>
        ))}
      </div>

      {/* Results */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
          {loading ? 'Loading...' : `${filtered.length} exercises`}
        </div>

        {filtered.map(ex => (
          <div
            key={ex.id}
            onClick={() => setSelected(ex)}
            style={{ background: darkMode ? '#1c1c1e' : '#fff', border: darkMode ? '0.5px solid #2a2a2a' : '0.5px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', marginBottom: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: darkMode ? '#ffffff' : '#111827' }}>{ex.name}</div>
              <div style={{ fontSize: '11px', color: darkMode ? '#666666' : '#6b7280', marginTop: '3px' }}>
                {ex.primary_muscle}{ex.equipment && ex.equipment.length > 0 ? ` · ${ex.equipment[0]}` : ''}
              </div>
            </div>
            <div style={{ fontSize: '18px', color: '#333', marginLeft: '8px' }}>›</div>
          </div>
        ))}
      </div>
    </div>
  )
}
