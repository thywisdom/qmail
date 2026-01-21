import { IconArchive, IconInbox, IconSend, IconTrash } from "@tabler/icons-react"
import { db } from "@/lib/db"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card"

export function SectionCards() {
  const { user } = db.useAuth()

  // In real app, querying counts
  // For now we can use db.useQuery to get all boxes for user and filter client side or use component state if centralized 
  // Optimization: The 'total' counts should ideally be aggregations. 
  // For now, let's fetch 'boxes' and count.

  const { data } = db.useQuery(user?.email ? {
    boxes: {
      $: {
        where: { userEmail: user.email }
      }
    }
  } : null)

  const boxes = data?.boxes || []

  const inboxCount = boxes.filter((b: { status: string }) => b.status === 'inbox').length
  const sentCount = boxes.filter((b: { status: string }) => b.status === 'sent').length
  const trashCount = boxes.filter((b: { status: string }) => b.status === 'trash').length
  const archiveCount = boxes.filter((b: { status: string }) => b.status === 'archive').length

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inbox</CardTitle>
          <IconInbox className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inboxCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sent</CardTitle>
          <IconSend className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sentCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Archive</CardTitle>
          <IconArchive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{archiveCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trash</CardTitle>
          <IconTrash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{trashCount}</div>
        </CardContent>
      </Card>
    </div>
  )
}

