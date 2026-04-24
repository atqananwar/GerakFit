import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SPLIT_TEMPLATES, generateProgram, saveProgram } from '../lib/programs'
import type { ProgramTemplate, GeneratedDay } from '../lib/programs'

interface Props {
  onBack: () => void
}

interface ActiveProgram {
  id: string
  name: string
  split_type: string
  created_at: string
  days: { id: string; name: string; day_type: string; estimated_minutes: number; exercises: { name: string; sets: number; min_reps: number; max_reps: number }[] }[]
}

type Phase = 'home' | 'pick_split' | 'preview' | 'saving' | 'saved'

const SPLIT_ICONS: Record<string, string> = {
  full_body: '◎',
  upper_lower: '⊕',
  ppl: '△',
  body_part: '□',
  ppl_upper_arms: '✦',
}

const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#E1F5EE', Back: '#E6F1FB', Shoulders: '#FAECE7',
  Biceps: '#FAEEDA', Triceps: '#FBEAF0', Legs: '#EAF3DE',
  'Abs/Core': '#EEEDFE', Cardio: '#FCEBEB', Mobility: '#F1EFE8',
}
const MUSCLE_TEXT: Record<string, string> = {
  Chest: '#085041', Back: '#0C447C', Shoulders: '#712B13',
  Biceps: '#633806', Triceps: '#72243E', Legs: '#27500A',
  'Abs/Core': '#3C3489', Cardio: '#791F1F', Mobility: '#444441',
}

export default function ProgramBuilder({ onBack }: Props) {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('home')
  const [activeProgram, setActiveProgram] = useState<ActiveProgram | null>(null)
  const [userEquipment, setUserEquipment] = useState<string[]>([])
  const [experienceLevel, setExperienceLevel] = useState('beginner')
  const [selectedTemplate, setSelectedTemplate] = useState<ProgramTemplate | null>(null)
  const [generatedDays, setGeneratedDays] = useState<GeneratedDay[]>([])
  const [expandedDay, setExpandedDay] = useState<number | null>(0)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    if (!user) return
    setLoading(true)
    const [profileRes, equipRes, programRes] = await Promise.all([
      supabase.from('profiles').select('experience_level').eq('id', user.id).single(),
      supabase.from('user_equipment').select('equipment_name').eq('user_id', user.id),
      supabase.from('programs').select('id, name, split_type, created_at').eq('user_id', user.id).eq('is_active', true).single(),
    ])

    if (profileRes.data?.experience_level) setExperienceLevel(profileRes.data.experience_level)
    setUserEquipment((equipRes.data ?? []).map(e => e.equipment_name))

    if (programRes.data) {
      const { data: templates } = await supabase
        .from('workout_templates')
        .select('id, name, day_type, estimated_minutes')
        .eq('program_id', programRes.data.id)
        .order('sort_order')

      const days = await Promise.all((templates ?? []).map(async tmpl => {
        const { data: exs } = await supabase
          .from('template_exercises')
          .select('exercises(name), target_sets, min_reps, max_reps')
          .eq('template_id', tmpl.id)
          .order('sort_order')
        return {
          id: tmpl.id,
          name: tmpl.name,
          day_type: tmpl.day_type,
          estimated_minutes: tmpl.estimated_minutes ?? 45,
          exercises: (exs ?? []).map(e => ({
            name: (e.exercises as unknown as { name: string })?.name ?? '—',
            sets: e.target_sets,
            min_reps: e.min_reps,
            max_reps: e.max_reps,
          })),
        }
      }))

      setActiveProgram({ ...programRes.data, days })
    }
    setLoading(false)
  }

  async function handleSelectTemplate(template: ProgramTemplate) {
    setSelectedTemplate(template)
    setGenerating(true)
    const days = await generateProgram(template, userEquipment, experienceLevel)
    setGeneratedDays(days)
    setGenerating(false)
    setExpandedDay(0)
    setPhase('preview')
  }

  async function handleSaveProgram() {
    if (!user || !selectedTemplate) return
    setPhase('saving')
    await saveProgram(user.id, selectedTemplate, generatedDays)
    await load()
    setPhase('saved')
    setTimeout(() => setPhase('home'), 1500)
  }

  async function deactivateProgram() {
    if (!user) return
    await supabase.from('programs').update({ is_active: false }).eq('user_id', user.id)
    setActiveProgram(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '13px', color: '#9ca3af' }}>Loading programs...</div>
    </div>
  )

  // ── Preview generated program ───────────────────────────
  if (phase === 'preview' && selectedTemplate) {
    return (
      <div style={PAGE}>
        <div style={HDR}>
          <button onClick={() => setPhase('pick_split')} style={BTN}>← Back</button>
          <div style={HTITLE}>{selectedTemplate.name}</div>
        </div>
        <div style={BODY}>
          <div style={{ background: '#E1F5EE', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#085041' }}>Generated for your gym</div>
            <div style={{ fontSize: '12px', color: '#0F6E56', marginTop: '3px' }}>
              {userEquipment.length} equipment items · {experienceLevel} level · {generatedDays.length} workout days
            </div>
          </div>

          {generatedDays.map((day, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', marginBottom: '10px', overflow: 'hidden' }}>
              <div onClick={() => setExpandedDay(expandedDay === i ? null : i)} style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{day.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{day.exercises.length} exercises · ~{Math.round(day.exercises.reduce((s, e) => s + e.sets * (90 + 45), 0) / 60)} min</div>
                </div>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>{expandedDay === i ? '▲' : '▼'}</span>
              </div>

              {expandedDay === i && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '10px 16px 14px' }}>
                  {day.exercises.map((ex, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                        <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '8px', background: MUSCLE_COLORS[ex.primary_muscle] ?? '#f3f4f6', color: MUSCLE_TEXT[ex.primary_muscle] ?? '#374151' }}>{ex.primary_muscle}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginLeft: '12px', whiteSpace: 'nowrap' }}>
                        {ex.sets} × {ex.min_reps}–{ex.max_reps}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              onClick={() => handleSelectTemplate(selectedTemplate)}
              disabled={generating}
              style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', color: '#374151', cursor: 'pointer' }}
            >
              {generating ? 'Regenerating...' : 'Regenerate'}
            </button>
            <button
              onClick={handleSaveProgram}
              style={{ flex: 2, padding: '11px', borderRadius: '10px', background: '#1D9E75', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              Start this program
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Saving / Saved ──────────────────────────────────────
  if (phase === 'saving' || phase === 'saved') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>{phase === 'saved' ? '✓' : '⟳'}</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{phase === 'saved' ? 'Program activated!' : 'Saving program...'}</div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {phase === 'saved' ? 'Your workouts are ready.' : 'Building your workout schedule...'}
          </div>
        </div>
      </div>
    )
  }

  // ── Pick split ──────────────────────────────────────────
  if (phase === 'pick_split') {
    return (
      <div style={PAGE}>
        <div style={HDR}>
          <button onClick={() => setPhase('home')} style={BTN}>← Back</button>
          <div style={HTITLE}>Choose a split</div>
        </div>
        <div style={BODY}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
            Exercises will be auto-selected based on your equipment and experience level.
          </div>
          {SPLIT_TEMPLATES.filter(t => t.days.length > 0).map(template => (
            <div
              key={template.split_type}
              onClick={() => handleSelectTemplate(template)}
              style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px', marginBottom: '10px', cursor: 'pointer', transition: 'border-color 0.15s' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, color: '#085041' }}>
                  {SPLIT_ICONS[template.split_type] ?? '◎'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{template.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px', lineHeight: 1.5 }}>{template.description}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <span style={{ fontSize: '11px', background: '#E6F1FB', color: '#185FA5', padding: '2px 8px', borderRadius: '8px' }}>{template.days_per_week} days/week</span>
                    <span style={{ fontSize: '11px', background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: '8px' }}>{template.best_for}</span>
                  </div>
                </div>
                <div style={{ color: '#d1d5db', fontSize: '18px' }}>›</div>
              </div>
            </div>
          ))}

          {generating && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280', fontSize: '14px' }}>
              Generating your program...
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Home ────────────────────────────────────────────────
  return (
    <div style={PAGE}>
      <div style={HDR}>
        <button onClick={onBack} style={BTN}>← Back</button>
        <div style={HTITLE}>Programs</div>
      </div>
      <div style={BODY}>

        {/* Active program */}
        {activeProgram ? (
          <>
            <div style={{ background: '#E1F5EE', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#0F6E56', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Active program</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#085041', marginTop: '2px' }}>{activeProgram.name}</div>
                <div style={{ fontSize: '12px', color: '#0F6E56', marginTop: '2px' }}>{activeProgram.days.length} workout days</div>
              </div>
              <button onClick={deactivateProgram} style={{ fontSize: '11px', color: '#ef4444', background: 'transparent', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                Remove
              </button>
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
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f9fafb' }}>
                        <div style={{ fontSize: '13px', color: '#111827' }}>{ex.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{ex.sets} × {ex.min_reps}–{ex.max_reps}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => setPhase('pick_split')}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '14px', color: '#374151', cursor: 'pointer', marginTop: '8px' }}
            >
              Switch program
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', padding: '32px 0 24px', color: '#9ca3af' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>No active program</div>
              <div style={{ fontSize: '13px', lineHeight: 1.6 }}>Choose a split and we'll generate a workout plan based on your gym equipment and experience level.</div>
            </div>
            <button
              onClick={() => setPhase('pick_split')}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1D9E75', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              Choose a program
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const PAGE: React.CSSProperties = { minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '32px' }
const HDR: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }
const HTITLE: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: '#111827', flex: 1 }
const BODY: React.CSSProperties = { padding: '20px 16px', maxWidth: '560px', margin: '0 auto' }
const BTN: React.CSSProperties = { padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', color: '#374151', cursor: 'pointer' }