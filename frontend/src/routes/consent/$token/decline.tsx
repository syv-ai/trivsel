import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { motion } from "motion/react"
import { OpenAPI } from "@/client"

export const Route = createFileRoute("/consent/$token/decline")({
  component: ConsentDeclinePage,
  head: () => ({
    meta: [
      {
        title: "Afviser samtykke - TrivselsTracker",
      },
    ],
  }),
})

function ConsentDeclinePage() {
  const { token } = Route.useParams()

  const declineMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/consent/${token}/decline`, {
        method: "POST",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to decline consent")
      }
      return response.json()
    },
  })

  useEffect(() => {
    if (declineMutation.isIdle) {
      declineMutation.mutate()
    }
  }, [declineMutation.isIdle])

  // Loading state
  if (declineMutation.isIdle || declineMutation.isPending) {
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
              className="absolute inset-0 rounded-full bg-[#d4d4d4]"
              style={{ animation: 'breathe 2s ease-in-out infinite' }}
            />
            <div
              className="absolute inset-2 rounded-full bg-[#a3a3a3]"
              style={{ animation: 'breathe 2s ease-in-out infinite 0.2s' }}
            />
            <div
              className="absolute inset-4 rounded-full bg-[#737373]"
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
  if (declineMutation.isError) {
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
              {declineMutation.error instanceof Error
                ? declineMutation.error.message
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
            className="absolute top-[10%] left-[10%] w-64 h-64 rounded-full bg-gradient-to-br from-[#e8e8e8] to-[#f5f5f5] blur-3xl opacity-60"
            style={{ animation: 'drift 15s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-[20%] right-[15%] w-80 h-80 rounded-full bg-gradient-to-br from-[#d4d4d4] to-[#e8e8e8] blur-3xl opacity-50"
            style={{ animation: 'drift 18s ease-in-out infinite reverse' }}
          />
          <div
            className="absolute top-[50%] right-[30%] w-40 h-40 rounded-full bg-gradient-to-br from-[#e0e0e0] to-[#efefef] blur-2xl opacity-40"
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

          {/* Decline icon */}
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
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#a3a3a3] to-[#737373] opacity-20" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#a3a3a3] to-[#737373] opacity-30" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#a3a3a3] to-[#737373] flex items-center justify-center">
              <motion.svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
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
            Dit valg er registreret
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-[#7a7a7a] text-center text-lg leading-relaxed mb-4"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Du har valgt ikke at deltage i TrivselsTracker.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="text-[#9a9a9a] text-center leading-relaxed mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Du vil ikke modtage trivselstjek. Kontakt din mentor hvis du ombestemmer dig.
          </motion.p>

          {/* Decorative divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#e0e0e0]" />
            <div className="w-2 h-2 rounded-full bg-[#d4d4d4]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#e0e0e0]" />
          </motion.div>

          {/* Close message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex items-center justify-center gap-2 text-[#a0a0a0]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
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
