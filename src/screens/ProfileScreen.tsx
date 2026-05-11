import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../lib/auth'

interface Props {
  onNavigate: (screen: 'dashboard' | 'programs' | 'analytics' | 'exercises') => void
  activeTab: string
}

interface Profile {
  full_name: string; goal: string; experience_level: string
  training_days_per_week: number; session_length_minutes: number
  injury_notes: string; avatar_url: string
}

interface BodyLog { id: string; log_date: string; weight_kg: number; notes: string }
interface EquipmentItem { name: string; selected: boolean }
interface EquipmentCategory { category: string; items: EquipmentItem[] }

const EQUIPMENT_CATEGORIES: { category: string; items: string[] }[] = [
  { category: 'Free Weight', items: ['Dumbbell','Barbell','EZ Bar','Weight Plate','Kettlebell','Trap Bar / Hex Bar','Safety Squat Bar','Landmine Attachment'] },
  { category: 'Cable Machine', items: ['Cable Pulley','Lat Pulldown Machine','Seated Cable Row','Cable Crossover Machine','Straight Bar Attachment','Rope Attachment','V-Bar Attachment','D-Handle','Ankle Strap'] },
  { category: 'Machines', items: ['Chest Press Machine','Pec Deck Machine','Shoulder Press Machine','Lateral Raise Machine','Rear Delt Machine','T-Bar Row Machine','High Row Machine','Low Row Machine','Leg Press Machine','Leg Extension Machine','Leg Curl Machine','Hip Thrust Machine','Hip Abductor Machine','Hip Adductor Machine','Glute Kickback Machine','Calf Raise Machine','Smith Machine','Hack Squat Machine','Assisted Pull-Up / Dip Machine','Glute Ham Developer','Back Extension Bench','Ab Crunch Machine'] },
  { category: 'Benches & Racks', items: ['Flat Bench','Adjustable Bench','Decline Bench','Preacher Curl Bench','Squat Rack','Power Rack','Olympic Rings'] },
  { category: 'Bodyweight', items: ['Pull-Up Bar','Dip Bar',"Captain's Chair",'Parallel Bar'] },
  { category: 'Functional / Accessories', items: ['Resistance Band','Mini Band','TRX / Suspension Trainer','Medicine Ball','Slam Ball','Stability Ball','Battle Rope','Sled / Prowler','Farmer Walk Handles','Sandbag','Plyo Box','Jump Rope'] },
  { category: 'Mobility / Rehab', items: ['Yoga Mat','Foam Roller','Massage Ball','Stretching Strap','Grip Trainer'] },
  { category: 'Cardio', items: ['Treadmill','Curved Treadmill','Stationary Bike','Spin Bike','Elliptical','Stair Climber','Rowing Machine','Air Bike','SkiErg'] },
]

const GOAL_OPTIONS = [
  { id: 'muscle_gain', label: 'Build muscle' },
  { id: 'fat_loss', label: 'Lose fat' },
  { id: 'strength', label: 'Get stronger' },
  { id: 'general_fitness', label: 'General fitness' },
]

const EXPERIENCE_OPTIONS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

type Section =
  | 'main' | 'edit_profile' | 'edit_equipment' | 'body_log'
  | 'settings' | 'settings_account' | 'settings_units'
  | 'settings_theme' | 'settings_notifications' | 'settings_language'
  | 'settings_privacy' | 'settings_help' | 'settings_export'

// ─── Shared Settings Components ──────────────────────────────────────────────

function SettingsScreen({ title, onBack, children }: {
  title: string; onBack: () => void; children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '14px 20px', borderBottom: '0.5px solid #1a1a1a',
        display: 'flex', alignItems: 'center', background: '#0d0d0d', flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: '#1D9E75',
          fontSize: 15, cursor: 'pointer', padding: '0 12px 0 0', fontWeight: 500,
        }}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, color: '#fff', marginRight: 60 }}>
          {title}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
    </div>
  )
}

function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontSize: 12, color: '#555', textTransform: 'uppercase',
        letterSpacing: 1, padding: '16px 20px 8px', background: '#0d0d0d',
      }}>{label}</div>
      <div style={{ background: '#1c1c1e' }}>{children}</div>
    </div>
  )
}

function SettingsRow({ icon, label, value, onPress, danger, last }: {
  icon: string; label: string; value?: string
  onPress: () => void; danger?: boolean; last?: boolean
}) {
  return (
    <div onClick={onPress} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 20px', cursor: 'pointer',
      borderBottom: last ? 'none' : '0.5px solid #1a1a1a',
    }}>
      <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 15, color: danger ? '#ef4444' : '#fff' }}>{label}</span>
      {value && <span style={{ fontSize: 13, color: '#555', marginRight: 4 }}>{value}</span>}
      {!danger && <span style={{ fontSize: 18, color: '#444' }}>›</span>}
    </div>
  )
}

function ToggleRow({ icon, label, value, onChange, last }: {
  icon: string; label: string; value: boolean
  onChange: (v: boolean) => void; last?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 20px', borderBottom: last ? 'none' : '0.5px solid #1a1a1a',
    }}>
      <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 15, color: '#fff' }}>{label}</span>
      <div onClick={() => onChange(!value)} style={{
        width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
        background: value ? '#1D9E75' : '#333', position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  )
}

// ─── ProfileScreen ────────────────────────────────────────────────────────────

export default function ProfileScreen({ onNavigate, activeTab }: Props) {
  const [currentThemeLabel, setCurrentThemeLabel] = useState(() =>
    localStorage.getItem('gerakfit-theme-label') || 'Dark'
  )
  const darkMode = currentThemeLabel === 'Dark' ||
    (currentThemeLabel === 'System Default' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => { document.body.style.background = darkMode ? '#0d0d0d' : '#f9fafb' }, [darkMode])

  const { user } = useAuth()
  const [section, setSection] = useState<Section>('main')
  const [profile, setProfile] = useState<Profile>({ full_name: '', goal: '', experience_level: '', training_days_per_week: 3, session_length_minutes: 60, injury_notes: '', avatar_url: '' })
  const [equipCats, setEquipCats] = useState<EquipmentCategory[]>([])
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [bodyLogs, setBodyLogs] = useState<BodyLog[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [newWeightNotes, setNewWeightNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalSessions: 0, streakDays: 0, totalPRs: 0 })
  const fileRef = useRef<HTMLInputElement>(null)

  // Settings states
  const [notifSettings, setNotifSettings] = useState({
    workoutReminders: false, dailyChallenge: true, achievements: true, weeklySummary: true,
  })
  const [selectedLanguage, setSelectedLanguage] = useState(() =>
    localStorage.getItem('gerakfit-language') || 'English'
  )
  const [weightUnit, setWeightUnit] = useState(() =>
    localStorage.getItem('gerakfit-units') || 'kg'
  )
  const [distanceUnit, setDistanceUnit] = useState(() =>
    localStorage.getItem('gerakfit-distance') || 'km'
  )
  const [measureUnit, setMeasureUnit] = useState(() =>
    localStorage.getItem('gerakfit-measure') || 'cm'
  )
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    if (!user) return
    setLoading(true)
    const [pRes, eRes, bRes, sRes, prRes] = await Promise.all([
      supabase.from('profiles').select('full_name,goal,experience_level,training_days_per_week,session_length_minutes,injury_notes,avatar_url').eq('id', user.id).single(),
      supabase.from('user_equipment').select('equipment_name').eq('user_id', user.id),
      supabase.from('body_logs').select('id,log_date,weight_kg,notes').eq('user_id', user.id).order('log_date', { ascending: false }).limit(15),
      supabase.from('workout_sessions').select('id,workout_date').eq('user_id', user.id).eq('status', 'completed').order('workout_date', { ascending: false }),
      supabase.from('personal_records').select('id').eq('user_id', user.id),
    ])
    if (pRes.data) setProfile({ full_name: pRes.data.full_name ?? '', goal: pRes.data.goal ?? '', experience_level: pRes.data.experience_level ?? '', training_days_per_week: pRes.data.training_days_per_week ?? 3, session_length_minutes: pRes.data.session_length_minutes ?? 60, injury_notes: pRes.data.injury_notes ?? '', avatar_url: pRes.data.avatar_url ?? '' })
    const sel = new Set((eRes.data ?? []).map(e => e.equipment_name))
    setEquipCats(EQUIPMENT_CATEGORIES.map(c => ({ category: c.category, items: c.items.map(n => ({ name: n, selected: sel.has(n) })) })))
    if (bRes.data) setBodyLogs(bRes.data as BodyLog[])
    const sessCount = sRes.data?.length ?? 0
    let streak = 0
    if (sRes.data && sRes.data.length > 0) {
      const uniqueDates = [...new Set(sRes.data.map(s => s.workout_date))].sort().reverse()
      let expected = new Date().toISOString().split('T')[0]
      for (const date of uniqueDates) {
        if (date === expected) {
          streak++
          const d = new Date(date); d.setDate(d.getDate() - 1)
          expected = d.toISOString().split('T')[0]
        } else { break }
      }
    }
    setStats({ totalSessions: sessCount, streakDays: streak, totalPRs: prRes.data?.length ?? 0 })
    setLoading(false)
  }

  async function uploadAvatar(file: File) {
    if (!user) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = data.publicUrl + '?t=' + Date.now()
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      setProfile(p => ({ ...p, avatar_url: url }))
      showSaved()
    } finally { setUploading(false) }
  }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: profile.full_name, goal: profile.goal, experience_level: profile.experience_level, training_days_per_week: profile.training_days_per_week, session_length_minutes: profile.session_length_minutes, injury_notes: profile.injury_notes || null }).eq('id', user.id)
    setSaving(false); showSaved(); setSection('main')
  }

  async function saveEquipment() {
    if (!user) return
    setSaving(true)
    await supabase.from('user_equipment').delete().eq('user_id', user.id)
    const rows = equipCats.flatMap(c => c.items.filter(i => i.selected).map(i => ({ user_id: user.id, equipment_name: i.name, is_available: true })))
    if (rows.length > 0) await supabase.from('user_equipment').insert(rows)
    setSaving(false); showSaved(); setSection('main')
  }

  async function addBodyLog() {
    if (!user || !newWeight) return
    setSaving(true)
    const { data, error } = await supabase.from('body_logs').insert({ user_id: user.id, log_date: new Date().toISOString().split('T')[0], weight_kg: parseFloat(newWeight), notes: newWeightNotes || null }).select().single()
    if (!error && data) { setBodyLogs(p => [data as BodyLog, ...p]); setNewWeight(''); setNewWeightNotes(''); showSaved() }
    setSaving(false)
  }

  function applyTheme(label: string) {
    setCurrentThemeLabel(label)
    localStorage.setItem('gerakfit-theme-label', label)
    if (label === 'Dark') localStorage.setItem('gerakfit-dark', 'true')
    else if (label === 'Light') localStorage.setItem('gerakfit-dark', 'false')
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      localStorage.setItem('gerakfit-dark', prefersDark ? 'true' : 'false')
    }
    window.location.reload()
  }

  function showSaved() { setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 2000) }
  function toggleItem(ci: number, ii: number) { setEquipCats(p => p.map((c, x) => x !== ci ? c : { ...c, items: c.items.map((item, y) => y !== ii ? item : { ...item, selected: !item.selected }) })) }
  function toggleAll(ci: number) { setEquipCats(p => p.map((c, x) => { if (x !== ci) return c; const all = c.items.every(i => i.selected); return { ...c, items: c.items.map(i => ({ ...i, selected: !all })) } })) }
  function toggleCat(cat: string) { setExpandedCats(p => { const n = new Set(p); n.has(cat) ? n.delete(cat) : n.add(cat); return n }) }

  const totalSel = equipCats.reduce((s, c) => s + c.items.filter(i => i.selected).length, 0)
  const goalLabel = GOAL_OPTIONS.find(g => g.id === profile.goal)?.label ?? '—'
  const expLabel = EXPERIENCE_OPTIONS.find(e => e.id === profile.experience_level)?.label ?? '—'
  const latestWeight = bodyLogs[0]?.weight_kg ?? null
  const initials = (profile.full_name || user?.email || 'U').charAt(0).toUpperCase()
  const isSettingsSection = section.startsWith('settings')

  // Styles for full-screen edit sections (no bottom nav)
  const P: React.CSSProperties = { minHeight: '100vh', background: darkMode ? '#0d0d0d' : '#f9fafb', fontFamily: 'system-ui,sans-serif', paddingBottom: '32px' }
  const H: React.CSSProperties = { background: darkMode ? '#1c1c1e' : '#fff', borderBottom: darkMode ? '0.5px solid #2a2a2a' : '0.5px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }
  const B: React.CSSProperties = { padding: '20px 16px', maxWidth: '500px', margin: '0 auto' }
  const CARD: React.CSSProperties = { background: darkMode ? '#1c1c1e' : '#fff', border: darkMode ? '0.5px solid #2a2a2a' : '0.5px solid #e5e7eb', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px' }
  const CT: React.CSSProperties = { fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888888', margin: 0 }
  const FG: React.CSSProperties = { marginBottom: '18px' }
  const LBL: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: darkMode ? '#d1d5db' : '#2a2a2a', marginBottom: '8px' }
  const INP: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `0.5px solid ${darkMode ? '#2a2a2a' : '#e5e7eb'}`, fontSize: '14px', color: darkMode ? '#f9fafb' : '#000000', background: darkMode ? '#141414' : '#fff', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif' }
  const OPT: React.CSSProperties = { padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', cursor: 'pointer' }
  const SBTN: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', background: '#1D9E75', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }
  const EBTN: React.CSSProperties = { fontSize: '12px', color: '#1D9E75', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }
  const BTN: React.CSSProperties = { background: 'none', border: 'none', fontSize: '14px', color: '#666', cursor: 'pointer', padding: '0' }
  const SM: React.CSSProperties = { fontSize: '12px', color: '#1D9E75', fontWeight: 500 }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ fontSize: '13px', color: '#666666' }}>Loading...</div>
    </div>
  )

  // ─── Edit Profile (full-screen, no bottom nav) ─────────────────────────────
  if (section === 'edit_profile') return (
    <div style={P}>
      <div style={H}>
        <button onClick={() => setSection('main')} style={BTN}>← Back</button>
        <div style={{ fontSize: '18px', fontWeight: 800, color: darkMode ? '#f9fafb' : '#111827', flex: 1 }}>Edit profile</div>
        {saveMsg && <div style={SM}>{saveMsg}</div>}
      </div>
      <div style={B}>
        <div style={FG}><label style={LBL}>Full name</label><input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} style={INP} placeholder="Your name" /></div>
        <div style={FG}><label style={LBL}>Goal</label><div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{GOAL_OPTIONS.map(g => <div key={g.id} onClick={() => setProfile(p => ({ ...p, goal: g.id }))} style={{ ...OPT, borderColor: profile.goal === g.id ? '#1D9E75' : '#e5e7eb', background: profile.goal === g.id ? '#E1F5EE' : '#fff' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${profile.goal === g.id ? '#1D9E75' : '#d1d5db'}`, background: profile.goal === g.id ? '#1D9E75' : 'transparent', flexShrink: 0 }} /><span style={{ fontSize: '14px', color: profile.goal === g.id ? '#085041' : '#000000' }}>{g.label}</span></div></div>)}</div></div>
        <div style={FG}><label style={LBL}>Experience</label><div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{EXPERIENCE_OPTIONS.map(e => <div key={e.id} onClick={() => setProfile(p => ({ ...p, experience_level: e.id }))} style={{ ...OPT, borderColor: profile.experience_level === e.id ? '#1D9E75' : '#e5e7eb', background: profile.experience_level === e.id ? '#E1F5EE' : '#fff' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${profile.experience_level === e.id ? '#1D9E75' : '#d1d5db'}`, background: profile.experience_level === e.id ? '#1D9E75' : 'transparent', flexShrink: 0 }} /><span style={{ fontSize: '14px', color: profile.experience_level === e.id ? '#085041' : '#000000' }}>{e.label}</span></div></div>)}</div></div>
        <div style={FG}><label style={LBL}>Days per week — <strong>{profile.training_days_per_week}</strong></label><input type="range" min="2" max="6" step="1" value={profile.training_days_per_week} onChange={e => setProfile(p => ({ ...p, training_days_per_week: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#1D9E75' }} /></div>
        <div style={FG}><label style={LBL}>Session length — <strong>{profile.session_length_minutes} min</strong></label><input type="range" min="30" max="120" step="15" value={profile.session_length_minutes} onChange={e => setProfile(p => ({ ...p, session_length_minutes: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#1D9E75' }} /></div>
        <div style={FG}><label style={LBL}>Injury notes <span style={{ fontWeight: 400, color: darkMode ? '#666666' : '#888888' }}>(optional)</span></label><textarea value={profile.injury_notes} onChange={e => setProfile(p => ({ ...p, injury_notes: e.target.value }))} rows={3} style={{ ...INP, resize: 'none' }} placeholder="e.g. Left knee pain" /></div>
        <button onClick={saveProfile} disabled={saving} style={SBTN}>{saving ? 'Saving...' : 'Save changes'}</button>
      </div>
    </div>
  )

  // ─── Edit Equipment (full-screen, no bottom nav) ────────────────────────────
  if (section === 'edit_equipment') return (
    <div style={P}>
      <div style={H}>
        <button onClick={() => setSection('main')} style={BTN}>← Back</button>
        <div style={{ fontSize: '18px', fontWeight: 800, color: darkMode ? '#f9fafb' : '#111827', flex: 1 }}>Equipment ({totalSel} selected)</div>
        {saveMsg && <div style={SM}>{saveMsg}</div>}
      </div>
      <div style={B}>
        <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#666666', marginBottom: '16px' }}>Tap category to expand. Select equipment available at your gym.</div>
        {equipCats.map((cat, ci) => {
          const expanded = expandedCats.has(cat.category)
          const selCount = cat.items.filter(i => i.selected).length
          const allSel = cat.items.every(i => i.selected)
          return (
            <div key={cat.category} style={{ background: darkMode ? '#1c1c1e' : '#fff', border: darkMode ? '0.5px solid #2a2a2a' : '0.5px solid #e5e7eb', borderRadius: '12px', marginBottom: '8px', overflow: 'hidden' }}>
              <div onClick={() => toggleCat(cat.category)} style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: darkMode ? '#f9fafb' : '#111827' }}>{cat.category}</div>
                  {selCount > 0 && <span style={{ fontSize: '11px', background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: '10px', fontWeight: 500 }}>{selCount}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={e => { e.stopPropagation(); toggleAll(ci) }} style={{ fontSize: '11px', color: allSel ? '#ef4444' : '#1D9E75', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}>{allSel ? 'Clear' : 'All'}</button>
                  <span style={{ color: darkMode ? '#666666' : '#888888', fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
                </div>
              </div>
              {expanded && <div style={{ borderTop: '0.5px solid #f3f4f6', padding: '8px 14px 12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {cat.items.map((item, ii) => (
                    <div key={item.name} onClick={() => toggleItem(ci, ii)} style={{ padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', border: `1.5px solid ${item.selected ? '#1D9E75' : '#e5e7eb'}`, background: item.selected ? '#E1F5EE' : '#f9fafb', display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: `2px solid ${item.selected ? '#1D9E75' : '#d1d5db'}`, background: item.selected ? '#1D9E75' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.selected && <span style={{ color: '#fff', fontSize: '9px' }}>✓</span>}</div>
                      <span style={{ fontSize: '12px', color: item.selected ? '#085041' : '#2a2a2a', lineHeight: 1.3 }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>}
            </div>
          )
        })}
        <button onClick={saveEquipment} disabled={saving} style={SBTN}>{saving ? 'Saving...' : `Save (${totalSel} selected)`}</button>
      </div>
    </div>
  )

  // ─── Body Log (full-screen, no bottom nav) ──────────────────────────────────
  if (section === 'body_log') return (
    <div style={P}>
      <div style={H}>
        <button onClick={() => setSection('main')} style={BTN}>← Back</button>
        <div style={{ fontSize: '18px', fontWeight: 800, color: darkMode ? '#f9fafb' : '#111827', flex: 1 }}>Body weight log</div>
      </div>
      <div style={B}>
        <div style={CARD}>
          <div style={CT}>Log today's weight</div>
          <div style={{ display: 'flex', gap: '10px', margin: '12px 0 8px' }}>
            <input type="number" placeholder="kg" value={newWeight} onChange={e => setNewWeight(e.target.value)} style={{ ...INP, flex: 1 }} />
            <button onClick={addBodyLog} disabled={saving || !newWeight} style={{ padding: '10px 18px', borderRadius: '8px', background: newWeight ? '#1D9E75' : '#9FE1CB', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: newWeight ? 'pointer' : 'not-allowed' }}>{saving ? '...' : 'Add'}</button>
          </div>
          <input type="text" placeholder="Notes (optional)" value={newWeightNotes} onChange={e => setNewWeightNotes(e.target.value)} style={{ ...INP, fontSize: '13px' }} />
        </div>
        <div style={CARD}>
          <div style={CT}>History</div>
          {bodyLogs.length === 0 ? <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '13px', color: darkMode ? '#666666' : '#888888' }}>No entries yet.</div> : bodyLogs.map((log, i) => {
            const prev = bodyLogs[i + 1]
            const diff = prev ? parseFloat((log.weight_kg - prev.weight_kg).toFixed(1)) : null
            return (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: darkMode ? '0.5px solid #2a2a2a' : '0.5px solid #f3f4f6' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: darkMode ? '#f9fafb' : '#111827' }}>{log.weight_kg} kg</span>
                    {diff !== null && <span style={{ fontSize: '12px', color: diff < 0 ? '#1D9E75' : diff > 0 ? '#ef4444' : '#888888', fontWeight: 500 }}>{diff > 0 ? '+' : ''}{diff} kg</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: darkMode ? '#666666' : '#888888', marginTop: '1px' }}>{new Date(log.log_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}{log.notes ? ` · ${log.notes}` : ''}</div>
                </div>
                <button onClick={() => { supabase.from('body_logs').delete().eq('id', log.id); setBodyLogs(p => p.filter(l => l.id !== log.id)) }} style={{ padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #fee2e2', background: darkMode ? '#1c1c1e' : '#fff', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ─── Main layout (main + all settings sections share sticky header + bottom nav) ──

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d0d0d', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* Sticky header — always visible */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0d0d0d', borderBottom: '0.5px solid #1a1a1a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>
          {profile.full_name || user?.email?.split('@')[0]}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setSection('edit_profile')} style={{ background: 'none', border: 'none', color: '#fff', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
          </button>
          <button onClick={() => {
            if (navigator.share) navigator.share({ title: 'GerakFit', text: 'Check out my GerakFit profile!', url: window.location.href })
          }} style={{ background: 'none', border: 'none', color: '#fff', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
          <button onClick={() => setSection('settings')} style={{ background: 'none', border: 'none', color: '#fff', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content area — changes based on section */}
      <div style={{ flex: 1, overflow: isSettingsSection ? 'hidden' : 'auto', padding: isSettingsSection ? 0 : '20px' }}>

        {/* ── Main profile ─────────────────────────────────────── */}
        {section === 'main' && <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1D9E75' }} />
              ) : (
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: '#085041', border: '2px solid #1D9E75' }}>{initials}</div>
              )}
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#1D9E75', border: '2px solid #0d0d0d', color: '#fff', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{uploading ? '…' : '+'}</button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]) }} />
            </div>
            <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
              {[
                { label: 'Workouts', value: stats.totalSessions },
                { label: 'Streak', value: stats.streakDays + 'd' },
                { label: 'PRs', value: stats.totalPRs },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{profile.full_name || user?.email}</div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{user?.email}</div>
            {saveMsg && <div style={{ fontSize: '12px', color: '#1D9E75', fontWeight: 500, marginTop: '4px' }}>{saveMsg}</div>}
          </div>

          {latestWeight && (
            <div style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#666', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current weight</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#1D9E75', marginTop: '2px' }}>{latestWeight} kg</div>
              </div>
              <button onClick={() => setSection('body_log')} style={{ fontSize: '12px', color: '#1D9E75', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Update →</button>
            </div>
          )}

          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', marginTop: '20px' }}>Dashboard</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            {[
              { icon: '📊', label: 'Statistics', action: () => onNavigate('analytics') },
              { icon: '🏋️', label: 'Exercises', action: () => onNavigate('exercises') },
              { icon: '⚖️', label: 'Body Log', action: () => setSection('body_log') },
              { icon: '🔧', label: 'Equipment', action: () => setSection('edit_equipment') },
            ].map(item => (
              <div key={item.label} onClick={item.action} style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '16px 18px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={CT}>Training profile</div>
              <button onClick={() => setSection('edit_profile')} style={EBTN}>Edit</button>
            </div>
            {[['Goal', goalLabel], ['Experience', expLabel], ['Training days', `${profile.training_days_per_week} days/week`], ['Session length', `${profile.session_length_minutes} min`], ['Injuries', profile.injury_notes || 'None noted']].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #2a2a2a' }}>
                <span style={{ fontSize: '13px', color: '#666666' }}>{l}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff', textAlign: 'right', maxWidth: '55%' }}>{v}</span>
              </div>
            ))}
          </div>
        </>}

        {/* ── Settings ─────────────────────────────────────────── */}
        {section === 'settings' && (
          <SettingsScreen title="Settings" onBack={() => setSection('main')}>
            <SettingsGroup label="Account">
              <SettingsRow icon="👤" label="Account Settings" onPress={() => setSection('settings_account')} />
              <SettingsRow icon="✏️" label="Edit Profile" onPress={() => setSection('edit_profile')} />
              <SettingsRow icon="📏" label="Units" value={weightUnit} onPress={() => setSection('settings_units')} />
              <SettingsRow icon="🌙" label="Theme" value={currentThemeLabel} onPress={() => setSection('settings_theme')} />
              <SettingsRow icon="🔔" label="Notifications" onPress={() => setSection('settings_notifications')} />
              <SettingsRow icon="🌐" label="Language" value={selectedLanguage} onPress={() => setSection('settings_language')} last />
            </SettingsGroup>

            <SettingsGroup label="Data">
              <SettingsRow icon="💾" label="Data Backup" onPress={() => console.log('backup')} />
              <SettingsRow icon="📤" label="Export & Import Data" onPress={() => setSection('settings_export')} last />
            </SettingsGroup>

            <SettingsGroup label="Privacy & Security">
              <SettingsRow icon="🔒" label="Privacy" onPress={() => setSection('settings_privacy')} />
              <SettingsRow icon="🔑" label="Update Password" onPress={() => {
                supabase.auth.resetPasswordForEmail(user?.email ?? '')
                alert('Password reset email sent!')
              }} last />
            </SettingsGroup>

            <SettingsGroup label="Help & Support">
              <SettingsRow icon="📖" label="Getting Started Guide" onPress={() => setSection('settings_help')} />
              <SettingsRow icon="❓" label="FAQ" onPress={() => setSection('settings_help')} />
              <SettingsRow icon="💬" label="Contact Support" onPress={() => window.open('mailto:support@gerakfit.com')} />
              <SettingsRow icon="ℹ️" label="About GerakFit" onPress={() => setSection('settings_help')} last />
            </SettingsGroup>

            <SettingsGroup label="Session">
              <SettingsRow icon="🚪" label="Logout" onPress={() => setShowLogoutConfirm(true)} danger last />
            </SettingsGroup>

            {showLogoutConfirm && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 300 }}>
                <div style={{ background: '#1c1c1e', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%' }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Log Out</div>
                    <div style={{ fontSize: 14, color: '#888' }}>Are you sure you want to log out?</div>
                  </div>
                  <button onClick={() => signOut()} style={{ width: '100%', padding: 16, borderRadius: 12, marginBottom: 10, background: '#ef4444', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Log Out</button>
                  <button onClick={() => setShowLogoutConfirm(false)} style={{ width: '100%', padding: 16, borderRadius: 12, background: '#2a2a2a', border: 'none', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </SettingsScreen>
        )}

        {/* ── Account Settings ──────────────────────────────────── */}
        {section === 'settings_account' && (
          <SettingsScreen title="Account Settings" onBack={() => setSection('settings')}>
            <SettingsGroup label="Account">
              <SettingsRow icon="👤" label="Change Username" onPress={() => setSection('edit_profile')} />
              <SettingsRow icon="📧" label="Change Email" onPress={() => alert('Change email coming soon')} />
              <SettingsRow icon="🔑" label="Update Password" onPress={() => {
                supabase.auth.resetPasswordForEmail(user?.email ?? '')
                alert('Password reset email sent to ' + user?.email)
              }} last />
            </SettingsGroup>

            <SettingsGroup label="Danger Zone">
              <SettingsRow icon="🗑️" label="Delete Account" onPress={() => setShowDeleteConfirm(true)} danger last />
            </SettingsGroup>

            {showDeleteConfirm && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
                <div style={{ background: '#1c1c1e', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Delete Account</div>
                  <div style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
                    This action is permanent and cannot be undone. All your data will be deleted.
                  </div>
                  <button onClick={() => signOut()} style={{ width: '100%', padding: 14, borderRadius: 10, marginBottom: 8, background: '#ef4444', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Yes, Delete My Account</button>
                  <button onClick={() => setShowDeleteConfirm(false)} style={{ width: '100%', padding: 14, borderRadius: 10, background: '#2a2a2a', border: 'none', color: '#fff', fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </SettingsScreen>
        )}

        {/* ── Units ─────────────────────────────────────────────── */}
        {section === 'settings_units' && (
          <SettingsScreen title="Units" onBack={() => setSection('settings')}>
            {[
              { label: 'Weight', key: 'weight', options: ['kg', 'lb'], value: weightUnit, onChange: (v: string) => { setWeightUnit(v); localStorage.setItem('gerakfit-units', v) } },
              { label: 'Distance', key: 'distance', options: ['km', 'miles'], value: distanceUnit, onChange: (v: string) => { setDistanceUnit(v); localStorage.setItem('gerakfit-distance', v) } },
              { label: 'Body Measurements', key: 'measure', options: ['cm', 'in'], value: measureUnit, onChange: (v: string) => { setMeasureUnit(v); localStorage.setItem('gerakfit-measure', v) } },
            ].map(group => (
              <div key={group.key} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#555', textTransform: 'uppercase', letterSpacing: 1, padding: '16px 20px 8px' }}>{group.label}</div>
                <div style={{ background: '#1c1c1e' }}>
                  {group.options.map((opt, i) => (
                    <div key={opt} onClick={() => group.onChange(opt)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', borderBottom: i < group.options.length - 1 ? '0.5px solid #1a1a1a' : 'none' }}>
                      <span style={{ fontSize: 15, color: '#fff' }}>{opt}</span>
                      {group.value === opt && <span style={{ color: '#1D9E75', fontSize: 18, fontWeight: 700 }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </SettingsScreen>
        )}

        {/* ── Theme ─────────────────────────────────────────────── */}
        {section === 'settings_theme' && (
          <SettingsScreen title="Theme" onBack={() => setSection('settings')}>
            <div style={{ fontSize: 12, color: '#555', textTransform: 'uppercase', letterSpacing: 1, padding: '16px 20px 8px' }}>Select Theme</div>
            <div style={{ background: '#1c1c1e' }}>
              {['System Default', 'Dark', 'Light'].map((t, i) => (
                <div key={t} onClick={() => applyTheme(t)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', borderBottom: i < 2 ? '0.5px solid #1a1a1a' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{t === 'Dark' ? '🌙' : t === 'Light' ? '☀️' : '📱'}</span>
                    <span style={{ fontSize: 15, color: '#fff' }}>{t}</span>
                  </div>
                  {currentThemeLabel === t && <span style={{ color: '#1D9E75', fontSize: 18, fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#555', padding: '12px 20px', lineHeight: 1.5 }}>
              System Default follows your device appearance setting automatically.
            </div>
          </SettingsScreen>
        )}

        {/* ── Notifications ─────────────────────────────────────── */}
        {section === 'settings_notifications' && (
          <SettingsScreen title="Notifications" onBack={() => setSection('settings')}>
            <div style={{ fontSize: 12, color: '#555', textTransform: 'uppercase', letterSpacing: 1, padding: '16px 20px 8px' }}>Alerts</div>
            <div style={{ background: '#1c1c1e' }}>
              <ToggleRow icon="🏋️" label="Workout Reminders" value={notifSettings.workoutReminders} onChange={v => setNotifSettings(p => ({ ...p, workoutReminders: v }))} />
              <ToggleRow icon="⚔️" label="Daily Challenge Alerts" value={notifSettings.dailyChallenge} onChange={v => setNotifSettings(p => ({ ...p, dailyChallenge: v }))} />
              <ToggleRow icon="🏆" label="Achievement Notifications" value={notifSettings.achievements} onChange={v => setNotifSettings(p => ({ ...p, achievements: v }))} />
              <ToggleRow icon="📊" label="Weekly Summary" value={notifSettings.weeklySummary} onChange={v => setNotifSettings(p => ({ ...p, weeklySummary: v }))} last />
            </div>
          </SettingsScreen>
        )}

        {/* ── Language ──────────────────────────────────────────── */}
        {section === 'settings_language' && (
          <SettingsScreen title="Language" onBack={() => setSection('settings')}>
            <div style={{ fontSize: 12, color: '#555', textTransform: 'uppercase', letterSpacing: 1, padding: '16px 20px 8px' }}>Select Language</div>
            <div style={{ background: '#1c1c1e' }}>
              {[
                { label: 'English', flag: '🇬🇧' },
                { label: 'Bahasa Melayu', flag: '🇲🇾' },
                { label: 'Japanese', flag: '🇯🇵' },
                { label: 'Korean', flag: '🇰🇷' },
                { label: 'Chinese', flag: '🇨🇳' },
              ].map((lang, i) => (
                <div key={lang.label} onClick={() => { setSelectedLanguage(lang.label); localStorage.setItem('gerakfit-language', lang.label) }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', borderBottom: i < 4 ? '0.5px solid #1a1a1a' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{lang.flag}</span>
                    <span style={{ fontSize: 15, color: '#fff' }}>{lang.label}</span>
                  </div>
                  {selectedLanguage === lang.label && <span style={{ color: '#1D9E75', fontSize: 18, fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>
          </SettingsScreen>
        )}

        {/* ── Export & Import ───────────────────────────────────── */}
        {section === 'settings_export' && (
          <SettingsScreen title="Export & Import Data" onBack={() => setSection('settings')}>
            <SettingsGroup label="Export">
              <SettingsRow icon="📤" label="Export Workouts (JSON)" onPress={async () => {
                if (!user) return
                const { data } = await supabase
                  .from('workout_sessions')
                  .select('*, session_exercises(*, exercise_sets(*), exercises(name))')
                  .eq('user_id', user.id)
                  .eq('status', 'completed')
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = 'gerakfit-workouts.json'; a.click()
              }} last />
            </SettingsGroup>
            <SettingsGroup label="Import">
              <SettingsRow icon="📥" label="Import Data" onPress={() => alert('Import coming soon')} last />
            </SettingsGroup>
            <div style={{ fontSize: 12, color: '#555', padding: '12px 20px', lineHeight: 1.5 }}>
              Export your workout history as a JSON file. Import feature coming soon.
            </div>
          </SettingsScreen>
        )}

        {/* ── Privacy ───────────────────────────────────────────── */}
        {section === 'settings_privacy' && (
          <SettingsScreen title="Privacy" onBack={() => setSection('settings')}>
            <SettingsGroup label="Your Data">
              <SettingsRow icon="📋" label="Manage Personal Data" onPress={() => alert('Data management coming soon')} />
              <SettingsRow icon="⬇️" label="Download Personal Data" onPress={async () => {
                if (!user) return
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = 'gerakfit-profile.json'; a.click()
              }} />
              <SettingsRow icon="🗑️" label="Delete Account" onPress={() => { setSection('settings_account'); setShowDeleteConfirm(true) }} danger last />
            </SettingsGroup>
          </SettingsScreen>
        )}

        {/* ── Help & Support ────────────────────────────────────── */}
        {section === 'settings_help' && (
          <SettingsScreen title="Help & Support" onBack={() => setSection('settings')}>
            <SettingsGroup label="Resources">
              <SettingsRow icon="📖" label="Getting Started Guide" onPress={() => alert('Guide coming soon')} />
              <SettingsRow icon="❓" label="Frequently Asked Questions" onPress={() => alert('FAQ coming soon')} />
              <SettingsRow icon="💬" label="Contact Support" onPress={() => window.open('mailto:support@gerakfit.com')} last />
            </SettingsGroup>
            <SettingsGroup label="App Info">
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                  <span style={{ color: '#fff' }}>Gerak</span><span style={{ color: '#1D9E75' }}>Fit</span>
                </div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>Version 1.0.0 (Build 1)</div>
                <div style={{ fontSize: 12, color: '#444', marginBottom: 12 }}>© 2025 GerakFit. All rights reserved.</div>
                <a href="https://gerak-fit.vercel.app" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#1D9E75', textDecoration: 'none' }}>
                  gerak-fit.vercel.app
                </a>
              </div>
            </SettingsGroup>
          </SettingsScreen>
        )}

      </div>

      {/* Bottom tab bar — always visible */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: '#0d0d0d', borderTop: '0.5px solid #1a1a1a', padding: '8px 0 20px', position: 'relative', zIndex: 50 }}>
        <button onClick={() => onNavigate('dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 20px', color: activeTab === 'dashboard' ? '#1D9E75' : '#555555' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 500 }}>Home</span>
        </button>
        <button onClick={() => onNavigate('programs')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 20px', color: activeTab === 'programs' ? '#1D9E75' : '#555555' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4v16M18 4v16M8 4h-4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h4M8 18h-4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h4M16 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4M16 18h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-4M8 12h8"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 500 }}>Workout</span>
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 20px', color: activeTab === 'profile' ? '#1D9E75' : '#555555' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 500 }}>Profile</span>
        </button>
      </div>

    </div>
  )
}
