import { useState, useEffect } from 'react'
import { PRESET_ROUTINES } from '../data/presetRoutines'
import type { PresetRoutine } from '../data/presetRoutines'

interface Props {
  onBack: () => void
  onStartWorkout: () => void
}


type Level = 'All' | 'Beginner' | 'Intermediate' | 'Advanced'
type Routine = PresetRoutine

const LEVEL_COLORS: Record<string, string> = {
  Beginner: '#1D9E75',
  Intermediate: '#378ADD',
  Advanced: '#e55a2b',
}


export default function ExploreRoutinesScreen({ onBack, onStartWorkout }: Props) {
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')
  const [levelFilter, setLevelFilter] = useState<Level>('All')
  const [selected, setSelected] = useState<Routine | null>(null)

  useEffect(() => {
    document.body.style.background = darkMode ? '#0d0d0d' : '#f9fafb'
  }, [darkMode])

  const filtered = levelFilter === 'All'
    ? PRESET_ROUTINES
    : PRESET_ROUTINES.filter(r => r.level === levelFilter)

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', fontFamily: 'system-ui, sans-serif', paddingBottom: '32px' }}>

      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '0.5px solid #1c1c1e' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer', padding: '0 4px 0 0', lineHeight: 1 }}>←</button>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', flex: 1 }}>Explore Routines</div>
        <div style={{ fontSize: '12px', color: '#666' }}>{filtered.length} routines</div>
      </div>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: '8px', padding: '14px 16px', overflowX: 'auto' }}>
        {(['All', 'Beginner', 'Intermediate', 'Advanced'] as Level[]).map(l => (
          <button
            key={l}
            onClick={() => setLevelFilter(l)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: levelFilter === l ? 'none' : '0.5px solid #2a2a2a',
              background: levelFilter === l ? '#1D9E75' : '#1c1c1e',
              color: levelFilter === l ? '#ffffff' : '#888',
              fontSize: '13px',
              fontWeight: levelFilter === l ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Routine list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(routine => (
          <div
            key={routine.id}
            onClick={() => setSelected(routine)}
            style={{
              background: '#1c1c1e',
              border: '0.5px solid #2a2a2a',
              borderRadius: '14px',
              padding: '16px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', flex: 1, lineHeight: 1.3 }}>{routine.name}</div>
              <div style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap', flexShrink: 0 }}>{routine.days}d/wk</div>
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '6px', lineHeight: 1.4 }}>{routine.description}</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: LEVEL_COLORS[routine.level] ?? '#888', background: '#0d0d0d', border: `0.5px solid ${LEVEL_COLORS[routine.level] ?? '#2a2a2a'}`, borderRadius: '6px', padding: '3px 8px' }}>{routine.level}</span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#aaa', background: '#0d0d0d', border: '0.5px solid #2a2a2a', borderRadius: '6px', padding: '3px 8px' }}>{routine.equipment}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail sheet */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={() => setSelected(null)}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div
            style={{ position: 'relative', background: '#1c1c1e', borderRadius: '20px 20px 0 0', padding: '0 0 40px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#3a3a3a' }} />
            </div>

            {/* Sheet header */}
            <div style={{ padding: '12px 20px 16px', borderBottom: '0.5px solid #2a2a2a' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>{selected.name}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>{selected.description}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: LEVEL_COLORS[selected.level] ?? '#888', background: '#0d0d0d', border: `0.5px solid ${LEVEL_COLORS[selected.level] ?? '#2a2a2a'}`, borderRadius: '6px', padding: '3px 8px' }}>{selected.level}</span>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#aaa', background: '#0d0d0d', border: '0.5px solid #2a2a2a', borderRadius: '6px', padding: '3px 8px' }}>{selected.equipment}</span>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#aaa', background: '#0d0d0d', border: '0.5px solid #2a2a2a', borderRadius: '6px', padding: '3px 8px' }}>{selected.days} days/week</span>
              </div>
            </div>

            {/* Workouts */}
            <div style={{ padding: '8px 20px' }}>
              {selected.workouts.map((workout, wi) => (
                <div key={wi}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase' as const, marginTop: '12px', letterSpacing: '0.4px' }}>{workout.name}</div>
                  {workout.exercises.map((ex, ei) => (
                    <div
                      key={ei}
                      style={{ fontSize: '13px', color: '#cccccc', padding: '6px 0', borderBottom: '0.5px solid #1a1a1a' }}
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ padding: '20px 20px 0' }}>
              <button
                onClick={() => { setSelected(null); onStartWorkout() }}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1D9E75', border: 'none', color: '#ffffff', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
              >
                Start this Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
