import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { Suspense } from "react"

import { type UserPublic, UsersService } from "@/client"
import AddUser from "@/components/Admin/AddUser"
import { columns, type UserTableData } from "@/components/Admin/columns"
import { DataTable } from "@/components/Common/DataTable"
import PendingUsers from "@/components/Pending/PendingUsers"
import useAuth from "@/hooks/useAuth"

function getUsersQueryOptions() {
  return {
    queryFn: () => UsersService.readUsers({ skip: 0, limit: 100 }),
    queryKey: ["users"],
  }
}

export const Route = createFileRoute("/_layout/admin")({
  component: Admin,
  head: () => ({
    meta: [
      {
        title: "Brugere - Admin - TrivselsTracker",
      },
    ],
  }),
})

function UsersTableContent() {
  const { user: currentUser } = useAuth()
  const { data: users } = useSuspenseQuery(getUsersQueryOptions())

  const tableData: UserTableData[] = users.data.map((user: UserPublic) => ({
    ...user,
    isCurrentUser: currentUser?.id === user.id,
  }))

  return <DataTable columns={columns} data={tableData} />
}

function UsersTable() {
  return (
    <Suspense fallback={<PendingUsers />}>
      <UsersTableContent />
    </Suspense>
  )
}

function UsersContent() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brugere</h1>
          <p className="text-muted-foreground">
            Administrer brugerkonti og tilladelser
          </p>
        </div>
        <AddUser />
      </div>
      <UsersTable />
    </div>
  )
}

function Admin() {
  // Check if we're on a child route by looking at the current path
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // If we're on /admin/students, /admin/questions, or /admin/groups, render the child route
  const isChildRoute = pathname !== "/admin" && pathname.startsWith("/admin/")

  if (isChildRoute) {
    return <Outlet />
  }

  return <UsersContent />
}
