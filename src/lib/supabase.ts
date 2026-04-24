import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  profiles: {
    id: string
    full_name: string | null
    height_cm: number | null
    weight_kg: number | null
    goal: 'muscle_gain' | 'fat_loss' | 'strength' | 'general_fitness' | null
    experience_level: 'beginner' | 'intermediate' | 'advanced' | null
    training_days_per_week: number | null
    session_length_minutes: number | null
    injury_notes: string | null
    created_at: string
  }
  exercises: {
    id: string
    name: string
    primary_muscle: string
    secondary_muscles: string[] | null
    equipment: string[] | null
    movement_pattern: string | null
    difficulty: 'beginner' | 'intermediate' | 'advanced' | null
    instructions: string | null
    common_mistakes: string | null
    is_active: boolean
    created_at: string
  }
  workout_sessions: {
    id: string
    user_id: string
    template_id: string | null
    workout_date: string
    status: 'in_progress' | 'completed' | 'cancelled'
    started_at: string
    ended_at: string | null
    duration_seconds: number | null
    notes: string | null
  }
  exercise_sets: {
    id: string
    session_exercise_id: string
    set_number: number
    weight_kg: number | null
    reps: number | null
    rpe: number | null
    is_warmup: boolean
    is_failure: boolean
    completed_at: string
  }
}