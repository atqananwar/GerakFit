import { supabase } from './supabase'

export interface ProgramTemplate {
  name: string
  split_type: string
  description: string
  days_per_week: number
  best_for: string
  days: DayTemplate[]
}

export interface DayTemplate {
  name: string
  day_type: string
  target_muscles: string[]
  exercise_slots: ExerciseSlot[]
}

export interface ExerciseSlot {
  muscle: string
  movement_priority: 'compound' | 'isolation'
  sets: number
  min_reps: number
  max_reps: number
  rest_seconds: number
}

export interface GeneratedDay {
  name: string
  day_type: string
  exercises: GeneratedExercise[]
}

export interface GeneratedExercise {
  exercise_id: string
  name: string
  primary_muscle: string
  difficulty: string | null
  sets: number
  min_reps: number
  max_reps: number
  rest_seconds: number
}

// ─── Split Templates ──────────────────────────────────────

export const SPLIT_TEMPLATES: ProgramTemplate[] = [
  {
    name: 'Full Body',
    split_type: 'full_body',
    description: 'Train every muscle group each session. Best for beginners building the habit.',
    days_per_week: 3,
    best_for: 'Beginners, 2–3 days/week',
    days: [
      {
        name: 'Full Body A',
        day_type: 'full_body',
        target_muscles: ['Chest', 'Back', 'Legs', 'Shoulders'],
        exercise_slots: [
          { muscle: 'Legs', movement_priority: 'compound', sets: 3, min_reps: 8, max_reps: 12, rest_seconds: 120 },
          { muscle: 'Chest', movement_priority: 'compound', sets: 3, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Back', movement_priority: 'compound', sets: 3, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Shoulders', movement_priority: 'compound', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Biceps', movement_priority: 'isolation', sets: 2, min_reps: 10, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Triceps', movement_priority: 'isolation', sets: 2, min_reps: 10, max_reps: 15, rest_seconds: 60 },
        ],
      },
      {
        name: 'Full Body B',
        day_type: 'full_body',
        target_muscles: ['Legs', 'Back', 'Chest', 'Shoulders'],
        exercise_slots: [
          { muscle: 'Back', movement_priority: 'compound', sets: 3, min_reps: 8, max_reps: 12, rest_seconds: 120 },
          { muscle: 'Legs', movement_priority: 'compound', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 90 },
          { muscle: 'Chest', movement_priority: 'compound', sets: 3, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Shoulders', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Abs/Core', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 20, rest_seconds: 60 },
        ],
      },
    ],
  },
  {
    name: 'Upper / Lower',
    split_type: 'upper_lower',
    description: 'Alternate upper and lower body days. Great balance of frequency and volume.',
    days_per_week: 4,
    best_for: 'Intermediate, 4 days/week',
    days: [
      {
        name: 'Upper A',
        day_type: 'upper',
        target_muscles: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
        exercise_slots: [
          { muscle: 'Chest', movement_priority: 'compound', sets: 4, min_reps: 6, max_reps: 10, rest_seconds: 120 },
          { muscle: 'Back', movement_priority: 'compound', sets: 4, min_reps: 6, max_reps: 10, rest_seconds: 120 },
          { muscle: 'Shoulders', movement_priority: 'compound', sets: 3, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Biceps', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Triceps', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 60 },
        ],
      },
      {
        name: 'Lower A',
        day_type: 'lower',
        target_muscles: ['Legs', 'Abs/Core'],
        exercise_slots: [
          { muscle: 'Legs', movement_priority: 'compound', sets: 4, min_reps: 6, max_reps: 10, rest_seconds: 150 },
          { muscle: 'Legs', movement_priority: 'compound', sets: 4, min_reps: 8, max_reps: 12, rest_seconds: 120 },
          { muscle: 'Legs', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Legs', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Abs/Core', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 20, rest_seconds: 60 },
        ],
      },
      {
        name: 'Upper B',
        day_type: 'upper',
        target_muscles: ['Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps'],
        exercise_slots: [
          { muscle: 'Back', movement_priority: 'compound', sets: 4, min_reps: 8, max_reps: 12, rest_seconds: 120 },
          { muscle: 'Chest', movement_priority: 'compound', sets: 4, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Shoulders', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Shoulders', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Biceps', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Triceps', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 60 },
        ],
      },
      {
        name: 'Lower B',
        day_type: 'lower',
        target_muscles: ['Legs', 'Abs/Core'],
        exercise_slots: [
          { muscle: 'Legs', movement_priority: 'compound', sets: 4, min_reps: 8, max_reps: 12, rest_seconds: 120 },
          { muscle: 'Legs', movement_priority: 'compound', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 90 },
          { muscle: 'Legs', movement_priority: 'isolation', sets: 4, min_reps: 10, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Legs', movement_priority: 'isolation', sets: 4, min_reps: 10, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Abs/Core', movement_priority: 'isolation', sets: 3, min_reps: 15, max_reps: 20, rest_seconds: 60 },
        ],
      },
    ],
  },
  {
    name: 'Push / Pull / Legs',
    split_type: 'ppl',
    description: 'Classic 3-day split run twice per week. High volume, great for hypertrophy.',
    days_per_week: 6,
    best_for: 'Intermediate–Advanced, 5–6 days/week',
    days: [
      {
        name: 'Push',
        day_type: 'push',
        target_muscles: ['Chest', 'Shoulders', 'Triceps'],
        exercise_slots: [
          { muscle: 'Chest', movement_priority: 'compound', sets: 4, min_reps: 6, max_reps: 10, rest_seconds: 120 },
          { muscle: 'Chest', movement_priority: 'compound', sets: 4, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Shoulders', movement_priority: 'compound', sets: 3, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Chest', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Shoulders', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Triceps', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Triceps', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
        ],
      },
      {
        name: 'Pull',
        day_type: 'pull',
        target_muscles: ['Back', 'Biceps', 'Shoulders'],
        exercise_slots: [
          { muscle: 'Back', movement_priority: 'compound', sets: 4, min_reps: 6, max_reps: 10, rest_seconds: 120 },
          { muscle: 'Back', movement_priority: 'compound', sets: 4, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Back', movement_priority: 'compound', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 90 },
          { muscle: 'Shoulders', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Biceps', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Biceps', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 60 },
        ],
      },
      {
        name: 'Legs',
        day_type: 'legs',
        target_muscles: ['Legs', 'Abs/Core'],
        exercise_slots: [
          { muscle: 'Legs', movement_priority: 'compound', sets: 4, min_reps: 6, max_reps: 10, rest_seconds: 150 },
          { muscle: 'Legs', movement_priority: 'compound', sets: 4, min_reps: 8, max_reps: 12, rest_seconds: 120 },
          { muscle: 'Legs', movement_priority: 'compound', sets: 3, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Legs', movement_priority: 'isolation', sets: 4, min_reps: 10, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Legs', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Abs/Core', movement_priority: 'isolation', sets: 3, min_reps: 15, max_reps: 20, rest_seconds: 60 },
        ],
      },
    ],
  },
  {
    name: 'Body Part Split',
    split_type: 'body_part',
    description: 'Dedicate each day to one muscle group. Maximum volume per session.',
    days_per_week: 5,
    best_for: 'Intermediate–Advanced, 5 days/week',
    days: [
      {
        name: 'Chest',
        day_type: 'chest',
        target_muscles: ['Chest', 'Triceps'],
        exercise_slots: [
          { muscle: 'Chest', movement_priority: 'compound', sets: 4, min_reps: 6, max_reps: 10, rest_seconds: 120 },
          { muscle: 'Chest', movement_priority: 'compound', sets: 4, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Chest', movement_priority: 'compound', sets: 3, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Chest', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Chest', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Triceps', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
        ],
      },
      {
        name: 'Back',
        day_type: 'back',
        target_muscles: ['Back', 'Biceps'],
        exercise_slots: [
          { muscle: 'Back', movement_priority: 'compound', sets: 4, min_reps: 6, max_reps: 10, rest_seconds: 120 },
          { muscle: 'Back', movement_priority: 'compound', sets: 4, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Back', movement_priority: 'compound', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 90 },
          { muscle: 'Back', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Biceps', movement_priority: 'isolation', sets: 4, min_reps: 10, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Biceps', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 60 },
        ],
      },
      {
        name: 'Shoulders',
        day_type: 'shoulders',
        target_muscles: ['Shoulders', 'Triceps'],
        exercise_slots: [
          { muscle: 'Shoulders', movement_priority: 'compound', sets: 4, min_reps: 8, max_reps: 12, rest_seconds: 90 },
          { muscle: 'Shoulders', movement_priority: 'isolation', sets: 4, min_reps: 12, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Shoulders', movement_priority: 'isolation', sets: 4, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Shoulders', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Triceps', movement_priority: 'isolation', sets: 4, min_reps: 10, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Triceps', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
        ],
      },
      {
        name: 'Legs',
        day_type: 'legs',
        target_muscles: ['Legs', 'Abs/Core'],
        exercise_slots: [
          { muscle: 'Legs', movement_priority: 'compound', sets: 4, min_reps: 6, max_reps: 10, rest_seconds: 150 },
          { muscle: 'Legs', movement_priority: 'compound', sets: 4, min_reps: 8, max_reps: 12, rest_seconds: 120 },
          { muscle: 'Legs', movement_priority: 'compound', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 90 },
          { muscle: 'Legs', movement_priority: 'isolation', sets: 4, min_reps: 10, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Legs', movement_priority: 'isolation', sets: 4, min_reps: 10, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Abs/Core', movement_priority: 'isolation', sets: 3, min_reps: 15, max_reps: 20, rest_seconds: 60 },
        ],
      },
      {
        name: 'Arms',
        day_type: 'arms',
        target_muscles: ['Biceps', 'Triceps'],
        exercise_slots: [
          { muscle: 'Biceps', movement_priority: 'isolation', sets: 4, min_reps: 10, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Triceps', movement_priority: 'isolation', sets: 4, min_reps: 10, max_reps: 15, rest_seconds: 75 },
          { muscle: 'Biceps', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Triceps', movement_priority: 'isolation', sets: 3, min_reps: 10, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Biceps', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
          { muscle: 'Triceps', movement_priority: 'isolation', sets: 3, min_reps: 12, max_reps: 15, rest_seconds: 60 },
        ],
      },
    ],
  },
  {
    name: 'PPL + Upper + Arms',
    split_type: 'ppl_upper_arms',
    description: 'Advanced 6-day rotation for maximum hypertrophy with arm specialisation.',
    days_per_week: 6,
    best_for: 'Advanced, 6 days/week',
    days: [],
  },
]

// ─── Exercise Picker ──────────────────────────────────────

interface DBExercise {
  id: string
  name: string
  primary_muscle: string
  equipment: string[] | null
  difficulty: string | null
  movement_pattern: string | null
}

const COMPOUND_PATTERNS = ['horizontal press','incline press','vertical press','squat','hip hinge','horizontal pull','vertical pull','lunge']

function isCompound(ex: DBExercise): boolean {
  return COMPOUND_PATTERNS.some(p => (ex.movement_pattern ?? '').toLowerCase().includes(p))
}

function equipmentMatches(ex: DBExercise, userEquipment: string[]): boolean {
  if (!ex.equipment || ex.equipment.length === 0) return true
  // Map detailed equipment names to exercise equipment categories
  const equipMap: Record<string, string[]> = {
    'Bodyweight': ['Bodyweight','Pull-Up Bar','Dip Bar',"Captain's Chair",'Parallel Bar'],
    'Barbell': ['Barbell','EZ Bar','Trap Bar / Hex Bar','Safety Squat Bar'],
    'Dumbbell': ['Dumbbell','Kettlebell'],
    'Cable': ['Cable Pulley','Cable Crossover Machine','Lat Pulldown Machine','Seated Cable Row','Straight Bar Attachment','Rope Attachment','V-Bar Attachment','D-Handle','Ankle Strap'],
    'Machine': ['Chest Press Machine','Pec Deck Machine','Shoulder Press Machine','Lateral Raise Machine','Rear Delt Machine','T-Bar Row Machine','High Row Machine','Low Row Machine','Leg Press Machine','Leg Extension Machine','Leg Curl Machine','Hip Thrust Machine','Hip Abductor Machine','Hip Adductor Machine','Glute Kickback Machine','Calf Raise Machine','Hack Squat Machine','Glute Ham Developer','Back Extension Bench','Ab Crunch Machine','Assisted Pull-Up / Dip Machine'],
    'Smith Machine': ['Smith Machine'],
    'Bench': ['Flat Bench','Adjustable Bench','Decline Bench'],
    'Resistance Band': ['Resistance Band','Mini Band'],
  }

  return ex.equipment.every(req => {
    if (userEquipment.includes(req)) return true
    const mapped = Object.entries(equipMap).find(([key]) => key === req)?.[1] ?? []
    return mapped.some(m => userEquipment.includes(m))
  })
}

export async function generateProgram(
  template: ProgramTemplate,
  userEquipment: string[],
  experienceLevel: string
): Promise<GeneratedDay[]> {
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, name, primary_muscle, equipment, difficulty, movement_pattern')
    .eq('is_active', true)

  if (!allExercises) return []

  // Filter by experience: beginners get beginner+intermediate, advanced get all
  const allowedDifficulty = experienceLevel === 'beginner'
    ? ['beginner', 'intermediate']
    : experienceLevel === 'intermediate'
    ? ['beginner', 'intermediate', 'advanced']
    : ['beginner', 'intermediate', 'advanced']

  const eligible = allExercises.filter(ex =>
    equipmentMatches(ex as DBExercise, userEquipment) &&
    allowedDifficulty.includes(ex.difficulty ?? 'beginner')
  )

  const usedInProgram = new Set<string>()

  return template.days.map(day => {
    const usedInDay = new Set<string>()
    const exercises: GeneratedExercise[] = []

    for (const slot of day.exercise_slots) {
      const candidates = eligible.filter(ex => {
        if (ex.primary_muscle !== slot.muscle) return false
        if (usedInDay.has(ex.id)) return false
        const compound = isCompound(ex as DBExercise)
        if (slot.movement_priority === 'compound' && !compound) return false
        if (slot.movement_priority === 'isolation' && compound) return false
        return true
      })

      // Prefer exercises not used elsewhere in the program (variety)
      const fresh = candidates.filter(ex => !usedInProgram.has(ex.id))
      const pool = fresh.length > 0 ? fresh : candidates

      if (pool.length === 0) {
        // Fallback: any exercise for this muscle
        const fallback = eligible.filter(ex => ex.primary_muscle === slot.muscle && !usedInDay.has(ex.id))
        if (fallback.length > 0) {
          const pick = fallback[Math.floor(Math.random() * Math.min(fallback.length, 3))]
          usedInDay.add(pick.id)
          usedInProgram.add(pick.id)
          exercises.push({ exercise_id: pick.id, name: pick.name, primary_muscle: pick.primary_muscle, difficulty: pick.difficulty, sets: slot.sets, min_reps: slot.min_reps, max_reps: slot.max_reps, rest_seconds: slot.rest_seconds })
        }
        continue
      }

      const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 3))]
      usedInDay.add(pick.id)
      usedInProgram.add(pick.id)
      exercises.push({ exercise_id: pick.id, name: pick.name, primary_muscle: pick.primary_muscle, difficulty: pick.difficulty, sets: slot.sets, min_reps: slot.min_reps, max_reps: slot.max_reps, rest_seconds: slot.rest_seconds })
    }

    return { name: day.name, day_type: day.day_type, exercises }
  })
}

// ─── Save Program to Supabase ─────────────────────────────

export async function saveProgram(
  userId: string,
  template: ProgramTemplate,
  generatedDays: GeneratedDay[]
): Promise<string | null> {
  // Deactivate existing programs
  await supabase.from('programs').update({ is_active: false }).eq('user_id', userId)

  const { data: program, error: pErr } = await supabase
    .from('programs')
    .insert({ user_id: userId, name: template.name, goal: null, split_type: template.split_type, is_active: true })
    .select()
    .single()

  if (pErr || !program) return null

  for (let i = 0; i < generatedDays.length; i++) {
    const day = generatedDays[i]
    const { data: tmpl, error: tErr } = await supabase
      .from('workout_templates')
      .insert({ program_id: program.id, name: day.name, day_type: day.day_type, estimated_minutes: Math.max(30, Math.round(day.exercises.reduce((s, e) => s + e.sets * ((e.rest_seconds ?? 90) + 45), 0) / 60)), sort_order: i })
      .select()
      .single()

    if (tErr || !tmpl) continue

    if (day.exercises.length > 0) {
      await supabase.from('template_exercises').insert(
        day.exercises.map((ex, j) => ({
          template_id: tmpl.id,
          exercise_id: ex.exercise_id,
          sort_order: j,
          target_sets: ex.sets,
          min_reps: ex.min_reps,
          max_reps: ex.max_reps,
          rest_seconds: ex.rest_seconds,
        }))
      )
    }
  }

  return program.id
}