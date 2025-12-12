import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  TrendingDown,
  Clock,
  CheckCircle2,
  Bell,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import { OpenAPI } from "@/client"

export const Route = createFileRoute("/_layout/alerts")({
  component: AlertsPage,
  head: () => ({
    meta: [
      {
        title: "Advarsler - TrivselsTracker",
      },
    ],
  }),
})

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

const alertTypeConfig: Record<
  string,
  {
    icon: React.ElementType
    gradient: string
    iconBg: string
    iconColor: string
    badge: string
    label: string
  }
> = {
  critical_score: {
    icon: AlertTriangle,
    gradient: "from-red-500/10 via-red-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-red-100 to-red-50",
    iconColor: "text-red-600",
    badge: "bg-red-100 text-red-700 border-red-200",
    label: "Kritisk score",
  },
  score_drop: {
    icon: TrendingDown,
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-amber-100 to-amber-50",
    iconColor: "text-amber-600",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    label: "Score fald",
  },
  non_response: {
    icon: Clock,
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-blue-100 to-blue-50",
    iconColor: "text-blue-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    label: "Manglende svar",
  },
  weekly_summary: {
    icon: Bell,
    gradient: "from-gray-500/10 via-gray-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-gray-100 to-gray-50",
    iconColor: "text-gray-600",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
    label: "Ugentlig opsummering",
  },
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  delay,
}: {
  title: string
  value: number
  icon: React.ElementType
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className={`${color} border-0 shadow-soft hover-lift transition-all duration-300`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">{title}</p>
              <motion.p
                className="text-3xl font-bold mt-1"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
              >
                {value}
              </motion.p>
            </div>
            <div className="p-3 rounded-2xl bg-white/50 backdrop-blur-sm">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AlertsPage() {
  const queryClient = useQueryClient()

  // Fetch all alerts
  const { data: alerts, isLoading } = useQuery<{
    data: AlertInfo[]
    count: number
  }>({
    queryKey: ["dashboard", "alerts", "all"],
    queryFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/dashboard/alerts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch alerts")
      return response.json()
    },
  })

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/dashboard/alerts/${alertId}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to mark alert as read")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "alerts"] })
      toast.success("Advarsel markeret som læst")
    },
    onError: () => {
      toast.error("Kunne ikke markere advarsel")
    },
  })

  const unreadAlerts = alerts?.data.filter((a) => !a.read_at) || []
  const readAlerts = alerts?.data.filter((a) => a.read_at) || []
  const criticalCount = unreadAlerts.filter((a) => a.type === "critical_score").length
  const warningCount = unreadAlerts.filter((a) => a.type === "score_drop").length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Advarsler
        </h1>
        <p className="text-muted-foreground mt-1">
          Hold dig opdateret med vigtige notifikationer om dine elever
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Ulæste"
          value={unreadAlerts.length}
          icon={Bell}
          color="bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-700"
          delay={0}
        />
        <StatCard
          title="Kritiske"
          value={criticalCount}
          icon={AlertTriangle}
          color="bg-gradient-to-br from-red-50 to-red-100/50 text-red-700"
          delay={0.1}
        />
        <StatCard
          title="Advarsler"
          value={warningCount}
          icon={TrendingDown}
          color="bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-700"
          delay={0.2}
        />
        <StatCard
          title="Håndteret"
          value={readAlerts.length}
          icon={CheckCircle2}
          color="bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-700"
          delay={0.3}
        />
      </div>

      {/* Unread Alerts */}
      <AnimatePresence mode="wait">
        {unreadAlerts.length > 0 ? (
          <motion.div
            key="unread"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="rounded-2xl border-0 shadow-soft overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-3">
                  <motion.div
                    className="p-2 rounded-xl bg-primary/10"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Bell className="h-5 w-5 text-primary" />
                  </motion.div>
                  <span>Ulæste advarsler</span>
                  <Badge variant="secondary" className="rounded-full">
                    {unreadAlerts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <AnimatePresence>
                  {unreadAlerts.map((alert, index) => {
                    const config = alertTypeConfig[alert.type] || alertTypeConfig.weekly_summary
                    const Icon = config.icon
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "relative p-6 border-b last:border-b-0 hover:bg-muted/30 transition-colors",
                          "bg-gradient-to-r",
                          config.gradient
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <motion.div
                            className={cn("p-3 rounded-2xl shadow-sm", config.iconBg)}
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <Icon className={cn("h-6 w-6", config.iconColor)} />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline" className={cn("rounded-full", config.badge)}>
                                {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(alert.sent_at).toLocaleDateString("da-DK", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="font-semibold text-lg mb-1">{alert.title}</p>
                            <p className="text-muted-foreground">{alert.message}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                              <Button
                                variant="default"
                                size="sm"
                                asChild
                                className="rounded-xl gap-2 shadow-soft"
                              >
                                <Link to="/students/$studentId" params={{ studentId: alert.student_id }}>
                                  Se elev
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markReadMutation.mutate(alert.id)}
                                disabled={markReadMutation.isPending}
                                className="rounded-xl gap-2"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Marker som læst
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="rounded-2xl border-0 shadow-soft overflow-hidden">
              <CardContent className="py-16">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="relative mx-auto w-24 h-24 mb-6"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50" />
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ShieldCheck className="h-12 w-12 text-emerald-600" />
                    </motion.div>
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="h-6 w-6 text-amber-500" />
                    </motion.div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-xl font-semibold text-emerald-700 mb-2">
                      Alle advarsler er håndteret
                    </p>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Godt gået! Du er helt opdateret med alle notifikationer.
                      Nye advarsler vil dukke op her.
                    </p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Read Alerts */}
      {readAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="rounded-2xl border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5" />
                Tidligere advarsler
                <Badge variant="outline" className="rounded-full ml-2">
                  {readAlerts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {readAlerts.slice(0, 10).map((alert, index) => {
                  const config = alertTypeConfig[alert.type] || alertTypeConfig.weekly_summary
                  const Icon = config.icon
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.03 }}
                      className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group"
                    >
                      <div className={cn("p-2 rounded-xl", config.iconBg, "opacity-60")}>
                        <Icon className={cn("h-4 w-4", config.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.student_name} •{" "}
                          {new Date(alert.sent_at).toLocaleDateString("da-DK")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Link to="/students/$studentId" params={{ studentId: alert.student_id }}>
                          Se elev
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </motion.div>
                  )
                })}
              </div>
              {readAlerts.length > 10 && (
                <div className="p-4 text-center border-t">
                  <p className="text-sm text-muted-foreground">
                    Viser de seneste 10 af {readAlerts.length} håndterede advarsler
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
