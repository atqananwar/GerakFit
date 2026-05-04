import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'

interface Props {
  onBack: () => void
}

interface WeeklyVolume {
  muscle: string
  volume: number
  sets: number
}

interface DailySession {
  date: string
  label: string
  completed: boolean
  duration_minutes: number
}

interface WeekSummary {
  week: string
  sessions: number
}

interface MuscleFrequency {
  muscle: string
  sessions: number
  lastTrained: string | null
}

const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#1D9E75',
  Back: '#378ADD',
  Shoulders: '#D85A30',
  Biceps: '#BA7517',
  Triceps: '#993556',
  Legs: '#639922',
  'Abs/Core': '#7F77DD',
  Cardio: '#E24B4A',
  Mobility: '#888780',
}

const DEFAULT_COLOR = '#555555'

export default function AnalyticsScreen({ onBack }: Props) {
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') === 'true')
  useEffect(() => { document.body.style.background = darkMode ? '#000000' : '#f9fafb' }, [darkMode])
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'volume' | 'consistency' | 'muscles'>('volume')
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolume[]>([])
  const [last7Days, setLast7Days] = useState<DailySession[]>([])
  const [last8Weeks, setLast8Weeks] = useState<WeekSummary[]>([])
  const [muscleFreq, setMuscleFreq] = useState<MuscleFrequency[]>([])
  const [totalStats, setTotalStats] = useState({ sessions: 0, totalVolume: 0, totalSets: 0, streakDays: 0 })

  useEffect(() => {
    if (user) loadAnalytics()
  }, [user])

  async function loadAnalytics() {
    if (!user) return
    setLoading(true)
    try {
      await Promise.all([
        loadWeeklyVolume(),
        loadConsistency(),
        loadMuscleFrequency(),
      ])
    } finally {
      setLoading(false)
    }
  }

  async function loadWeeklyVolume() {
    if (!user) return

    // Get sessions from last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('workout_date', weekAgo.toISOString().split('T')[0])

    if (!sessions || sessions.length === 0) { setWeeklyVolume([]); return }

    const sessionIds = sessions.map(s => s.id)

    const { data: seData } = await supabase
      .from('session_exercises')
      .select('id, exercises(primary_muscle)')
      .in('session_id', sessionIds)

    if (!seData) return

    const seIds = seData.map(se => se.id)

    const { data: setsData } = await supabase
      .from('exercise_sets')
      .select('session_exercise_id, weight_kg, reps, is_warmup')
      .in('session_exercise_id', seIds)
      .eq('is_warmup', false)

    // Aggregate volume by muscle
    const muscleMap: Record<string, { volume: number; sets: number }> = {}

    for (const set of setsData ?? []) {
      const se = seData.find(s => s.id === set.session_exercise_id)
      const muscle = (se?.exercises as unknown as { primary_muscle: string } | null)?.primary_muscle ?? 'Unknown'
      if (!muscleMap[muscle]) muscleMap[muscle] = { volume: 0, sets: 0 }
      muscleMap[muscle].volume += (set.weight_kg ?? 0) * (set.reps ?? 0)
      muscleMap[muscle].sets += 1
    }

    const result = Object.entries(muscleMap)
      .map(([muscle, data]) => ({ muscle, volume: Math.round(data.volume), sets: data.sets }))
      .sort((a, b) => b.volume - a.volume)

    setWeeklyVolume(result)

    const totalVol = result.reduce((s, r) => s + r.volume, 0)
    const totalSets = result.reduce((s, r) => s + r.sets, 0)
    setTotalStats(prev => ({ ...prev, totalVolume: totalVol, totalSets }))
  }

  async function loadConsistency() {
    if (!user) return

    // Last 7 days
    const days: DailySession[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-MY', { weekday: 'short' }),
        completed: false,
        duration_minutes: 0,
      })
    }

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('workout_date, status, duration_seconds')
      .eq('user_id', user.id)
      .gte('workout_date', days[0].date)
      .order('workout_date')

    for (const session of sessions ?? []) {
      const day = days.find(d => d.date === session.workout_date)
      if (day && session.status === 'completed') {
        day.completed = true
        day.duration_minutes = Math.round((session.duration_seconds ?? 0) / 60)
      }
    }

    setLast7Days(days)

    // Last 8 weeks
    const { data: allSessions } = await supabase
      .from('workout_sessions')
      .select('workout_date, status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('workout_date', { ascending: false })
      .limit(200)

    const weekMap: Record<string, number> = {}
    for (const s of allSessions ?? []) {
      const d = new Date(s.workout_date)
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const key = weekStart.toISOString().split('T')[0]
      weekMap[key] = (weekMap[key] ?? 0) + 1
    }

    const weeks: WeekSummary[] = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - d.getDay() - i * 7)
      const key = d.toISOString().split('T')[0]
      weeks.push({
        week: d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' }),
        sessions: weekMap[key] ?? 0,
      })
    }

    setLast8Weeks(weeks)

    const totalSessions = allSessions?.length ?? 0
    setTotalStats(prev => ({ ...prev, sessions: totalSessions }))

    // Streak
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const sessionDates = new Set((allSessions ?? []).map(s => s.workout_date))
    for (let i = 0; i <= 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (key === today && !sessionDates.has(key)) continue
      if (sessionDates.has(key)) streak++
      else break
    }
    setTotalStats(prev => ({ ...prev, streakDays: streak }))
  }

  async function loadMuscleFrequency() {
    if (!user) return

    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id, workout_date')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('workout_date', monthAgo.toISOString().split('T')[0])

    if (!sessions) return

    const sessionIds = sessions.map(s => s.id)
    const sessionDateMap = Object.fromEntries(sessions.map(s => [s.id, s.workout_date]))

    const { data: seData } = await supabase
      .from('session_exercises')
      .select('session_id, exercises(primary_muscle)')
      .in('session_id', sessionIds)

    const muscleMap: Record<string, { sessions: Set<string>; lastDate: string }> = {}

    for (const se of seData ?? []) {
      const muscle = (se.exercises as unknown as { primary_muscle: string } | null)?.primary_muscle
      if (!muscle) continue
      if (!muscleMap[muscle]) muscleMap[muscle] = { sessions: new Set(), lastDate: '' }
      muscleMap[muscle].sessions.add(se.session_id)
      const date = sessionDateMap[se.session_id]
      if (!muscleMap[muscle].lastDate || date > muscleMap[muscle].lastDate) {
        muscleMap[muscle].lastDate = date
      }
    }

    const result = Object.entries(muscleMap)
      .map(([muscle, data]) => ({
        muscle,
        sessions: data.sessions.size,
        lastTrained: data.lastDate || null,
      }))
      .sort((a, b) => b.sessions - a.sessions)

    setMuscleFreq(result)
  }

  function formatDaysAgo(dateStr: string | null) {
    if (!dateStr) return 'Never'
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return `${diff} days ago`
  }

  const btnStyle: React.CSSProperties = {
    background: 'none', border: 'none', fontSize: '14px', color: '#444', cursor: 'pointer', padding: '0',
  }
  const cardStyle: React.CSSProperties = {
    background: darkMode ? '#111111' : '#fff', border: darkMode ? '0.5px solid #1a1a1a' : '0.5px solid #e5e7eb', borderRadius: '14px',
    padding: '16px 18px', marginBottom: '14px',
  }
  const cardTitle: React.CSSProperties = {
    fontSize: '14px', fontWeight: 700, color: '#555', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px',
  }
  const emptyStyle: React.CSSProperties = {
    textAlign: 'center', padding: '24px 0', fontSize: '13px', color: '#555555',
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#000000' : '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700 }}>Gerak<span style={{ color: '#1D9E75' }}>Fit</span></div>
          <div style={{ fontSize: '13px', color: '#555555', marginTop: '8px' }}>Loading analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: darkMode ? '#000000' : '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '32px' }}>

      {/* Header */}
      <div style={{ background: darkMode ? '#000000' : '#fff', borderBottom: '0.5px solid #1a1a1a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={btnStyle}>← Back</button>
        <div style={{ fontSize: '18px', fontWeight: 800, color: darkMode ? '#f9fafb' : '#111827' }}>Progress</div>
      </div>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Total sessions', value: totalStats.sessions, sub: 'all time' },
            { label: 'Current streak', value: `${totalStats.streakDays}d`, sub: 'consecutive days' },
            { label: 'Volume this week', value: totalStats.totalVolume > 0 ? `${(totalStats.totalVolume / 1000).toFixed(1)}t` : '0', sub: 'kg lifted' },
            { label: 'Sets this week', value: totalStats.totalSets, sub: 'working sets' },
          ].map(stat => (
            <div key={stat.label} style={{ background: darkMode ? '#111111' : '#fff', border: darkMode ? '0.5px solid #1a1a1a' : '0.5px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '10px', color: '#444', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: darkMode ? '#f9fafb' : '#111827', marginTop: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: darkMode ? '#555555' : '#6b7280', marginTop: '1px' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: darkMode ? '#1a1a1a' : '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '16px' }}>
          {([['volume', 'Volume'], ['consistency', 'Consistency'], ['muscles', 'Muscles']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              padding: '8px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: activeTab === id ? 600 : 500, cursor: 'pointer',
              background: activeTab === id ? (darkMode ? '#222' : '#fff') : 'transparent',
              color: activeTab === id ? (darkMode ? '#ffffff' : '#111827') : (darkMode ? '#444' : '#6b7280'),
              boxShadow: activeTab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {/* ── Volume tab ── */}
        {activeTab === 'volume' && (
          <>
            <div style={cardStyle}>
              <div style={cardTitle}>Volume by muscle — this week</div>
              {weeklyVolume.length === 0 ? (
                <div style={emptyStyle}>No workout data this week yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyVolume} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="muscle" tick={{ fontSize: 10, fill: '#555555' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#555555' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`${Number(val).toLocaleString()} kg`, 'Volume']}
                      contentStyle={{ background: darkMode ? '#111111' : '#fff', borderRadius: '8px', border: darkMode ? '0.5px solid #1a1a1a' : '0.5px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Bar dataKey="volume" radius={[4, 4, 0, 0]}
                      fill="#1D9E75"
                      label={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Volume breakdown list */}
            {weeklyVolume.length > 0 && (
              <div style={cardStyle}>
                <div style={cardTitle}>Breakdown</div>
                {weeklyVolume.map(item => {
                  const total = weeklyVolume.reduce((s, v) => s + v.volume, 0)
                  const pct = total > 0 ? Math.round((item.volume / total) * 100) : 0
                  const color = MUSCLE_COLORS[item.muscle] ?? DEFAULT_COLOR
                  return (
                    <div key={item.muscle} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: darkMode ? '#f9fafb' : '#111827' }}>{item.muscle}</span>
                        <span style={{ fontSize: '12px', color: darkMode ? '#555555' : '#6b7280' }}>{item.volume.toLocaleString()} kg · {item.sets} sets · {pct}%</span>
                      </div>
                      <div style={{ background: darkMode ? '#1a1a1a' : '#f3f4f6', borderRadius: '4px', height: '6px' }}>
                        <div style={{ background: color, height: '6px', borderRadius: '4px', width: `${pct}%`, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Consistency tab ── */}
        {activeTab === 'consistency' && (
          <>
            {/* Last 7 days heatmap */}
            <div style={cardStyle}>
              <div style={cardTitle}>Last 7 days</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginTop: '12px' }}>
                {last7Days.map((day, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#555555', marginBottom: '5px' }}>{day.label}</div>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', margin: '0 auto',
                      background: day.completed ? '#1D9E75' : (darkMode ? '#1a1a1a' : '#f3f4f6'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {day.completed && <span style={{ color: '#fff', fontSize: '14px' }}>✓</span>}
                    </div>
                    {day.completed && day.duration_minutes > 0 && (
                      <div style={{ fontSize: '9px', color: darkMode ? '#555555' : '#6b7280', marginTop: '3px' }}>{day.duration_minutes}m</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 8-week trend */}
            <div style={cardStyle}>
              <div style={cardTitle}>Sessions per week — last 8 weeks</div>
              {last8Weeks.every(w => w.sessions === 0) ? (
                <div style={emptyStyle}>Not enough data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={last8Weeks} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1a1a1a' : '#f3f4f6'} />
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#555555' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#555555' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [Number(val), 'Sessions']}
                      contentStyle={{ background: darkMode ? '#111111' : '#fff', borderRadius: '8px', border: darkMode ? '0.5px solid #1a1a1a' : '0.5px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="sessions" stroke="#1D9E75" strokeWidth={2} dot={{ fill: '#1D9E75', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}

        {/* ── Muscles tab ── */}
        {activeTab === 'muscles' && (
          <div style={cardStyle}>
            <div style={cardTitle}>Muscle frequency — last 30 days</div>
            {muscleFreq.length === 0 ? (
              <div style={emptyStyle}>No data yet. Start training!</div>
            ) : (
              muscleFreq.map(item => {
                const color = MUSCLE_COLORS[item.muscle] ?? DEFAULT_COLOR
                const daysAgo = item.lastTrained
                  ? Math.floor((Date.now() - new Date(item.lastTrained).getTime()) / 86400000)
                  : 999
                const freshness = daysAgo <= 2 ? 'fresh' : daysAgo <= 5 ? 'ok' : 'stale'
                const freshnessColor = freshness === 'fresh' ? '#1D9E75' : freshness === 'ok' ? '#BA7517' : '#ef4444'
                const freshnessLabel = freshness === 'fresh' ? 'Trained recently' : freshness === 'ok' ? 'Needs attention' : 'Undertrained'

                return (
                  <div key={item.muscle} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: darkMode ? '0.5px solid #1a1a1a' : '0.5px solid #f3f4f6' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: darkMode ? '#f9fafb' : '#111827' }}>{item.muscle}</span>
                        <span style={{ fontSize: '11px', color: darkMode ? '#555555' : '#6b7280' }}>{item.sessions} session{item.sessions !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#444' }}>Last: {formatDaysAgo(item.lastTrained)}</span>
                        <span style={{ fontSize: '10px', fontWeight: 500, color: freshnessColor }}>{freshnessLabel}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

      </div>
    </div>
  )
}
