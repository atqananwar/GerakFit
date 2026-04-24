import { useEffect, useState } from 'react'
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
  muscleGroups: string[]
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home' },
  { id: 'workout', label: 'Workout' },
  { id: 'programs', label: 'Programs' },
  { id: 'progress', label: 'Progress' },
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
}

export default function DashboardScreen({ onStartWorkout, onOpenAnalytics, onOpenProfile, onOpenPrograms }: Props) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [prs, setPRs] = useState<PR[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ sessionsThisWeek: 0, targetDays: 3, muscleGroups: [] })
  const [activeNav, setActiveNav] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const today = new Date()

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

      // Weekly stats
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const thisWeekSessions = (sessionsRes.data || []).filter(s => {
        const d = new Date(s.workout_date)
        return d >= weekStart && s.status === 'completed'
      })

      setWeeklyStats({
        sessionsThisWeek: thisWeekSessions.length,
        targetDays: profileRes.data?.training_days_per_week ?? 3,
        muscleGroups: [],
      })
    } finally {
      setLoading(false)
    }
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return '—'
    const m = Math.round(seconds / 60)
    return `${m} min`
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
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

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const weekProgress = Math.min(weeklyStats.sessionsThisWeek / weeklyStats.targetDays, 1)

  // Generate week grid (Sun–Sat)
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - today.getDay() + i)
    const dateStr = d.toISOString().split('T')[0]
    const hasSession = recentSessions.some(s => s.workout_date === dateStr && s.status === 'completed')
    const isToday = i === today.getDay()
    return { label: DAY_NAMES[i], hasSession, isToday }
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700 }}>Gerak<span style={{ color: '#1D9E75' }}>Fit</span></div>
          <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>

      {/* Top header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>
          Gerak<span style={{ color: '#1D9E75' }}>Fit</span>
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '4px 10px', borderRadius: '20px' }}>
          {GOAL_LABELS[profile?.goal ?? ''] ?? 'No goal set'}
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>{getGreeting()}, {firstName}</div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
            {today.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        {/* Weekly progress card */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>This week</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginTop: '2px' }}>
                {weeklyStats.sessionsThisWeek}
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#9ca3af' }}> / {weeklyStats.targetDays} sessions</span>
              </div>
            </div>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: '#085041',
            }}>
              {Math.round(weekProgress * 100)}%
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px', marginBottom: '14px' }}>
            <div style={{ background: '#1D9E75', height: '6px', borderRadius: '4px', width: `${weekProgress * 100}%`, transition: 'width 0.5s' }} />
          </div>

          {/* Week day dots */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {weekDays.map((d, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: d.isToday ? '#1D9E75' : '#9ca3af', fontWeight: d.isToday ? 600 : 400, marginBottom: '4px' }}>{d.label}</div>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', margin: '0 auto',
                  background: d.hasSession ? '#1D9E75' : d.isToday ? '#E1F5EE' : '#f3f4f6',
                  border: d.isToday ? '2px solid #1D9E75' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {d.hasSession && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start workout CTA */}
        <button
          onClick={onStartWorkout}
          style={{
            width: '100%', padding: '16px', borderRadius: '14px',
            background: '#1D9E75', border: 'none', color: '#fff',
            fontSize: '16px', fontWeight: 700, cursor: 'pointer',
            marginBottom: '16px', letterSpacing: '-0.2px',
          }}
        >
          Start today's workout
        </button>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total sessions</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#111827', marginTop: '4px' }}>{recentSessions.filter(s => s.status === 'completed').length}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>all time</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personal records</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#111827', marginTop: '4px' }}>{prs.length}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>recorded</div>
          </div>
        </div>

        {/* Recent PRs */}
        {prs.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '16px 18px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Recent PRs</div>
            {prs.map(pr => (
              <div key={pr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{pr.exercises?.name ?? '—'}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{formatDate(pr.achieved_at)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1D9E75' }}>
                    {pr.weight_kg ? `${pr.weight_kg} kg` : ''}{pr.weight_kg && pr.reps ? ' × ' : ''}{pr.reps ? `${pr.reps} reps` : ''}
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px' }}>{pr.record_type.replace(/_/g, ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent sessions */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '16px 18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Recent sessions</div>
          {recentSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '13px', color: '#9ca3af' }}>
              No sessions yet. Start your first workout!
            </div>
          ) : (
            recentSessions.slice(0, 5).map(session => (
              <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>Workout</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{formatDate(session.workout_date)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{formatDuration(session.duration_seconds)}</div>
                  <div style={{
                    padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 500,
                    background: session.status === 'completed' ? '#E1F5EE' : '#fef9c3',
                    color: session.status === 'completed' ? '#085041' : '#854d0e',
                  }}>
                    {session.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid #e5e7eb',
        display: 'flex', justifyContent: 'space-around', padding: '10px 0 16px',
        zIndex: 100,
      }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => item.id === 'profile' ? onOpenProfile() : item.id === 'programs' ? onOpenPrograms() : item.id === 'progress' ? onOpenAnalytics() : setActiveNav(item.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', border: 'none', background: 'transparent',
              cursor: 'pointer', padding: '4px 12px',
              color: activeNav === item.id ? '#1D9E75' : '#9ca3af',
              fontSize: '11px', fontWeight: activeNav === item.id ? 600 : 400,
            }}
          >
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: activeNav === item.id ? '#1D9E75' : 'transparent',
              marginBottom: '2px',
            }} />
            {item.label}
          </button>
        ))}
      </div>

    </div>
  )
}