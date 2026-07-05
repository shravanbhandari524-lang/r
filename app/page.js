"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  Trophy,
  Clock,
  CheckCircle2,
  Circle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  Medal,
  Award,
  User,
  BookOpen,
  Hash,
  LogIn,
  RotateCw,
  XCircle,
  AlertTriangle,
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

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ---------- LANDING ----------
function Landing({ onEnter, quizTitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass stroke-anim rounded-[20px] p-8 md:p-12 max-w-3xl w-full text-center"
      >
        <h1 className="font-display text-[2.9rem] md:text-[5rem] font-normal tracking-wide mb-3 bg-gradient-to-b from-white to-white/55 bg-clip-text text-transparent">
          Quiz Challenge
        </h1>
        <p className="text-base md:text-lg text-muted-foreground mb-8">
          College Orientation 2026 &middot; Test your knowledge &middot; Win
          amazing prizes
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8 text-sm max-w-md mx-auto">
          <div className="glass rounded-xl p-4">
            <Clock className="w-6 h-6 mx-auto mb-2 text-white/70" />
            <div className="font-bold">10 Minutes</div>
            <div className="text-muted-foreground text-xs">Time Limit</div>
          </div>
          <div className="glass rounded-xl p-4">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-white/70" />
            <div className="font-bold">Top 3 Wins</div>
            <div className="text-muted-foreground text-xs">Fastest & Highest</div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="block md:inline-block"
        >
          <Button
            size="lg"
            onClick={onEnter}
            className="group w-full md:w-auto bg-white text-black hover:bg-white/90 h-12 px-12 rounded-xl text-base font-bold shadow-glow"
          >
            Enter Quiz <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
        <p className="text-xs mt-6 flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-yellow-400 font-medium">One attempt only</span>
          <span className="text-muted-foreground">&middot; Good luck!</span>
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
      toast.success(
        `Registered! Your number is #${data.participant.reg_number} — note it down.`,
        { duration: 8000 }
      );
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
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass stroke-anim rounded-3xl p-8 md:p-10 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-normal tracking-wide">Register</h2>
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
              className="h-12 rounded-xl"
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
              className="h-12 rounded-xl"
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
              className="h-12 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-white text-black font-bold hover:bg-white/90 active:scale-[0.98] transition-transform duration-200 stroke-anim"
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
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/quiz");
      const data = await res.json();
      if (data.quiz?.status === "running" || data.quiz?.status === "ended") {
        onStart(data);
      } else {
        toast.info("Quiz hasn't started yet — check back soon.");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass stroke-anim rounded-3xl p-10 max-w-md w-full text-center"
      >
        <div className="relative w-20 h-20 mx-auto mb-6 rounded-full border-2 border-white/15">
          <div className="absolute left-1/2 top-1/2 w-[2px] h-9 -ml-[1px] origin-top bg-white/90 rounded-full animate-spin" />
          <div className="absolute left-1/2 top-1/2 w-[3px] h-6 -ml-[1.5px] origin-top bg-white rounded-full animate-[spin_4s_linear_infinite]" />
          <div className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full bg-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Waiting for quiz to start...
        </h2>
        <p className="text-muted-foreground mb-3">
          Hi{" "}
          <span className="text-white font-semibold">{participant.name}</span>
          , please stay on this page.
        </p>
        {participant.reg_number && (
          <div className="mb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Your Registration Number</p>
            <div className="inline-flex items-center justify-center bg-gradient-to-b from-white to-zinc-300 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.2),0_6px_18px_rgba(0,0,0,0.5)] text-black font-black text-4xl tracking-[0.2em] rounded-2xl px-8 py-4 select-all">
              #{participant.reg_number}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Screenshot or note this down</p>
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-6">
          The quiz will begin when the admin starts it. Tap below to check.
        </p>
        <Button
          onClick={checkStatus}
          disabled={checking}
          className="h-11 bg-white text-black hover:bg-white/90 font-semibold"
        >
          <RotateCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking..." : "Check Status"}
        </Button>
      </motion.div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-white/35">
        Developed By SHREYAS & SHRAVAN
      </p>
    </div>
  );
}

// ---------- QUIZ ----------
function QuizView({ participant, quiz, questions: initialQs, onSubmit }) {
  const DRAFT_KEY = `fq_draft_${participant.id}`;

  const [questions] = useState(initialQs);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const submittedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showGifTransition, setShowGifTransition] = useState(false);



  // Load answers/marked from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.marked) setMarked(new Set(parsed.marked));
      }
    } catch (_) {}
    setIsLoaded(true);
  }, [DRAFT_KEY]);

  // Mirror answers/marked to localStorage on every change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, marked: Array.from(marked) }));
    } catch (_) {}
  }, [answers, marked, DRAFT_KEY, isLoaded]);

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
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participant.id,
          answers,
          marked: Array.from(marked),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      // Clear draft on success
      try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
      
      // Close the confirmation dialog, then show GIF transition
      setShowConfirm(false);
      setShowGifTransition(true);
      setTimeout(() => {
        onSubmit(data.result);
      }, 5000);
    } catch (err) {
      // Allow retry — server-side is idempotent
      submittedRef.current = false;
      toast.error(err.message || "Submission failed. Please try again.");
    }
  }, [participant.id, answers, marked, DRAFT_KEY, onSubmit]);

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

  const selectOption = (idx) => {
    const q = questions[current];
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
  };

  const toggleMark = () => {
    const q = questions[current];
    const isMarked = marked.has(q.id);
    const newMarked = new Set(marked);
    if (isMarked) newMarked.delete(q.id);
    else newMarked.add(q.id);
    setMarked(newMarked);
  };

  const q = questions[current];
  if (!q)
    return <div className="text-center p-10">No questions available.</div>;

  const answeredCount = Object.keys(answers).length;
  const progress = ((current + 1) / questions.length) * 100;
  const timeLow = remaining < 60;

  const getPageNumbers = () => {
    const total = questions.length;
    const currentNum = current + 1; // 1-indexed
    
    if (total <= 6) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (currentNum <= 3) {
      return [1, 2, 3, 4, '...', total];
    }

    if (currentNum >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }

    return [1, '...', currentNum - 1, currentNum, currentNum + 1, '...', total];
  };


  return (
    <div className="h-[100dvh] w-full flex flex-col justify-between p-3 md:p-4 no-select max-w-md mx-auto overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1 py-1 text-sm shrink-0">
        <span className="font-mono font-bold tracking-tight text-white/90 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-white/70" />
          {fmtTime(remaining)}
        </span>
        <span className="text-xs font-semibold text-white/50 tracking-wider uppercase">
          {answeredCount} / {questions.length} Answered
        </span>
      </div>

      {/* Thin Progress Indicator */}
      <div className="w-full bg-white/5 h-[1.5px] rounded-full my-2 shrink-0 overflow-hidden">
        <div 
          className="bg-white h-full transition-all duration-300 rounded-full" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      {/* Slim Question Navigator */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none py-1 mb-2 shrink-0">
        {getPageNumbers().map((num, idx) => {
          if (num === '...') {
            return (
              <span key={`dots-${idx}`} className="w-8 text-center text-white/30 text-xs font-bold select-none">
                ...
              </span>
            );
          }
          const qIdx = num - 1;
          const isAns = answers[questions[qIdx].id] !== undefined;
          const isCur = qIdx === current;
          
          return (
            <button
              key={qIdx}
              onClick={() => setCurrent(qIdx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
                isCur
                  ? "bg-white text-black shadow-glow"
                  : isAns
                  ? "bg-white/15 text-white border border-white/5"
                  : "bg-white/5 border border-white/5 text-white/40 hover:text-white"
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      <Card className="glass stroke-anim rounded-2xl p-4 md:p-5 flex-grow flex flex-col justify-between overflow-hidden">
        {/* Scrollable Question Content (Question text + Image + Options) */}
        <div className="flex-grow overflow-y-auto pr-0.5 space-y-3.5 scrollbar-none flex flex-col justify-between">
          {/* Question Text */}
          <div className="shrink-0">
            <h2 className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-1">
              Question {current + 1} of {questions.length}
            </h2>
            <h1 className="text-[15px] md:text-[17px] font-bold text-white leading-snug tracking-tight break-words">
              {q.question_text}
            </h1>
          </div>

          {/* Optional Image */}
          {q.image_url && (
            <div className="shrink-0 flex justify-center bg-black/20 rounded-xl p-1.5 border border-white/5 my-1">
              <img
                src={q.image_url}
                alt=""
                className="rounded-lg max-h-24 md:max-h-28 object-contain"
              />
            </div>
          )}

          {/* Options List */}
          <div className="space-y-2 flex-grow flex flex-col justify-center">
            {q.options.map((opt, idx) => {
              const selected = answers[q.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => selectOption(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-155 flex items-center gap-3 shrink-0 ${
                    selected 
                      ? "border-white bg-white/10" 
                      : "border-white/5 bg-white/5 hover:border-white/15 active:scale-[0.99]"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors duration-150 ${
                      selected ? "bg-white text-black" : "bg-white/10 text-white/70"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1 text-[13px] md:text-sm font-medium text-white/90 break-words leading-tight">
                    {opt}
                  </span>
                  {selected && (
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fixed Actions Bar */}
        <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-white/5 shrink-0">
          <Button
            variant="outline"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex-1 h-10 bg-white/5 hover:bg-white/10 text-white border-white/5 disabled:opacity-30 disabled:hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Previous
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            disabled={current === questions.length - 1}
            className="flex-1 h-10 bg-white/5 hover:bg-white/10 text-white border-white/5 disabled:opacity-30 disabled:hover:bg-white/5"
          >
            Next <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </Card>

      {/* Submit Button outside Card */}
      <div className="mt-3 shrink-0">
        <Button
          onClick={() => setShowConfirm(true)}
          className="w-full h-11 bg-white hover:bg-white/90 text-black font-bold text-sm shadow-glow rounded-xl"
        >
          Submit Quiz
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="glass-strong rounded-3xl max-w-[340px] p-5">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-bold">Submit Quiz?</DialogTitle>
            <DialogDescription className="text-xs text-white/60 pt-2">
              You have answered{" "}
              <span className="font-bold text-white">{answeredCount}</span>{" "}
              out of <span className="font-bold text-white">{questions.length}</span>{" "}
              questions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirm(false)} 
              className="flex-1 h-10 bg-white/5 text-white border-white/5 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={doSubmit}
              className="flex-1 h-10 bg-white text-black hover:bg-white/90 font-bold"
            >
              Submit Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GIF preloaded silently in background from quiz start, shown on submit */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(12px)',
          padding: '1rem',
          opacity: showGifTransition ? 1 : 0,
          pointerEvents: showGifTransition ? 'all' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        <div className="glass stroke-anim rounded-3xl p-6 md:p-8 max-w-sm w-full text-center flex flex-col items-center gap-4 shadow-2xl">
          <div className="w-[280px] h-[280px] overflow-hidden rounded-2xl bg-black/40 border border-white/5">
            {/* iframe always mounted so browser preloads it during quiz */}
            <iframe
              src="https://tenor.com/embed/5034219186050115128"
              frameBorder="0"
              scrolling="no"
              allowFullScreen
              className="w-full h-full rounded-2xl"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-wide text-white">Submitting Answers...</h2>
            <p className="text-xs text-white/50">Saving your scores and details</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- RESULTS ----------
function Results({ result }) {
  const pct = result?.percentage ?? 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass stroke-anim rounded-3xl p-6 md:p-8 max-w-2xl w-full"
      >
        <div className="text-center mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-black mb-3 bg-gradient-to-b from-white to-zinc-300 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.2),0_6px_18px_rgba(0,0,0,0.5)]"
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 52 52"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
                d="M14 27 L22 35 L38 17"
              />
            </motion.svg>
          </motion.div>
          <h1 className="font-display text-[2.9rem] md:text-[5.5rem] font-normal tracking-wide mb-2 bg-gradient-to-b from-white to-white/55 bg-clip-text text-transparent">
            Quiz Submitted!
          </h1>
          <p className="text-muted-foreground">
            Great job, {result?.participant_name || "Champion"}!
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="glass rounded-xl p-3 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-white" />
            <div className="text-3xl font-black text-green-400">
              {result?.correct ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Correct</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <XCircle className="w-5 h-5 mx-auto mb-2 text-white/35" />
            <div className="text-3xl font-black text-red-400">
              {result?.wrong ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Wrong</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-2 text-white/70" />
            <div className="text-3xl font-black text-white">
              {result?.score ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Score</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <Award className="w-5 h-5 mx-auto mb-2 text-white/70" />
            <div className="text-3xl font-black text-white">{pct}%</div>
            <div className="text-xs text-muted-foreground mt-1">Percentage</div>
          </div>
        </div>
        <div className="glass rounded-xl p-3 mb-4 text-sm text-center">
          <div className="text-muted-foreground">
            Time taken:{" "}
            <span className="text-white font-bold">
              {fmtTime(result?.time_taken_seconds || 0)}
            </span>
          </div>
        </div>
      </motion.div>

      <p className="text-[11px] tracking-[0.3em] uppercase text-white/35">
        Developed By SHREYAS & SHRAVAN
      </p>
    </div>
  );
}

// ---------- LEADERBOARD + WINNERS ----------
function Confetti() {
  const colors = [
    "#ffffff",
    "#e5e5e5",
    "#a3a3a3",
    "#737373",
    "#525252",
    "#d4d4d4",
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
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 bg-gradient-to-b from-white to-white/55 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Congratulations to all participants!
          </p>
          {myRank && (
            <Badge className="mt-3 bg-white/15 text-white text-base px-4 py-1">
              Your Rank: #{myRank}
            </Badge>
          )}
        </motion.div>

        {loading ? (
          <div className="space-y-3 max-w-2xl mx-auto">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl">
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
                  const heights = ["md:mt-0", "md:mt-8", "md:mt-12"];
                  const opacities = ["text-white", "text-white/70", "text-white/45"];
                  const ringStyles = [
                    "border-white text-white",
                    "border-white/70 text-white",
                    "border-white/40 text-white",
                  ];
                  const numOpacity = ["text-white", "text-white/80", "text-white/60"];
                  return (
                    <motion.div
                      key={p.participant_id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: pos * 0.12, duration: 0.4 }}
                      className={`glass-strong rounded-2xl p-6 text-center ${heights[pos]}`}
                    >
                      <div
                        className={`inline-flex w-12 h-12 rounded-full border-2 items-center justify-center font-black mb-3 ${ringStyles[pos]}`}
                      >
                        {pos + 1}
                      </div>
                      <div
                        className={`font-bold text-lg truncate ${numOpacity[pos]}`}
                      >
                        {p.participant_name}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        {p.participant_course}
                      </div>
                      <div className={`text-4xl font-black ${opacities[pos]}`}>
                        {p.score}
                        <span className="text-lg text-muted-foreground">
                          /{p.total}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {fmtTime(p.time_taken_seconds)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <Card className="glass overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
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
                          className={`border-b border-white/5 transition-colors duration-150 ${r.participant_id === myResult?.participant_id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
                        >
                          <td className="p-3 font-bold">#{r.rank}</td>
                          <td className="p-3">{r.participant_name}</td>
                          <td className="p-3 text-muted-foreground text-sm">
                            {r.participant_course}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-white">
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
          <Button variant="outline" onClick={onRestart} className="h-11">
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
    const res = await fetch(`/api/quiz/questions?participant_id=${encodeURIComponent(p.id)}`);
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass stroke-anim rounded-[20px] p-8 md:p-12 max-w-3xl w-full text-center">
          {/* title */}
          <Skeleton className="h-[3.4rem] md:h-[5rem] w-[16rem] md:w-[24rem] mx-auto mb-3 rounded-lg" />
          {/* subtitle */}
          <Skeleton className="h-4 md:h-5 w-[20rem] md:w-[26rem] mx-auto mb-8 rounded-md" />
          {/* info chips — mirrors the 2-col glass grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8 max-w-md mx-auto">
            {[0, 1].map((i) => (
              <div key={i} className="glass rounded-xl p-4">
                <Skeleton className="w-6 h-6 mx-auto mb-2 rounded-md" />
                <Skeleton className="h-4 w-20 mx-auto mb-1 rounded" />
                <Skeleton className="h-3 w-16 mx-auto rounded" />
              </div>
            ))}
          </div>
          {/* CTA button */}
          <Skeleton className="h-12 w-full md:w-72 mx-auto rounded-xl" />
          {/* warning line */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            <Skeleton className="w-3.5 h-3.5 rounded-sm" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        </div>
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
  if (view === "results") return <Results result={result} />;
  if (view === "leaderboard")
    return <Leaderboard myResult={result} onRestart={restart} />;
  return null;
}

export default App;
