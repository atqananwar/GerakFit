export const PRESET_ROUTINES = [
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

export type PresetRoutine = typeof PRESET_ROUTINES[0]
