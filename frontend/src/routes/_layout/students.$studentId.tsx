import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  User,
  Calendar,
  Mail,
  Clock,
  CheckCircle2,
  Plus,
  Loader2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  MessageSquare,
  Activity,
  Target,
  Send,
} from "lucide-react"
import { toast } from "sonner"
import { OpenAPI } from "@/client"
import { SendSurveyDialog } from "@/components/SendSurveyDialog"

export const Route = createFileRoute("/_layout/students/$studentId")({
  component: StudentDetail,
  head: () => ({
    meta: [
      {
        title: "Elev detaljer - TrivselsTracker",
      },
    ],
  }),
})

interface Student {
  id: string
  internal_id: string
  name: string
  email: string
  phase: string
  consent_status: boolean
  status: string
  consent_date: string | null
  created_at: string
}

interface Score {
  id: string
  student_id: string
  session_id: string
  category: string | null
  score_value: number
  color: "green" | "yellow" | "red"
  is_total: boolean
  calculated_at: string
}

interface Intervention {
  id: string
  student_id: string
  user_id: string
  status: string
  comment: string | null
  created_at: string
}

const phaseLabels: Record<string, string> = {
  indslusning: "Indslusning",
  hovedforloeb: "Hovedforløb",
  udslusning: "Udslusning",
}

const phaseColors: Record<string, string> = {
  indslusning: "bg-blue-50 text-blue-700 border-blue-200",
  hovedforloeb: "bg-purple-50 text-purple-700 border-purple-200",
  udslusning: "bg-amber-50 text-amber-700 border-amber-200",
}

const categoryLabels: Record<string, string> = {
  trivsel: "Trivsel",
  motivation: "Motivation",
  faellesskab: "Fællesskab",
  selvindsigt: "Selvindsigt",
  arbejdsparathed: "Arbejdsparathed",
}

const categoryIcons: Record<string, string> = {
  trivsel: "🌱",
  motivation: "✨",
  faellesskab: "🤝",
  selvindsigt: "🪞",
  arbejdsparathed: "💪",
}

const categoryColors: Record<string, { bg: string; fill: string }> = {
  trivsel: { bg: "bg-emerald-100", fill: "bg-emerald-500" },
  motivation: { bg: "bg-violet-100", fill: "bg-violet-500" },
  faellesskab: { bg: "bg-blue-100", fill: "bg-blue-500" },
  selvindsigt: { bg: "bg-amber-100", fill: "bg-amber-500" },
  arbejdsparathed: { bg: "bg-rose-100", fill: "bg-rose-500" },
}

const interventionStatusLabels: Record<string, string> = {
  contacted: "Kontaktet",
  meeting_planned: "Samtale planlagt",
  intervention_started: "Indsats igangsat",
  completed: "Afsluttet",
}

const interventionStatusColors: Record<string, string> = {
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  meeting_planned: "bg-purple-50 text-purple-700 border-purple-200",
  intervention_started: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const colorConfig = {
  green: { bg: "bg-emerald-500", text: "text-emerald-600", glow: "shadow-emerald-500/30" },
  yellow: { bg: "bg-amber-500", text: "text-amber-600", glow: "shadow-amber-500/30" },
  red: { bg: "bg-rose-500", text: "text-rose-600", glow: "shadow-rose-500/30" },
}

function StudentDetail() {
  const { studentId } = Route.useParams()
  const queryClient = useQueryClient()
  const [interventionDialogOpen, setInterventionDialogOpen] = useState(false)
  const [newInterventionStatus, setNewInterventionStatus] = useState("")
  const [newInterventionComment, setNewInterventionComment] = useState("")
  const [sendSurveyDialogOpen, setSendSurveyDialogOpen] = useState(false)

  // Fetch student
  const { data: student, isLoading: studentLoading } = useQuery<Student>({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch student")
      return response.json()
    },
  })

  // Fetch scores
  const { data: scores } = useQuery<{ data: Score[]; count: number }>({
    queryKey: ["student", studentId, "scores"],
    queryFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/students/${studentId}/scores`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch scores")
      return response.json()
    },
  })

  // Fetch interventions
  const { data: interventions } = useQuery<{
    data: Intervention[]
    count: number
  }>({
    queryKey: ["student", studentId, "interventions"],
    queryFn: async () => {
      const response = await fetch(
        `${OpenAPI.BASE}/api/v1/students/${studentId}/interventions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      )
      if (!response.ok) throw new Error("Failed to fetch interventions")
      return response.json()
    },
  })

  // Create intervention mutation
  const createInterventionMutation = useMutation({
    mutationFn: async (data: { status: string; comment: string }) => {
      const response = await fetch(
        `${OpenAPI.BASE}/api/v1/students/${studentId}/interventions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            student_id: studentId,
            status: data.status,
            comment: data.comment || null,
          }),
        }
      )
      if (!response.ok) throw new Error("Failed to create intervention")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student", studentId, "interventions"],
      })
      setInterventionDialogOpen(false)
      setNewInterventionStatus("")
      setNewInterventionComment("")
      toast.success("Indsats registreret")
    },
    onError: () => {
      toast.error("Kunne ikke registrere indsats")
    },
  })

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Indlæser elev...</p>
        </motion.div>
      </div>
    )
  }

  if (!student) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-lg mb-4">Elev ikke fundet</p>
        <Button asChild>
          <Link to="/">Tilbage til dashboard</Link>
        </Button>
      </motion.div>
    )
  }

  // Get latest total score
  const latestTotalScore = scores?.data.find((s) => s.is_total)

  // Get category scores from latest session
  const latestSessionId = latestTotalScore?.session_id
  const categoryScores = scores?.data.filter(
    (s) => !s.is_total && s.session_id === latestSessionId
  )

  // Get score history (total scores only)
  const scoreHistory = scores?.data
    .filter((s) => s.is_total)
    .slice(0, 6)
    .reverse()

  // Calculate trend
  const trend = scoreHistory && scoreHistory.length >= 2
    ? scoreHistory[scoreHistory.length - 1].score_value - scoreHistory[scoreHistory.length - 2].score_value
    : 0

  const initials = student.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-6"
      >
        <Button variant="ghost" size="icon" asChild className="mt-1">
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex-1 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"
            >
              <span className="text-xl font-bold text-primary">{initials}</span>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">{student.internal_id}</span>
                <Badge variant="outline" className={phaseColors[student.phase]}>
                  {phaseLabels[student.phase] || student.phase}
                </Badge>
              </div>
            </div>
            {student.consent_status && student.status === "active" && (
              <Button
                onClick={() => setSendSurveyDialogOpen(true)}
                className="rounded-xl"
              >
                <Send className="h-4 w-4 mr-2" />
                Send tjek
              </Button>
            )}
          </div>

          {latestTotalScore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-right"
            >
              <p className="text-xs text-muted-foreground mb-1">Seneste score</p>
              <div className="flex items-center gap-3">
                <motion.div
                  className={cn(
                    "h-4 w-4 rounded-full shadow-lg",
                    colorConfig[latestTotalScore.color].bg,
                    colorConfig[latestTotalScore.color].glow
                  )}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
                <span className={cn(
                  "text-4xl font-bold",
                  colorConfig[latestTotalScore.color].text
                )}>
                  {latestTotalScore.score_value.toFixed(1)}
                </span>
                {trend !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    trend > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(trend).toFixed(1)}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Student Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{student.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Oprettet {new Date(student.created_at).toLocaleDateString("da-DK")}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  {student.consent_status ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-emerald-700">
                        Samtykke givet{" "}
                        {student.consent_date &&
                          new Date(student.consent_date).toLocaleDateString("da-DK")}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-amber-700">Mangler samtykke</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  Score pr. kategori
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryScores && categoryScores.length > 0 ? (
                  <div className="space-y-4">
                    {categoryScores.map((score, idx) => {
                      const colors = categoryColors[score.category || "trivsel"]
                      return (
                        <motion.div
                          key={score.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          className="space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {categoryIcons[score.category || ""]}
                              </span>
                              <span className="text-sm font-medium">
                                {categoryLabels[score.category || ""] || score.category}
                              </span>
                            </div>
                            <span className="text-sm font-bold">
                              {score.score_value.toFixed(1)}
                            </span>
                          </div>
                          <div className={cn("h-2 rounded-full overflow-hidden", colors.bg)}>
                            <motion.div
                              className={cn("h-full rounded-full", colors.fill)}
                              initial={{ width: 0 }}
                              animate={{ width: `${(score.score_value / 5) * 100}%` }}
                              transition={{ delay: 0.4 + idx * 0.05, duration: 0.5 }}
                            />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Activity className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">Ingen score data endnu</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  Trivselsudvikling
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scoreHistory && scoreHistory.length > 0 ? (
                  <div className="flex items-end gap-3 h-40 pt-4">
                    {scoreHistory.map((score, idx) => (
                      <motion.div
                        key={score.id}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
                        style={{ originY: 1 }}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div className="relative w-full flex flex-col items-center">
                          <span className="text-xs font-bold mb-2 text-foreground">
                            {score.score_value.toFixed(1)}
                          </span>
                          <motion.div
                            className={cn(
                              "w-full max-w-[40px] rounded-t-xl transition-all",
                              colorConfig[score.color].bg
                            )}
                            style={{
                              height: `${(score.score_value / 5) * 100}px`,
                            }}
                            whileHover={{ scale: 1.05 }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground mt-3">
                          {new Date(score.calculated_at).toLocaleDateString("da-DK", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Ingen historik endnu</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Interventions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    Indsatslog
                  </CardTitle>
                  <Dialog
                    open={interventionDialogOpen}
                    onOpenChange={setInterventionDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        Ny indsats
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Registrer indsats</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <Select
                            value={newInterventionStatus}
                            onValueChange={setNewInterventionStatus}
                          >
                            <SelectTrigger className="mt-1.5 rounded-xl">
                              <SelectValue placeholder="Vælg status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="contacted">Kontaktet</SelectItem>
                              <SelectItem value="meeting_planned">
                                Samtale planlagt
                              </SelectItem>
                              <SelectItem value="intervention_started">
                                Indsats igangsat
                              </SelectItem>
                              <SelectItem value="completed">Afsluttet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Kommentar (valgfri)
                          </label>
                          <Textarea
                            value={newInterventionComment}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewInterventionComment(e.target.value)}
                            placeholder="Tilføj en kommentar..."
                            className="mt-1.5 rounded-xl"
                            rows={4}
                          />
                        </div>
                        <Button
                          onClick={() =>
                            createInterventionMutation.mutate({
                              status: newInterventionStatus,
                              comment: newInterventionComment,
                            })
                          }
                          disabled={
                            !newInterventionStatus ||
                            createInterventionMutation.isPending
                          }
                          className="w-full rounded-xl"
                        >
                          {createInterventionMutation.isPending
                            ? "Gemmer..."
                            : "Gem indsats"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {interventions && interventions.data.length > 0 ? (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {interventions.data.map((intervention, idx) => (
                        <motion.div
                          key={intervention.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Badge
                                  variant="outline"
                                  className={interventionStatusColors[intervention.status]}
                                >
                                  {interventionStatusLabels[intervention.status] ||
                                    intervention.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(intervention.created_at).toLocaleDateString(
                                    "da-DK",
                                    { day: "numeric", month: "short", year: "numeric" }
                                  )}
                                </span>
                              </div>
                              {intervention.comment && (
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {intervention.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Ingen indsatser registreret endnu
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInterventionDialogOpen(true)}
                      className="rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tilføj første indsats
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Send Survey Dialog */}
      <SendSurveyDialog
        studentId={studentId}
        studentName={student.name}
        open={sendSurveyDialogOpen}
        onOpenChange={setSendSurveyDialogOpen}
      />
    </div>
  )
}
