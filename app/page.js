"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  GraduationCap,
  Trophy,
  Clock,
  CheckCircle2,
  Circle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles,
  Medal,
  Award,
  User,
  BookOpen,
  Hash,
  LogIn,
  RotateCw,
} from "lucide-react";

const PID_KEY = "fq_participant_id";
const STARTED_KEY = "fq_local_started_at";

function fmtTime(sec) {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// ---------- LANDING ----------
function Landing({ onEnter, quizTitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass rounded-3xl p-8 md:p-12 max-w-3xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-lg shadow-purple-500/40"
        >
          <GraduationCap className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent mb-3">
          {quizTitle || "Freshers' Quiz Challenge"}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          College Orientation 2025 &middot; Test your knowledge &middot; Win
          amazing prizes
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
          <div className="glass rounded-xl p-4">
            <Clock className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <div className="font-semibold">10 Minutes</div>
            <div className="text-muted-foreground text-xs">Time Limit</div>
          </div>
          <div className="glass rounded-xl p-4">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-pink-400" />
            <div className="font-semibold">Live Quiz</div>
            <div className="text-muted-foreground text-xs">
              Server-Synced Timer
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <div className="font-semibold">Top 3 Wins</div>
            <div className="text-muted-foreground text-xs">
              Fastest & Highest Score
            </div>
          </div>
        </div>
        <Button
          size="lg"
          onClick={onEnter}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-6 h-auto rounded-xl shadow-lg shadow-purple-500/40"
        >
          Enter Quiz <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="text-xs text-muted-foreground mt-6">
          One attempt only &middot; No login required &middot; Good luck!
        </p>
      </motion.div>
    </div>
  );
}

// ---------- REGISTER ----------
function Register({ onRegistered }) {
  const [form, setForm] = useState({ name: "", course: "", usn: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.course.trim()) {
      toast.error("Name and course are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      localStorage.setItem(PID_KEY, data.participant.id);
      toast.success("Registered! Get ready for the quiz.");
      onRegistered(data.participant);
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 md:p-10 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Register</h2>
            <p className="text-sm text-muted-foreground">
              Enter your details to join
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="mb-2 block">
              <User className="w-4 h-4 inline mr-1" />
              Full Name *
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              className="h-11"
              required
            />
          </div>
          <div>
            <Label className="mb-2 block">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Course / Department *
            </Label>
            <Input
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              placeholder="B.Tech CSE"
              className="h-11"
              required
            />
          </div>
          <div>
            <Label className="mb-2 block">
              <Hash className="w-4 h-4 inline mr-1" />
              USN / Roll Number (Optional)
            </Label>
            <Input
              value={form.usn}
              onChange={(e) => setForm({ ...form, usn: e.target.value })}
              placeholder="1AB25CS001"
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {loading ? "Registering..." : "Continue to Quiz"}{" "}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// ---------- WAITING ----------
function Waiting({ participant, onStart }) {
  useEffect(() => {
    const iv = setInterval(async () => {
      const res = await fetch("/api/quiz");
      const data = await res.json();
      if (data.quiz?.status === "running") {
        onStart(data);
        clearInterval(iv);
      } else if (data.quiz?.status === "ended") {
        onStart(data);
        clearInterval(iv);
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [onStart]);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-3xl p-10 max-w-md text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-6 border-4 border-purple-500 border-t-transparent rounded-full"
        />
        <h2 className="text-2xl font-bold mb-2">
          Waiting for quiz to start...
        </h2>
        <p className="text-muted-foreground mb-4">
          Hi{" "}
          <span className="text-purple-300 font-semibold">
            {participant.name}
          </span>
          , please stay on this page.
        </p>
        <p className="text-sm text-muted-foreground">
          The quiz will begin automatically when the admin starts it.
        </p>
      </motion.div>
    </div>
  );
}

// ---------- QUIZ ----------
function QuizView({ participant, quiz, questions: initialQs, onSubmit }) {
  const [questions] = useState(initialQs);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const submittedRef = useRef(false);

  // compute end time from server started_at + duration
  useEffect(() => {
    if (!quiz?.started_at) return;
    const start = new Date(quiz.started_at).getTime();
    const end = start + quiz.duration_minutes * 60 * 1000;
    const tick = () =>
      setRemaining(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 500);
    return () => clearInterval(iv);
  }, [quiz]);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: participant.id }),
    });
    const data = await res.json();
    onSubmit(data.result);
  }, [participant.id, onSubmit]);

  useEffect(() => {
    if (remaining === 0 && quiz?.started_at) doSubmit();
  }, [remaining, quiz, doSubmit]);

  // Warn before leaving + disable copy/paste/right-click
  useEffect(() => {
    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const noCopy = (e) => e.preventDefault();
    const noRight = (e) => e.preventDefault();
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("copy", noCopy);
    document.addEventListener("cut", noCopy);
    document.addEventListener("paste", noCopy);
    document.addEventListener("contextmenu", noRight);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("copy", noCopy);
      document.removeEventListener("cut", noCopy);
      document.removeEventListener("paste", noCopy);
      document.removeEventListener("contextmenu", noRight);
    };
  }, []);

  const saveAnswer = async (questionId, idx, mark = null) => {
    setSaving(true);
    await fetch("/api/quiz/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant_id: participant.id,
        question_id: questionId,
        selected_index: idx,
        marked: mark,
      }),
    });
    setSaving(false);
  };

  const selectOption = (idx) => {
    const q = questions[current];
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
    saveAnswer(q.id, idx);
  };

  const toggleMark = () => {
    const q = questions[current];
    const isMarked = marked.has(q.id);
    const newMarked = new Set(marked);
    if (isMarked) newMarked.delete(q.id);
    else newMarked.add(q.id);
    setMarked(newMarked);
    saveAnswer(q.id, answers[q.id] ?? null, !isMarked);
  };

  const q = questions[current];
  if (!q)
    return <div className="text-center p-10">No questions available.</div>;

  const answeredCount = Object.keys(answers).length;
  const progress = ((current + 1) / questions.length) * 100;
  const timeLow = remaining < 60;

  return (
    <div className="min-h-screen p-4 no-select">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto glass rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold">{participant.name}</div>
            <div className="text-xs text-muted-foreground">
              {participant.course}
            </div>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${timeLow ? "bg-red-500/20 text-red-300 animate-pulse" : "bg-purple-500/20 text-purple-300"}`}
        >
          <Clock className="w-5 h-5" /> {fmtTime(remaining)}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">
            {answeredCount}/{questions.length} answered
          </Badge>
          {saving && (
            <Badge className="bg-green-500/20 text-green-300">Saving...</Badge>
          )}
          {!saving && (
            <Badge className="bg-green-500/20 text-green-300">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Auto-saved
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto mb-4">
        <Progress value={progress} className="h-2" />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Question */}
        <Card className="glass p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-purple-500/20 text-purple-300">
              Question {current + 1} of {questions.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMark}
              className={marked.has(q.id) ? "text-yellow-400" : ""}
            >
              <Flag className="w-4 h-4 mr-1" />{" "}
              {marked.has(q.id) ? "Marked" : "Mark for Review"}
            </Button>
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-6 leading-relaxed">
            {q.question_text}
          </h2>
          {q.image_url && (
            <img
              src={q.image_url}
              alt=""
              className="rounded-lg mb-6 max-h-64 mx-auto"
            />
          )}
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              const selected = answers[q.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => selectOption(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selected ? "border-purple-500 bg-purple-500/20" : "border-white/10 hover:border-white/30 hover:bg-white/5"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${selected ? "bg-purple-500 text-white" : "bg-white/10"}`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1">{opt}</span>
                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            {current === questions.length - 1 ? (
              <Button
                onClick={() => setShowConfirm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500"
              >
                <Send className="w-4 h-4 mr-1" /> Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setCurrent((c) => Math.min(questions.length - 1, c + 1))
                }
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </Card>

        {/* Palette */}
        <Card className="glass p-4 h-fit">
          <h3 className="font-bold mb-3">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {questions.map((qq, i) => {
              const isAns = answers[qq.id] !== undefined;
              const isMark = marked.has(qq.id);
              const isCur = i === current;
              let cls = "bg-white/10 text-white";
              if (isAns && isMark) cls = "bg-purple-500 text-white";
              else if (isAns) cls = "bg-green-500 text-white";
              else if (isMark) cls = "bg-yellow-500 text-white";
              if (isCur) cls += " ring-2 ring-white";
              return (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold ${cls}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/10" /> Not Answered
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500" /> Marked
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500" /> Answered +
              Marked
            </div>
          </div>
          <Button
            onClick={() => setShowConfirm(true)}
            className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500"
          >
            <Send className="w-4 h-4 mr-1" /> Submit Quiz
          </Button>
        </Card>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>Submit Quiz?</DialogTitle>
            <DialogDescription>
              You have answered{" "}
              <span className="font-bold text-purple-300">{answeredCount}</span>{" "}
              out of <span className="font-bold">{questions.length}</span>{" "}
              questions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={doSubmit}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              Submit Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- RESULTS ----------
function Results({ result, onLeaderboard }) {
  const pct = result?.percentage ?? 0;
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass rounded-3xl p-8 md:p-10 max-w-2xl w-full"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
            Quiz Submitted!
          </h1>
          <p className="text-muted-foreground">
            Great job, {result?.participant_name || "Champion"}!
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-green-400">
              {result?.correct ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Correct</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-red-400">
              {result?.wrong ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Wrong</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-purple-400">
              {result?.score ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Score</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-yellow-400">{pct}%</div>
            <div className="text-xs text-muted-foreground mt-1">Percentage</div>
          </div>
        </div>
        <div className="glass rounded-xl p-4 mb-6 text-sm text-center">
          <div className="text-muted-foreground">
            Time taken:{" "}
            <span className="text-white font-bold">
              {fmtTime(result?.time_taken_seconds || 0)}
            </span>{" "}
            &middot; Submitted at{" "}
            <span className="text-white font-mono">
              {new Date(result?.submission_time).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <Button
          onClick={onLeaderboard}
          className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500"
        >
          <Trophy className="w-5 h-5 mr-2" /> View Leaderboard
        </Button>
      </motion.div>
    </div>
  );
}

// ---------- LEADERBOARD + WINNERS ----------
function Confetti() {
  const colors = [
    "#a855f7",
    "#ec4899",
    "#3b82f6",
    "#f59e0b",
    "#10b981",
    "#ef4444",
  ];
  return (
    <>
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            background: colors[i % colors.length],
            animationDuration: `${3 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </>
  );
}

function Leaderboard({ myResult, onRestart }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/leaderboard");
      const d = await res.json();
      setData(d.leaderboard || []);
      setLoading(false);
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3, 20);
  const myRank = data.find(
    (r) => r.participant_id === myResult?.participant_id,
  )?.rank;

  return (
    <div className="min-h-screen p-4 relative">
      {top3.length > 0 && <Confetti />}
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-4"
        >
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Congratulations to all participants!
          </p>
          {myRank && (
            <Badge className="mt-3 bg-purple-500/30 text-purple-100 text-base px-4 py-1">
              Your Rank: #{myRank}
            </Badge>
          )}
        </motion.div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            Loading leaderboard...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            No submissions yet. Be the first!
          </div>
        ) : (
          <>
            {/* Winners Podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[1, 0, 2].map((pos) => {
                  const p = top3[pos];
                  if (!p) return <div key={pos} />;
                  const trophies = ["🥇", "🥈", "🥉"];
                  const gradients = [
                    "from-yellow-400 to-yellow-600",
                    "from-gray-300 to-gray-500",
                    "from-orange-400 to-orange-600",
                  ];
                  const heights = ["md:mt-0", "md:mt-8", "md:mt-12"];
                  return (
                    <motion.div
                      key={p.participant_id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: pos * 0.15 }}
                      className={`glass-strong rounded-2xl p-6 text-center ${heights[pos]}`}
                    >
                      <div className="text-5xl mb-2">{trophies[pos]}</div>
                      <div
                        className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${gradients[pos]} text-black font-bold text-sm mb-3`}
                      >
                        RANK #{pos + 1}
                      </div>
                      <div className="font-bold text-lg truncate">
                        {p.participant_name}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        {p.participant_course}
                      </div>
                      <div className="text-4xl font-black text-purple-300">
                        {p.score}
                        <span className="text-lg text-muted-foreground">
                          /{p.total}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {fmtTime(p.time_taken_seconds)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <Card className="glass overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs uppercase text-muted-foreground">
                        <th className="p-3">Rank</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Course</th>
                        <th className="p-3 text-right">Score</th>
                        <th className="p-3 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rest.map((r) => (
                        <tr
                          key={r.participant_id}
                          className={`border-b border-white/5 ${r.participant_id === myResult?.participant_id ? "bg-purple-500/10" : ""}`}
                        >
                          <td className="p-3 font-bold">#{r.rank}</td>
                          <td className="p-3">{r.participant_name}</td>
                          <td className="p-3 text-muted-foreground text-sm">
                            {r.participant_course}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-purple-300">
                            {r.score}/{r.total}
                          </td>
                          <td className="p-3 text-right text-muted-foreground font-mono text-sm">
                            {fmtTime(r.time_taken_seconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
        <div className="text-center mt-8">
          <Button variant="outline" onClick={onRestart}>
            <RotateCw className="w-4 h-4 mr-1" /> Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- MAIN APP ----------
function App() {
  const [view, setView] = useState("loading"); // loading|landing|register|waiting|quiz|results|leaderboard
  const [participant, setParticipant] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);

  // Initial load: check quiz + participant
  useEffect(() => {
    (async () => {
      const qres = await fetch("/api/quiz");
      const qdata = await qres.json();
      setQuiz(qdata.quiz);
      const pid =
        typeof window !== "undefined" ? localStorage.getItem(PID_KEY) : null;
      if (pid) {
        const pres = await fetch(`/api/participants/${pid}`);
        if (pres.ok) {
          const pdata = await pres.json();
          setParticipant(pdata.participant);
          if (pdata.result) {
            setResult(pdata.result);
            setView("results");
            return;
          }
          if (qdata.quiz?.status === "running") {
            await loadQuiz(pdata.participant, qdata.quiz);
            return;
          }
          if (qdata.quiz?.status === "ended") {
            setView("landing");
            return;
          }
          setView("waiting");
          return;
        } else {
          localStorage.removeItem(PID_KEY);
        }
      }
      setView("landing");
    })();
  }, []);

  const loadQuiz = async (p, q) => {
    const res = await fetch("/api/quiz/questions");
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions);
      setParticipant(p);
      setQuiz(q);
      setView("quiz");
    }
  };

  const onEnter = () => setView("register");
  const onRegistered = async (p) => {
    setParticipant(p);
    const qres = await fetch("/api/quiz");
    const qdata = await qres.json();
    setQuiz(qdata.quiz);
    if (qdata.quiz?.status === "running") await loadQuiz(p, qdata.quiz);
    else setView("waiting");
  };
  const onStart = async (qdata) => {
    if (qdata.quiz?.status === "running")
      await loadQuiz(participant, qdata.quiz);
  };
  const onSubmit = (r) => {
    setResult(r);
    setView("results");
  };
  const restart = () => setView("landing");

  if (view === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (view === "landing")
    return <Landing onEnter={onEnter} quizTitle={quiz?.title} />;
  if (view === "register") return <Register onRegistered={onRegistered} />;
  if (view === "waiting")
    return <Waiting participant={participant} onStart={onStart} />;
  if (view === "quiz")
    return (
      <QuizView
        participant={participant}
        quiz={quiz}
        questions={questions}
        onSubmit={onSubmit}
      />
    );
  if (view === "results")
    return (
      <Results result={result} onLeaderboard={() => setView("leaderboard")} />
    );
  if (view === "leaderboard")
    return <Leaderboard myResult={result} onRestart={restart} />;
  return null;
}

export default App;
