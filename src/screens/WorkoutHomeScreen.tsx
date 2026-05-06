import { useState, useEffect } from 'react'

interface Props {
  onStartWorkout: () => void
  onExploreRoutines: () => void
  onHome: () => void
  onOpenProfile: () => void
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'workout', label: 'Workout' },
  { id: 'profile', label: 'Profile' },
]

export default function WorkoutHomeScreen({ onStartWorkout, onExploreRoutines, onHome, onOpenProfile }: Props) {
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')

  useEffect(() => {
    document.body.style.background = darkMode ? '#0d0d0d' : '#f9fafb'
  }, [darkMode])

  return (
    <div style={{ minHeight: '100vh', background: darkMode ? '#0d0d0d' : '#f9fafb', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', paddingBottom: '80px' }}>

      {/* v2 */}
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
            width: '100%',
            border: '0.5px solid #2a2a2a',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2a2a2a', color: '#ffffff', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</div>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>Start Empty Workout</span>
        </div>

        {/* Routines label */}
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginTop: '8px' }}>Routines</div>

        {/* Grid buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div
            onClick={onStartWorkout}
            style={{
              background: '#1c1c1e',
              border: '0.5px solid #2a2a2a',
              borderRadius: '14px',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '28px' }}>📋</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>New Routine</span>
          </div>
          <div
            onClick={onExploreRoutines}
            style={{
              background: '#1c1c1e',
              border: '0.5px solid #2a2a2a',
              borderRadius: '14px',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '28px' }}>🔍</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Explore Routines</span>
          </div>
        </div>

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
