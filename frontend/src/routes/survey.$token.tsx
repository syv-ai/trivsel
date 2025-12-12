import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation } from "@tanstack/react-query"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { OpenAPI } from "@/client"

export const Route = createFileRoute("/survey/$token")({
  component: SurveyPage,
  head: () => ({
    meta: [
      {
        title: "Trivselstjek - TrivselsTracker",
      },
    ],
  }),
})

interface SurveyQuestion {
  id: string
  category: string
  phase: string
  question_text_da: string
  order: number
  is_active: boolean
  created_at: string
}

interface SurveyInfo {
  student_name: string
  week_number: number
  year: number
  questions: SurveyQuestion[]
  status: string
}

interface SurveyResponse {
  question_id: string
  answer: number
}

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  trivsel: { label: "Trivsel", color: "#7ab77e", bg: "rgba(122, 183, 126, 0.12)" },
  motivation: { label: "Motivation", color: "#e8a87c", bg: "rgba(232, 168, 124, 0.12)" },
  faellesskab: { label: "Fællesskab", color: "#85c1e9", bg: "rgba(133, 193, 233, 0.12)" },
  selvindsigt: { label: "Selvindsigt", color: "#c39bd3", bg: "rgba(195, 155, 211, 0.12)" },
  arbejdsparathed: { label: "Arbejdsparathed", color: "#f5b041", bg: "rgba(245, 176, 65, 0.12)" },
}

const answerOptions = [
  { value: 1, color: "#e57373" },
  { value: 2, color: "#ffb74d" },
  { value: 3, color: "#fff176" },
  { value: 4, color: "#aed581" },
  { value: 5, color: "#81c784" },
]

function SurveyPage() {
  const { token } = Route.useParams()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{
    message: string
    total_score: number
    color: string
  } | null>(null)
  const [direction, setDirection] = useState(0)

  const {
    data: surveyInfo,
    isLoading,
    error,
  } = useQuery<SurveyInfo>({
    queryKey: ["survey", token],
    queryFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/survey/${token}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to load survey")
      }
      return response.json()
    },
    retry: false,
  })

  const submitMutation = useMutation({
    mutationFn: async (responsesArray: SurveyResponse[]) => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/survey/${token}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: responsesArray }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to submit responses")
      }
      return response.json()
    },
    onSuccess: (data) => {
      setResult(data)
      setSubmitted(true)
    },
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=DM+Sans:wght@400;500&display=swap');

          @keyframes breathe {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.1); opacity: 1; }
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div
              className="absolute inset-0 rounded-full bg-[#b8d4b8]"
              style={{ animation: "breathe 2s ease-in-out infinite" }}
            />
            <div
              className="absolute inset-2 rounded-full bg-[#9dc59f]"
              style={{ animation: "breathe 2s ease-in-out infinite 0.2s" }}
            />
            <div
              className="absolute inset-4 rounded-full bg-[#7ab77e]"
              style={{ animation: "breathe 2s ease-in-out infinite 0.4s" }}
            />
          </div>
          <p
            className="text-[#5c5c5c] text-lg tracking-wide"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Indlæser trivselstjek...
          </p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=DM+Sans:wght@400;500&display=swap');
        `}</style>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-3xl p-10 shadow-[0_4px_40px_rgba(0,0,0,0.06)] border border-[#f0ebe4]">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#fef2f2] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#b45858]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>

            <h1
              className="text-2xl text-[#2c2c2c] text-center mb-3"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Kunne ikke indlæse
            </h1>

            <p
              className="text-[#7a7a7a] text-center leading-relaxed mb-6"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {error instanceof Error
                ? error.message
                : "Der opstod en fejl. Prøv igen senere."}
            </p>

            <div className="pt-4 border-t border-[#f0ebe4]">
              <p
                className="text-sm text-[#a0a0a0] text-center"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Kontakt din mentor hvis problemet fortsætter
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Success state
  if (submitted && result) {
    const scoreColorMap: Record<string, string> = {
      green: "#7ab77e",
      yellow: "#f5b041",
      red: "#e57373",
    }
    const scoreColor = scoreColorMap[result.color] || "#7ab77e"

    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6 overflow-hidden">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=DM+Sans:wght@400;500&display=swap');

          @keyframes drift {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(10px, -10px); }
            50% { transform: translate(0, -20px); }
            75% { transform: translate(-10px, -10px); }
          }

          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.4; }
            50% { transform: scale(1.15); opacity: 0.1; }
            100% { transform: scale(1); opacity: 0.4; }
          }
        `}</style>

        {/* Floating shapes */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            <div
              className="absolute top-[10%] left-[10%] w-64 h-64 rounded-full bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] blur-3xl opacity-60"
              style={{ animation: "drift 15s ease-in-out infinite" }}
            />
            <div
              className="absolute bottom-[20%] right-[15%] w-80 h-80 rounded-full bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] blur-3xl opacity-50"
              style={{ animation: "drift 18s ease-in-out infinite reverse" }}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full relative z-10"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 shadow-[0_8px_60px_rgba(0,0,0,0.08)] border border-white/50">
            {/* Animated score circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="relative w-32 h-32 mx-auto mb-8"
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: scoreColor, opacity: 0.15, animation: "pulse-ring 2s ease-in-out infinite" }}
              />
              <div
                className="absolute inset-3 rounded-full"
                style={{ backgroundColor: scoreColor, opacity: 0.25 }}
              />
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${scoreColor} 0%, ${scoreColor}dd 100%)` }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-4xl font-bold text-white"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {result.total_score.toFixed(1)}
                </motion.span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-3xl text-[#2c2c2c] text-center mb-3"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Tak for dit svar!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-[#7a7a7a] text-center text-lg leading-relaxed mb-2"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Din trivselsscore er registreret.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="text-[#a0a0a0] text-center text-sm mb-8"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {result.total_score.toFixed(1)} ud af 5
            </motion.p>

            {/* Decorative divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center justify-center gap-3 mb-8"
            >
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#e0e0e0]" />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: scoreColor }} />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#e0e0e0]" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex items-center justify-center gap-2 text-[#a0a0a0]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="text-sm">Du kan lukke denne side nu</span>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="text-center text-[#c0c0c0] text-sm mt-6"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            TrivselsTracker
          </motion.p>
        </motion.div>
      </div>
    )
  }

  if (!surveyInfo) {
    return null
  }

  const questions = surveyInfo.questions
  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const allAnswered = questions.every((q) => responses[q.id] !== undefined)
  const category = categoryConfig[currentQuestion.category] || categoryConfig.trivsel

  const handleAnswer = (value: number) => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setDirection(1)
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }, 400)
    }
  }

  const handleSubmit = () => {
    const responsesArray: SurveyResponse[] = Object.entries(responses).map(
      ([question_id, answer]) => ({ question_id, answer })
    )
    submitMutation.mutate(responsesArray)
  }

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setDirection(-1)
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1 && responses[currentQuestion.id]) {
      setDirection(1)
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=DM+Sans:wght@400;500&display=swap');

        @keyframes drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(15px, -15px) rotate(2deg); }
          66% { transform: translate(-10px, -25px) rotate(-1deg); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>

      {/* Background organic shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle, ${category.color}22 0%, transparent 70%)`,
            animation: "drift 20s ease-in-out infinite"
          }}
        />
        <div
          className="absolute bottom-0 -left-20 w-80 h-80 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #e8d5c4 0%, transparent 70%)",
            animation: "drift 25s ease-in-out infinite reverse"
          }}
        />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-5 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ backgroundColor: category.bg }}
          >
            <span
              className="text-sm font-medium"
              style={{ fontFamily: "'DM Sans', sans-serif", color: category.color }}
            >
              Uge {surveyInfo.week_number} · {category.label}
            </span>
          </motion.div>

          <h1
            className="text-[2rem] text-[#2c2c2c] mb-2 leading-tight"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Hej {surveyInfo.student_name.split(" ")[0]}
          </h1>
          <p
            className="text-[#7a7a7a] text-base"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Hvordan har du det i dag?
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex justify-between text-sm mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <span className="text-[#7a7a7a]">
              {currentQuestionIndex + 1} af {questions.length}
            </span>
            <span className="text-[#a0a0a0]">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-[#e8e4df] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: category.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            />
          </div>
        </motion.div>

        {/* Question Card */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestionIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-1 flex flex-col"
            >
              <div
                className="bg-white rounded-[1.75rem] p-7 shadow-[0_4px_40px_rgba(0,0,0,0.06)] border border-[#f0ebe4] flex-1 flex flex-col"
              >
                {/* Question text */}
                <div className="flex-1 flex items-center justify-center mb-8">
                  <h2
                    className="text-xl text-[#2c2c2c] text-center leading-relaxed"
                    style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                  >
                    {currentQuestion.question_text_da}
                  </h2>
                </div>

                {/* Answer scale */}
                <div className="space-y-4">
                  <div className="flex justify-between text-xs text-[#a0a0a0] px-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <span>Meget uenig</span>
                    <span>Meget enig</span>
                  </div>

                  <div className="flex justify-between gap-3">
                    {answerOptions.map(({ value, color }) => {
                      const isSelected = responses[currentQuestion.id] === value
                      return (
                        <motion.button
                          key={value}
                          onClick={() => handleAnswer(value)}
                          whileHover={{ scale: 1.08, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "relative flex-1 aspect-square rounded-2xl transition-all duration-300",
                            "flex items-center justify-center",
                            "border-2",
                            isSelected
                              ? "border-transparent shadow-lg"
                              : "border-[#e8e4df] bg-white hover:border-[#d0ccc7]"
                          )}
                          style={{
                            backgroundColor: isSelected ? color : undefined,
                            boxShadow: isSelected ? `0 8px 24px ${color}40` : undefined,
                          }}
                        >
                          <span
                            className={cn(
                              "text-2xl font-semibold transition-colors",
                              isSelected ? "text-white" : "text-[#7a7a7a]"
                            )}
                            style={{ fontFamily: "'Fraunces', serif" }}
                          >
                            {value}
                          </span>

                          {isSelected && (
                            <motion.div
                              layoutId="selected-ring"
                              className="absolute inset-0 rounded-2xl border-2 border-white/50"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 mt-6"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <button
            onClick={goToPrevious}
            disabled={currentQuestionIndex === 0}
            className={cn(
              "flex-1 h-14 rounded-2xl font-medium transition-all duration-200",
              "flex items-center justify-center gap-2",
              currentQuestionIndex === 0
                ? "bg-[#f5f3f0] text-[#c0c0c0] cursor-not-allowed"
                : "bg-white text-[#5c5c5c] hover:bg-[#f5f3f0] border border-[#e8e4df]"
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Forrige
          </button>

          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={goToNext}
              disabled={!responses[currentQuestion.id]}
              className={cn(
                "flex-1 h-14 rounded-2xl font-medium transition-all duration-200",
                "flex items-center justify-center gap-2",
                !responses[currentQuestion.id]
                  ? "bg-[#f5f3f0] text-[#c0c0c0] cursor-not-allowed"
                  : "text-white"
              )}
              style={{
                backgroundColor: responses[currentQuestion.id] ? category.color : undefined,
                boxShadow: responses[currentQuestion.id] ? `0 4px 14px ${category.color}40` : undefined,
              }}
            >
              Næste
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
              className={cn(
                "flex-1 h-14 rounded-2xl font-medium transition-all duration-200",
                "flex items-center justify-center gap-2",
                !allAnswered || submitMutation.isPending
                  ? "bg-[#f5f3f0] text-[#c0c0c0] cursor-not-allowed"
                  : "bg-[#7ab77e] text-white shadow-[0_4px_14px_rgba(122,183,126,0.4)]"
              )}
            >
              {submitMutation.isPending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </motion.div>
                  Sender...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Send svar
                </>
              )}
            </button>
          )}
        </motion.div>

        {/* Question dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-2 mt-6 flex-wrap px-4"
        >
          {questions.map((q, idx) => {
            const isAnswered = responses[q.id] !== undefined
            const isCurrent = idx === currentQuestionIndex
            const answerValue = responses[q.id]
            const answerColor = answerValue ? answerOptions.find(a => a.value === answerValue)?.color : undefined

            return (
              <motion.button
                key={q.id}
                onClick={() => {
                  setDirection(idx > currentQuestionIndex ? 1 : -1)
                  setCurrentQuestionIndex(idx)
                }}
                whileHover={{ scale: 1.3 }}
                className={cn(
                  "rounded-full transition-all duration-300",
                  isCurrent ? "w-6 h-2" : "w-2 h-2"
                )}
                style={{
                  backgroundColor: isAnswered ? answerColor : isCurrent ? category.color : "#e0dcd7",
                  opacity: isAnswered || isCurrent ? 1 : 0.5,
                }}
              />
            )
          })}
        </motion.div>

        {/* Branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-[#c0c0c0] text-sm mt-6"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          TrivselsTracker
        </motion.p>
      </div>
    </div>
  )
}
