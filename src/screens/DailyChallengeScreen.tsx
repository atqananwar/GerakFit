import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../theme/ThemeContext'

interface Props {
  onBack: () => void
}

interface Challenge {
  id: string
  name: string
  description: string
  exercises: ChallengeExercise[]
  difficulty: 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
  xp: number
  estimatedMinutes: number
}

interface ChallengeExercise {
  name: string
  sets: number
  reps: number | null
  seconds: number | null
  instruction: string
}

interface ExerciseProgress {
  exerciseIdx: number
  setsDone: number
  completed: boolean
}

const RANK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  E: { bg: '#1f2937', text: '#9ca3af', border: '#4b5563' },
  D: { bg: '#1c1917', text: '#d6d3d1', border: '#57534e' },
  C: { bg: '#14532d', text: '#4ade80', border: '#166534' },
  B: { bg: '#1e3a5f', text: '#60a5fa', border: '#1d4ed8' },
  A: { bg: '#4c1d95', text: '#c084fc', border: '#7c3aed' },
  S: { bg: '#7c2d12', text: '#fb923c', border: '#c2410c' },
}

const CHALLENGES: Challenge[] = [
  {
    id: 'rank_e',
    name: 'Basic Training',
    description: 'The gate has opened. Begin your ascent.',
    difficulty: 'E',
    xp: 100,
    estimatedMinutes: 10,
    exercises: [
      { name: 'Push Up', sets: 3, reps: 10, seconds: null, instruction: 'Full range — chest to floor, arms fully extended at top.' },
      { name: 'Bodyweight Squat', sets: 3, reps: 15, seconds: null, instruction: 'Feet shoulder width, squat until thighs parallel. Keep chest up.' },
      { name: 'Plank', sets: 3, reps: null, seconds: 30, instruction: 'Straight line from head to heels. Squeeze glutes and core.' },
    ],
  },
  {
    id: 'rank_d',
    name: 'Shadow Protocol',
    description: 'Shadows move without rest. Can you keep up?',
    difficulty: 'D',
    xp: 200,
    estimatedMinutes: 15,
    exercises: [
      { name: 'Jump Squat', sets: 3, reps: 12, seconds: null, instruction: 'Squat down, explode up, land softly. Absorb impact with bent knees.' },
      { name: 'Pike Push Up', sets: 3, reps: 10, seconds: null, instruction: 'Hips high in inverted V. Lower head toward floor. Targets shoulders.' },
      { name: 'Reverse Lunge', sets: 3, reps: 10, seconds: null, instruction: 'Step back into lunge. Front knee tracks over toes. Alternate legs.' },
      { name: 'Mountain Climber', sets: 3, reps: null, seconds: 30, instruction: 'Plank position. Drive knees to chest alternately. Keep hips level.' },
    ],
  },
  {
    id: 'rank_c',
    name: 'Iron Will',
    description: 'The weak have no place here. Push past your limit.',
    difficulty: 'C',
    xp: 350,
    estimatedMinutes: 20,
    exercises: [
      { name: 'Diamond Push Up', sets: 4, reps: 12, seconds: null, instruction: 'Hands form diamond below chest. Elbows track close to body.' },
      { name: 'Bulgarian Split Squat', sets: 3, reps: 10, seconds: null, instruction: 'Rear foot elevated. Lower until front thigh parallel. Stay upright.' },
      { name: 'Decline Push Up', sets: 3, reps: 12, seconds: null, instruction: 'Feet elevated on chair or step. Targets upper chest.' },
      { name: 'Wall Sit', sets: 3, reps: null, seconds: 45, instruction: 'Back flat on wall, thighs parallel. Hold position. Breathe steadily.' },
      { name: 'Burpee', sets: 3, reps: 8, seconds: null, instruction: 'Squat down, jump feet back to plank, push up, jump up. Full movement.' },
    ],
  },
  {
    id: 'rank_b',
    name: 'Necromancer',
    description: 'The dead rise at your command. Prove your dominion.',
    difficulty: 'B',
    xp: 550,
    estimatedMinutes: 25,
    exercises: [
      { name: 'Archer Push Up', sets: 4, reps: 8, seconds: null, instruction: 'Wide hands. Shift weight to one arm while extending the other. Alternate.' },
      { name: 'Pistol Squat Assist', sets: 3, reps: 6, seconds: null, instruction: 'Hold a door frame for balance. Lower on one leg as far as possible.' },
      { name: 'Plyometric Push Up', sets: 3, reps: 8, seconds: null, instruction: 'Explode up so hands leave floor. Land softly with bent elbows.' },
      { name: 'Nordic Curl', sets: 3, reps: 6, seconds: null, instruction: 'Kneel, feet anchored. Lower torso forward slowly. Use hands to catch yourself.' },
      { name: 'L-Sit Hold', sets: 3, reps: null, seconds: 20, instruction: 'On floor or chair, lift body and hold legs straight. Core strength test.' },
    ],
  },
  {
    id: 'rank_s',
    name: 'Shadow Monarch',
    description: 'Only the strongest survive this trial. Are you ready?',
    difficulty: 'S',
    xp: 1000,
    estimatedMinutes: 35,
    exercises: [
      { name: 'One Arm Push Up', sets: 3, reps: 5, seconds: null, instruction: 'Feet wide for stability. Lower with full control. One arm only.' },
      { name: 'Pistol Squat', sets: 3, reps: 5, seconds: null, instruction: 'No assistance. Lower fully on one leg, drive back up through heel.' },
      { name: 'Handstand Hold', sets: 3, reps: null, seconds: 15, instruction: 'Against wall for safety. Straight body, arms locked, core tight.' },
      { name: 'Muscle Up Progression', sets: 3, reps: 5, seconds: null, instruction: 'Jump assisted: Pull up explosively, transition chest over bar.' },
      { name: 'Dragon Flag', sets: 3, reps: 6, seconds: null, instruction: 'Grip bench behind head. Raise and lower body straight as a plank.' },
    ],
  },
]

function getChallengeByStreak(streak: number): Challenge {
  if (streak < 3) return CHALLENGES[0]
  if (streak < 7) return CHALLENGES[1]
  if (streak < 14) return CHALLENGES[2]
  if (streak < 30) return CHALLENGES[3]
  return CHALLENGES[4]
}

export default function DailyChallengeScreen({ onBack }: Props) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [phase, setPhase] = useState<'home' | 'active' | 'complete'>('home')
  const [challenge, setChallenge] = useState<Challenge>(CHALLENGES[0])
  const [progress, setProgress] = useState<ExerciseProgress[]>([])
  const [currentEx, setCurrentEx] = useState(0)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restActive, setRestActive] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [streakDays, setStreakDays] = useState(0)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (user) loadStreak()
  }, [user])

  async function loadStreak() {
    if (!user) return
    const { data } = await supabase
      .from('body_logs')
      .select('notes, log_date')
      .eq('user_id', user.id)
      .like('notes', 'daily_challenge%')
      .order('log_date', { ascending: false })
      .limit(30)

    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const dates = new Set((data ?? []).map(d => d.log_date))
    for (let i = 0; i <= 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (key === today && !dates.has(key)) continue
      if (dates.has(key)) streak++
      else break
    }

    const xpTotal = (data ?? []).reduce((sum, d) => {
      const match = d.notes?.match(/xp:(\d+)/)
      return sum + (match ? parseInt(match[1]) : 0)
    }, 0)

    setStreakDays(streak)
    setTotalXP(xpTotal)
    setChallenge(getChallengeByStreak(streak))
  }

  function startChallenge() {
    setProgress(challenge.exercises.map((_, i) => ({ exerciseIdx: i, setsDone: 0, completed: false })))
    setCurrentEx(0)
    setPhase('active')
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }

  function completeSet() {
    setProgress(prev => {
      const updated = [...prev]
      const cur = { ...updated[currentEx] }
      cur.setsDone++
      if (cur.setsDone >= challenge.exercises[currentEx].sets) {
        cur.completed = true
        if (currentEx < challenge.exercises.length - 1) {
          setTimeout(() => setCurrentEx(c => c + 1), 300)
        } else {
          setTimeout(() => finishChallenge(), 500)
        }
      }
      updated[currentEx] = cur
      return updated
    })
    startRest(60)
  }

  function startRest(seconds: number) {
    if (restRef.current) clearInterval(restRef.current)
    setRestTimer(seconds)
    setRestActive(true)
    restRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(restRef.current!)
          setRestActive(false)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  async function finishChallenge() {
    if (elapsedRef.current) clearInterval(elapsedRef.current)
    if (restRef.current) clearInterval(restRef.current)
    setPhase('complete')
    if (user) {
      await supabase.from('body_logs').insert({
        user_id: user.id,
        log_date: new Date().toISOString().split('T')[0],
        weight_kg: 0,
        notes: `daily_challenge:${challenge.id}:xp:${challenge.xp}`,
      })
      setTotalXP(prev => prev + challenge.xp)
      setStreakDays(prev => prev + 1)
    }
  }

  const rankInfo = RANK_COLORS[challenge.difficulty]
  const totalSets = challenge.exercises.reduce((s, e) => s + e.sets, 0)
  const completedSets = progress.reduce((s, p) => s + p.setsDone, 0)
  const overallProgress = totalSets > 0 ? completedSets / totalSets : 0
  const nextChallenge = getChallengeByStreak(streakDays + 1)
  const setsToNextRank = challenge.difficulty === 'E' ? 3 : challenge.difficulty === 'D' ? 7 : challenge.difficulty === 'C' ? 14 : challenge.difficulty === 'B' ? 30 : null

  // ── Complete ─────────────────────────────────────────────
  if (phase === 'complete') {
    const newStreak = streakDays
    const newChallenge = getChallengeByStreak(newStreak)
    const rankUp = newChallenge.difficulty !== challenge.difficulty
    return (
      <div style={{ minHeight: '100vh', background: theme.background, fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px', width: '100%' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>{rankUp ? '🎖️' : '⚔️'}</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: theme.text, marginBottom: '6px' }}>{rankUp ? 'RANK UP!' : 'Quest Complete'}</div>
          <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '28px' }}>{rankUp ? `You have ascended to Rank ${newChallenge.difficulty}!` : 'You have grown stronger.'}</div>

          <div style={{ background: rankInfo.bg, border: `0.5px solid ${rankInfo.border}`, borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: rankInfo.text, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Rank {challenge.difficulty} — {challenge.name}</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: rankInfo.text }}>+{challenge.xp} XP</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            <div style={{ background: theme.card, borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total XP</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#1D9E75', marginTop: '4px' }}>{(totalXP).toLocaleString()}</div>
            </div>
            <div style={{ background: theme.card, borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Streak</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: theme.text, marginTop: '4px' }}>{newStreak}🔥</div>
            </div>
          </div>

          <button onClick={onBack} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1D9E75', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}>
            Return to base
          </button>
        </div>
      </div>
    )
  }

  // ── Active ───────────────────────────────────────────────
  if (phase === 'active') {
    return (
      <div style={{ minHeight: '100vh', background: theme.background, fontFamily: 'system-ui, sans-serif', paddingBottom: '32px' }}>
        <div style={{ background: theme.card, borderBottom: `0.5px solid ${theme.border}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: theme.text }}>{challenge.name}</div>
            <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '1px' }}>
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} · {completedSets}/{totalSets} sets
            </div>
          </div>
          <button onClick={() => { if (confirm('Abandon quest?')) { if (elapsedRef.current) clearInterval(elapsedRef.current); onBack() } }} style={{ padding: '6px 12px', borderRadius: '8px', border: `0.5px solid ${theme.border}`, background: 'transparent', color: theme.textSecondary, fontSize: '12px', cursor: 'pointer' }}>
            Abandon
          </button>
        </div>

        <div style={{ padding: '0 16px', background: theme.card, borderBottom: `0.5px solid ${theme.border}`, paddingBottom: '10px', paddingTop: '8px' }}>
          <div style={{ background: theme.border, borderRadius: '4px', height: '4px' }}>
            <div style={{ background: rankInfo.text, height: '4px', borderRadius: '4px', width: `${overallProgress * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>

        {restActive && restTimer !== null && (
          <div style={{ background: rankInfo.bg, borderBottom: `0.5px solid ${rankInfo.border}`, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: rankInfo.text, fontSize: '14px', fontWeight: 600 }}>Rest · {restTimer}s</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => startRest((restTimer ?? 0) + 30)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: rankInfo.text, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>+30s</button>
              <button onClick={() => { if (restRef.current) clearInterval(restRef.current); setRestActive(false); setRestTimer(null) }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: rankInfo.text, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Skip</button>
            </div>
          </div>
        )}

        <div style={{ padding: '16px' }}>
          {challenge.exercises.map((ex, i) => {
            const prog = progress[i]
            const isCurrent = i === currentEx
            const isDone = prog?.completed
            return (
              <div key={i} style={{ background: isCurrent ? rankInfo.bg : isDone ? '#0a1a0a' : theme.card, border: `0.5px solid ${isCurrent ? rankInfo.border : isDone ? '#166534' : theme.border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '10px', opacity: !isCurrent && !isDone && i > currentEx ? 0.4 : 1, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: isCurrent ? rankInfo.text : isDone ? '#4ade80' : theme.textSecondary }}>{ex.name}</span>
                      {isDone && <span style={{ fontSize: '12px', color: '#4ade80' }}>✓</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: isCurrent ? rankInfo.text : theme.textSecondary, opacity: 0.8 }}>
                      {ex.sets} sets × {ex.reps ? `${ex.reps} reps` : `${ex.seconds}s hold`}
                    </div>
                    {isCurrent && (
                      <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '8px', lineHeight: 1.6, padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>{ex.instruction}</div>
                    )}
                  </div>
                  {isCurrent && !isDone && (
                    <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: rankInfo.text }}>{prog?.setsDone ?? 0}/{ex.sets}</div>
                      <div style={{ fontSize: '10px', color: theme.textSecondary }}>sets done</div>
                    </div>
                  )}
                </div>
                {isCurrent && !isDone && (
                  <button
                    onClick={completeSet}
                    disabled={restActive}
                    style={{ width: '100%', marginTop: '12px', padding: '14px', borderRadius: '10px', background: restActive ? theme.border : rankInfo.border, border: 'none', color: restActive ? theme.textSecondary : '#fff', fontSize: '15px', fontWeight: 800, cursor: restActive ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                  >
                    {restActive ? `Resting... ${restTimer}s` : `Complete set ${(prog?.setsDone ?? 0) + 1} of ${ex.sets}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Home ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: theme.background, fontFamily: 'system-ui, sans-serif', paddingBottom: '32px' }}>
      <div style={{ background: theme.card, borderBottom: `0.5px solid ${theme.border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '14px', color: theme.textSecondary, cursor: 'pointer', padding: '0' }}>← Back</button>
        <div style={{ fontSize: '16px', fontWeight: 800, color: theme.text, flex: 1 }}>Daily Challenge</div>
        {streakDays > 0 && <div style={{ fontSize: '13px', color: '#fb923c' }}>{streakDays}🔥</div>}
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '480px', margin: '0 auto' }}>

        {/* XP + Streak */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: theme.card, border: `0.5px solid ${theme.border}`, borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total XP</div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#1D9E75', marginTop: '4px' }}>{totalXP.toLocaleString()}</div>
          </div>
          <div style={{ background: theme.card, border: `0.5px solid ${theme.border}`, borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Streak</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: theme.text, marginTop: '4px' }}>{streakDays} days 🔥</div>
          </div>
        </div>

        {/* Next rank progress */}
        {setsToNextRank !== null && (
          <div style={{ background: theme.card, border: `0.5px solid ${theme.border}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: theme.textSecondary }}>Progress to Rank {nextChallenge.difficulty}</span>
              <span style={{ fontSize: '12px', color: rankInfo.text }}>{streakDays}/{setsToNextRank} days</span>
            </div>
            <div style={{ background: theme.border, borderRadius: '4px', height: '6px' }}>
              <div style={{ background: rankInfo.text, height: '6px', borderRadius: '4px', width: `${Math.min((streakDays / setsToNextRank) * 100, 100)}%`, transition: 'width 0.5s' }} />
            </div>
          </div>
        )}

        {/* Today's challenge card */}
        <div style={{ background: theme.card, border: `0.5px solid ${theme.border}`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: rankInfo.text, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Rank {challenge.difficulty} Quest</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: theme.text }}>{challenge.name}</div>
              <div style={{ fontSize: '13px', color: theme.textSecondary, marginTop: '4px', fontStyle: 'italic' }}>"{challenge.description}"</div>
            </div>
            <div style={{ background: rankInfo.border, borderRadius: '10px', padding: '14px 18px', textAlign: 'center', flexShrink: 0, marginLeft: '12px' }}>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{challenge.difficulty}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Rank</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', background: theme.primaryMuted, border: '0.5px solid #1D9E75', color: '#1D9E75', padding: '3px 10px', borderRadius: '20px' }}>+{challenge.xp} XP</span>
            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', color: rankInfo.text, padding: '3px 10px', borderRadius: '20px' }}>~{challenge.estimatedMinutes} min</span>
            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', color: rankInfo.text, padding: '3px 10px', borderRadius: '20px' }}>No equipment</span>
          </div>

          {challenge.exercises.map((ex, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `0.5px solid ${theme.borderSubtle}` }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>{ex.name}</span>
              <span style={{ fontSize: '12px', color: theme.text, fontWeight: 700 }}>
                {ex.sets} × {ex.reps ? `${ex.reps} reps` : `${ex.seconds}s`}
              </span>
            </div>
          ))}
        </div>

        {/* All ranks */}
        <div style={{ background: theme.card, border: `0.5px solid ${theme.border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>All ranks</div>
          {CHALLENGES.map((c, i) => {
            const r = RANK_COLORS[c.difficulty]
            const isCurrent = c.difficulty === challenge.difficulty
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `0.5px solid ${theme.borderSubtle}`, opacity: isCurrent ? 1 : 0.45 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '6px', background: r.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{c.difficulty}</span>
                  <div>
                    <div style={{ fontSize: '13px', color: theme.text }}>{c.name}{isCurrent ? ' ← current' : ''}</div>
                    <div style={{ fontSize: '11px', color: theme.textSecondary }}>{c.exercises.length} exercises · {c.estimatedMinutes} min</div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: r.text, fontWeight: 500 }}>+{c.xp} XP</span>
              </div>
            )
          })}
        </div>

        <button onClick={startChallenge} style={{ width: '100%', padding: '14px', borderRadius: '14px', background: rankInfo.border, border: 'none', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}>
          Begin Quest ⚔️
        </button>
      </div>
    </div>
  )
}
