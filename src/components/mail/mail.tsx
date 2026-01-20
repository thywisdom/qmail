"use client"

import * as React from "react"
import {
    Archive,
    Inbox,
    Send,
    Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"


import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"

import { AccountSwitcher } from "@/components/mail/account-switcher"
import { MailDisplay } from "@/components/mail/mail-display"
import { MailList } from "@/components/mail/mail-list"
import { Nav } from "@/components/mail/nav"
import { useMail, Mail } from "@/components/mail/use-mail"
import { MailCompose } from "@/components/mail/mail-compose"

interface MailProps {
    accounts: {
        label: string
        email: string
        icon: React.ReactNode
    }[]
    mails: Mail[]
    defaultLayout: number[] | undefined
    defaultCollapsed?: boolean
    navCollapsedSize: number
}

export function MailComponent({
    accounts,
    mails,
    defaultLayout = [20, 32, 48],
    defaultCollapsed = false,
    navCollapsedSize,
}: MailProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
    const [mail, setMail] = useMail()

    // Filter mails based on current view/folder
    // Mails are already filtered by owner in page.tsx data fetching

    const filteredMails = React.useMemo(() => {
        switch (mail.filter) {
            case "inbox":
                return mails.filter(m => m.status === "inbox")
            case "sent":
                return mails.filter(m => m.status === "sent")
            case "trash":
                return mails.filter(m => m.status === "trash")
            case "archive":
                return mails.filter(m => m.status === "archive")
            default:
                return mails.filter(m => m.status === "inbox")
        }
    }, [mails, mail.filter])


    React.useEffect(() => {
        // Basic selection logic: Select first mail if none selected, OR if the currently selected mail is NOT in the filtered list (e.g. moved to trash)
        const isSelectedInList = filteredMails.some(m => m.id === mail.selected)
        if ((!mail.selected || !isSelectedInList) && filteredMails.length > 0) {
            // setMail({ ...mail, selected: filteredMails[0].id }) // Auto-select first? Maybe slightly annoying if it jumps. 
            // Better: Deselect if not found, let user select.
            if (!isSelectedInList && mail.selected) {
                setMail(prev => ({ ...prev, selected: null }))
            }
        }
    }, [filteredMails, mail.selected, setMail])

    // Calculate counts
    const unreadCount = mails.filter(m => !m.read && m.status === "inbox").length
    const trashCount = mails.filter(m => m.status === "trash").length
    const archiveCount = mails.filter(m => m.status === "archive").length


    return (
        <TooltipProvider delayDuration={0}>
            <ResizablePanelGroup
                direction="horizontal"
                onLayout={(sizes: number[]) => {
                    document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
                        sizes
                    )}`
                }}
                className="h-full max-h-[800px] items-stretch"
            >
                <ResizablePanel
                    defaultSize={defaultLayout[0]}
                    collapsedSize={navCollapsedSize}
                    collapsible={true}
                    minSize={15}
                    maxSize={20}
                    onCollapse={() => {
                        setIsCollapsed(true)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                            true
                        )}`
                    }}
                    onResize={() => {
                        setIsCollapsed(false)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                            false
                        )}`
                    }}
                    className={cn(
                        isCollapsed &&
                        "min-w-[50px] transition-all duration-300 ease-in-out"
                    )}
                >
                    <div
                        className={cn(
                            "flex h-[52px] items-center justify-center",
                            isCollapsed ? "h-[52px]" : "px-2"
                        )}
                    >
                        <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
                    </div>
                    <Separator />
                    <div className="p-2">
                        <MailCompose className={isCollapsed ? "justify-center px-0" : ""} />
                    </div>
                    <Separator />
                    <Nav
                        isCollapsed={isCollapsed}
                        links={[
                            {
                                title: "Inbox",
                                label: unreadCount > 0 ? unreadCount.toString() : "",
                                icon: Inbox,
                                variant: mail.filter === "inbox" ? "default" : "ghost",
                                onClick: () => setMail(prev => ({ ...prev, filter: "inbox" }))
                            },
                            // Drafts removed.
                            // Sent functionality implemented via labels.
                            {
                                title: "Sent",
                                label: "",
                                icon: Send,
                                variant: mail.filter === "sent" ? "default" : "ghost",
                                onClick: () => setMail(prev => ({ ...prev, filter: "sent" }))
                            },
                            {
                                title: "Trash",
                                label: trashCount > 0 ? trashCount.toString() : "",
                                icon: Trash2,
                                variant: mail.filter === "trash" ? "default" : "ghost",
                                onClick: () => setMail(prev => ({ ...prev, filter: "trash" }))
                            },
                            {
                                title: "Archive",
                                label: archiveCount > 0 ? archiveCount.toString() : "",
                                icon: Archive,
                                variant: mail.filter === "archive" ? "default" : "ghost",
                                onClick: () => setMail(prev => ({ ...prev, filter: "archive" }))
                            },
                        ]}
                    />
                    <Separator />
                    {/* Removed extra sections as requested */}
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
                    <Tabs defaultValue="all">
                        <div className="flex items-center px-4 py-2">
                            <h1 className="text-xl font-bold capitalize">{mail.filter}</h1>
                            <TabsList className="ml-auto">
                                <TabsTrigger
                                    value="all"
                                    className="text-zinc-600 dark:text-zinc-200"
                                >
                                    All mail
                                </TabsTrigger>
                                <TabsTrigger
                                    value="unread"
                                    className="text-zinc-600 dark:text-zinc-200"
                                >
                                    Unread
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <Separator />

                        <TabsContent value="all" className="m-0">
                            <MailList items={filteredMails} />
                        </TabsContent>
                        <TabsContent value="unread" className="m-0">
                            <MailList items={filteredMails.filter((item) => !item.read)} />
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
                    <MailDisplay
                        mail={mails.find((item) => item.id === mail.selected) || null}
                        mails={mails}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider>
    )
}
