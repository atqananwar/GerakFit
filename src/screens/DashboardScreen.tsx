import { useEffect, useState } from 'react'
import type { SyncStatus } from '../lib/sync'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Profile {
  full_name: string | null
  goal: string | null
  experience_level: string | null
  training_days_per_week: number | null
  session_length_minutes: number | null
}

interface RecentSession {
  id: string
  workout_date: string
  status: string
  duration_seconds: number | null
  template_id: string | null
}

interface PR {
  id: string
  record_type: string
  weight_kg: number | null
  reps: number | null
  achieved_at: string
  exercises: { name: string | null } | null
}

interface WeeklyStats {
  sessionsThisWeek: number
  targetDays: number
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home' },
  { id: 'workout', label: 'Workout' },
  { id: 'profile', label: 'Profile' },
]

const GOAL_LABELS: Record<string, string> = {
  muscle_gain: 'Build muscle',
  fat_loss: 'Lose fat',
  strength: 'Get stronger',
  general_fitness: 'General fitness',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  onStartWorkout: () => void
  onOpenLibrary: () => void
  onOpenAnalytics: () => void
  onOpenProfile: () => void
  onOpenPrograms: () => void
  onOpenAISummary: () => void
  onOpenDailyChallenge: () => void
  syncStatus?: SyncStatus
}

export default function DashboardScreen({ onStartWorkout, onOpenAnalytics, onOpenProfile, onOpenPrograms, onOpenAISummary, onOpenDailyChallenge, syncStatus }: Props) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [prs, setPRs] = useState<PR[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ sessionsThisWeek: 0, targetDays: 3 })
  const [activeNav, setActiveNav] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const today = new Date()

  useEffect(() => {
    document.body.style.background = darkMode ? '#000000' : '#f9fafb'
    localStorage.setItem('gerakfit-dark', String(darkMode))
  }, [darkMode])

  useEffect(() => {
    if (user) loadDashboard()
  }, [user])

  async function loadDashboard() {
    if (!user) return
    setLoading(true)
    try {
      const [profileRes, sessionsRes, prsRes] = await Promise.all([
        supabase.from('profiles').select('full_name, goal, experience_level, training_days_per_week, session_length_minutes').eq('id', user.id).single(),
        supabase.from('workout_sessions').select('id, workout_date, status, duration_seconds, template_id').eq('user_id', user.id).order('workout_date', { ascending: false }).limit(10),
        supabase.from('personal_records').select('id, record_type, weight_kg, reps, achieved_at, exercises(name)').eq('user_id', user.id).order('achieved_at', { ascending: false }).limit(5),
      ])
      if (profileRes.data) setProfile(profileRes.data)
      if (sessionsRes.data) setRecentSessions(sessionsRes.data)
      if (prsRes.data) setPRs(prsRes.data as unknown as PR[])
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const thisWeekSessions = (sessionsRes.data || []).filter(s => new Date(s.workout_date) >= weekStart && s.status === 'completed')
      setWeeklyStats({ sessionsThisWeek: thisWeekSessions.length, targetDays: profileRes.data?.training_days_per_week ?? 3 })
    } finally {
      setLoading(false)
    }
  }

  async function deleteSession(id: string) {
    await supabase.from('exercise_sets').delete().in('session_exercise_id',
      (await supabase.from('session_exercises').select('id').eq('session_id', id)).data?.map(r => r.id) ?? []
    )
    await supabase.from('session_exercises').delete().eq('session_id', id)
    await supabase.from('workout_sessions').delete().eq('id', id)
    setRecentSessions(prev => prev.filter(s => s.id !== id))
    setDeleteConfirm(null)
    loadDashboard()
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return '—'
    return `${Math.round(seconds / 60)} min`
  }

  function formatDate(dateStr: string) {
    const diff = Math.floor((today.getTime() - new Date(dateStr).getTime()) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return `${diff} days ago`
  }

  function getGreeting() {
    const h = today.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const D = darkMode
  const bg = D ? '#000000' : '#f9fafb'
  const card = D ? '#111111' : '#fff'
  const border = D ? '#1a1a1a' : '#e5e7eb'
  const textPrimary = D ? '#f9fafb' : '#111827'
  const textSecondary = D ? '#555555' : '#6b7280'
  const textTertiary = D ? '#444444' : '#9ca3af'
  const surfaceBg = D ? '#1a1a1a' : '#f3f4f6'

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const weekProgress = Math.min(weeklyStats.sessionsThisWeek / weeklyStats.targetDays, 1)

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - today.getDay() + i)
    const dateStr = d.toISOString().split('T')[0]
    const hasSession = recentSessions.some(s => s.workout_date === dateStr && s.status === 'completed')
    const isToday = i === today.getDay()
    return { label: DAY_NAMES[i], hasSession, isToday }
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: textPrimary }}>Gerak<span style={{ color: '#1D9E75' }}>Fit</span></div>
        <div style={{ fontSize: '13px', color: textTertiary, marginTop: '8px' }}>Loading...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ background: card, borderBottom: `0.5px solid ${border}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', color: textPrimary }}>
          Gerak<span style={{ color: '#1D9E75' }}>Fit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: textSecondary, background: surfaceBg, padding: '4px 10px', borderRadius: '20px' }}>
            {GOAL_LABELS[profile?.goal ?? ''] ?? 'No goal set'}
          </div>
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(d => !d)}
            style={{ width: '36px', height: '20px', borderRadius: '10px', border: 'none', background: darkMode ? '#1D9E75' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
          >
            <div style={{ position: 'absolute', top: '2px', left: darkMode ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: '#444444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{getGreeting()}</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: textPrimary, letterSpacing: '-0.5px' }}>{firstName}</div>
          <div style={{ fontSize: '13px', color: textSecondary, marginTop: '2px' }}>
            {today.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        {/* Weekly progress */}
        <div style={{ background: card, border: `0.5px solid ${border}`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', color: textSecondary, fontWeight: 500 }}>This week</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
              <span style={{ fontSize: '52px', fontWeight: 800, color: textPrimary, letterSpacing: '-2px', lineHeight: 1 }}>{weeklyStats.sessionsThisWeek}</span>
              <span style={{ fontSize: '16px', fontWeight: 400, color: '#9ca3af' }}> /{weeklyStats.targetDays} sessions</span>
            </div>
          </div>
          <div style={{ background: surfaceBg, borderRadius: '4px', height: '3px', marginBottom: '14px' }}>
            <div style={{ background: '#1D9E75', height: '3px', borderRadius: '4px', width: `${weekProgress * 100}%`, transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {weekDays.map((d, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: d.isToday ? '#1D9E75' : textTertiary, fontWeight: d.isToday ? 600 : 400, marginBottom: '4px' }}>{d.label}</div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto', background: d.hasSession ? '#1D9E75' : d.isToday ? (D ? '#064e3b' : '#E1F5EE') : surfaceBg, border: d.isToday ? '2px solid #1D9E75' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {d.hasSession && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sync status */}
        {syncStatus && syncStatus !== 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: syncStatus === 'syncing' ? surfaceBg : syncStatus === 'success' ? (D ? '#064e3b' : '#E1F5EE') : syncStatus === 'offline' ? '#fef9c3' : '#fef2f2', marginBottom: '12px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: syncStatus === 'syncing' ? '#9ca3af' : syncStatus === 'success' ? '#1D9E75' : syncStatus === 'offline' ? '#d97706' : '#ef4444' }} />
            <span style={{ fontSize: '12px', color: syncStatus === 'syncing' ? textSecondary : syncStatus === 'success' ? '#085041' : syncStatus === 'offline' ? '#92400e' : '#991b1b' }}>
              {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'success' ? 'All synced' : syncStatus === 'offline' ? 'Offline — saved locally' : 'Sync error'}
            </span>
          </div>
        )}

        {/* Start workout */}
        <button onClick={onStartWorkout} style={{ width: '100%', padding: '18px', borderRadius: '14px', background: '#1D9E75', border: 'none', color: '#fff', fontSize: '17px', fontWeight: 800, cursor: 'pointer', marginBottom: '10px' }}>
          Start today's workout
        </button>

        {/* AI Summary + Daily Challenge row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={onOpenAISummary} style={{ flex: 1, padding: '11px 8px', borderRadius: '12px', background: card, border: `0.5px solid ${border}`, color: textPrimary, fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>✦</span> AI weekly summary
          </button>
          <button onClick={onOpenDailyChallenge} style={{ flex: 1, padding: '11px 8px', borderRadius: '12px', background: '#000000', border: '0.5px solid #1a1a1a', color: '#f9fafb', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>⚔️</span> Daily Challenge
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Total sessions', value: recentSessions.filter(s => s.status === 'completed').length, sub: 'all time' },
            { label: 'Personal records', value: prs.length, sub: 'recorded' },
          ].map(stat => (
            <div key={stat.label} style={{ background: card, border: `0.5px solid ${border}`, borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '10px', color: textTertiary, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: textPrimary, marginTop: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: textSecondary, marginTop: '2px' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent PRs */}
        {prs.length > 0 && (
          <div style={{ background: card, border: `0.5px solid ${border}`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, marginBottom: '12px' }}>Recent PRs</div>
            {prs.map(pr => (
              <div key={pr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', marginBottom: '10px', borderBottom: `0.5px solid ${border}` }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{pr.exercises?.name ?? '—'}</div>
                  <div style={{ fontSize: '11px', color: textTertiary, marginTop: '1px' }}>{formatDate(pr.achieved_at)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1D9E75' }}>
                    {pr.weight_kg ? `${pr.weight_kg} kg` : ''}{pr.weight_kg && pr.reps ? ' × ' : ''}{pr.reps ? `${pr.reps} reps` : ''}
                  </div>
                  <div style={{ fontSize: '10px', color: textTertiary, marginTop: '1px', textTransform: 'capitalize' }}>{pr.record_type.replace(/_/g, ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent sessions */}
        <div style={{ background: card, border: `0.5px solid ${border}`, borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, marginBottom: '12px' }}>Recent sessions</div>
          {recentSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '13px', color: textTertiary }}>No sessions yet. Start your first workout!</div>
          ) : (
            recentSessions.slice(0, 5).map(session => (
              <div key={session.id}>
                {deleteConfirm === session.id ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `0.5px solid ${border}` }}>
                    <span style={{ fontSize: '13px', color: '#ef4444' }}>Delete this session?</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setDeleteConfirm(null)} style={{ padding: '4px 10px', borderRadius: '6px', border: `0.5px solid ${border}`, background: card, color: textSecondary, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={() => deleteSession(session.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', marginBottom: '10px', borderBottom: `0.5px solid ${border}` }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: textPrimary }}>Workout</div>
                      <div style={{ fontSize: '11px', color: textTertiary, marginTop: '1px' }}>{formatDate(session.workout_date)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '13px', color: textSecondary }}>{formatDuration(session.duration_seconds)}</div>
                      <div style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 500, background: session.status === 'completed' ? (D ? '#064e3b' : '#E1F5EE') : '#fef9c3', color: session.status === 'completed' ? '#1D9E75' : '#854d0e' }}>
                        {session.status}
                      </div>
                      <button onClick={() => setDeleteConfirm(session.id)} style={{ padding: '2px 8px', borderRadius: '6px', border: `1px solid ${D ? '#4b5563' : '#fee2e2'}`, background: 'transparent', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}>×</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: card, borderTop: `0.5px solid ${border}`, display: 'flex', justifyContent: 'space-around', padding: '0 0 16px', zIndex: 100 }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'profile') onOpenProfile()
              else if (item.id === 'programs') onOpenPrograms()
              else if (item.id === 'progress') onOpenAnalytics()
              else if (item.id === 'workout') onStartWorkout()
              else setActiveNav(item.id)
            }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', borderTop: activeNav === item.id ? '2px solid #1D9E75' : '2px solid transparent', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', background: 'transparent', cursor: 'pointer', padding: '10px 20px 4px', color: activeNav === item.id ? '#1D9E75' : textTertiary, fontSize: '12px', fontWeight: activeNav === item.id ? 600 : 400 }}
          >
            {item.label}
          </button>
        ))}
      </div>

    </div>
  )
}
