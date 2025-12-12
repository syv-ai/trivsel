import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import useAuth from "@/hooks/useAuth"
import { OpenAPI } from "@/client"
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bell,
  TrendingDown,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
} from "lucide-react"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Dashboard - TrivselsTracker",
      },
    ],
  }),
})

interface StudentWithScore {
  id: string
  internal_id: string
  name: string
  email: string
  phase: string
  consent_status: boolean
  status: string
  consent_date: string | null
  created_at: string
  latest_score: number | null
  latest_color: "green" | "yellow" | "red" | null
  last_response_date: string | null
}

interface DashboardOverview {
  total_students: number
  green_count: number
  yellow_count: number
  red_count: number
  non_response_count: number
  students: StudentWithScore[]
}

interface AlertInfo {
  id: string
  student_id: string
  student_name: string
  type: string
  title: string
  message: string
  sent_at: string
  read_at: string | null
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

// Animated stat card component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  delay = 0,
  trend,
}: {
  title: string
  value: number
  subtitle: string
  icon: React.ElementType
  color: "primary" | "green" | "yellow" | "red"
  delay?: number
  trend?: "up" | "down" | "neutral"
}) {
  const colorClasses = {
    primary: "from-primary/10 to-primary/5 border-primary/20",
    green: "from-emerald-50 to-teal-50/50 border-emerald-200/50",
    yellow: "from-amber-50 to-yellow-50/50 border-amber-200/50",
    red: "from-rose-50 to-red-50/50 border-rose-200/50",
  }

  const iconColors = {
    primary: "text-primary bg-primary/10",
    green: "text-emerald-600 bg-emerald-100",
    yellow: "text-amber-600 bg-amber-100",
    red: "text-rose-600 bg-rose-100",
  }

  const valueColors = {
    primary: "text-primary",
    green: "text-emerald-600",
    yellow: "text-amber-600",
    red: "text-rose-600",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
    >
      <Card className={cn(
        "overflow-hidden border bg-gradient-to-br hover-lift cursor-default",
        colorClasses[color]
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: delay + 0.2, type: "spring" }}
                  className={cn("text-4xl font-bold tracking-tight", valueColors[color])}
                >
                  {value}
                </motion.span>
                {trend && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: delay + 0.4 }}
                  >
                    {trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                    {trend === "down" && <TrendingDown className="h-4 w-4 text-rose-500" />}
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.1, type: "spring" }}
              className={cn("p-3 rounded-xl", iconColors[color])}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Status indicator component
function StatusIndicator({ color, score }: { color: string | null; score: number | null }) {
  if (!color || score === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-dashed">
        Ingen data
      </Badge>
    )
  }

  const statusConfig = {
    green: {
      bg: "bg-emerald-500",
      glow: "shadow-emerald-500/30",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "God trivsel",
    },
    yellow: {
      bg: "bg-amber-500",
      glow: "shadow-amber-500/30",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Opmærksomhed",
    },
    red: {
      bg: "bg-rose-500",
      glow: "shadow-rose-500/30",
      badge: "bg-rose-50 text-rose-700 border-rose-200",
      label: "Kritisk",
    },
  }

  const config = statusConfig[color as keyof typeof statusConfig]

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <motion.div
          className={cn("h-3 w-3 rounded-full", config.bg, `shadow-lg ${config.glow}`)}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
      </div>
      <Badge variant="outline" className={config.badge}>
        {config.label}
      </Badge>
    </div>
  )
}

function Dashboard() {
  const { user: currentUser } = useAuth()

  // Fetch dashboard overview
  const { data: overview, isLoading: overviewLoading } =
    useQuery<DashboardOverview>({
      queryKey: ["dashboard", "overview"],
      queryFn: async () => {
        const response = await fetch(`${OpenAPI.BASE}/api/v1/dashboard/overview`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
        if (!response.ok) throw new Error("Failed to fetch dashboard")
        return response.json()
      },
    })

  // Fetch alerts
  const { data: alerts } = useQuery<{ data: AlertInfo[]; count: number }>({
    queryKey: ["dashboard", "alerts"],
    queryFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/dashboard/alerts?unread_only=true`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch alerts")
      return response.json()
    },
  })

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Indlæser dashboard...</p>
        </motion.div>
      </div>
    )
  }

  const firstName = currentUser?.full_name?.split(" ")[0] || currentUser?.email?.split("@")[0]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="text-3xl"
            >
              👋
            </motion.span>
            <h1 className="text-3xl font-bold tracking-tight">
              Hej, {firstName}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Her er en oversigt over dine elevers trivsel
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden md:flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Activity className="h-4 w-4" />
          <span>Sidst opdateret: {new Date().toLocaleDateString("da-DK")}</span>
        </motion.div>
      </motion.div>

      {/* Alerts Banner */}
      {alerts && alerts.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(244,63,94,0.1),transparent_50%)]" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 }}
                  className="p-3 rounded-xl bg-rose-100"
                >
                  <Bell className="h-6 w-6 text-rose-600" />
                </motion.div>
                <div className="flex-1">
                  <p className="font-semibold text-rose-900">
                    Du har {alerts.count} ulæst{alerts.count !== 1 ? "e" : ""} advarsel{alerts.count !== 1 ? "er" : ""}
                  </p>
                  <p className="text-sm text-rose-700/80 mt-0.5">
                    {alerts.data[0]?.title}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="border-rose-200 text-rose-700 hover:bg-rose-100">
                  <Link to="/alerts">
                    Se alle
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Elever i alt"
          value={overview?.total_students ?? 0}
          subtitle="Aktive elever med samtykke"
          icon={Users}
          color="primary"
          delay={0.1}
        />
        <StatCard
          title="God trivsel"
          value={overview?.green_count ?? 0}
          subtitle="Elever med grøn score"
          icon={CheckCircle2}
          color="green"
          delay={0.15}
          trend="up"
        />
        <StatCard
          title="Opmærksomhed"
          value={overview?.yellow_count ?? 0}
          subtitle="Elever med gul score"
          icon={AlertTriangle}
          color="yellow"
          delay={0.2}
        />
        <StatCard
          title="Kritisk"
          value={overview?.red_count ?? 0}
          subtitle="Elever med rød score"
          icon={TrendingDown}
          color="red"
          delay={0.25}
        />
      </div>

      {/* Non-response warning */}
      {overview && overview.non_response_count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-4 flex items-center gap-4">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                className="p-2.5 rounded-xl bg-amber-100"
              >
                <Clock className="h-5 w-5 text-amber-600" />
              </motion.div>
              <div className="flex-1">
                <p className="text-amber-900 font-medium">
                  <span className="font-bold">{overview.non_response_count} elev{overview.non_response_count !== 1 ? "er" : ""}</span>{" "}
                  har ikke besvaret denne uges trivselstjek
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="shadow-soft border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">Mine elever</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                {overview?.students.length ?? 0} elever
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Elev</TableHead>
                    <TableHead className="font-semibold">Fase</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Score</TableHead>
                    <TableHead className="font-semibold">Sidst svaret</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview?.students.map((student, idx) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.05 }}
                      className="group hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {student.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.internal_id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={phaseColors[student.phase]}>
                          {phaseLabels[student.phase] || student.phase}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusIndicator color={student.latest_color} score={student.latest_score} />
                      </TableCell>
                      <TableCell>
                        {student.latest_score !== null ? (
                          <span className="font-mono font-bold text-lg">
                            {student.latest_score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.last_response_date ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(student.last_response_date).toLocaleDateString(
                              "da-DK",
                              { day: "numeric", month: "short" }
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Link to="/students/$studentId" params={{ studentId: student.id }}>
                            Se detaljer
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {(!overview?.students || overview.students.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-3"
                        >
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                            <Users className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground">
                            Ingen elever fundet. Kontakt en administrator for at få
                            tildelt elever.
                          </p>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
