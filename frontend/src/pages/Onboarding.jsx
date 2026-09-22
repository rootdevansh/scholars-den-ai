import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, Plus, Trash2, Loader } from 'lucide-react';
import { api } from '../hooks/useApi';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const MASTERY_OPTIONS = [
  { value: 'weak',   emoji: '😰', label: 'Weak' },
  { value: 'medium', emoji: '🤔', label: 'Medium' },
  { value: 'strong', emoji: '💪', label: 'Strong' },
];

const JEE_PRESET = [
  { subject: 'Physics',     name: 'Mechanics',          weightage: 9, mastery: 'weak',   estimated_hours: 12 },
  { subject: 'Physics',     name: 'Electromagnetism',   weightage: 10, mastery: 'weak',  estimated_hours: 14 },
  { subject: 'Physics',     name: 'Thermodynamics',     weightage: 7, mastery: 'medium', estimated_hours: 8  },
  { subject: 'Physics',     name: 'Optics',             weightage: 6, mastery: 'medium', estimated_hours: 6  },
  { subject: 'Physics',     name: 'Modern Physics',     weightage: 7, mastery: 'strong', estimated_hours: 5  },
  { subject: 'Chemistry',   name: 'Organic Chemistry',  weightage: 10, mastery: 'weak',  estimated_hours: 16 },
  { subject: 'Chemistry',   name: 'Physical Chemistry', weightage: 8, mastery: 'weak',   estimated_hours: 12 },
  { subject: 'Chemistry',   name: 'Inorganic Chemistry',weightage: 7, mastery: 'medium', estimated_hours: 10 },
  { subject: 'Chemistry',   name: 'Electrochemistry',   weightage: 5, mastery: 'strong', estimated_hours: 4  },
  { subject: 'Mathematics', name: 'Calculus',           weightage: 10, mastery: 'medium',estimated_hours: 14 },
  { subject: 'Mathematics', name: 'Algebra',            weightage: 8, mastery: 'medium', estimated_hours: 10 },
  { subject: 'Mathematics', name: 'Coordinate Geometry',weightage: 7, mastery: 'weak',   estimated_hours: 8  },
  { subject: 'Mathematics', name: 'Trigonometry',       weightage: 6, mastery: 'strong', estimated_hours: 5  },
  { subject: 'Mathematics', name: 'Probability',        weightage: 5, mastery: 'medium', estimated_hours: 6  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setActivePlanId } = useStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [planName, setPlanName]     = useState('');
  const [examDate, setExamDate]     = useState('');
  const [dailyHours, setDailyHours] = useState(6);
  const [topics, setTopics]         = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic]     = useState('');
  const [newWeight, setNewWeight]   = useState(5);
  const [newHours, setNewHours]     = useState(3);

  // Days preview
  const daysLeft = examDate
    ? Math.max(0, Math.floor((new Date(examDate) - new Date()) / 86400000))
    : 0;

  // ── Quick Demo ──────────────────────────────────────────────────────────────
  const handleQuickDemo = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/plans/sample/load');
      setActivePlanId(data.planId);
      toast.success('Sample plan loaded! 🚀');
      navigate('/plan');
    } catch {
      toast.error('Sample plan not found — run schema.sql in Supabase first');
    } finally {
      setLoading(false);
    }
  };

  // ── Add topic ───────────────────────────────────────────────────────────────
  const addTopic = () => {
    if (!newSubject.trim() || !newTopic.trim()) {
      toast.error('Enter subject and topic name');
      return;
    }
    setTopics((prev) => [
      ...prev,
      { subject: newSubject, name: newTopic, weightage: newWeight, mastery: 'medium', estimated_hours: newHours },
    ]);
    setNewTopic('');
  };

  const loadJEEPreset = () => {
    setTopics(JEE_PRESET);
    setPlanName('JEE Advanced 2027 Prep');
    toast.success('JEE preset loaded!');
  };

  const updateMastery = (idx, mastery) => {
    setTopics((prev) => prev.map((t, i) => (i === idx ? { ...t, mastery } : t)));
  };

  // ── Generate Plan ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!planName || !examDate || !topics.length) {
      toast.error('Fill in all fields and add at least one topic');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/plans', {
        name: planName,
        exam_date: examDate,
        daily_hours: dailyHours,
        topics,
      });
      setActivePlanId(data.plan.id);
      toast.success('Your plan is ready! 🎯');
      navigate('/plan');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 0: Landing ─────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
        {/* Animated blob bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="blob absolute top-1/4 left-1/4 w-80 h-80 bg-den-yellow/8 rounded-full blur-3xl" />
          <div className="blob blob-delay absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl relative z-10"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-den-yellow rounded-2xl flex items-center justify-center yellow-glow">
              <span className="font-syne font-black text-black text-xl">SD</span>
            </div>
            <span className="font-syne font-bold text-3xl text-den-text">
              Scholar's Den <span className="text-den-yellow">AI</span>
            </span>
          </div>

          <h1 className="font-syne font-black text-5xl sm:text-6xl text-den-text leading-tight mb-4">
            Study smarter,<br />
            <span className="text-den-yellow">not harder.</span>
          </h1>

          <p className="text-den-muted text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Scholar's Den AI builds your personal exam plan — adaptive, weighted,
            and powered by real constraints. No more generic timetables.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleQuickDemo}
              disabled={loading}
              className="btn-primary flex items-center gap-2 text-base px-8 py-4 yellow-glow"
            >
              {loading ? <Loader size={18} className="animate-spin" /> : <Zap size={18} />}
              Quick Demo 🚀
            </button>
            <button
              onClick={() => setStep(1)}
              className="btn-secondary flex items-center gap-2 text-base px-8 py-4"
            >
              Create my plan <ChevronRight size={18} />
            </button>
          </div>

          <p className="text-den-muted text-xs mt-6">
            Quick Demo loads a pre-built JEE plan — no setup needed
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-10">
            {['Adaptive re-planning', 'AI Tutor', 'Priority tagging', 'Progress dashboard', 'Smart reminders'].map((f) => (
              <span key={f} className="px-3 py-1.5 bg-den-card border border-den-border rounded-full text-xs text-den-muted">
                {f}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Step 1: Exam details ────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <StepHeader step={1} total={3} title="Exam Details" subtitle="Tell me about your target exam" />

          <div className="space-y-4">
            <div>
              <label className="block text-den-muted text-xs font-medium mb-1.5">Exam / Plan Name</label>
              <input className="input-field" placeholder="e.g. JEE Advanced 2027" value={planName} onChange={(e) => setPlanName(e.target.value)} />
            </div>
            <div>
              <label className="block text-den-muted text-xs font-medium mb-1.5">Exam Date</label>
              <input type="date" className="input-field" value={examDate} onChange={(e) => setExamDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-den-muted text-xs font-medium mb-1.5">
                Daily Study Hours: <span className="text-den-yellow font-bold">{dailyHours}h</span>
              </label>
              <input type="range" min={1} max={12} step={0.5} value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="w-full accent-den-yellow" />
              <div className="flex justify-between text-den-muted text-xs mt-1"><span>1h</span><span>12h</span></div>
            </div>

            {examDate && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-den-yellow/10 border border-den-yellow/20 rounded-xl p-4 text-center">
                <p className="text-den-yellow font-syne font-bold text-2xl">{daysLeft} days</p>
                <p className="text-den-muted text-xs">{(daysLeft * dailyHours).toFixed(0)} total study hours available</p>
              </motion.div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(0)} className="btn-secondary flex-1">← Back</button>
            <button onClick={() => { if (!planName || !examDate) { toast.error('Fill all fields'); return; } setStep(2); }}
              className="btn-primary flex-1">Next →</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Step 2: Topics ──────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <StepHeader step={2} total={3} title="Subjects & Topics" subtitle="Add your syllabus or load a preset" />

          {/* Preset buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={loadJEEPreset} className="px-4 py-2 bg-den-card border border-den-border rounded-xl text-xs font-semibold text-den-text hover:border-den-yellow/40 transition-colors">
              📚 JEE Preset
            </button>
          </div>

          {/* Add topic form */}
          <div className="bg-den-card border border-den-border rounded-2xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder="Subject (e.g. Physics)" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
              <input className="input-field" placeholder="Topic name" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-den-muted text-xs mb-1 block">Weightage: <span className="text-den-yellow">{newWeight}/10</span></label>
                <input type="range" min={1} max={10} value={newWeight} onChange={(e) => setNewWeight(parseInt(e.target.value))} className="w-full accent-den-yellow" />
              </div>
              <div>
                <label className="text-den-muted text-xs mb-1 block">Est. Hours: <span className="text-den-yellow">{newHours}h</span></label>
                <input type="range" min={1} max={30} value={newHours} onChange={(e) => setNewHours(parseInt(e.target.value))} className="w-full accent-den-yellow" />
              </div>
            </div>
            <button onClick={addTopic} className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={16} /> Add Topic
            </button>
          </div>

          {/* Topics list */}
          {topics.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-den-muted text-xs mb-2">{topics.length} topics added</p>
              {topics.map((t, i) => (
                <div key={i} className="flex items-center gap-3 bg-den-card border border-den-border rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-den-text text-sm font-medium">{t.name}</p>
                    <p className="text-den-muted text-xs">{t.subject} · W:{t.weightage} · {t.estimated_hours}h</p>
                  </div>
                  <button onClick={() => setTopics((prev) => prev.filter((_, j) => j !== i))}
                    className="text-den-muted hover:text-den-danger transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
            <button onClick={() => { if (!topics.length) { toast.error('Add at least one topic'); return; } setStep(3); }}
              className="btn-primary flex-1">Next →</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Self-assessment ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-2xl mx-auto">
        <StepHeader step={3} total={3} title="Self-Assessment" subtitle="Rate your current level for each topic" />

        {/* Progress bar */}
        <div className="h-1.5 bg-den-border rounded-full mb-6">
          <div
            className="h-full bg-den-yellow rounded-full transition-all"
            style={{ width: `${(topics.filter(t => t.mastery).length / topics.length) * 100}%` }}
          />
        </div>

        <div className="space-y-3 mb-6">
          {topics.map((t, i) => (
            <div key={i} className="bg-den-card border border-den-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-den-text">{t.name}</p>
                  <p className="text-den-muted text-xs">{t.subject}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {MASTERY_OPTIONS.map(({ value, emoji, label }) => (
                  <button
                    key={value}
                    onClick={() => updateMastery(i, value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border
                      ${t.mastery === value
                        ? 'bg-den-yellow text-black border-den-yellow'
                        : 'bg-transparent text-den-muted border-den-border hover:border-den-yellow/30'
                      }`}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader size={16} className="animate-spin" /> Generating...</> : '✨ Generate My Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ step, total, title, subtitle }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < step ? 'bg-den-yellow' : 'bg-den-border'}`} />
        ))}
      </div>
      <p className="text-den-muted text-xs font-medium mb-1">Step {step} of {total}</p>
      <h2 className="font-syne font-bold text-3xl text-den-text">{title}</h2>
      <p className="text-den-muted text-sm mt-1">{subtitle}</p>
    </div>
  );
}
