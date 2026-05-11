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
  const VALID_STATES: AppState[] = ['dashboard', 'workout', 'exercises', 'analytics',
    'profile', 'programs', 'ai_summary', 'daily_challenge', 'explore_routines', 'create_routine']

  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const saved = sessionStorage.getItem('gf-state') as AppState
      if (saved && VALID_STATES.includes(saved)) return saved
    } catch {}
    return 'loading'
  })
  const [routineRefreshKey, setRoutineRefreshKey] = useState(0)
  const [activeTemplateId, setActiveTemplateId] = useState<string | undefined>()
  const syncStatus = 'idle' as const

  function navigateTo(state: AppState) {
    try { sessionStorage.setItem('gf-state', state) } catch {}
    setAppState(state)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setAppState('auth'); return }
    checkOnboarding()
  }, [user, authLoading])

  async function checkOnboarding() {
    if (!user) return
    const { data } = await supabase.from('profiles').select('goal, experience_level').eq('id', user.id).single()
    if (data?.goal && data?.experience_level) {
      try {
        const savedState = sessionStorage.getItem('gf-state') as AppState
        if (savedState && VALID_STATES.includes(savedState)) { setAppState(savedState); return }
      } catch {}
      navigateTo('dashboard')
    } else {
      navigateTo('onboarding')
    }
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
  if (appState === 'onboarding') return <OnboardingScreen onComplete={() => navigateTo('dashboard')} />
  if (appState === 'workout') return <WorkoutLogger onBack={() => navigateTo('dashboard')} templateId={activeTemplateId} />
  if (appState === 'exercises') return <ExerciseLibrary onBack={() => navigateTo('dashboard')} />
  if (appState === 'analytics') return <AnalyticsScreen onBack={() => navigateTo('dashboard')} />
  if (appState === 'profile') return <ProfileScreen onBack={() => navigateTo('dashboard')} onNavigateAnalytics={() => navigateTo('analytics')} onNavigateExercises={() => navigateTo('exercises')} />
  if (appState === 'programs') return (
    <WorkoutHomeScreen
      onStartWorkout={() => { setActiveTemplateId(undefined); navigateTo('workout') }}
      onStartRoutine={(templateId) => { setActiveTemplateId(templateId); navigateTo('workout') }}
      onNewRoutine={() => navigateTo('create_routine')}
      onExploreRoutines={() => navigateTo('explore_routines')}
      onHome={() => navigateTo('dashboard')}
      onOpenProfile={() => navigateTo('profile')}
      refreshKey={routineRefreshKey}
    />
  )
  if (appState === 'create_routine') return (
    <CreateRoutineScreen
      onBack={() => navigateTo('programs')}
      onRoutineSaved={() => { setRoutineRefreshKey(k => k + 1); navigateTo('programs') }}
    />
  )
  if (appState === 'program_builder') return <ProgramBuilder onBack={() => navigateTo('programs')} onStartWorkout={() => navigateTo('workout')} />
  if (appState === 'explore_routines') return <ExploreRoutinesScreen onBack={() => navigateTo('programs')} onRoutineSaved={() => { setRoutineRefreshKey(k => k + 1); navigateTo('programs') }} />
  if (appState === 'ai_summary') return <AISummaryScreen onBack={() => navigateTo('dashboard')} />
  if (appState === 'daily_challenge') return <DailyChallengeScreen onBack={() => navigateTo('dashboard')} />
  return (
    <DashboardScreen
      onStartWorkout={() => navigateTo('workout')}
      onOpenLibrary={() => navigateTo('exercises')}
      onOpenAnalytics={() => navigateTo('analytics')}
      onOpenProfile={() => navigateTo('profile')}
      onOpenPrograms={() => navigateTo('programs')}
      onOpenAISummary={() => navigateTo('ai_summary')}
      onOpenDailyChallenge={() => navigateTo('daily_challenge')}
      syncStatus={syncStatus}
    />
  )
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>
}