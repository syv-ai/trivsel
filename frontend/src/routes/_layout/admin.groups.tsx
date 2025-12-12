import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Users,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  Loader2,
  Search,
  FolderOpen,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { OpenAPI } from "@/client"

export const Route = createFileRoute("/_layout/admin/groups")({
  component: AdminGroups,
  head: () => ({
    meta: [
      {
        title: "Grupper - Admin - TrivselsTracker",
      },
    ],
  }),
})

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  member_count?: number
}

interface Student {
  id: string
  internal_id: string
  name: string
  email: string
  phase: string
  status: string
}

interface GroupMember {
  student_id: string
  student_name: string
  student_internal_id: string
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

function AdminGroups() {
  const queryClient = useQueryClient()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [newGroup, setNewGroup] = useState({ name: "", description: "" })
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch groups
  const { data: groupsData, isLoading } = useQuery<{
    data: Group[]
    count: number
  }>({
    queryKey: ["admin", "groups"],
    queryFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/groups/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch groups")
      return response.json()
    },
  })

  // Fetch students for adding to groups
  const { data: studentsData } = useQuery<{
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

  // Fetch group members
  const { data: groupMembers, refetch: refetchMembers } = useQuery<{
    data: GroupMember[]
    count: number
  }>({
    queryKey: ["admin", "groups", selectedGroup?.id, "members"],
    queryFn: async () => {
      if (!selectedGroup) return { data: [], count: 0 }
      const response = await fetch(`${OpenAPI.BASE}/api/v1/groups/${selectedGroup.id}/members`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch members")
      return response.json()
    },
    enabled: !!selectedGroup,
  })

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/groups/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to create group")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] })
      setAddDialogOpen(false)
      setNewGroup({ name: "", description: "" })
      toast.success("Gruppe oprettet")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (data: {
      id: string
      name?: string
      description?: string
    }) => {
      const { id, ...updateData } = data
      const response = await fetch(`${OpenAPI.BASE}/api/v1/groups/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(updateData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to update group")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] })
      setEditDialogOpen(false)
      setEditingGroup(null)
      toast.success("Gruppe opdateret")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to delete group")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] })
      toast.success("Gruppe slettet")
    },
    onError: () => {
      toast.error("Kunne ikke slette gruppe")
    },
  })

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: { groupId: string; studentId: string }) => {
      const response = await fetch(`${OpenAPI.BASE}/api/v1/groups/${data.groupId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ student_id: data.studentId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to add member")
      }
      return response.json()
    },
    onSuccess: () => {
      refetchMembers()
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] })
      setSelectedStudentId("")
      toast.success("Elev tilføjet til gruppen")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (data: { groupId: string; studentId: string }) => {
      const response = await fetch(
        `${OpenAPI.BASE}/api/v1/groups/${data.groupId}/members/${data.studentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      )
      if (!response.ok) throw new Error("Failed to remove member")
      return response.json()
    },
    onSuccess: () => {
      refetchMembers()
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] })
      toast.success("Elev fjernet fra gruppen")
    },
    onError: () => {
      toast.error("Kunne ikke fjerne elev")
    },
  })

  const openEditDialog = (group: Group) => {
    setEditingGroup(group)
    setEditDialogOpen(true)
  }

  const openMembersDialog = (group: Group) => {
    setSelectedGroup(group)
    setMembersDialogOpen(true)
  }

  // Get students not in the selected group
  const availableStudents =
    studentsData?.data.filter(
      (student) =>
        student.status === "active" &&
        !groupMembers?.data.some((m) => m.student_id === student.id)
    ) || []

  // Filter groups by search
  const filteredGroups =
    groupsData?.data.filter(
      (group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

  // Calculate stats
  const totalGroups = groupsData?.data.length ?? 0
  const totalMembers =
    groupsData?.data.reduce((acc, g) => acc + (g.member_count ?? 0), 0) ?? 0
  const activeGroups =
    groupsData?.data.filter((g) => (g.member_count ?? 0) > 0).length ?? 0

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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Grupper
          </h1>
          <p className="text-muted-foreground mt-1">
            Organiser elever i grupper til lettere administration
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-soft hover-lift gap-2">
              <Plus className="h-4 w-4" />
              Opret gruppe
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Opret ny gruppe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Navn</Label>
                <Input
                  id="name"
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Gruppenavn"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="description">Beskrivelse (valgfri)</Label>
                <Textarea
                  id="description"
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Beskrivelse af gruppen..."
                  rows={3}
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <Button
                onClick={() => createGroupMutation.mutate(newGroup)}
                disabled={!newGroup.name || createGroupMutation.isPending}
                className="w-full rounded-xl h-11"
              >
                {createGroupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opretter...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Opret gruppe
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Grupper i alt"
          value={totalGroups}
          icon={FolderOpen}
          color="bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-700"
          delay={0}
        />
        <StatCard
          title="Aktive grupper"
          value={activeGroups}
          icon={Users}
          color="bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-700"
          delay={0.1}
        />
        <StatCard
          title="Medlemmer i alt"
          value={totalMembers}
          icon={UserPlus}
          color="bg-gradient-to-br from-violet-50 to-violet-100/50 text-violet-700"
          delay={0.2}
        />
      </div>

      {/* Search */}
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søg efter grupper..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 rounded-2xl bg-muted/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </motion.div>

      {/* Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredGroups.map((group, index) => (
            <motion.div
              key={group.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                delay: index * 0.05,
                duration: 0.3,
                layout: { duration: 0.2 },
              }}
            >
              <Card className="group rounded-2xl border-0 shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1.5">
                    <CardTitle className="text-lg font-semibold">{group.name}</CardTitle>
                    {group.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(group)}
                      className="h-8 w-8 rounded-xl hover:bg-primary/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGroupMutation.mutate(group.id)}
                      disabled={deleteGroupMutation.isPending}
                      className="h-8 w-8 rounded-xl hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-2xl font-bold">
                          {group.member_count ?? 0}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">
                          {(group.member_count ?? 0) === 1 ? "medlem" : "medlemmer"}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openMembersDialog(group)}
                      className="rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-colors"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Administrer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredGroups.length === 0 && (
          <motion.div
            className="col-span-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="rounded-2xl border-0 shadow-soft">
              <CardContent className="py-16 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                </motion.div>
                <p className="text-lg font-medium">
                  {searchQuery ? "Ingen grupper fundet" : "Ingen grupper oprettet endnu"}
                </p>
                <p className="text-muted-foreground mt-1">
                  {searchQuery
                    ? "Prøv at søge efter noget andet"
                    : "Opret din første gruppe for at komme i gang"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Edit Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Rediger gruppe</DialogTitle>
          </DialogHeader>
          {editingGroup && (
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-name">Navn</Label>
                <Input
                  id="edit-name"
                  value={editingGroup.name}
                  onChange={(e) =>
                    setEditingGroup((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Beskrivelse (valgfri)</Label>
                <Textarea
                  id="edit-description"
                  value={editingGroup.description || ""}
                  onChange={(e) =>
                    setEditingGroup((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  rows={3}
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <Button
                onClick={() =>
                  updateGroupMutation.mutate({
                    id: editingGroup.id,
                    name: editingGroup.name,
                    description: editingGroup.description || undefined,
                  })
                }
                disabled={!editingGroup.name || updateGroupMutation.isPending}
                className="w-full rounded-xl h-11"
              >
                {updateGroupMutation.isPending ? (
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

      {/* Manage Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Add member */}
            <div className="flex gap-2">
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
              >
                <SelectTrigger className="flex-1 rounded-xl">
                  <SelectValue placeholder="Vælg elev at tilføje..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.internal_id})
                    </SelectItem>
                  ))}
                  {availableStudents.length === 0 && (
                    <SelectItem value="_none" disabled>
                      Ingen ledige elever
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={() =>
                  selectedGroup &&
                  addMemberMutation.mutate({
                    groupId: selectedGroup.id,
                    studentId: selectedStudentId,
                  })
                }
                disabled={!selectedStudentId || addMemberMutation.isPending}
                className="rounded-xl"
              >
                {addMemberMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Member list */}
            <div className="rounded-2xl border overflow-hidden">
              <AnimatePresence>
                {groupMembers?.data.map((member, index) => (
                  <motion.div
                    key={member.student_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {member.student_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.student_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.student_internal_id}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        selectedGroup &&
                        removeMemberMutation.mutate({
                          groupId: selectedGroup.id,
                          studentId: member.student_id,
                        })
                      }
                      disabled={removeMemberMutation.isPending}
                      className="rounded-xl hover:bg-red-100 hover:text-red-600"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {(!groupMembers?.data || groupMembers.data.length === 0) && (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Ingen medlemmer i denne gruppe
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
