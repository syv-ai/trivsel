import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { motion } from "motion/react"
import { OpenAPI } from "@/client"

export const Route = createFileRoute("/consent/$token/accept")({
  component: ConsentAcceptPage,
  head: () => ({
    meta: [
      {
        title: "Samtykke registreret - TrivselsTracker",
      },
    ],
  }),
})

function ConsentAcceptPage() {
  const { token } = Route.useParams()

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/consent/${token}/accept`, {
        method: "POST",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to accept consent")
      }
      return response.json()
    },
  })

  useEffect(() => {
    if (acceptMutation.isIdle) {
      acceptMutation.mutate()
    }
  }, [acceptMutation.isIdle])

  // Loading state
  if (acceptMutation.isIdle || acceptMutation.isPending) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=DM+Sans:wght@400;500&display=swap');

          @keyframes breathe {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.1); opacity: 1; }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div
              className="absolute inset-0 rounded-full bg-[#e8c4a0]"
              style={{ animation: 'breathe 2s ease-in-out infinite' }}
            />
            <div
              className="absolute inset-2 rounded-full bg-[#d4a574]"
              style={{ animation: 'breathe 2s ease-in-out infinite 0.2s' }}
            />
            <div
              className="absolute inset-4 rounded-full bg-[#c4956a]"
              style={{ animation: 'breathe 2s ease-in-out infinite 0.4s' }}
            />
          </div>
          <p
            className="text-[#5c5c5c] text-lg tracking-wide"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Et øjeblik...
          </p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (acceptMutation.isError) {
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
              Noget gik galt
            </h1>

            <p
              className="text-[#7a7a7a] text-center leading-relaxed mb-6"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {acceptMutation.error instanceof Error
                ? acceptMutation.error.message
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
  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6 overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=DM+Sans:wght@400;500&display=swap');

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }

        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(10px, -10px); }
          50% { transform: translate(0, -20px); }
          75% { transform: translate(-10px, -10px); }
        }
      `}</style>

      {/* Floating organic shapes background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        >
          <div
            className="absolute top-[10%] left-[10%] w-64 h-64 rounded-full bg-gradient-to-br from-[#e8dfd3] to-[#f5efe8] blur-3xl opacity-60"
            style={{ animation: 'drift 15s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-[20%] right-[15%] w-80 h-80 rounded-full bg-gradient-to-br from-[#d4e8d9] to-[#e8f0ea] blur-3xl opacity-50"
            style={{ animation: 'drift 18s ease-in-out infinite reverse' }}
          />
          <div
            className="absolute top-[50%] right-[30%] w-40 h-40 rounded-full bg-gradient-to-br from-[#e0d4c3] to-[#efe8dd] blur-2xl opacity-40"
            style={{ animation: 'drift 12s ease-in-out infinite 2s' }}
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

          {/* Success icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2
            }}
            className="relative w-24 h-24 mx-auto mb-8"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#9dc59f] to-[#7ab77e] opacity-20" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#9dc59f] to-[#7ab77e] opacity-30" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#9dc59f] to-[#7ab77e] flex items-center justify-center">
              <motion.svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                />
              </motion.svg>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-3xl text-[#2c2c2c] text-center mb-4"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Samtykke registreret
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-[#7a7a7a] text-center text-lg leading-relaxed mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Tak fordi du vil deltage i TrivselsTracker.
            Du vil snart modtage dit første trivselstjek.
          </motion.p>

          {/* Decorative divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#e0d4c3]" />
            <div className="w-2 h-2 rounded-full bg-[#d4c4b0]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#e0d4c3]" />
          </motion.div>

          {/* Close message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex items-center justify-center gap-2 text-[#a0a0a0]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-sm">Du kan lukke denne side nu</span>
          </motion.div>
        </div>

        {/* Bottom branding */}
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
