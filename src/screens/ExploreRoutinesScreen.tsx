import { useState, useEffect } from 'react'

interface Props {
  onBack: () => void
  onStartWorkout: () => void
}

const PRESET_ROUTINES = [
  // BEGINNER
  {
    id: 1, name: 'Beginner Full Body (Equipment-Free)', level: 'Beginner', equipment: 'Bodyweight', days: 3,
    description: 'No equipment needed. Build base strength with fundamental movements.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 2, name: 'Beginner Full Body (Dumbbells)', level: 'Beginner', equipment: 'Dumbbells', days: 3,
    description: 'Full body dumbbell program. Great for home gym setups.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 3, name: 'Beginner Full Body (Gym Equipment)', level: 'Beginner', equipment: 'Gym', days: 3,
    description: 'Classic beginner full body using gym machines and free weights.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 4, name: 'Beginner Upper/Lower (Dumbbells)', level: 'Beginner', equipment: 'Dumbbells', days: 4,
    description: '4-day upper/lower split with dumbbells. Good balance of frequency and volume.',
    workouts: [
      { name: 'Upper', exercises: ['Warm Up 1 set', 'Chest Press 4x10-12', 'Lat Pulldown 4x10-12', 'Shoulder Press 3x10-12', 'Seated Row 3x10-12', 'Lateral Raise 3x12-15', 'Tricep Pushdown 3x12-15', 'Bicep Curl 3x12-15'] },
      { name: 'Lower', exercises: ['Warm Up 1 set', 'Leg Press 4x10-12', 'Leg Curl 3x12-15', 'Leg Extension 3x12-15', 'Calf Raise 3x15-20'] },
    ]
  },
  {
    id: 5, name: 'Beginner Upper/Lower (Gym Equipment)', level: 'Beginner', equipment: 'Gym', days: 4,
    description: '4-day upper/lower split using gym machines. Structured and beginner-friendly.',
    workouts: [
      { name: 'Upper', exercises: ['Warm Up 1 set', 'Chest Press 4x10-12', 'Lat Pulldown 4x10-12', 'Shoulder Press 3x10-12', 'Seated Row 3x10-12', 'Lateral Raise 3x12-15', 'Tricep Pushdown 3x12-15', 'Bicep Curl 3x12-15'] },
      { name: 'Lower', exercises: ['Warm Up 1 set', 'Leg Press 4x10-12', 'Leg Curl 3x12-15', 'Leg Extension 3x12-15', 'Calf Raise 3x15-20'] },
    ]
  },
  {
    id: 6, name: 'Beginner Push/Pull/Legs (Dumbbells)', level: 'Beginner', equipment: 'Dumbbells', days: 3,
    description: 'Introduction to PPL split with dumbbells. No barbell needed.',
    workouts: [
      { name: 'Push', exercises: ['Bench Press 4x8-10', 'Shoulder Press 3x10', 'Incline Press 3x10', 'Tricep Pushdown 3x12', 'Cable Fly 3x12'] },
      { name: 'Pull', exercises: ['Lat Pulldown 4x10', 'Seated Row 3x10', 'Face Pull 3x15', 'Bicep Curl 3x12', 'Hammer Curl 3x12'] },
      { name: 'Legs', exercises: ['Squat / Leg Press 4x8-12', 'Leg Curl 3x12', 'Leg Extension 3x12', 'Calf Raise 3x15'] },
    ]
  },
  {
    id: 7, name: 'Beginner Push/Pull/Legs (Gym Equipment)', level: 'Beginner', equipment: 'Gym', days: 3,
    description: 'Classic PPL split for beginners using full gym equipment.',
    workouts: [
      { name: 'Push', exercises: ['Bench Press 4x8-10', 'Shoulder Press 3x10', 'Incline Press 3x10', 'Tricep Pushdown 3x12', 'Cable Fly 3x12'] },
      { name: 'Pull', exercises: ['Lat Pulldown 4x10', 'Seated Row 3x10', 'Face Pull 3x15', 'Bicep Curl 3x12', 'Hammer Curl 3x12'] },
      { name: 'Legs', exercises: ['Squat / Leg Press 4x8-12', 'Leg Curl 3x12', 'Leg Extension 3x12', 'Calf Raise 3x15'] },
    ]
  },
  {
    id: 8, name: 'Beginner 5x5', level: 'Beginner', equipment: 'Gym', days: 3,
    description: 'Simple 5x5 strength program. Focus on progressive overload on compound lifts.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 9, name: 'Beginner Home Workout', level: 'Beginner', equipment: 'Bodyweight', days: 3,
    description: 'Train at home with no equipment. Perfect for beginners starting out.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 10, name: 'Beginner Machine Only', level: 'Beginner', equipment: 'Gym', days: 3,
    description: 'Machines only — ideal for beginners not comfortable with free weights yet.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },

  // INTERMEDIATE
  {
    id: 11, name: 'Intermediate Full Body (Equipment-Free)', level: 'Intermediate', equipment: 'Bodyweight', days: 3,
    description: 'Higher intensity bodyweight full body for intermediate lifters.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 12, name: 'Intermediate Full Body (Dumbbells)', level: 'Intermediate', equipment: 'Dumbbells', days: 3,
    description: 'Progressive full body dumbbell program for intermediate lifters.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 13, name: 'Intermediate Full Body (Gym Equipment)', level: 'Intermediate', equipment: 'Gym', days: 3,
    description: 'Higher intensity full body for intermediate gym-goers. Progressive overload focus.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 14, name: 'Intermediate Upper/Lower (Dumbbells)', level: 'Intermediate', equipment: 'Dumbbells', days: 4,
    description: 'Strength-focused upper/lower split with dumbbells.',
    workouts: [
      { name: 'Upper', exercises: ['Warm Up 1 set', 'Chest Press 4x10-12', 'Lat Pulldown 4x10-12', 'Shoulder Press 3x10-12', 'Seated Row 3x10-12', 'Lateral Raise 3x12-15', 'Tricep Pushdown 3x12-15', 'Bicep Curl 3x12-15'] },
      { name: 'Lower', exercises: ['Warm Up 1 set', 'Leg Press 4x10-12', 'Leg Curl 3x12-15', 'Leg Extension 3x12-15', 'Calf Raise 3x15-20'] },
    ]
  },
  {
    id: 15, name: 'Intermediate Upper/Lower (Gym Equipment)', level: 'Intermediate', equipment: 'Gym', days: 4,
    description: 'Classic intermediate upper/lower split. Good strength and hypertrophy balance.',
    workouts: [
      { name: 'Upper', exercises: ['Warm Up 1 set', 'Chest Press 4x10-12', 'Lat Pulldown 4x10-12', 'Shoulder Press 3x10-12', 'Seated Row 3x10-12', 'Lateral Raise 3x12-15', 'Tricep Pushdown 3x12-15', 'Bicep Curl 3x12-15'] },
      { name: 'Lower', exercises: ['Warm Up 1 set', 'Leg Press 4x10-12', 'Leg Curl 3x12-15', 'Leg Extension 3x12-15', 'Calf Raise 3x15-20'] },
    ]
  },
  {
    id: 16, name: 'Intermediate Push/Pull/Legs (Dumbbells)', level: 'Intermediate', equipment: 'Dumbbells', days: 3,
    description: 'Full PPL program with dumbbells. Home gym friendly.',
    workouts: [
      { name: 'Push', exercises: ['Bench Press 4x8-10', 'Shoulder Press 3x10', 'Incline Press 3x10', 'Tricep Pushdown 3x12', 'Cable Fly 3x12'] },
      { name: 'Pull', exercises: ['Lat Pulldown 4x10', 'Seated Row 3x10', 'Face Pull 3x15', 'Bicep Curl 3x12', 'Hammer Curl 3x12'] },
      { name: 'Legs', exercises: ['Squat / Leg Press 4x8-12', 'Leg Curl 3x12', 'Leg Extension 3x12', 'Calf Raise 3x15'] },
    ]
  },
  {
    id: 17, name: 'Intermediate Push/Pull/Legs (Gym Equipment)', level: 'Intermediate', equipment: 'Gym', days: 3,
    description: 'High frequency PPL for intermediate lifters. Popular for muscle gain.',
    workouts: [
      { name: 'Push', exercises: ['Bench Press 4x8-10', 'Shoulder Press 3x10', 'Incline Press 3x10', 'Tricep Pushdown 3x12', 'Cable Fly 3x12'] },
      { name: 'Pull', exercises: ['Lat Pulldown 4x10', 'Seated Row 3x10', 'Face Pull 3x15', 'Bicep Curl 3x12', 'Hammer Curl 3x12'] },
      { name: 'Legs', exercises: ['Squat / Leg Press 4x8-12', 'Leg Curl 3x12', 'Leg Extension 3x12', 'Calf Raise 3x15'] },
    ]
  },
  {
    id: 18, name: '4-Day PHUL', level: 'Intermediate', equipment: 'Gym', days: 4,
    description: 'Power Hypertrophy Upper Lower. Combines strength and hypertrophy training.',
    workouts: [
      { name: 'Upper Power', exercises: ['Warm Up 1 set', 'Chest Press 4x10-12', 'Lat Pulldown 4x10-12', 'Shoulder Press 3x10-12', 'Seated Row 3x10-12', 'Lateral Raise 3x12-15', 'Tricep Pushdown 3x12-15', 'Bicep Curl 3x12-15'] },
      { name: 'Lower Power', exercises: ['Warm Up 1 set', 'Leg Press 4x10-12', 'Leg Curl 3x12-15', 'Leg Extension 3x12-15', 'Calf Raise 3x15-20'] },
      { name: 'Upper Hypertrophy', exercises: ['Warm Up 1 set', 'Chest Press 4x10-12', 'Lat Pulldown 4x10-12', 'Shoulder Press 3x10-12', 'Seated Row 3x10-12', 'Lateral Raise 3x12-15', 'Tricep Pushdown 3x12-15', 'Bicep Curl 3x12-15'] },
      { name: 'Lower Hypertrophy', exercises: ['Warm Up 1 set', 'Leg Press 4x10-12', 'Leg Curl 3x12-15', 'Leg Extension 3x12-15', 'Calf Raise 3x15-20'] },
    ]
  },
  {
    id: 19, name: 'Strength + Hypertrophy', level: 'Intermediate', equipment: 'Gym', days: 3,
    description: 'Powerbuilding approach. Build strength and size simultaneously.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 20, name: 'Intermediate Fat Loss', level: 'Intermediate', equipment: 'Bodyweight', days: 3,
    description: 'High intensity fat loss program. Combines cardio and strength movements.',
    workouts: [
      { name: 'Workout A', exercises: ['Burpees 3x15', 'Squat 3x15', 'Push Up 3x12'] },
      { name: 'Workout B', exercises: ['Mountain Climber 3x30s', 'Lunges 3x12', 'Plank 3x30s'] },
    ]
  },

  // ADVANCED
  {
    id: 21, name: 'Advanced Full Body (Equipment-Free)', level: 'Advanced', equipment: 'Bodyweight', days: 3,
    description: 'Advanced bodyweight training. High intensity full body sessions.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 22, name: 'Advanced Full Body (Dumbbells)', level: 'Advanced', equipment: 'Dumbbells', days: 3,
    description: 'Advanced full body dumbbell program. Progressive overload focused.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 23, name: 'Advanced Full Body (Gym Equipment)', level: 'Advanced', equipment: 'Gym', days: 3,
    description: 'High volume full body for advanced gym-goers.',
    workouts: [
      { name: 'Workout A', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
      { name: 'Workout B', exercises: ['Chest Press 3x10', 'Lat Pulldown 3x10', 'Squat / Leg Press 3x12', 'Shoulder Press 3x10', 'Core (Plank) 3x30s'] },
    ]
  },
  {
    id: 24, name: 'Advanced Upper/Lower (Dumbbells)', level: 'Advanced', equipment: 'Dumbbells', days: 4,
    description: 'High intensity upper/lower with dumbbells for advanced lifters.',
    workouts: [
      { name: 'Upper', exercises: ['Warm Up 1 set', 'Chest Press 4x10-12', 'Lat Pulldown 4x10-12', 'Shoulder Press 3x10-12', 'Seated Row 3x10-12', 'Lateral Raise 3x12-15', 'Tricep Pushdown 3x12-15', 'Bicep Curl 3x12-15'] },
      { name: 'Lower', exercises: ['Warm Up 1 set', 'Leg Press 4x10-12', 'Leg Curl 3x12-15', 'Leg Extension 3x12-15', 'Calf Raise 3x15-20'] },
    ]
  },
  {
    id: 25, name: 'Advanced Upper/Lower (Gym Equipment)', level: 'Advanced', equipment: 'Gym', days: 4,
    description: 'Advanced upper/lower split. High volume, periodized loading.',
    workouts: [
      { name: 'Upper', exercises: ['Warm Up 1 set', 'Chest Press 4x10-12', 'Lat Pulldown 4x10-12', 'Shoulder Press 3x10-12', 'Seated Row 3x10-12', 'Lateral Raise 3x12-15', 'Tricep Pushdown 3x12-15', 'Bicep Curl 3x12-15'] },
      { name: 'Lower', exercises: ['Warm Up 1 set', 'Leg Press 4x10-12', 'Leg Curl 3x12-15', 'Leg Extension 3x12-15', 'Calf Raise 3x15-20'] },
    ]
  },
  {
    id: 26, name: 'Advanced Push/Pull/Legs (Dumbbells)', level: 'Advanced', equipment: 'Dumbbells', days: 3,
    description: 'Advanced PPL with dumbbells. Serious home gym program.',
    workouts: [
      { name: 'Push', exercises: ['Bench Press 4x8-10', 'Shoulder Press 3x10', 'Incline Press 3x10', 'Tricep Pushdown 3x12', 'Cable Fly 3x12'] },
      { name: 'Pull', exercises: ['Lat Pulldown 4x10', 'Seated Row 3x10', 'Face Pull 3x15', 'Bicep Curl 3x12', 'Hammer Curl 3x12'] },
      { name: 'Legs', exercises: ['Squat / Leg Press 4x8-12', 'Leg Curl 3x12', 'Leg Extension 3x12', 'Calf Raise 3x15'] },
    ]
  },
  {
    id: 27, name: 'Advanced Push/Pull/Legs (Gym Equipment)', level: 'Advanced', equipment: 'Gym', days: 3,
    description: 'High volume PPL for advanced lifters. Full gym equipment.',
    workouts: [
      { name: 'Push', exercises: ['Bench Press 4x8-10', 'Shoulder Press 3x10', 'Incline Press 3x10', 'Tricep Pushdown 3x12', 'Cable Fly 3x12'] },
      { name: 'Pull', exercises: ['Lat Pulldown 4x10', 'Seated Row 3x10', 'Face Pull 3x15', 'Bicep Curl 3x12', 'Hammer Curl 3x12'] },
      { name: 'Legs', exercises: ['Squat / Leg Press 4x8-12', 'Leg Curl 3x12', 'Leg Extension 3x12', 'Calf Raise 3x15'] },
    ]
  },
  {
    id: 28, name: '6-Day PHUL', level: 'Advanced', equipment: 'Gym', days: 6,
    description: 'Extended PHUL for advanced lifters. Power and hypertrophy across 6 days.',
    workouts: [
      { name: 'Upper Power', exercises: ['Warm Up 1 set', 'Chest Press 4x10-12', 'Lat Pulldown 4x10-12', 'Shoulder Press 3x10-12', 'Seated Row 3x10-12', 'Lateral Raise 3x12-15', 'Tricep Pushdown 3x12-15', 'Bicep Curl 3x12-15'] },
      { name: 'Lower Power', exercises: ['Warm Up 1 set', 'Leg Press 4x10-12', 'Leg Curl 3x12-15', 'Leg Extension 3x12-15', 'Calf Raise 3x15-20'] },
      { name: 'Upper Hypertrophy', exercises: ['Warm Up 1 set', 'Chest Press 4x10-12', 'Lat Pulldown 4x10-12', 'Shoulder Press 3x10-12', 'Seated Row 3x10-12', 'Lateral Raise 3x12-15', 'Tricep Pushdown 3x12-15', 'Bicep Curl 3x12-15'] },
      { name: 'Lower Hypertrophy', exercises: ['Warm Up 1 set', 'Leg Press 4x10-12', 'Leg Curl 3x12-15', 'Leg Extension 3x12-15', 'Calf Raise 3x15-20'] },
    ]
  },
  {
    id: 29, name: 'Powerbuilding', level: 'Advanced', equipment: 'Gym', days: 4,
    description: 'Combines powerlifting and bodybuilding. Strength + aesthetics.',
    workouts: [
      { name: 'Power', exercises: ['Bench 5x5', 'Squat 5x5', 'Deadlift 3x5'] },
      { name: 'Hypertrophy', exercises: ['Warm Up 1 set', 'Chest Press 4x10-12', 'Lat Pulldown 4x10-12', 'Shoulder Press 3x10-12', 'Seated Row 3x10-12', 'Lateral Raise 3x12-15', 'Tricep Pushdown 3x12-15', 'Bicep Curl 3x12-15'] },
    ]
  },
  {
    id: 30, name: 'Athletic Performance', level: 'Advanced', equipment: 'Gym', days: 3,
    description: 'Sport-focused training. Power, speed, and functional strength.',
    workouts: [
      { name: 'Workout A', exercises: ['Sprint 5 rounds', 'Box Jump 4x5', 'Med Ball Slam 3x10'] },
      { name: 'Workout B', exercises: ['Agility Drill', 'Core', 'Conditioning'] },
    ]
  },
]

type Level = 'All' | 'Beginner' | 'Intermediate' | 'Advanced'
type Routine = typeof PRESET_ROUTINES[0]

const LEVEL_COLORS: Record<string, string> = {
  Beginner: '#1D9E75',
  Intermediate: '#378ADD',
  Advanced: '#e55a2b',
}

const EQUIPMENT_COLORS: Record<string, string> = {
  Bodyweight: '#9b59b6',
  Dumbbells: '#e67e22',
  Gym: '#2a2a2a',
}

export default function ExploreRoutinesScreen({ onBack, onStartWorkout }: Props) {
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')
  const [levelFilter, setLevelFilter] = useState<Level>('All')
  const [selected, setSelected] = useState<Routine | null>(null)

  useEffect(() => {
    document.body.style.background = darkMode ? '#0d0d0d' : '#f9fafb'
  }, [darkMode])

  const filtered = levelFilter === 'All'
    ? PRESET_ROUTINES
    : PRESET_ROUTINES.filter(r => r.level === levelFilter)

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', fontFamily: 'system-ui, sans-serif', paddingBottom: '32px' }}>

      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '0.5px solid #1c1c1e' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer', padding: '0 4px 0 0', lineHeight: 1 }}>←</button>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', flex: 1 }}>Explore Routines</div>
        <div style={{ fontSize: '12px', color: '#666' }}>{filtered.length} routines</div>
      </div>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: '8px', padding: '14px 16px', overflowX: 'auto' }}>
        {(['All', 'Beginner', 'Intermediate', 'Advanced'] as Level[]).map(l => (
          <button
            key={l}
            onClick={() => setLevelFilter(l)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: levelFilter === l ? 'none' : '0.5px solid #2a2a2a',
              background: levelFilter === l ? '#1D9E75' : '#1c1c1e',
              color: levelFilter === l ? '#ffffff' : '#888',
              fontSize: '13px',
              fontWeight: levelFilter === l ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Routine list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(routine => (
          <div
            key={routine.id}
            onClick={() => setSelected(routine)}
            style={{
              background: '#1c1c1e',
              border: '0.5px solid #2a2a2a',
              borderRadius: '14px',
              padding: '16px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', flex: 1, lineHeight: 1.3 }}>{routine.name}</div>
              <div style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap', flexShrink: 0 }}>{routine.days}d/wk</div>
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '6px', lineHeight: 1.4 }}>{routine.description}</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: LEVEL_COLORS[routine.level] ?? '#888', background: '#0d0d0d', border: `0.5px solid ${LEVEL_COLORS[routine.level] ?? '#2a2a2a'}`, borderRadius: '6px', padding: '3px 8px' }}>{routine.level}</span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#aaa', background: '#0d0d0d', border: '0.5px solid #2a2a2a', borderRadius: '6px', padding: '3px 8px' }}>{routine.equipment}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail sheet */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={() => setSelected(null)}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div
            style={{ position: 'relative', background: '#1c1c1e', borderRadius: '20px 20px 0 0', padding: '0 0 40px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#3a3a3a' }} />
            </div>

            {/* Sheet header */}
            <div style={{ padding: '12px 20px 16px', borderBottom: '0.5px solid #2a2a2a' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>{selected.name}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>{selected.description}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: LEVEL_COLORS[selected.level] ?? '#888', background: '#0d0d0d', border: `0.5px solid ${LEVEL_COLORS[selected.level] ?? '#2a2a2a'}`, borderRadius: '6px', padding: '3px 8px' }}>{selected.level}</span>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#aaa', background: '#0d0d0d', border: '0.5px solid #2a2a2a', borderRadius: '6px', padding: '3px 8px' }}>{selected.equipment}</span>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#aaa', background: '#0d0d0d', border: '0.5px solid #2a2a2a', borderRadius: '6px', padding: '3px 8px' }}>{selected.days} days/week</span>
              </div>
            </div>

            {/* Workouts */}
            <div style={{ padding: '8px 20px' }}>
              {selected.workouts.map((workout, wi) => (
                <div key={wi}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase' as const, marginTop: '12px', letterSpacing: '0.4px' }}>{workout.name}</div>
                  {workout.exercises.map((ex, ei) => (
                    <div
                      key={ei}
                      style={{ fontSize: '13px', color: '#cccccc', padding: '6px 0', borderBottom: '0.5px solid #1a1a1a' }}
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ padding: '20px 20px 0' }}>
              <button
                onClick={() => { setSelected(null); onStartWorkout() }}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1D9E75', border: 'none', color: '#ffffff', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
              >
                Start this Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
