import { useState } from 'react'
import { PRESET_ROUTINES } from '../data/presetRoutines'
import type { PresetRoutine } from '../data/presetRoutines'
import { useTheme } from '../theme/ThemeContext'

interface Props {
  onBack: () => void
  onStartWorkout: () => void
}

type Level = 'All' | 'Beginner' | 'Intermediate' | 'Advanced'
type Equipment = 'All' | 'Gym' | 'Dumbbells' | 'Bodyweight'

const LEVEL_COLORS: Record<string, string> = {
  Beginner: '#1D9E75',
  Intermediate: '#378ADD',
  Advanced: '#e55a2b',
}

export default function ProgramBuilder({ onBack, onStartWorkout }: Props) {
  const { theme } = useTheme()
  const [levelFilter, setLevelFilter] = useState<Level>('All')
  const [equipFilter, setEquipFilter] = useState<Equipment>('All')
  const [selected, setSelected] = useState<PresetRoutine | null>(null)

  const filtered = PRESET_ROUTINES.filter(r => {
    const levelOk = levelFilter === 'All' || r.level === levelFilter
    const equipOk = equipFilter === 'All' || r.equipment === equipFilter
    return levelOk && equipOk
  })

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: '20px',
    border: active ? 'none' : `0.5px solid ${theme.border}`,
    background: active ? '#1D9E75' : theme.card,
    color: active ? '#ffffff' : theme.textSecondary,
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  })

  const equipChipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: '20px',
    border: active ? `0.5px solid ${theme.textTertiary}` : `0.5px solid ${theme.border}`,
    background: active ? theme.border : theme.card,
    color: active ? theme.text : theme.textSecondary,
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  })

  return (
    <div style={{ minHeight: '100vh', background: theme.background, fontFamily: 'system-ui, sans-serif', paddingBottom: '32px' }}>

      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `0.5px solid ${theme.card}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: theme.textSecondary, fontSize: '20px', cursor: 'pointer', padding: '0 4px 0 0', lineHeight: 1 }}>←</button>
        <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text, flex: 1 }}>Programs</div>
        <div style={{ fontSize: '12px', color: theme.textSecondary }}>{filtered.length} routines</div>
      </div>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: '8px', padding: '14px 16px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {(['All', 'Beginner', 'Intermediate', 'Advanced'] as Level[]).map(l => (
          <button key={l} onClick={() => setLevelFilter(l)} style={chipStyle(levelFilter === l)}>{l}</button>
        ))}
      </div>

      {/* Equipment filter */}
      <div style={{ display: 'flex', gap: '8px', padding: '10px 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {(['All', 'Gym', 'Dumbbells', 'Bodyweight'] as Equipment[]).map(e => (
          <button key={e} onClick={() => setEquipFilter(e)} style={equipChipStyle(equipFilter === e)}>{e}</button>
        ))}
      </div>

      {/* Routine list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(routine => (
          <div
            key={routine.id}
            onClick={() => setSelected(routine)}
            style={{ background: theme.card, border: `0.5px solid ${theme.border}`, borderRadius: '14px', padding: '16px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: theme.text, flex: 1, lineHeight: 1.3 }}>{routine.name}</div>
              <div style={{ fontSize: '12px', color: theme.textSecondary, whiteSpace: 'nowrap', flexShrink: 0 }}>{routine.days}d/wk</div>
            </div>
            <div style={{ fontSize: '13px', color: theme.textSecondary, marginTop: '6px', lineHeight: 1.4 }}>{routine.description}</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: LEVEL_COLORS[routine.level] ?? theme.textSecondary, background: theme.background, border: `0.5px solid ${LEVEL_COLORS[routine.level] ?? theme.border}`, borderRadius: '6px', padding: '3px 8px' }}>{routine.level}</span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: theme.textSecondary, background: theme.background, border: `0.5px solid ${theme.border}`, borderRadius: '6px', padding: '3px 8px' }}>{routine.equipment}</span>
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
            style={{ position: 'relative', background: theme.card, borderRadius: '20px 20px 0 0', padding: '0 0 40px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: theme.border }} />
            </div>

            <div style={{ padding: '12px 20px 16px', borderBottom: `0.5px solid ${theme.border}` }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>{selected.name}</div>
              <div style={{ fontSize: '13px', color: theme.textSecondary, marginTop: '6px' }}>{selected.description}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: LEVEL_COLORS[selected.level] ?? theme.textSecondary, background: theme.background, border: `0.5px solid ${LEVEL_COLORS[selected.level] ?? theme.border}`, borderRadius: '6px', padding: '3px 8px' }}>{selected.level}</span>
                <span style={{ fontSize: '11px', fontWeight: 500, color: theme.textSecondary, background: theme.background, border: `0.5px solid ${theme.border}`, borderRadius: '6px', padding: '3px 8px' }}>{selected.equipment}</span>
                <span style={{ fontSize: '11px', fontWeight: 500, color: theme.textSecondary, background: theme.background, border: `0.5px solid ${theme.border}`, borderRadius: '6px', padding: '3px 8px' }}>{selected.days} days/week</span>
              </div>
            </div>

            <div style={{ padding: '8px 20px' }}>
              {selected.workouts.map((workout, wi) => (
                <div key={wi}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase' as const, marginTop: '12px', letterSpacing: '0.4px' }}>{workout.name}</div>
                  {workout.exercises.map((ex, ei) => (
                    <div key={ei} style={{ fontSize: '13px', color: theme.text, padding: '6px 0', borderBottom: `0.5px solid ${theme.borderSubtle}` }}>{ex}</div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ padding: '20px 20px 0' }}>
              <button
                onClick={() => { setSelected(null); onStartWorkout() }}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1D9E75', border: 'none', color: '#ffffff', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
              >
                Start this Routine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
