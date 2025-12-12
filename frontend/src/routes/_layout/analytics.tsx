import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Download,
  FileJson,
  FileSpreadsheet,
  Loader2,
  ShieldCheck,
  Lock,
  TrendingUp,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { OpenAPI } from "@/client"

export const Route = createFileRoute("/_layout/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      {
        title: "Analytics - TrivselsTracker",
      },
    ],
  }),
})

const dataOptions = [
  {
    id: "scores",
    label: "Trivselsscores",
    description: "Kategoriscores og samlet trivselsniveau",
    icon: TrendingUp,
  },
  {
    id: "responses",
    label: "Besvarelser",
    description: "Individuelle svar på spørgsmål",
    icon: BarChart3,
  },
  {
    id: "interventions",
    label: "Indsatser",
    description: "Logførte interventioner og opfølgninger",
    icon: Users,
  },
]

function AnalyticsPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [format, setFormat] = useState("csv")
  const [includeScores, setIncludeScores] = useState(true)
  const [includeResponses, setIncludeResponses] = useState(true)
  const [includeInterventions, setIncludeInterventions] = useState(false)

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.append("start_date", startDate)
      if (endDate) params.append("end_date", endDate)
      params.append("format", format)
      params.append("include_scores", includeScores.toString())
      params.append("include_responses", includeResponses.toString())
      params.append("include_interventions", includeInterventions.toString())

      const response = await fetch(`${OpenAPI.BASE}/api/v1/analytics/export?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to export data")
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `trivsel_export_${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      return { success: true }
    },
    onSuccess: () => {
      toast.success("Data eksporteret")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const selectedCount = [includeScores, includeResponses, includeInterventions].filter(Boolean).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Analytics & Eksport
        </h1>
        <p className="text-muted-foreground mt-1">
          Eksporter anonymiserede data til forskningsformål og analyser
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export Options Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card className="rounded-2xl border-0 shadow-soft h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Eksporter data</CardTitle>
                  <CardDescription>
                    Vælg tidsperiode og datatyper
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Tidsperiode
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                      Fra dato
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1.5 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                      Til dato
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1.5 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Filformat</Label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setFormat("csv")}
                    className={cn(
                      "relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                      format === "csv"
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/30 hover:bg-muted/50"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={cn(
                      "p-2 rounded-xl",
                      format === "csv" ? "bg-primary/10" : "bg-muted"
                    )}>
                      <FileSpreadsheet className={cn(
                        "h-5 w-5",
                        format === "csv" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">CSV</p>
                      <p className="text-xs text-muted-foreground">Excel-kompatibel</p>
                    </div>
                    {format === "csv" && (
                      <motion.div
                        className="absolute top-2 right-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setFormat("json")}
                    className={cn(
                      "relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                      format === "json"
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/30 hover:bg-muted/50"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={cn(
                      "p-2 rounded-xl",
                      format === "json" ? "bg-primary/10" : "bg-muted"
                    )}>
                      <FileJson className={cn(
                        "h-5 w-5",
                        format === "json" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">JSON</p>
                      <p className="text-xs text-muted-foreground">Struktureret data</p>
                    </div>
                    {format === "json" && (
                      <motion.div
                        className="absolute top-2 right-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Data Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Inkluder data</Label>
                <div className="space-y-2">
                  {dataOptions.map((option, index) => {
                    const isChecked =
                      option.id === "scores"
                        ? includeScores
                        : option.id === "responses"
                          ? includeResponses
                          : includeInterventions
                    const setChecked =
                      option.id === "scores"
                        ? setIncludeScores
                        : option.id === "responses"
                          ? setIncludeResponses
                          : setIncludeInterventions

                    return (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        onClick={() => setChecked(!isChecked)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all",
                          isChecked
                            ? "bg-primary/5 ring-1 ring-primary/20"
                            : "bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          id={option.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => setChecked(checked as boolean)}
                          className="pointer-events-none"
                        />
                        <div className={cn(
                          "p-2 rounded-xl",
                          isChecked ? "bg-primary/10" : "bg-muted"
                        )}>
                          <option.icon className={cn(
                            "h-4 w-4",
                            isChecked ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Export Button */}
              <Button
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending || selectedCount === 0}
                className="w-full h-12 rounded-xl shadow-soft gap-2 text-base"
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Eksporterer...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Eksporter {selectedCount} {selectedCount === 1 ? "datatype" : "datatyper"}
                    <ArrowRight className="h-5 w-5 ml-auto" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Cards */}
        <div className="space-y-4">
          {/* Privacy Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Card className="relative rounded-2xl border-0 shadow-soft overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent" />
              <CardContent className="relative pt-6">
                <div className="flex items-start gap-4">
                  <motion.div
                    className="p-3 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-sm"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Fuld anonymisering</h3>
                    <p className="text-sm text-muted-foreground">
                      Al eksporteret data er fuldt anonymiseret. Elevnavne, emails og
                      andre identificerbare oplysninger fjernes automatisk.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data Content Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Card className="rounded-2xl border-0 shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Dataindhold</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Trivselsscores pr. kategori og samlet",
                    "Besvarelser på individuelle spørgsmål",
                    "Fase og tidsperiode information",
                    "Svarprocent og non-response data",
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Usage Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card className="relative rounded-2xl border-0 shadow-soft overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent" />
              <CardContent className="relative pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 shadow-sm">
                    <Lock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Anvendelsesformål</h3>
                    <p className="text-sm text-muted-foreground">
                      Data kan bruges til forskningsformål, evalueringer og aggregerede
                      rapporter om TAMU-programmets effekt på unges trivsel.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
