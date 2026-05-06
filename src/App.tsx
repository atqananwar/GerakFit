import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthScreen from './screens/AuthScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import DashboardScreen from './screens/DashboardScreen'
import WorkoutLogger from './screens/WorkoutLogger'
import ExerciseLibrary from './screens/ExerciseLibrary'
import AnalyticsScreen from './screens/AnalyticsScreen'
import ProfileScreen from './screens/ProfileScreen'
import ProgramBuilder from './screens/ProgramBuilder'
import WorkoutHomeScreen from './screens/WorkoutHomeScreen'
import ExploreRoutinesScreen from './screens/ExploreRoutinesScreen'
import CreateRoutineScreen from './screens/CreateRoutineScreen'
import AISummaryScreen from './screens/AISummaryScreen'
import DailyChallengeScreen from './screens/DailyChallengeScreen'
import { supabase } from './lib/supabase'

type AppState = 'loading' | 'auth' | 'onboarding' | 'dashboard' | 'workout' | 'exercises' | 'analytics' | 'profile' | 'programs' | 'program_builder' | 'explore_routines' | 'create_routine' | 'ai_summary' | 'daily_challenge'

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const [appState, setAppState] = useState<AppState>('loading')
  const syncStatus = 'idle' as const

  useEffect(() => {
    if (authLoading) return
    if (!user) { setAppState('auth'); return }
    checkOnboarding()
  }, [user, authLoading])

  async function checkOnboarding() {
    if (!user) return
    const { data } = await supabase.from('profiles').select('goal, experience_level').eq('id', user.id).single()
    if (data?.goal && data?.experience_level) setAppState('dashboard')
    else setAppState('onboarding')
  }

  if (appState === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '8px' }}>Gerak<span style={{ color: '#1D9E75' }}>Fit</span></div>
        <div style={{ fontSize: '13px', color: '#9ca3af' }}>Loading...</div>
      </div>
    </div>
  )

  if (appState === 'auth') return <AuthScreen onSuccess={() => checkOnboarding()} />
  if (appState === 'onboarding') return <OnboardingScreen onComplete={() => setAppState('dashboard')} />
  if (appState === 'workout') return <WorkoutLogger onBack={() => setAppState('dashboard')} />
  if (appState === 'exercises') return <ExerciseLibrary onBack={() => setAppState('dashboard')} />
  if (appState === 'analytics') return <AnalyticsScreen onBack={() => setAppState('dashboard')} />
  if (appState === 'profile') return <ProfileScreen onBack={() => setAppState('dashboard')} />
  if (appState === 'programs') return (
    <WorkoutHomeScreen
      onStartWorkout={() => setAppState('workout')}
      onStartRoutine={(_routineId) => setAppState('workout')}
      onNewRoutine={() => setAppState('create_routine')}
      onExploreRoutines={() => setAppState('explore_routines')}
      onHome={() => setAppState('dashboard')}
      onOpenProfile={() => setAppState('profile')}
    />
  )
  if (appState === 'create_routine') return (
    <CreateRoutineScreen
      onBack={() => setAppState('programs')}
      onSaved={() => setAppState('programs')}
    />
  )
  if (appState === 'program_builder') return <ProgramBuilder onBack={() => setAppState('programs')} onStartWorkout={() => setAppState('workout')} />
  if (appState === 'explore_routines') return <ExploreRoutinesScreen onBack={() => setAppState('programs')} />
  if (appState === 'ai_summary') return <AISummaryScreen onBack={() => setAppState('dashboard')} />
  if (appState === 'daily_challenge') return <DailyChallengeScreen onBack={() => setAppState('dashboard')} />
  return (
    <DashboardScreen
      onStartWorkout={() => setAppState('workout')}
      onOpenLibrary={() => setAppState('exercises')}
      onOpenAnalytics={() => setAppState('analytics')}
      onOpenProfile={() => setAppState('profile')}
      onOpenPrograms={() => setAppState('programs')}
      onOpenAISummary={() => setAppState('ai_summary')}
      onOpenDailyChallenge={() => setAppState('daily_challenge')}
      syncStatus={syncStatus}
    />
  )
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>
}