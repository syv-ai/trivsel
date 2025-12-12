import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Plus,
  CheckCircle2,
  Loader2,
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  UserX,
  Send,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { OpenAPI } from "@/client"

export const Route = createFileRoute("/_layout/admin/students")({
  component: AdminStudents,
  head: () => ({
    meta: [
      {
        title: "Elever - Admin - TrivselsTracker",
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

function AdminStudents() {
  const queryClient = useQueryClient()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [newStudentName, setNewStudentName] = useState("")
  const [newStudentEmail, setNewStudentEmail] = useState("")
  const [newStudentPhase, setNewStudentPhase] = useState("indslusning")

  // Fetch students
  const { data: studentsData, isLoading } = useQuery<{
    data: Student[]
    count: number
  }>({
    queryKey: ["admin", "students"],
    queryFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/students/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch students")
      return response.json()
    },
  })

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (data: {
      name: string
      email: string
      phase: string
    }) => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/students/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const text = await response.text()
        let errorMessage = "Kunne ikke oprette elev"
        if (text) {
          try {
            const error = JSON.parse(text)
            errorMessage = error.detail || errorMessage
          } catch {
            errorMessage = text
          }
        }
        throw new Error(errorMessage)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] })
      setAddDialogOpen(false)
      setNewStudentName("")
      setNewStudentEmail("")
      setNewStudentPhase("indslusning")
      toast.success("Elev oprettet")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Deactivate student mutation
  const deactivateStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/students/${studentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to deactivate student")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] })
      toast.success("Elev deaktiveret")
    },
    onError: () => {
      toast.error("Kunne ikke deaktivere elev")
    },
  })

  // Send survey mutation
  const sendSurveyMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(
        `${OpenAPI.BASE}/api/v1/students/${studentId}/send-survey`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      )
      if (!response.ok) {
        const text = await response.text()
        let errorMessage = "Kunne ikke sende trivselstjek"
        if (text) {
          try {
            const error = JSON.parse(text)
            errorMessage = error.detail || errorMessage
          } catch {
            errorMessage = text
          }
        }
        throw new Error(errorMessage)
      }
      return response.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || "Trivselstjek sendt")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Filter students by search query
  const filteredStudents = studentsData?.data.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.internal_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const totalStudents = studentsData?.data.length || 0
  const activeStudents = studentsData?.data.filter(s => s.status === "active").length || 0
  const withConsent = studentsData?.data.filter(s => s.consent_status).length || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Indlæser elever...</p>
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
              <Users className="h-6 w-6 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight">Elever</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Administrer elever i systemet
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <UserPlus className="h-4 w-4 mr-2" />
              Tilføj elev
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Tilføj ny elev
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Navn</Label>
                <Input
                  id="name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Elevens fulde navn"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="elev@example.com"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="phase">Fase</Label>
                <Select
                  value={newStudentPhase}
                  onValueChange={setNewStudentPhase}
                >
                  <SelectTrigger id="phase" className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indslusning">Indslusning</SelectItem>
                    <SelectItem value="hovedforloeb">Hovedforløb</SelectItem>
                    <SelectItem value="udslusning">Udslusning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() =>
                  createStudentMutation.mutate({
                    name: newStudentName,
                    email: newStudentEmail,
                    phase: newStudentPhase,
                  })
                }
                disabled={
                  !newStudentName ||
                  !newStudentEmail ||
                  createStudentMutation.isPending
                }
                className="w-full rounded-xl"
              >
                {createStudentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opretter...
                  </>
                ) : (
                  "Opret elev"
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
        className="grid gap-4 md:grid-cols-3"
      >
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-sm text-muted-foreground">Elever i alt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{activeStudents}</p>
                <p className="text-sm text-muted-foreground">Aktive elever</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{withConsent}</p>
                <p className="text-sm text-muted-foreground">Med samtykke</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search & Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-soft border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Alle elever</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søg efter elev..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 rounded-xl"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Elev</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Fase</TableHead>
                    <TableHead className="font-semibold">Samtykke</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Oprettet</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredStudents?.map((student, idx) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.03 }}
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
                        <TableCell className="text-muted-foreground">
                          {student.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={phaseColors[student.phase]}>
                            {phaseLabels[student.phase] || student.phase}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {student.consent_status ? (
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
                          <Badge
                            variant="outline"
                            className={cn(
                              student.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                            )}
                          >
                            {student.status === "active" ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(student.created_at).toLocaleDateString("da-DK")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {student.status === "active" && student.consent_status && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  sendSurveyMutation.mutate(student.id)
                                }
                                disabled={sendSurveyMutation.isPending}
                                className="rounded-lg text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Send tjek
                              </Button>
                            )}
                            {student.status === "active" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  deactivateStudentMutation.mutate(student.id)
                                }
                                disabled={deactivateStudentMutation.isPending}
                                className="rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Deaktiver
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {(!filteredStudents || filteredStudents.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-3"
                        >
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                            <Users className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground">
                            {searchQuery ? "Ingen elever matcher søgningen" : "Ingen elever endnu"}
                          </p>
                          {!searchQuery && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAddDialogOpen(true)}
                              className="rounded-xl"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Tilføj første elev
                            </Button>
                          )}
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
