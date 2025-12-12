import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Pencil,
  GripVertical,
  Loader2,
  HelpCircle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { OpenAPI } from "@/client"

export const Route = createFileRoute("/_layout/admin/questions")({
  component: AdminQuestions,
  head: () => ({
    meta: [
      {
        title: "Spørgsmål - Admin - TrivselsTracker",
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

const phaseLabels: Record<string, string> = {
  all: "Alle faser",
  indslusning: "Indslusning",
  hovedforloeb: "Hovedforløb",
  udslusning: "Udslusning",
}

function AdminQuestions() {
  const queryClient = useQueryClient()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null)
  const [newQuestion, setNewQuestion] = useState({
    category: "",
    phase: "all",
    question_text_da: "",
  })

  // Fetch questions
  const { data: questionsData, isLoading } = useQuery<{
    data: SurveyQuestion[]
    count: number
  }>({
    queryKey: ["admin", "questions"],
    queryFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/questions/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch questions")
      return response.json()
    },
  })

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: {
      category: string
      phase: string
      question_text_da: string
    }) => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/questions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to create question")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] })
      setAddDialogOpen(false)
      setNewQuestion({ category: "", phase: "all", question_text_da: "" })
      toast.success("Spørgsmål oprettet")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async (data: {
      id: string
      category?: string
      phase?: string
      question_text_da?: string
      is_active?: boolean
    }) => {
      const { id, ...updateData } = data
      const response = await fetch(`${OpenAPI.BASE}/api/v1/questions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(updateData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to update question")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] })
      setEditDialogOpen(false)
      setEditingQuestion(null)
      toast.success("Spørgsmål opdateret")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const openEditDialog = (question: SurveyQuestion) => {
    setEditingQuestion(question)
    setEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Indlæser spørgsmål...</p>
        </motion.div>
      </div>
    )
  }

  // Group questions by category
  const questionsByCategory = questionsData?.data.reduce(
    (acc, q) => {
      if (!acc[q.category]) acc[q.category] = []
      acc[q.category].push(q)
      return acc
    },
    {} as Record<string, SurveyQuestion[]>
  )

  const totalQuestions = questionsData?.data.length || 0

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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="p-2.5 rounded-xl bg-primary/10"
            >
              <HelpCircle className="h-6 w-6 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight">Spørgsmål</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Administrer trivselstjek spørgsmål
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Tilføj spørgsmål
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Tilføj nyt spørgsmål
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={newQuestion.category}
                  onValueChange={(value) =>
                    setNewQuestion((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger id="category" className="mt-1.5 rounded-xl">
                    <SelectValue placeholder="Vælg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span>{categoryIcons[key]}</span>
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phase">Fase</Label>
                <Select
                  value={newQuestion.phase}
                  onValueChange={(value) =>
                    setNewQuestion((prev) => ({ ...prev, phase: value }))
                  }
                >
                  <SelectTrigger id="phase" className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(phaseLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="question_text">Spørgsmålstekst (dansk)</Label>
                <Textarea
                  id="question_text"
                  value={newQuestion.question_text_da}
                  onChange={(e) =>
                    setNewQuestion((prev) => ({
                      ...prev,
                      question_text_da: e.target.value,
                    }))
                  }
                  placeholder="Skriv spørgsmålet her..."
                  className="mt-1.5 rounded-xl"
                  rows={3}
                />
              </div>
              <Button
                onClick={() => createQuestionMutation.mutate(newQuestion)}
                disabled={
                  !newQuestion.category ||
                  !newQuestion.question_text_da ||
                  createQuestionMutation.isPending
                }
                className="w-full rounded-xl"
              >
                {createQuestionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opretter...
                  </>
                ) : (
                  "Opret spørgsmål"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
      >
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalQuestions}</p>
                <p className="text-sm text-muted-foreground">I alt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <Card key={key} className="shadow-soft border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="text-2xl">{categoryIcons[key]}</div>
                <div>
                  <p className="text-2xl font-bold">
                    {questionsByCategory?.[key]?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Questions by category */}
      {Object.entries(categoryLabels).map(([category, label], catIdx) => {
        const questions = questionsByCategory?.[category] || []
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + catIdx * 0.05 }}
          >
            <Card className="shadow-soft border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoryIcons[category]}</span>
                    <CardTitle className="text-lg">{label}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {questions.length} spørgsmål
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-12 font-semibold">#</TableHead>
                        <TableHead className="font-semibold">Spørgsmål</TableHead>
                        <TableHead className="w-32 font-semibold">Fase</TableHead>
                        <TableHead className="w-24 font-semibold">Aktiv</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {questions
                          .sort((a, b) => a.order - b.order)
                          .map((question, idx) => (
                            <motion.tr
                              key={question.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              className="group hover:bg-muted/50 transition-colors"
                            >
                              <TableCell>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <GripVertical className="h-4 w-4" />
                                  <span className="font-mono">{idx + 1}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className={cn(
                                  "leading-relaxed",
                                  !question.is_active && "text-muted-foreground"
                                )}>
                                  {question.question_text_da}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {phaseLabels[question.phase] || question.phase}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {question.is_active ? (
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm text-emerald-700">Ja</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                    <span className="text-sm text-muted-foreground">Nej</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(question)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                      </AnimatePresence>
                      {questions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <p className="text-muted-foreground">
                              Ingen spørgsmål i denne kategori
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Rediger spørgsmål
            </DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-category">Kategori</Label>
                <Select
                  value={editingQuestion.category}
                  onValueChange={(value) =>
                    setEditingQuestion((prev) =>
                      prev ? { ...prev, category: value } : null
                    )
                  }
                >
                  <SelectTrigger id="edit-category" className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span>{categoryIcons[key]}</span>
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-phase">Fase</Label>
                <Select
                  value={editingQuestion.phase}
                  onValueChange={(value) =>
                    setEditingQuestion((prev) =>
                      prev ? { ...prev, phase: value } : null
                    )
                  }
                >
                  <SelectTrigger id="edit-phase" className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(phaseLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-question-text">Spørgsmålstekst (dansk)</Label>
                <Textarea
                  id="edit-question-text"
                  value={editingQuestion.question_text_da}
                  onChange={(e) =>
                    setEditingQuestion((prev) =>
                      prev ? { ...prev, question_text_da: e.target.value } : null
                    )
                  }
                  className="mt-1.5 rounded-xl"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <Label htmlFor="edit-active" className="cursor-pointer">Aktiv</Label>
                <Switch
                  id="edit-active"
                  checked={editingQuestion.is_active}
                  onCheckedChange={(checked: boolean) =>
                    setEditingQuestion((prev) =>
                      prev ? { ...prev, is_active: checked } : null
                    )
                  }
                />
              </div>
              <Button
                onClick={() =>
                  updateQuestionMutation.mutate({
                    id: editingQuestion.id,
                    category: editingQuestion.category,
                    phase: editingQuestion.phase,
                    question_text_da: editingQuestion.question_text_da,
                    is_active: editingQuestion.is_active,
                  })
                }
                disabled={
                  !editingQuestion.question_text_da ||
                  updateQuestionMutation.isPending
                }
                className="w-full rounded-xl"
              >
                {updateQuestionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gemmer...
                  </>
                ) : (
                  "Gem ændringer"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
