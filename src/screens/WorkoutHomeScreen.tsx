import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onStartWorkout: () => void
  onStartRoutine: (routineId: string) => void
  onNewRoutine: () => void
  onExploreRoutines: () => void
  onHome: () => void
  onOpenProfile: () => void
  refreshKey?: number
}

interface SavedRoutine {
  id: string
  name: string
  split_type: string
  workout_templates: {
    id: string
    name: string
    day_type: string
    sort_order: number
  }[]
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'workout', label: 'Workout' },
  { id: 'profile', label: 'Profile' },
]

export default function WorkoutHomeScreen({ onStartWorkout, onStartRoutine, onNewRoutine, onExploreRoutines, onHome, onOpenProfile, refreshKey }: Props) {
  const { user } = useAuth()
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([])
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.background = darkMode ? '#0d0d0d' : '#f9fafb'
  }, [darkMode])

  async function loadSavedRoutines() {
    if (!user) return
    const { data } = await supabase
      .from('programs')
      .select('id, name, split_type, workout_templates(id, name, day_type, sort_order)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (data) setSavedRoutines(data as SavedRoutine[])
  }

  useEffect(() => { loadSavedRoutines() }, [user, refreshKey])

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>Workout</div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

        {/* Start Empty Workout */}
        <div
          onClick={onStartWorkout}
          style={{
            background: '#1c1c1e',
            borderRadius: '14px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            border: '0.5px solid #2a2a2a',
            cursor: 'pointer',
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2a2a2a', color: '#ffffff', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</div>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>Start Empty Workout</span>
        </div>

        {/* Routines label + grid */}
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginTop: '8px' }}>Routines</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div
            onClick={onNewRoutine}
            style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '14px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '28px' }}>📋</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>New Routine</span>
          </div>
          <div
            onClick={onExploreRoutines}
            style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '14px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '28px' }}>🔍</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Explore Routines</span>
          </div>
        </div>

        {/* Saved routines */}
        {savedRoutines.map(routine => {
          const days = (routine.workout_templates ?? [])
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)

          const isExpanded = expandedRoutine === routine.id
          const dayCount = days.length

          const firstThree = days.slice(0, 3).map(d => d.name)
          const dayTitle = firstThree.join(', ') + (dayCount > 3 ? '...' : '')
          const allNames = days.map(d => d.name).join(', ')

          return (
            <div key={routine.id}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', cursor: 'pointer' }}
                onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
              >
                <span style={{ fontSize: '13px', color: '#888', lineHeight: 1, transition: 'transform 0.15s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                <span style={{ fontSize: '14px', color: '#888', flex: 1 }}>{routine.name} <span style={{ color: '#555' }}>({dayCount})</span></span>
                <button
                  onClick={e => { e.stopPropagation(); console.log('[WorkoutHome] menu tapped for:', routine.id) }}
                  style={{ background: 'none', border: 'none', color: '#555', fontSize: '18px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                >
                  ···
                </button>
              </div>

              {/* Expanded: day card */}
              {isExpanded && (
                <div style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '14px 16px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{dayTitle}</div>
                  <div style={{
                    fontSize: '12px', color: '#888', marginTop: '4px',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {allNames}
                  </div>
                  <button
                    onClick={() => onStartRoutine(routine.id)}
                    style={{ width: '100%', background: '#1D9E75', border: 'none', color: '#ffffff', fontSize: '14px', fontWeight: 700, padding: '12px', borderRadius: '10px', marginTop: '12px', cursor: 'pointer' }}
                  >
                    Start Routine
                  </button>
                </div>
              )}
            </div>
          )
        })}

      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1c1c1e', borderTop: '0.5px solid #2a2a2a', display: 'flex', justifyContent: 'space-around', padding: '0 0 16px', zIndex: 100 }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'home') onHome()
              else if (item.id === 'profile') onOpenProfile()
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              borderTop: item.id === 'workout' ? '2px solid #378ADD' : '2px solid transparent',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '10px 20px 4px',
              color: item.id === 'workout' ? '#378ADD' : '#666666',
              fontSize: '12px',
              fontWeight: item.id === 'workout' ? 600 : 400,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
