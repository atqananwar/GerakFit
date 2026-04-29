import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onBack: () => void
}

interface Exercise {
  id: string
  name: string
  primary_muscle: string
  secondary_muscles: string[] | null
  equipment: string[] | null
  difficulty: string | null
  movement_pattern: string | null
}

interface ProgramDay {
  name: string
  day_type: string
  target_muscles: string[]
  exercises: SelectedExercise[]
}

interface SelectedExercise {
  exercise_id: string
  name: string
  primary_muscle: string
  sets: number
  min_reps: number
  max_reps: number
  rest_seconds: number
}

interface ActiveProgram {
  id: string
  name: string
  split_type: string
  days: ActiveDay[]
}

interface ActiveDay {
  id: string
  name: string
  day_type: string
  estimated_minutes: number
  exercises: { name: string; sets: number; min_reps: number; max_reps: number }[]
}

type Phase = 'home' | 'pick_split' | 'build_days' | 'saving' | 'saved'

// ─── Split Templates ──────────────────────────────────────

const SPLITS = [
  {
    id: 'ppl_3', name: 'Push / Pull / Legs', days_per_week: 3, best_for: 'Beginner–Intermediate · 3 days',
    description: 'Each session targets pushing, pulling, or legs. Run once per week.',
    days: [
      { name: 'Push Day', day_type: 'push', target_muscles: ['Upper Chest', 'Mid Chest', 'Lower Chest', 'Side Delt', 'Shoulders', 'Triceps Long Head', 'Triceps Lateral Head'] },
      { name: 'Pull Day', day_type: 'pull', target_muscles: ['Lats', 'Mid Back', 'Lower Back', 'Traps', 'Rear Delt', 'Biceps Long Head', 'Biceps Short Head', 'Brachialis'] },
      { name: 'Leg Day', day_type: 'legs', target_muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs'] },
    ],
  },
  {
    id: 'ppl_6', name: 'PPL × 2', days_per_week: 6, best_for: 'Intermediate–Advanced · 6 days',
    description: 'Push/Pull/Legs twice per week. High frequency hypertrophy.',
    days: [
      { name: 'Push Day A', day_type: 'push', target_muscles: ['Upper Chest', 'Mid Chest', 'Side Delt', 'Shoulders', 'Triceps Long Head', 'Triceps Lateral Head'] },
      { name: 'Pull Day A', day_type: 'pull', target_muscles: ['Lats', 'Mid Back', 'Rear Delt', 'Biceps Long Head', 'Biceps Short Head'] },
      { name: 'Leg Day A', day_type: 'legs', target_muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      { name: 'Push Day B', day_type: 'push', target_muscles: ['Upper Chest', 'Lower Chest', 'Side Delt', 'Shoulders', 'Triceps Long Head'] },
      { name: 'Pull Day B', day_type: 'pull', target_muscles: ['Lats', 'Mid Back', 'Traps', 'Rear Delt', 'Brachialis', 'Biceps Short Head'] },
      { name: 'Leg Day B', day_type: 'legs', target_muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs'] },
    ],
  },
  {
    id: 'upper_lower', name: 'Upper / Lower', days_per_week: 4, best_for: 'All levels · 4 days',
    description: 'Alternate upper and lower body. Great balance of frequency and volume.',
    days: [
      { name: 'Upper Day A', day_type: 'upper', target_muscles: ['Upper Chest', 'Mid Chest', 'Lats', 'Mid Back', 'Side Delt', 'Shoulders', 'Biceps Long Head', 'Triceps Lateral Head'] },
      { name: 'Lower Day A', day_type: 'lower', target_muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs'] },
      { name: 'Upper Day B', day_type: 'upper', target_muscles: ['Upper Chest', 'Mid Chest', 'Lats', 'Mid Back', 'Rear Delt', 'Side Delt', 'Biceps Short Head', 'Triceps Long Head'] },
      { name: 'Lower Day B', day_type: 'lower', target_muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs'] },
    ],
  },
  {
    id: 'full_body', name: 'Full Body', days_per_week: 3, best_for: 'Beginner · 3 days',
    description: 'Every session hits all muscle groups. Best for beginners.',
    days: [
      { name: 'Full Body A', day_type: 'full_body', target_muscles: ['Mid Chest', 'Lats', 'Quads', 'Shoulders', 'Biceps Long Head', 'Triceps Lateral Head', 'Abs'] },
      { name: 'Full Body B', day_type: 'full_body', target_muscles: ['Upper Chest', 'Mid Back', 'Hamstrings', 'Glutes', 'Side Delt', 'Biceps Short Head', 'Triceps Long Head'] },
      { name: 'Full Body C', day_type: 'full_body', target_muscles: ['Lower Chest', 'Lats', 'Quads', 'Shoulders', 'Brachialis', 'Triceps Lateral Head', 'Abs'] },
    ],
  },
  {
    id: 'bro_split', name: 'Body Part Split', days_per_week: 5, best_for: 'Intermediate · 5 days',
    description: 'One muscle group per day. Maximum volume per session.',
    days: [
      { name: 'Chest Day', day_type: 'chest', target_muscles: ['Upper Chest', 'Mid Chest', 'Lower Chest', 'Triceps Lateral Head'] },
      { name: 'Back Day', day_type: 'back', target_muscles: ['Lats', 'Mid Back', 'Lower Back', 'Traps', 'Rear Delt', 'Biceps Long Head'] },
      { name: 'Shoulder Day', day_type: 'shoulders', target_muscles: ['Side Delt', 'Shoulders', 'Rear Delt', 'Triceps Long Head'] },
      { name: 'Leg Day', day_type: 'legs', target_muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      { name: 'Arms Day', day_type: 'arms', target_muscles: ['Biceps Long Head', 'Biceps Short Head', 'Brachialis', 'Triceps Long Head', 'Triceps Lateral Head'] },
    ],
  },
  {
    id: 'custom', name: 'Custom Program', days_per_week: 0, best_for: 'Any level · Any days',
    description: 'Build your own split from scratch. You choose every day and exercise.',
    days: [],
  },
]

const MUSCLE_COLORS: Record<string, { bg: string; text: string }> = {
  'Upper Chest': { bg: '#E1F5EE', text: '#085041' },
  'Mid Chest': { bg: '#E1F5EE', text: '#085041' },
  'Lower Chest': { bg: '#E1F5EE', text: '#085041' },
  'Lats': { bg: '#E6F1FB', text: '#0C447C' },
  'Mid Back': { bg: '#E6F1FB', text: '#0C447C' },
  'Lower Back': { bg: '#E6F1FB', text: '#0C447C' },
  'Traps': { bg: '#E6F1FB', text: '#0C447C' },
  'Rear Delt': { bg: '#FAECE7', text: '#712B13' },
  'Side Delt': { bg: '#FAECE7', text: '#712B13' },
  'Shoulders': { bg: '#FAECE7', text: '#712B13' },
  'Biceps Long Head': { bg: '#FAEEDA', text: '#633806' },
  'Biceps Short Head': { bg: '#FAEEDA', text: '#633806' },
  'Brachialis': { bg: '#FAEEDA', text: '#633806' },
  'Triceps Long Head': { bg: '#FBEAF0', text: '#72243E' },
  'Triceps Lateral Head': { bg: '#FBEAF0', text: '#72243E' },
  'Quads': { bg: '#EAF3DE', text: '#27500A' },
  'Hamstrings': { bg: '#EAF3DE', text: '#27500A' },
  'Glutes': { bg: '#EAF3DE', text: '#27500A' },
  'Calves': { bg: '#EAF3DE', text: '#27500A' },
  'Abs': { bg: '#EEEDFE', text: '#3C3489' },
  'Obliques': { bg: '#EEEDFE', text: '#3C3489' },
  'Cardio': { bg: '#FCEBEB', text: '#791F1F' },
}

const DEFAULT_SETS: Record<string, { sets: number; min: number; max: number; rest: number }> = {
  compound: { sets: 4, min: 6, max: 10, rest: 120 },
  isolation: { sets: 3, min: 10, max: 15, rest: 75 },
}

const COMPOUND_PATTERNS = ['horizontal press', 'incline press', 'decline press', 'vertical press', 'squat', 'hip hinge', 'horizontal pull', 'vertical pull', 'lunge']

function isCompound(ex: Exercise) {
  return COMPOUND_PATTERNS.some(p => (ex.movement_pattern ?? '').toLowerCase().includes(p))
}

function getDefaultSets(ex: Exercise) {
  return isCompound(ex) ? DEFAULT_SETS.compound : DEFAULT_SETS.isolation
}

export default function ProgramBuilder({ onBack }: Props) {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('home')
  const [activeProgram, setActiveProgram] = useState<ActiveProgram | null>(null)
  const [selectedSplit, setSelectedSplit] = useState<typeof SPLITS[0] | null>(null)
  const [programDays, setProgramDays] = useState<ProgramDay[]>([])
  const [currentDayIdx, setCurrentDayIdx] = useState(0)
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [userEquipment, setUserEquipment] = useState<string[]>([])
  const [expandedDay, setExpandedDay] = useState<number | null>(0)
  const [showExPicker, setShowExPicker] = useState(false)
  const [pickerMuscle, setPickerMuscle] = useState<string>('All')
  const [pickerSearch, setPickerSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // Custom program state
  const [, setCustomDays] = useState<{ name: string; day_type: string; target_muscles: string[] }[]>([])
  const [showAddDay, setShowAddDay] = useState(false)
  const [newDayName, setNewDayName] = useState('')

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    if (!user) return
    setLoading(true)
    const [exRes, equipRes, programRes] = await Promise.all([
      supabase.from('exercises').select('id, name, primary_muscle, secondary_muscles, equipment, difficulty, movement_pattern').eq('is_active', true).order('primary_muscle').order('name'),
      supabase.from('user_equipment').select('equipment_name').eq('user_id', user.id),
      supabase.from('programs').select('id, name, split_type').eq('user_id', user.id).eq('is_active', true).single(),
    ])
    if (exRes.data) setAllExercises(exRes.data)
    setUserEquipment((equipRes.data ?? []).map(e => e.equipment_name))
    if (programRes.data) {
      const { data: templates } = await supabase.from('workout_templates').select('id, name, day_type, estimated_minutes').eq('program_id', programRes.data.id).order('sort_order')
      const days = await Promise.all((templates ?? []).map(async tmpl => {
        const { data: exs } = await supabase.from('template_exercises').select('exercises(name), target_sets, min_reps, max_reps').eq('template_id', tmpl.id).order('sort_order')
        return {
          id: tmpl.id, name: tmpl.name, day_type: tmpl.day_type, estimated_minutes: tmpl.estimated_minutes ?? 45,
          exercises: (exs ?? []).map(e => ({ name: (e.exercises as unknown as { name: string })?.name ?? '—', sets: e.target_sets, min_reps: e.min_reps, max_reps: e.max_reps })),
        }
      }))
      setActiveProgram({ ...programRes.data, days })
    }
    setLoading(false)
  }

  function equipmentMatches(ex: Exercise): boolean {
    if (!ex.equipment || ex.equipment.length === 0) return true
    const EQUIP_MAP: Record<string, string[]> = {
      'Bodyweight': ['Bodyweight', 'Pull-Up Bar', 'Dip Bar', "Captain's Chair", 'Parallel Bar'],
      'Barbell': ['Barbell', 'EZ Bar', 'Trap Bar / Hex Bar', 'Safety Squat Bar'],
      'Dumbbell': ['Dumbbell', 'Kettlebell'],
      'Cable': ['Cable Pulley', 'Cable Crossover Machine', 'Lat Pulldown Machine', 'Seated Cable Row', 'Straight Bar Attachment', 'Rope Attachment', 'V-Bar Attachment', 'D-Handle', 'Ankle Strap'],
      'Machine': ['Chest Press Machine', 'Pec Deck Machine', 'Shoulder Press Machine', 'Lateral Raise Machine', 'Rear Delt Machine', 'T-Bar Row Machine', 'High Row Machine', 'Low Row Machine', 'Leg Press Machine', 'Leg Extension Machine', 'Leg Curl Machine', 'Hip Thrust Machine', 'Hip Abductor Machine', 'Hip Adductor Machine', 'Glute Kickback Machine', 'Calf Raise Machine', 'Hack Squat Machine', 'Glute Ham Developer', 'Back Extension Bench', 'Ab Crunch Machine', 'Assisted Pull-Up / Dip Machine', 'Seated Calf Raise Machine', 'Sissy Squat Machine'],
      'Smith Machine': ['Smith Machine'],
      'Flat Bench': ['Flat Bench', 'Adjustable Bench'],
      'Adjustable Bench': ['Adjustable Bench', 'Flat Bench'],
      'Decline Bench': ['Decline Bench', 'Adjustable Bench'],
      'Preacher Curl Bench': ['Preacher Curl Bench'],
      'Squat Rack': ['Squat Rack', 'Power Rack'],
      'Resistance Band': ['Resistance Band', 'Mini Band'],
      'T-Bar Row Machine': ['T-Bar Row Machine'],
      'Leg Press Machine': ['Leg Press Machine'],
      'Leg Extension Machine': ['Leg Extension Machine'],
      'Leg Curl Machine': ['Leg Curl Machine'],
      'Lat Pulldown Machine': ['Lat Pulldown Machine', 'Cable Pulley'],
      'Seated Cable Row': ['Seated Cable Row', 'Cable Pulley'],
      'Pull-Up Bar': ['Pull-Up Bar', 'Squat Rack', 'Power Rack'],
      'Dip Bar': ['Dip Bar', 'Assisted Pull-Up / Dip Machine'],
      'Glute Ham Developer': ['Glute Ham Developer', 'Back Extension Bench'],
      'Trap Bar / Hex Bar': ['Trap Bar / Hex Bar'],
      'Weight Plate': ['Weight Plate', 'Barbell'],
    }
    return ex.equipment.every(req => {
      if (userEquipment.includes(req)) return true
      const mapped = EQUIP_MAP[req] ?? []
      return mapped.some(m => userEquipment.includes(m))
    })
  }

  function getExercisesForMuscle(muscle: string): Exercise[] {
    return allExercises.filter(ex => ex.primary_muscle === muscle && equipmentMatches(ex))
  }

  function autoFillDay(dayIdx: number) {
    const day = programDays[dayIdx]
    const newExercises: SelectedExercise[] = []
    const used = new Set<string>()

    for (const muscle of day.target_muscles) {
      const candidates = getExercisesForMuscle(muscle).filter(e => !used.has(e.id))
      const compounds = candidates.filter(isCompound)
      const isolations = candidates.filter(e => !isCompound(e))

      // Add 1-2 compounds for major muscles, 1 isolation
      const compoundCount = ['Upper Chest', 'Mid Chest', 'Lats', 'Mid Back', 'Quads', 'Hamstrings', 'Glutes'].includes(muscle) ? 2 : 1
      const compoundPicks = compounds.slice(0, compoundCount)
      const isolationPick = isolations.slice(0, 1)

      for (const ex of [...compoundPicks, ...isolationPick]) {
        if (newExercises.length >= 8) break
        const d = getDefaultSets(ex)
        newExercises.push({ exercise_id: ex.id, name: ex.name, primary_muscle: ex.primary_muscle, sets: d.sets, min_reps: d.min, max_reps: d.max, rest_seconds: d.rest })
        used.add(ex.id)
      }
    }

    setProgramDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, exercises: newExercises } : d))
  }

  function addExerciseToDay(ex: Exercise) {
    const d = getDefaultSets(ex)
    const newEx: SelectedExercise = { exercise_id: ex.id, name: ex.name, primary_muscle: ex.primary_muscle, sets: d.sets, min_reps: d.min, max_reps: d.max, rest_seconds: d.rest }
    setProgramDays(prev => prev.map((day, i) => i === currentDayIdx ? { ...day, exercises: [...day.exercises, newEx] } : day))
    setShowExPicker(false)
  }

  function removeExercise(dayIdx: number, exIdx: number) {
    setProgramDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d))
  }

  function updateExerciseField(dayIdx: number, exIdx: number, field: keyof SelectedExercise, value: number) {
    setProgramDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, exercises: d.exercises.map((ex, j) => j === exIdx ? { ...ex, [field]: value } : ex) } : d))
  }

  function handleStartBuild(split: typeof SPLITS[0]) {
    setSelectedSplit(split)
    if (split.id === 'custom') {
      setCustomDays([])
      setProgramDays([])
      setPhase('build_days')
    } else {
      const days: ProgramDay[] = split.days.map(d => ({ name: d.name, day_type: d.day_type, target_muscles: d.target_muscles, exercises: [] }))
      setProgramDays(days)
      setCurrentDayIdx(0)
      setPhase('build_days')
      // Auto-fill first day
      setTimeout(() => {
        const day = days[0]
        const newExercises: SelectedExercise[] = []
        const used = new Set<string>()
        for (const muscle of day.target_muscles) {
          const candidates = allExercises.filter(ex => ex.primary_muscle === muscle && equipmentMatches(ex))
          const compounds = candidates.filter(isCompound)
          const isolations = candidates.filter(e => !isCompound(e))
          const compoundCount = ['Upper Chest', 'Mid Chest', 'Lats', 'Mid Back', 'Quads', 'Hamstrings', 'Glutes'].includes(muscle) ? 2 : 1
          for (const ex of [...compounds.slice(0, compoundCount), ...isolations.slice(0, 1)]) {
            if (newExercises.length >= 8) break
            if (used.has(ex.id)) continue
            const d = getDefaultSets(ex)
            newExercises.push({ exercise_id: ex.id, name: ex.name, primary_muscle: ex.primary_muscle, sets: d.sets, min_reps: d.min, max_reps: d.max, rest_seconds: d.rest })
            used.add(ex.id)
          }
        }
        setProgramDays(prev => prev.map((d, i) => i === 0 ? { ...d, exercises: newExercises } : d))
      }, 100)
    }
  }

  function addCustomDay() {
    if (!newDayName.trim()) return
    const dayTypes: Record<string, string> = { 'push': 'push', 'pull': 'pull', 'leg': 'legs', 'chest': 'chest', 'back': 'back', 'shoulder': 'shoulders', 'arm': 'arms', 'upper': 'upper', 'lower': 'lower', 'full': 'full_body', 'cardio': 'cardio' }
    const type = Object.entries(dayTypes).find(([k]) => newDayName.toLowerCase().includes(k))?.[1] ?? 'custom'
    const muscleMap: Record<string, string[]> = {
      push: ['Upper Chest', 'Mid Chest', 'Side Delt', 'Shoulders', 'Triceps Long Head', 'Triceps Lateral Head'],
      pull: ['Lats', 'Mid Back', 'Rear Delt', 'Biceps Long Head', 'Biceps Short Head'],
      legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
      chest: ['Upper Chest', 'Mid Chest', 'Lower Chest'],
      back: ['Lats', 'Mid Back', 'Traps', 'Rear Delt'],
      shoulders: ['Side Delt', 'Shoulders', 'Rear Delt'],
      arms: ['Biceps Long Head', 'Biceps Short Head', 'Triceps Long Head', 'Triceps Lateral Head'],
      upper: ['Upper Chest', 'Mid Chest', 'Lats', 'Mid Back', 'Shoulders', 'Biceps Long Head', 'Triceps Lateral Head'],
      lower: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
      full_body: ['Mid Chest', 'Lats', 'Quads', 'Shoulders', 'Biceps Long Head', 'Triceps Lateral Head'],
      cardio: ['Cardio'],
      custom: [],
    }
    const newDay = { name: newDayName, day_type: type, target_muscles: muscleMap[type] ?? [] }
    setCustomDays(prev => [...prev, newDay])
    setProgramDays(prev => [...prev, { ...newDay, exercises: [] }])
    setNewDayName('')
    setShowAddDay(false)
  }

  async function saveProgram() {
    if (!user || !selectedSplit) return
    setSaving(true)
    await supabase.from('programs').update({ is_active: false }).eq('user_id', user.id)
    const { data: program } = await supabase.from('programs').insert({ user_id: user.id, name: selectedSplit.name, goal: null, split_type: selectedSplit.id, is_active: true }).select().single()
    if (!program) { setSaving(false); return }
    for (let i = 0; i < programDays.length; i++) {
      const day = programDays[i]
      if (day.exercises.length === 0) continue
      const estMin = Math.max(20, Math.round(day.exercises.reduce((s, e) => s + e.sets * ((e.rest_seconds ?? 90) + 45), 0) / 60))
      const { data: tmpl } = await supabase.from('workout_templates').insert({ program_id: program.id, name: day.name, day_type: day.day_type, estimated_minutes: estMin, sort_order: i }).select().single()
      if (!tmpl) continue
      await supabase.from('template_exercises').insert(day.exercises.map((ex, j) => ({ template_id: tmpl.id, exercise_id: ex.exercise_id, sort_order: j, target_sets: ex.sets, min_reps: ex.min_reps, max_reps: ex.max_reps, rest_seconds: ex.rest_seconds })))
    }
    setPhase('saved')
    setTimeout(() => { load(); setPhase('home') }, 1500)
  }

  async function deactivate() {
    if (!user) return
    await supabase.from('programs').update({ is_active: false }).eq('user_id', user.id)
    setActiveProgram(null)
  }

  // ── Exercise Picker Modal ────────────────────────────────
  const currentDay = programDays[currentDayIdx]
  const pickerMuscles = ['All', ...new Set(allExercises.map(e => e.primary_muscle))].sort()
  const filteredExercises = allExercises.filter(ex => {
    const mOk = pickerMuscle === 'All' || ex.primary_muscle === pickerMuscle
    const sOk = !pickerSearch || ex.name.toLowerCase().includes(pickerSearch.toLowerCase())
    const eqOk = equipmentMatches(ex)
    const notAdded = !currentDay?.exercises.some(e => e.exercise_id === ex.id)
    return mOk && sOk && eqOk && notAdded
  })

  if (showExPicker) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '20px' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setShowExPicker(false)} style={BTN}>← Back</button>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Add to {currentDay?.name}</div>
        </div>
        <div style={{ padding: '12px 16px 0' }}>
          <input type="text" placeholder="Search exercises..." value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box', color: '#111827' }} />
        </div>
        <div style={{ padding: '8px 16px 0', display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {pickerMuscles.slice(0, 15).map(m => (
            <div key={m} onClick={() => setPickerMuscle(m)} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', border: `1px solid ${pickerMuscle === m ? '#1D9E75' : '#e5e7eb'}`, background: pickerMuscle === m ? '#E1F5EE' : '#fff', color: pickerMuscle === m ? '#085041' : '#6b7280' }}>{m}</div>
          ))}
        </div>
        <div style={{ padding: '10px 16px' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>{filteredExercises.length} exercises — filtered by your equipment</div>
          {filteredExercises.map(ex => {
            const c = MUSCLE_COLORS[ex.primary_muscle] ?? { bg: '#f3f4f6', text: '#374151' }
            return (
              <div key={ex.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '11px 14px', marginBottom: '7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{ex.name}</div>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', background: c.bg, color: c.text }}>{ex.primary_muscle}</span>
                    {ex.difficulty && <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', background: '#f3f4f6', color: '#6b7280', textTransform: 'capitalize' }}>{ex.difficulty}</span>}
                    {isCompound(ex) && <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', background: '#fef9c3', color: '#854d0e' }}>Compound</span>}
                  </div>
                </div>
                <button onClick={() => addExerciseToDay(ex)} style={{ padding: '7px 14px', borderRadius: '8px', background: '#1D9E75', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', flexShrink: 0, marginLeft: '10px' }}>Add</button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Build Days ───────────────────────────────────────────
  if (phase === 'build_days' && selectedSplit) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '100px' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setPhase('pick_split')} style={BTN}>← Back</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{selectedSplit.name}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
              {programDays.filter(d => d.exercises.length > 0).length}/{programDays.length} days configured
            </div>
          </div>
          <button
            onClick={saveProgram}
            disabled={saving || programDays.every(d => d.exercises.length === 0)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: programDays.some(d => d.exercises.length > 0) ? '#1D9E75' : '#9FE1CB', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            {saving ? 'Saving...' : 'Save program'}
          </button>
        </div>

        <div style={{ padding: '14px 16px' }}>

          {/* Add custom day button */}
          {selectedSplit.id === 'custom' && (
            <>
              {showAddDay ? (
                <div style={{ background: '#fff', border: '1px solid #1D9E75', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                  <input
                    type="text" placeholder="e.g. Push Day, Leg Day, Back Day..."
                    value={newDayName} onChange={e => setNewDayName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomDay()}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box', color: '#111827', marginBottom: '10px' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowAddDay(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={addCustomDay} disabled={!newDayName.trim()} style={{ flex: 2, padding: '9px', borderRadius: '8px', background: newDayName.trim() ? '#1D9E75' : '#9FE1CB', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Add day</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddDay(true)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px dashed #d1d5db', background: '#fff', fontSize: '14px', color: '#6b7280', cursor: 'pointer', marginBottom: '12px' }}>
                  + Add training day
                </button>
              )}
            </>
          )}

          {programDays.map((day, dayIdx) => (
            <div key={dayIdx} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', marginBottom: '12px', overflow: 'hidden' }}>
              {/* Day header */}
              <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: expandedDay === dayIdx ? '1px solid #f3f4f6' : 'none' }} onClick={() => { setExpandedDay(expandedDay === dayIdx ? null : dayIdx); setCurrentDayIdx(dayIdx) }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{day.name}</div>
                    {day.exercises.length > 0 && <span style={{ fontSize: '11px', background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: '10px' }}>{day.exercises.length} exercises</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
                    {day.target_muscles.slice(0, 4).map(m => {
                      const c = MUSCLE_COLORS[m] ?? { bg: '#f3f4f6', text: '#6b7280' }
                      return <span key={m} style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', background: c.bg, color: c.text }}>{m}</span>
                    })}
                    {day.target_muscles.length > 4 && <span style={{ fontSize: '10px', color: '#9ca3af' }}>+{day.target_muscles.length - 4} more</span>}
                  </div>
                </div>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>{expandedDay === dayIdx ? '▲' : '▼'}</span>
              </div>

              {expandedDay === dayIdx && (
                <div style={{ padding: '12px 16px' }}>
                  {/* Auto fill button */}
                  <button
                    onClick={() => autoFillDay(dayIdx)}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #1D9E75', background: '#E1F5EE', color: '#085041', fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginBottom: '12px' }}
                  >
                    ✦ Auto-fill with suggested exercises
                  </button>

                  {/* Exercise list */}
                  {day.exercises.map((ex, exIdx) => {
                    const c = MUSCLE_COLORS[ex.primary_muscle] ?? { bg: '#f3f4f6', text: '#6b7280' }
                    return (
                      <div key={exIdx} style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px', border: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                            <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', background: c.bg, color: c.text, marginTop: '2px', display: 'inline-block' }}>{ex.primary_muscle}</span>
                          </div>
                          <button onClick={() => removeExercise(dayIdx, exIdx)} style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', fontSize: '11px', cursor: 'pointer', marginLeft: '8px', flexShrink: 0 }}>Remove</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                          {[
                            { label: 'Sets', field: 'sets' as keyof SelectedExercise, value: ex.sets },
                            { label: 'Min reps', field: 'min_reps' as keyof SelectedExercise, value: ex.min_reps },
                            { label: 'Max reps', field: 'max_reps' as keyof SelectedExercise, value: ex.max_reps },
                          ].map(({ label, field, value }) => (
                            <div key={field}>
                              <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '3px' }}>{label}</div>
                              <input type="number" value={value} onChange={e => updateExerciseField(dayIdx, exIdx, field, Number(e.target.value))} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px', textAlign: 'center', boxSizing: 'border-box', color: '#111827' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {/* Add exercise button */}
                  <button
                    onClick={() => { setCurrentDayIdx(dayIdx); setPickerMuscle('All'); setPickerSearch(''); setShowExPicker(true) }}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px dashed #d1d5db', background: '#fff', fontSize: '13px', color: '#6b7280', cursor: 'pointer', marginTop: '4px' }}
                  >
                    + Add exercise
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Saving ───────────────────────────────────────────────
  if (phase === 'saving' || phase === 'saved') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>{phase === 'saved' ? '✓' : '⟳'}</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{phase === 'saved' ? 'Program activated!' : 'Saving...'}</div>
        </div>
      </div>
    )
  }

  // ── Pick Split ───────────────────────────────────────────
  if (phase === 'pick_split') {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '20px' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setPhase('home')} style={BTN}>← Back</button>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Choose a split</div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '14px' }}>
            Exercises will be auto-suggested based on your equipment. You can customize every day.
          </div>
          {SPLITS.map(split => (
            <div key={split.id} onClick={() => handleStartBuild(split)} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px', marginBottom: '10px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {split.id === 'ppl_3' ? '△' : split.id === 'ppl_6' ? '⬡' : split.id === 'upper_lower' ? '⊕' : split.id === 'full_body' ? '◎' : split.id === 'bro_split' ? '□' : '✦'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{split.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px', lineHeight: 1.5 }}>{split.description}</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', background: '#E6F1FB', color: '#185FA5', padding: '2px 8px', borderRadius: '8px' }}>
                      {split.days_per_week > 0 ? `${split.days_per_week} days/week` : 'Custom days'}
                    </span>
                    <span style={{ fontSize: '11px', background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: '8px' }}>{split.best_for}</span>
                  </div>
                  {split.id !== 'custom' && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {split.days.map(d => <span key={d.name} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', background: '#f3f4f6', color: '#374151' }}>{d.name}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ color: '#d1d5db', fontSize: '18px' }}>›</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Home ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '13px', color: '#9ca3af' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '32px' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={BTN}>← Back</button>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', flex: 1 }}>Programs</div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '560px', margin: '0 auto' }}>

        {activeProgram ? (
          <>
            <div style={{ background: '#E1F5EE', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#0F6E56', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Active program</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#085041', marginTop: '2px' }}>{activeProgram.name}</div>
                <div style={{ fontSize: '12px', color: '#0F6E56', marginTop: '1px' }}>{activeProgram.days.length} workout days</div>
              </div>
              <button onClick={deactivate} style={{ fontSize: '11px', color: '#ef4444', background: 'transparent', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>Remove</button>
            </div>

            {activeProgram.days.map((day, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', marginBottom: '8px', overflow: 'hidden' }}>
                <div onClick={() => setExpandedDay(expandedDay === i ? null : i)} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{day.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '1px' }}>{day.exercises.length} exercises · ~{day.estimated_minutes} min</div>
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>{expandedDay === i ? '▲' : '▼'}</span>
                </div>
                {expandedDay === i && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '8px 16px 12px' }}>
                    {day.exercises.map((ex, j) => (
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f9fafb' }}>
                        <div style={{ fontSize: '13px', color: '#111827' }}>{ex.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{ex.sets} × {ex.min_reps}–{ex.max_reps}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button onClick={() => setPhase('pick_split')} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '14px', color: '#374151', cursor: 'pointer', marginTop: '8px' }}>
              Switch program
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>No active program</div>
              <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6 }}>Choose a split and build your workout plan. Exercises are auto-suggested based on your gym equipment.</div>
            </div>
            <button onClick={() => setPhase('pick_split')} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1D9E75', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
              Build a program
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const BTN: React.CSSProperties = { padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', color: '#374151', cursor: 'pointer' }