'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Shield, Play, Square, RotateCcw, Plus, Pencil, Trash2, Users, FileText, Trophy, LogOut, Upload, Download, Timer, ListChecks, Home, BarChart3, Copy } from 'lucide-react'

const TOKEN_KEY = 'fq_admin_token'

function api(path, opts = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  return fetch('/api/' + path, { ...opts, headers: { 'Content-Type':'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {}), ...(opts.headers || {}) } })
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    const res = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username, password}) })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || 'Login failed'); setLoading(false); return }
    localStorage.setItem(TOKEN_KEY, data.token)
    toast.success('Welcome, Admin!')
    onLogin()
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} className="glass rounded-3xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4"><Shield className="w-8 h-8 text-white"/></div>
          <h2 className="text-2xl font-bold">Admin Portal</h2>
          <p className="text-sm text-muted-foreground">Sign in to manage the quiz</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><Label className="mb-2 block">Username</Label><Input value={username} onChange={e=>setUsername(e.target.value)} className="h-11" required/></div>
          <div><Label className="mb-2 block">Password</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="h-11" required/></div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-purple-500 to-pink-500">{loading ? 'Signing in...' : 'Sign In'}</Button>
        </form>
      </motion.div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <Card className="glass p-5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} mb-3`}><Icon className="w-5 h-5 text-white"/></div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{label}</div>
    </Card>
  )
}

function QuestionEditor({ open, onOpenChange, question, onSave }) {
  const [q, setQ] = useState({ question_text: '', options: ['','','',''], correct_index: 0, image_url: '' })
  useEffect(() => {
    if (question) setQ({ ...question, image_url: question.image_url || '' })
    else setQ({ question_text: '', options: ['','','',''], correct_index: 0, image_url: '' })
  }, [question, open])
  const save = async () => {
    if (!q.question_text.trim() || q.options.some(o=>!o.trim())) { toast.error('Fill all fields'); return }
    if (question?.id) {
      const res = await api(`admin/questions/${question.id}`, { method:'PUT', body: JSON.stringify(q) })
      if (res.ok) { toast.success('Question updated'); onSave(); onOpenChange(false) }
    } else {
      const res = await api('admin/questions', { method:'POST', body: JSON.stringify(q) })
      if (res.ok) { toast.success('Question added'); onSave(); onOpenChange(false) }
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-2xl">
        <DialogHeader><DialogTitle>{question?.id ? 'Edit' : 'Add'} Question</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label className="mb-2 block">Question</Label><Textarea value={q.question_text} onChange={e=>setQ({...q, question_text:e.target.value})} rows={3}/></div>
          <div><Label className="mb-2 block">Image URL (Optional)</Label><Input value={q.image_url} onChange={e=>setQ({...q, image_url:e.target.value})}/></div>
          <div className="space-y-2">
            <Label>Options (click radio to mark correct)</Label>
            {q.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={q.correct_index===i} onChange={()=>setQ({...q, correct_index:i})} className="w-4 h-4 accent-purple-500"/>
                <span className="w-6 font-bold">{String.fromCharCode(65+i)}</span>
                <Input value={opt} onChange={e=>{ const opts=[...q.options]; opts[i]=e.target.value; setQ({...q, options:opts}) }} placeholder={`Option ${String.fromCharCode(65+i)}`}/>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} className="bg-gradient-to-r from-purple-500 to-pink-500">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BulkUpload({ open, onOpenChange, onSaved }) {
  const [text, setText] = useState('')
  const upload = async () => {
    try {
      // CSV format: question,optionA,optionB,optionC,optionD,correct_letter(A-D)
      // OR JSON array
      let questions = []
      const t = text.trim()
      if (t.startsWith('[')) {
        questions = JSON.parse(t)
      } else {
        const lines = t.split(/\r?\n/).filter(l=>l.trim())
        for (const line of lines) {
          // simple CSV parse (no quoted commas)
          const parts = line.split(',').map(s=>s.trim())
          if (parts.length < 6) continue
          const [qtext, a, b, c, d, correct] = parts
          const letter = (correct || 'A').toUpperCase()
          const idx = { A:0, B:1, C:2, D:3 }[letter] ?? 0
          questions.push({ question_text: qtext, options: [a,b,c,d], correct_index: idx })
        }
      }
      if (questions.length === 0) { toast.error('No valid questions found'); return }
      const res = await api('admin/questions/bulk', { method:'POST', body: JSON.stringify({ questions }) })
      const data = await res.json()
      if (res.ok) { toast.success(`${data.inserted} questions added`); onSaved(); onOpenChange(false); setText('') }
      else toast.error(data.error || 'Upload failed')
    } catch (e) { toast.error('Parse error: ' + e.message) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Questions</DialogTitle>
          <DialogDescription>
            Paste CSV: <code className="text-purple-300">question,optionA,optionB,optionC,optionD,correct(A/B/C/D)</code> — one per line.
          </DialogDescription>
        </DialogHeader>
        <Textarea value={text} onChange={e=>setText(e.target.value)} rows={10} placeholder="What is 2+2?,1,2,3,4,D" className="font-mono text-sm"/>
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={upload} className="bg-gradient-to-r from-purple-500 to-pink-500"><Upload className="w-4 h-4 mr-1"/> Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Dashboard({ onLogout }) {
  const [stats, setStats] = useState({ participants: 0, submissions: 0, questions: 0, quiz: null })
  const [questions, setQuestions] = useState([])
  const [participants, setParticipants] = useState([])
  const [results, setResults] = useState([])
  const [editing, setEditing] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [duration, setDuration] = useState(10)
  const [title, setTitle] = useState('')

  const loadAll = async () => {
    const [s, q, p, r] = await Promise.all([
      api('admin/stats').then(r=>r.json()),
      api('admin/questions').then(r=>r.json()),
      api('admin/participants').then(r=>r.json()),
      api('admin/results').then(r=>r.json()),
    ])
    setStats(s)
    setQuestions(q.questions || [])
    setParticipants(p.participants || [])
    setResults(r.results || [])
    if (s.quiz) { setDuration(s.quiz.duration_minutes); setTitle(s.quiz.title) }
  }
  useEffect(() => { loadAll(); const iv = setInterval(loadAll, 5000); return ()=>clearInterval(iv) }, [])

  const startQuiz = async () => {
    if (questions.length === 0) { toast.error('Add at least one question first'); return }
    const res = await api('admin/quiz/start', { method:'POST' }); if (res.ok) { toast.success('Quiz started!'); loadAll() }
  }
  const endQuiz = async () => { const res = await api('admin/quiz/end', { method:'POST' }); if (res.ok) { toast.success('Quiz ended'); loadAll() } }
  const resetQuiz = async () => {
    if (!confirm('This will DELETE all participants and results. Continue?')) return
    const res = await api('admin/quiz/reset', { method:'POST' }); if (res.ok) { toast.success('Quiz reset'); loadAll() }
  }
  const updateDuration = async () => { const res = await api('admin/quiz/duration', { method:'POST', body: JSON.stringify({ duration_minutes: Number(duration) }) }); if (res.ok) { toast.success('Duration updated'); loadAll() } }
  const updateTitle = async () => { const res = await api('admin/quiz/title', { method:'POST', body: JSON.stringify({ title }) }); if (res.ok) { toast.success('Title updated'); loadAll() } }

  const delQuestion = async (id) => {
    if (!confirm('Delete this question?')) return
    const res = await api(`admin/questions/${id}`, { method:'DELETE' }); if (res.ok) { toast.success('Deleted'); loadAll() }
  }

  const exportCSV = () => {
    const header = 'Rank,Name,Course,USN,Score,Total,Percentage,TimeTakenSec,SubmittedAt'
    const sorted = [...results].sort((a,b) => b.score - a.score || a.time_taken_seconds - b.time_taken_seconds)
    const rows = sorted.map((r,i) => {
      const p = participants.find(x => x.id === r.participant_id)
      return [i+1, r.participant_name, r.participant_course, p?.usn || '', r.score, r.total, r.percentage, r.time_taken_seconds, r.submission_time].join(',')
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `results-${Date.now()}.csv`; a.click()
  }
  const exportParticipants = () => {
    const csv = 'Name,Course,USN,RegisteredAt\n' + participants.map(p => `${p.name},${p.course},${p.usn||''},${p.created_at}`).join('\n')
    const blob = new Blob([csv], { type:'text/csv' }); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=`participants-${Date.now()}.csv`; a.click()
  }

  const quiz = stats.quiz
  const status = quiz?.status || 'idle'

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto glass rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Shield className="w-5 h-5 text-white"/></div>
          <div><div className="font-bold">Admin Dashboard</div><div className="text-xs text-muted-foreground">{quiz?.title}</div></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={status==='running' ? 'bg-green-500/30 text-green-200' : status==='ended' ? 'bg-red-500/30 text-red-200' : 'bg-yellow-500/30 text-yellow-200'}>
            {status.toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}><Home className="w-4 h-4"/></Button>
          <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="w-4 h-4"/></Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Participants" value={stats.participants} gradient="from-blue-500 to-cyan-500"/>
          <StatCard icon={FileText} label="Submissions" value={stats.submissions} gradient="from-purple-500 to-pink-500"/>
          <StatCard icon={ListChecks} label="Questions" value={stats.questions} gradient="from-green-500 to-emerald-500"/>
          <StatCard icon={BarChart3} label="Status" value={status} gradient="from-orange-500 to-red-500"/>
        </div>

        {/* Quiz Control */}
        <Card className="glass p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Timer className="w-5 h-5"/> Quiz Control</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <Button onClick={startQuiz} disabled={status==='running'} className="bg-gradient-to-r from-green-500 to-emerald-500"><Play className="w-4 h-4 mr-1"/> Start Quiz</Button>
            <Button onClick={endQuiz} disabled={status!=='running'} className="bg-gradient-to-r from-red-500 to-orange-500"><Square className="w-4 h-4 mr-1"/> End Quiz</Button>
            <Button onClick={resetQuiz} variant="outline"><RotateCcw className="w-4 h-4 mr-1"/> Reset (clear all)</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1"><Label className="mb-2 block">Duration (minutes)</Label><Input type="number" min={1} value={duration} onChange={e=>setDuration(e.target.value)}/></div>
              <Button onClick={updateDuration}>Update</Button>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1"><Label className="mb-2 block">Quiz Title</Label><Input value={title} onChange={e=>setTitle(e.target.value)}/></div>
              <Button onClick={updateTitle}>Update</Button>
            </div>
          </div>
          {quiz?.started_at && <div className="mt-3 text-sm text-muted-foreground">Started: {new Date(quiz.started_at).toLocaleString()}</div>}
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="questions">
          <TabsList className="glass">
            <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="participants">Participants ({participants.length})</TabsTrigger>
            <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <Card className="glass p-5">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h3 className="font-bold">Questions</h3>
                <div className="flex gap-2">
                  <Button onClick={()=>{setEditing(null); setEditorOpen(true)}} className="bg-gradient-to-r from-purple-500 to-pink-500"><Plus className="w-4 h-4 mr-1"/> Add Question</Button>
                  <Button onClick={()=>setBulkOpen(true)} variant="outline"><Upload className="w-4 h-4 mr-1"/> Bulk Upload</Button>
                </div>
              </div>
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={q.id} className="glass rounded-lg p-3 flex items-start gap-3">
                    <Badge className="bg-purple-500/30 text-purple-200 mt-0.5">Q{i+1}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{q.question_text}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Correct: <span className="text-green-400 font-semibold">{String.fromCharCode(65 + q.correct_index)}) {q.options[q.correct_index]}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={()=>{setEditing(q); setEditorOpen(true)}}><Pencil className="w-4 h-4"/></Button>
                    <Button size="sm" variant="ghost" onClick={()=>delQuestion(q.id)}><Trash2 className="w-4 h-4 text-red-400"/></Button>
                  </div>
                ))}
                {questions.length === 0 && <div className="text-center py-8 text-muted-foreground">No questions yet</div>}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="participants">
            <Card className="glass p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Participants</h3>
                <Button onClick={exportParticipants} variant="outline" size="sm"><Download className="w-4 h-4 mr-1"/> Download CSV</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/10 text-xs uppercase text-muted-foreground text-left"><th className="p-2">Name</th><th className="p-2">Course</th><th className="p-2">USN</th><th className="p-2">Registered</th></tr></thead>
                  <tbody>
                    {participants.map(p => (
                      <tr key={p.id} className="border-b border-white/5"><td className="p-2">{p.name}</td><td className="p-2">{p.course}</td><td className="p-2 text-muted-foreground">{p.usn||'-'}</td><td className="p-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td></tr>
                    ))}
                    {participants.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-muted-foreground">No participants yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card className="glass p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Results & Leaderboard</h3>
                <Button onClick={exportCSV} variant="outline" size="sm"><Download className="w-4 h-4 mr-1"/> Export CSV</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/10 text-xs uppercase text-muted-foreground text-left"><th className="p-2">Rank</th><th className="p-2">Name</th><th className="p-2">Course</th><th className="p-2">Score</th><th className="p-2">%</th><th className="p-2">Time</th></tr></thead>
                  <tbody>
                    {[...results].sort((a,b)=>b.score-a.score || a.time_taken_seconds-b.time_taken_seconds).map((r, i) => (
                      <tr key={r.id} className="border-b border-white/5"><td className="p-2 font-bold">#{i+1}</td><td className="p-2">{r.participant_name}</td><td className="p-2 text-muted-foreground">{r.participant_course}</td><td className="p-2 font-mono text-purple-300 font-bold">{r.score}/{r.total}</td><td className="p-2">{r.percentage}%</td><td className="p-2 text-muted-foreground font-mono">{Math.floor(r.time_taken_seconds/60)}:{String(r.time_taken_seconds%60).padStart(2,'0')}</td></tr>
                    ))}
                    {results.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-muted-foreground">No submissions yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <QuestionEditor open={editorOpen} onOpenChange={setEditorOpen} question={editing} onSave={loadAll}/>
      <BulkUpload open={bulkOpen} onOpenChange={setBulkOpen} onSaved={loadAll}/>
    </div>
  )
}

function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(null)
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setLoggedIn(false); return }
    // verify token
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` }}).then(r => {
      if (r.ok) setLoggedIn(true); else { localStorage.removeItem(TOKEN_KEY); setLoggedIn(false) }
    })
  }, [])
  if (loggedIn === null) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setLoggedIn(false) }
  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)}/>
  return <Dashboard onLogout={logout}/>
}

export default AdminApp
