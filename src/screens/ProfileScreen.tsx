import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../lib/auth'

interface Props { onBack: () => void }

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

type Section = 'main' | 'edit_profile' | 'edit_equipment' | 'body_log'

export default function ProfileScreen({ onBack }: Props) {
  const { user } = useAuth()
  const [section, setSection] = useState<Section>('main')
  const [profile, setProfile] = useState<Profile>({ full_name:'', goal:'', experience_level:'', training_days_per_week:3, session_length_minutes:60, injury_notes:'', avatar_url:'' })
  const [equipCats, setEquipCats] = useState<EquipmentCategory[]>([])
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [bodyLogs, setBodyLogs] = useState<BodyLog[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [newWeightNotes, setNewWeightNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    if (!user) return
    setLoading(true)
    const [pRes, eRes, bRes] = await Promise.all([
      supabase.from('profiles').select('full_name,goal,experience_level,training_days_per_week,session_length_minutes,injury_notes,avatar_url').eq('id', user.id).single(),
      supabase.from('user_equipment').select('equipment_name').eq('user_id', user.id),
      supabase.from('body_logs').select('id,log_date,weight_kg,notes').eq('user_id', user.id).order('log_date', { ascending: false }).limit(15),
    ])
    if (pRes.data) setProfile({ full_name: pRes.data.full_name??'', goal: pRes.data.goal??'', experience_level: pRes.data.experience_level??'', training_days_per_week: pRes.data.training_days_per_week??3, session_length_minutes: pRes.data.session_length_minutes??60, injury_notes: pRes.data.injury_notes??'', avatar_url: pRes.data.avatar_url??'' })
    const sel = new Set((eRes.data??[]).map(e => e.equipment_name))
    setEquipCats(EQUIPMENT_CATEGORIES.map(c => ({ category: c.category, items: c.items.map(n => ({ name: n, selected: sel.has(n) })) })))
    if (bRes.data) setBodyLogs(bRes.data as BodyLog[])
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
    await supabase.from('profiles').update({ full_name: profile.full_name, goal: profile.goal, experience_level: profile.experience_level, training_days_per_week: profile.training_days_per_week, session_length_minutes: profile.session_length_minutes, injury_notes: profile.injury_notes||null }).eq('id', user.id)
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
    const { data, error } = await supabase.from('body_logs').insert({ user_id: user.id, log_date: new Date().toISOString().split('T')[0], weight_kg: parseFloat(newWeight), notes: newWeightNotes||null }).select().single()
    if (!error && data) { setBodyLogs(p => [data as BodyLog, ...p]); setNewWeight(''); setNewWeightNotes(''); showSaved() }
    setSaving(false)
  }

  function showSaved() { setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 2000) }
  function toggleItem(ci: number, ii: number) { setEquipCats(p => p.map((c,x) => x!==ci?c:{ ...c, items: c.items.map((item,y) => y!==ii?item:{ ...item, selected: !item.selected }) })) }
  function toggleAll(ci: number) { setEquipCats(p => p.map((c,x) => { if(x!==ci) return c; const all = c.items.every(i=>i.selected); return { ...c, items: c.items.map(i=>({ ...i, selected: !all })) } })) }
  function toggleCat(cat: string) { setExpandedCats(p => { const n=new Set(p); n.has(cat)?n.delete(cat):n.add(cat); return n }) }

  const totalSel = equipCats.reduce((s,c) => s+c.items.filter(i=>i.selected).length, 0)
  const goalLabel = GOAL_OPTIONS.find(g=>g.id===profile.goal)?.label??'—'
  const expLabel = EXPERIENCE_OPTIONS.find(e=>e.id===profile.experience_level)?.label??'—'
  const latestWeight = bodyLogs[0]?.weight_kg??null
  const initials = (profile.full_name||user?.email||'U').charAt(0).toUpperCase()

  const P: React.CSSProperties = { minHeight:'100vh', background:'#f9fafb', fontFamily:'system-ui,sans-serif', paddingBottom:'32px' }
  const H: React.CSSProperties = { background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }
  const B: React.CSSProperties = { padding:'20px 16px', maxWidth:'500px', margin:'0 auto' }
  const CARD: React.CSSProperties = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'14px', padding:'16px 18px', marginBottom:'14px' }
  const CT: React.CSSProperties = { fontSize:'13px', fontWeight:600, color:'#111827', margin:0 }
  const FG: React.CSSProperties = { marginBottom:'18px' }
  const LBL: React.CSSProperties = { display:'block', fontSize:'13px', fontWeight:500, color:'#374151', marginBottom:'8px' }
  const INP: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'14px', color:'#111827', boxSizing:'border-box', fontFamily:'system-ui,sans-serif' }
  const OPT: React.CSSProperties = { padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #e5e7eb', cursor:'pointer' }
  const SBTN: React.CSSProperties = { width:'100%', padding:'12px', borderRadius:'10px', background:'#1D9E75', border:'none', color:'#fff', fontSize:'14px', fontWeight:600, cursor:'pointer', marginTop:'8px' }
  const EBTN: React.CSSProperties = { fontSize:'12px', color:'#1D9E75', background:'transparent', border:'none', cursor:'pointer', fontWeight:500 }
  const BTN: React.CSSProperties = { padding:'6px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#fff', fontSize:'13px', color:'#374151', cursor:'pointer' }
  const SM: React.CSSProperties = { fontSize:'12px', color:'#1D9E75', fontWeight:500 }

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif' }}><div style={{ fontSize:'13px', color:'#9ca3af' }}>Loading...</div></div>

  if (section === 'edit_profile') return (
    <div style={P}>
      <div style={H}><button onClick={()=>setSection('main')} style={BTN}>← Back</button><div style={{ fontSize:'16px', fontWeight:600, color:'#111827', flex:1 }}>Edit profile</div>{saveMsg&&<div style={SM}>{saveMsg}</div>}</div>
      <div style={B}>
        <div style={FG}><label style={LBL}>Full name</label><input value={profile.full_name} onChange={e=>setProfile(p=>({...p,full_name:e.target.value}))} style={INP} placeholder="Your name" /></div>
        <div style={FG}><label style={LBL}>Goal</label><div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>{GOAL_OPTIONS.map(g=><div key={g.id} onClick={()=>setProfile(p=>({...p,goal:g.id}))} style={{ ...OPT, borderColor:profile.goal===g.id?'#1D9E75':'#e5e7eb', background:profile.goal===g.id?'#E1F5EE':'#fff' }}><div style={{ display:'flex', alignItems:'center', gap:'10px' }}><div style={{ width:'16px',height:'16px',borderRadius:'50%',border:`2px solid ${profile.goal===g.id?'#1D9E75':'#d1d5db'}`,background:profile.goal===g.id?'#1D9E75':'transparent',flexShrink:0 }}/><span style={{ fontSize:'14px', color:profile.goal===g.id?'#085041':'#111827' }}>{g.label}</span></div></div>)}</div></div>
        <div style={FG}><label style={LBL}>Experience</label><div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>{EXPERIENCE_OPTIONS.map(e=><div key={e.id} onClick={()=>setProfile(p=>({...p,experience_level:e.id}))} style={{ ...OPT, borderColor:profile.experience_level===e.id?'#1D9E75':'#e5e7eb', background:profile.experience_level===e.id?'#E1F5EE':'#fff' }}><div style={{ display:'flex', alignItems:'center', gap:'10px' }}><div style={{ width:'16px',height:'16px',borderRadius:'50%',border:`2px solid ${profile.experience_level===e.id?'#1D9E75':'#d1d5db'}`,background:profile.experience_level===e.id?'#1D9E75':'transparent',flexShrink:0 }}/><span style={{ fontSize:'14px', color:profile.experience_level===e.id?'#085041':'#111827' }}>{e.label}</span></div></div>)}</div></div>
        <div style={FG}><label style={LBL}>Days per week — <strong>{profile.training_days_per_week}</strong></label><input type="range" min="2" max="6" step="1" value={profile.training_days_per_week} onChange={e=>setProfile(p=>({...p,training_days_per_week:Number(e.target.value)}))} style={{ width:'100%', accentColor:'#1D9E75' }} /></div>
        <div style={FG}><label style={LBL}>Session length — <strong>{profile.session_length_minutes} min</strong></label><input type="range" min="30" max="120" step="15" value={profile.session_length_minutes} onChange={e=>setProfile(p=>({...p,session_length_minutes:Number(e.target.value)}))} style={{ width:'100%', accentColor:'#1D9E75' }} /></div>
        <div style={FG}><label style={LBL}>Injury notes <span style={{ fontWeight:400, color:'#9ca3af' }}>(optional)</span></label><textarea value={profile.injury_notes} onChange={e=>setProfile(p=>({...p,injury_notes:e.target.value}))} rows={3} style={{ ...INP, resize:'none' }} placeholder="e.g. Left knee pain" /></div>
        <button onClick={saveProfile} disabled={saving} style={SBTN}>{saving?'Saving...':'Save changes'}</button>
      </div>
    </div>
  )

  if (section === 'edit_equipment') return (
    <div style={P}>
      <div style={H}><button onClick={()=>setSection('main')} style={BTN}>← Back</button><div style={{ fontSize:'16px', fontWeight:600, color:'#111827', flex:1 }}>Equipment ({totalSel} selected)</div>{saveMsg&&<div style={SM}>{saveMsg}</div>}</div>
      <div style={B}>
        <div style={{ fontSize:'13px', color:'#6b7280', marginBottom:'16px' }}>Tap category to expand. Select equipment available at your gym.</div>
        {equipCats.map((cat, ci) => {
          const expanded = expandedCats.has(cat.category)
          const selCount = cat.items.filter(i=>i.selected).length
          const allSel = cat.items.every(i=>i.selected)
          return (
            <div key={cat.category} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', marginBottom:'8px', overflow:'hidden' }}>
              <div onClick={()=>toggleCat(cat.category)} style={{ padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ fontSize:'14px', fontWeight:500, color:'#111827' }}>{cat.category}</div>
                  {selCount>0&&<span style={{ fontSize:'11px', background:'#E1F5EE', color:'#085041', padding:'2px 8px', borderRadius:'10px', fontWeight:500 }}>{selCount}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <button onClick={e=>{e.stopPropagation();toggleAll(ci)}} style={{ fontSize:'11px', color:allSel?'#ef4444':'#1D9E75', background:'transparent', border:'none', cursor:'pointer', fontWeight:500 }}>{allSel?'Clear':'All'}</button>
                  <span style={{ color:'#9ca3af', fontSize:'12px' }}>{expanded?'▲':'▼'}</span>
                </div>
              </div>
              {expanded&&<div style={{ borderTop:'1px solid #f3f4f6', padding:'8px 14px 12px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                  {cat.items.map((item, ii) => (
                    <div key={item.name} onClick={()=>toggleItem(ci,ii)} style={{ padding:'8px 10px', borderRadius:'8px', cursor:'pointer', border:`1.5px solid ${item.selected?'#1D9E75':'#e5e7eb'}`, background:item.selected?'#E1F5EE':'#f9fafb', display:'flex', alignItems:'center', gap:'7px' }}>
                      <div style={{ width:'14px',height:'14px',borderRadius:'3px',border:`2px solid ${item.selected?'#1D9E75':'#d1d5db'}`,background:item.selected?'#1D9E75':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>{item.selected&&<span style={{ color:'#fff',fontSize:'9px' }}>✓</span>}</div>
                      <span style={{ fontSize:'12px', color:item.selected?'#085041':'#374151', lineHeight:1.3 }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>}
            </div>
          )
        })}
        <button onClick={saveEquipment} disabled={saving} style={SBTN}>{saving?'Saving...':`Save (${totalSel} selected)`}</button>
      </div>
    </div>
  )

  if (section === 'body_log') return (
    <div style={P}>
      <div style={H}><button onClick={()=>setSection('main')} style={BTN}>← Back</button><div style={{ fontSize:'16px', fontWeight:600, color:'#111827', flex:1 }}>Body weight log</div></div>
      <div style={B}>
        <div style={CARD}>
          <div style={CT}>Log today's weight</div>
          <div style={{ display:'flex', gap:'10px', margin:'12px 0 8px' }}>
            <input type="number" placeholder="kg" value={newWeight} onChange={e=>setNewWeight(e.target.value)} style={{ ...INP, flex:1 }} />
            <button onClick={addBodyLog} disabled={saving||!newWeight} style={{ padding:'10px 18px', borderRadius:'8px', background:newWeight?'#1D9E75':'#9FE1CB', border:'none', color:'#fff', fontSize:'14px', fontWeight:600, cursor:newWeight?'pointer':'not-allowed' }}>{saving?'...':'Add'}</button>
          </div>
          <input type="text" placeholder="Notes (optional)" value={newWeightNotes} onChange={e=>setNewWeightNotes(e.target.value)} style={{ ...INP, fontSize:'13px' }} />
        </div>
        <div style={CARD}>
          <div style={CT}>History</div>
          {bodyLogs.length===0?<div style={{ textAlign:'center', padding:'20px 0', fontSize:'13px', color:'#9ca3af' }}>No entries yet.</div>:bodyLogs.map((log,i)=>{
            const prev = bodyLogs[i+1]
            const diff = prev ? parseFloat((log.weight_kg - prev.weight_kg).toFixed(1)) : null
            return (
              <div key={log.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f3f4f6' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'8px' }}>
                    <span style={{ fontSize:'16px', fontWeight:600, color:'#111827' }}>{log.weight_kg} kg</span>
                    {diff!==null&&<span style={{ fontSize:'12px', color:diff<0?'#1D9E75':diff>0?'#ef4444':'#9ca3af', fontWeight:500 }}>{diff>0?'+':''}{diff} kg</span>}
                  </div>
                  <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>{new Date(log.log_date).toLocaleDateString('en-MY',{day:'numeric',month:'short',year:'numeric'})}{log.notes?` · ${log.notes}`:''}</div>
                </div>
                <button onClick={()=>{supabase.from('body_logs').delete().eq('id',log.id);setBodyLogs(p=>p.filter(l=>l.id!==log.id))}} style={{ padding:'4px 10px', borderRadius:'6px', border:'1px solid #fee2e2', background:'#fff', color:'#ef4444', fontSize:'12px', cursor:'pointer' }}>Delete</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div style={P}>
      <div style={H}><button onClick={onBack} style={BTN}>← Back</button><div style={{ fontSize:'16px', fontWeight:600, color:'#111827', flex:1 }}>Profile</div>{saveMsg&&<div style={SM}>{saveMsg}</div>}</div>
      <div style={B}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ position:'relative', display:'inline-block' }}>
            {profile.avatar_url?(
              <img src={profile.avatar_url} alt="avatar" style={{ width:'80px', height:'80px', borderRadius:'50%', objectFit:'cover', border:'3px solid #E1F5EE' }} />
            ):(
              <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', fontWeight:700, color:'#085041', border:'3px solid #E1F5EE' }}>{initials}</div>
            )}
            <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{ position:'absolute', bottom:0, right:0, width:'26px', height:'26px', borderRadius:'50%', background:'#1D9E75', border:'2px solid #fff', color:'#fff', fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>{uploading?'…':'+'}</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{ if(e.target.files?.[0]) uploadAvatar(e.target.files[0]) }} />
          </div>
          <div style={{ fontSize:'17px', fontWeight:600, color:'#111827', marginTop:'10px' }}>{profile.full_name||user?.email}</div>
          <div style={{ fontSize:'12px', color:'#9ca3af', marginTop:'2px' }}>{user?.email}</div>
        </div>

        {latestWeight&&<div style={{ background:'#E1F5EE', borderRadius:'12px', padding:'12px 16px', marginBottom:'16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}><div><div style={{ fontSize:'11px', color:'#0F6E56', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.4px' }}>Current weight</div><div style={{ fontSize:'22px', fontWeight:700, color:'#085041', marginTop:'2px' }}>{latestWeight} kg</div></div><button onClick={()=>setSection('body_log')} style={{ fontSize:'12px', color:'#1D9E75', background:'transparent', border:'none', cursor:'pointer', fontWeight:500 }}>Update →</button></div>}

        <div style={CARD}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}><div style={CT}>Training profile</div><button onClick={()=>setSection('edit_profile')} style={EBTN}>Edit</button></div>
          {[['Goal',goalLabel],['Experience',expLabel],['Training days',`${profile.training_days_per_week} days/week`],['Session length',`${profile.session_length_minutes} min`],['Injuries',profile.injury_notes||'None noted']].map(([l,v])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}><span style={{ fontSize:'13px', color:'#6b7280' }}>{l}</span><span style={{ fontSize:'13px', fontWeight:500, color:'#111827', textAlign:'right', maxWidth:'55%' }}>{v}</span></div>
          ))}
        </div>

        <div style={CARD}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}><div style={CT}>Equipment <span style={{ fontWeight:400, color:'#9ca3af' }}>({totalSel} items)</span></div><button onClick={()=>setSection('edit_equipment')} style={EBTN}>Edit</button></div>
          {totalSel===0?<span style={{ fontSize:'13px', color:'#9ca3af' }}>None selected</span>:equipCats.filter(c=>c.items.some(i=>i.selected)).map(c=>(
            <div key={c.category} style={{ marginBottom:'8px' }}>
              <div style={{ fontSize:'11px', fontWeight:500, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'5px' }}>{c.category}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>{c.items.filter(i=>i.selected).map(i=><span key={i.name} style={{ padding:'2px 9px', borderRadius:'20px', fontSize:'11px', background:'#E1F5EE', color:'#085041' }}>{i.name}</span>)}</div>
            </div>
          ))}
        </div>

        <div style={CARD}>
          <div style={CT}>Quick actions</div>
          {[['Log body weight',()=>setSection('body_log')],['Update equipment',()=>setSection('edit_equipment')]].map(([l,a])=>(
            <div key={l as string} onClick={a as ()=>void} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f3f4f6', cursor:'pointer' }}><span style={{ fontSize:'14px', color:'#111827' }}>{l as string}</span><span style={{ color:'#9ca3af', fontSize:'16px' }}>›</span></div>
          ))}
        </div>

        <button onClick={()=>signOut()} style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #fee2e2', background:'#fff', color:'#ef4444', fontSize:'14px', fontWeight:500, cursor:'pointer', marginTop:'4px' }}>Sign out</button>
      </div>
    </div>
  )
}