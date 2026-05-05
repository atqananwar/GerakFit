import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onBack: () => void
}

interface WorkoutSummaryData {
  sessionsThisWeek: number
  targetDays: number
  muscleVolume: Record<string, number>
  prsThisWeek: number
  totalSetsThisWeek: number
  avgSessionDuration: number
  streakDays: number
  mostTrainedMuscle: string
  leastTrainedMuscle: string
  recentPRs: { exercise: string; type: string; value: string }[]
}

export default function AISummaryScreen({ onBack }: Props) {
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')
  useEffect(() => { document.body.style.background = darkMode ? '#0d0d0d' : '#f9fafb' }, [darkMode])
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [summaryData, setSummaryData] = useState<WorkoutSummaryData | null>(null)
  const [aiSummary, setAiSummary] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { if (user) loadData() }, [user])

  async function loadData() {
    if (!user) return
    setLoading(true)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]

    const [profileRes, sessionsRes, prsRes, allSessionsRes] = await Promise.all([
      supabase.from('profiles').select('training_days_per_week').eq('id', user.id).single(),
      supabase.from('workout_sessions').select('id, workout_date, duration_seconds, status').eq('user_id', user.id).gte('workout_date', weekAgoStr).eq('status', 'completed'),
      supabase.from('personal_records').select('record_type, weight_kg, reps, volume, achieved_at, exercises(name)').eq('user_id', user.id).gte('achieved_at', weekAgo.toISOString()),
      supabase.from('workout_sessions').select('workout_date').eq('user_id', user.id).eq('status', 'completed').order('workout_date', { ascending: false }).limit(30),
    ])

    const sessions = sessionsRes.data ?? []
    const sessionIds = sessions.map(s => s.id)

    let muscleVolume: Record<string, number> = {}
    let totalSets = 0

    if (sessionIds.length > 0) {
      const { data: seData } = await supabase
        .from('session_exercises')
        .select('id, exercises(primary_muscle)')
        .in('session_id', sessionIds)

      if (seData && seData.length > 0) {
        const seIds = seData.map(se => se.id)
        const { data: setsData } = await supabase
          .from('exercise_sets')
          .select('session_exercise_id, weight_kg, reps, is_warmup')
          .in('session_exercise_id', seIds)
          .eq('is_warmup', false)

        for (const set of setsData ?? []) {
          const se = seData.find(s => s.id === set.session_exercise_id)
          const muscle = (se?.exercises as unknown as { primary_muscle: string } | null)?.primary_muscle ?? 'Unknown'
          muscleVolume[muscle] = (muscleVolume[muscle] ?? 0) + (set.weight_kg ?? 0) * (set.reps ?? 0)
          totalSets++
        }
      }
    }

    // Streak
    let streak = 0
    const sessionDates = new Set((allSessionsRes.data ?? []).map(s => s.workout_date))
    for (let i = 0; i <= 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (sessionDates.has(key)) streak++
      else if (i > 0) break
    }

    const sortedMuscles = Object.entries(muscleVolume).sort((a, b) => b[1] - a[1])
    const allMuscles = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs/Core']
    const untrained = allMuscles.filter(m => !muscleVolume[m])

    const recentPRs = (prsRes.data ?? []).slice(0, 5).map(pr => ({
      exercise: (pr.exercises as unknown as { name: string } | null)?.name ?? '—',
      type: pr.record_type.replace(/_/g, ' '),
      value: pr.weight_kg ? `${pr.weight_kg}kg` : pr.volume ? `${pr.volume}kg vol` : `${pr.reps} reps`,
    }))

    const avgDuration = sessions.length > 0
      ? Math.round(sessions.reduce((s, sess) => s + (sess.duration_seconds ?? 0), 0) / sessions.length / 60)
      : 0

    setSummaryData({
      sessionsThisWeek: sessions.length,
      targetDays: profileRes.data?.training_days_per_week ?? 3,
      muscleVolume,
      prsThisWeek: prsRes.data?.length ?? 0,
      totalSetsThisWeek: totalSets,
      avgSessionDuration: avgDuration,
      streakDays: streak,
      mostTrainedMuscle: sortedMuscles[0]?.[0] ?? 'None',
      leastTrainedMuscle: untrained[0] ?? sortedMuscles[sortedMuscles.length - 1]?.[0] ?? 'None',
      recentPRs,
    })

    setLoading(false)
  }

  async function generateAISummary() {
    if (!summaryData) return
    setGenerating(true)
    setError('')
    setAiSummary('')

    const prompt = `You are a supportive personal fitness coach. Based on this week's workout data, write a motivating, personalized weekly summary in 3-4 short paragraphs. Be specific, encouraging, and practical.

Workout data this week:
- Sessions completed: ${summaryData.sessionsThisWeek} out of ${summaryData.targetDays} target days
- Total working sets: ${summaryData.totalSetsThisWeek}
- Average session duration: ${summaryData.avgSessionDuration} minutes
- Current streak: ${summaryData.streakDays} days
- New PRs this week: ${summaryData.prsThisWeek}
- Most trained muscle: ${summaryData.mostTrainedMuscle} (${Math.round(summaryData.muscleVolume[summaryData.mostTrainedMuscle] ?? 0).toLocaleString()} kg volume)
- Least trained muscle: ${summaryData.leastTrainedMuscle}
- Recent PRs: ${summaryData.recentPRs.map(p => `${p.exercise} (${p.type}: ${p.value})`).join(', ') || 'None this week'}
- Volume by muscle: ${Object.entries(summaryData.muscleVolume).map(([m, v]) => `${m}: ${Math.round(v).toLocaleString()}kg`).join(', ') || 'No data'}

Write the summary covering: (1) overall week performance, (2) what they did well, (3) what muscle groups need more attention, (4) one specific actionable tip for next week. Keep it under 200 words. Do not use bullet points — write in flowing paragraphs.`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const data = await response.json()
      const text = data.content?.map((c: { type: string; text?: string }) => c.type === 'text' ? c.text : '').join('') ?? ''
      setAiSummary(text)
    } catch {
      setError('Could not generate summary. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const BTN: React.CSSProperties = { background: 'none', border: 'none', fontSize: '14px', color: '#666', cursor: 'pointer', padding: '0' }
  const CARD: React.CSSProperties = { background: darkMode ? '#1c1c1e' : '#fff', border: darkMode ? '0.5px solid #2a2a2a' : '0.5px solid #e5e7eb', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px' }
  const CTITLE: React.CSSProperties = { fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888888', marginBottom: '12px' }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#0d0d0d' : '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '13px', color: '#9ca3af' }}>Loading your data...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: darkMode ? '#0d0d0d' : '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '32px' }}>
      <div style={{ background: darkMode ? '#1c1c1e' : '#fff', borderBottom: darkMode ? '0.5px solid #2a2a2a' : '0.5px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={BTN}>← Back</button>
        <div style={{ fontSize: '18px', fontWeight: 800, color: darkMode ? '#f9fafb' : '#111827', flex: 1 }}>AI Weekly Summary</div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '560px', margin: '0 auto' }}>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Sessions', value: `${summaryData!.sessionsThisWeek}/${summaryData!.targetDays}`, sub: 'this week' },
            { label: 'Streak', value: `${summaryData!.streakDays}d`, sub: 'consecutive' },
            { label: 'Sets done', value: summaryData!.totalSetsThisWeek, sub: 'working sets' },
            { label: 'New PRs', value: summaryData!.prsThisWeek, sub: 'this week' },
          ].map(s => (
            <div key={s.label} style={{ background: darkMode ? '#1c1c1e' : '#fff', border: darkMode ? '0.5px solid #2a2a2a' : '0.5px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '10px', color: '#666', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: darkMode ? '#f9fafb' : '#111827', marginTop: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: darkMode ? '#9ca3af' : '#6b7280', marginTop: '1px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Volume breakdown */}
        {Object.keys(summaryData!.muscleVolume).length > 0 && (
          <div style={CARD}>
            <div style={CTITLE}>Volume this week</div>
            {Object.entries(summaryData!.muscleVolume).sort((a, b) => b[1] - a[1]).map(([muscle, vol]) => {
              const max = Math.max(...Object.values(summaryData!.muscleVolume))
              const pct = Math.round((vol / max) * 100)
              return (
                <div key={muscle} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13px', color: darkMode ? '#f9fafb' : '#111827' }}>{muscle}</span>
                    <span style={{ fontSize: '12px', color: darkMode ? '#9ca3af' : '#6b7280' }}>{Math.round(vol).toLocaleString()} kg</span>
                  </div>
                  <div style={{ background: darkMode ? '#2a2a2a' : '#f3f4f6', borderRadius: '4px', height: '5px' }}>
                    <div style={{ background: '#1D9E75', height: '5px', borderRadius: '4px', width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Recent PRs */}
        {summaryData!.recentPRs.length > 0 && (
          <div style={CARD}>
            <div style={CTITLE}>PRs this week</div>
            {summaryData!.recentPRs.map((pr, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #f3f4f6' }}>
                <span style={{ fontSize: '13px', color: darkMode ? '#f9fafb' : '#111827' }}>{pr.exercise}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#1D9E75' }}>{pr.value}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'capitalize' }}>{pr.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Muscle attention */}
        <div style={CARD}>
          <div style={CTITLE}>Muscle balance</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, background: darkMode ? '#1c1c1e' : '#E1F5EE', border: darkMode ? '0.5px solid #1D9E75' : 'none', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: darkMode ? '#1D9E75' : '#0F6E56', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Most trained</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: darkMode ? '#1D9E75' : '#085041', marginTop: '3px' }}>{summaryData!.mostTrainedMuscle}</div>
            </div>
            <div style={{ flex: 1, background: darkMode ? '#1c1c1e' : '#fef2f2', border: darkMode ? '0.5px solid #444' : 'none', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Needs attention</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#7f1d1d', marginTop: '3px' }}>{summaryData!.leastTrainedMuscle}</div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div style={CARD}>
          <div style={CTITLE}>AI coach summary</div>

          {!aiSummary && !generating && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '13px', color: darkMode ? '#9ca3af' : '#6b7280', marginBottom: '14px', lineHeight: 1.6 }}>
                Get a personalized analysis of your week — what you did well, what needs work, and what to focus on next.
              </div>
              <button onClick={generateAISummary} style={{ padding: '13px 28px', borderRadius: '10px', background: '#1D9E75', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}>
                Generate summary
              </button>
            </div>
          )}

          {generating && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '13px', color: darkMode ? '#9ca3af' : '#6b7280' }}>Analyzing your week...</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '12px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75', animation: `pulse ${0.6 + i * 0.2}s infinite alternate` }} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#991b1b', marginTop: '8px' }}>
              {error}
              <button onClick={generateAISummary} style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer' }}>Try again</button>
            </div>
          )}

          {aiSummary && (
            <>
              <div style={{ fontSize: '14px', color: darkMode ? '#cccccc' : '#374151', lineHeight: 1.75, marginTop: '8px' }}>
                {aiSummary.split('\n\n').map((para, i) => (
                  <p key={i} style={{ marginBottom: '12px', margin: '0 0 12px' }}>{para}</p>
                ))}
              </div>
              <button onClick={generateAISummary} style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af', background: 'none', border: darkMode ? '0.5px solid #2a2a2a' : '0.5px solid #e5e7eb', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                Regenerate
              </button>
            </>
          )}
        </div>

      </div>

      <style>{`@keyframes pulse { from { opacity: 0.3 } to { opacity: 1 } }`}</style>
    </div>
  )
}
