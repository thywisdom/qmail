"use client"

import * as React from "react"
import { db } from "@/lib/db"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    LogOut,
    LayoutDashboard,
    ChevronsUpDown,
    CreditCard,
    Bell,
    Sparkles,
    BadgeCheck
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface AccountProps {
    isCollapsed: boolean
    accounts: {
        label: string
        email: string
        icon: React.ReactNode
    }[]
}

export function Account({
    isCollapsed,
    accounts,
}: AccountProps) {
    const router = useRouter()
    const { user } = db.useAuth()

    const displayEmail = user?.email || accounts[0]?.email || "user@example.com"
    const displayLabel = accounts.find(a => a.email === displayEmail)?.label || "User"
    // Extract initials for avatar fallback
    const initials = displayLabel.substring(0, 2).toUpperCase()

    const handleLogout = async () => {
        try {
            await db.auth.signOut()
            router.push("/login")
        } catch (err) {
            console.error("Failed to sign out", err)
        }
    }

    const handleDashboard = () => {
        router.push("/dashboard")
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="lg"
                    className={cn(
                        "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                        "w-full justify-start pl-0 pr-0",
                        isCollapsed ? "justify-center px-0" : "px-2"
                    )}
                >
                    <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src="" /> {/* Placeholder for avatar URL if available */}
                        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>

                    {!isCollapsed && (
                        <>
                            <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                                <span className="truncate font-semibold">{displayLabel}</span>
                                <span className="text-muted-foreground truncate text-xs">
                                    {displayEmail}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isCollapsed ? "right" : "top"} // Adjust side based on collapse state preference, or keep simple
                align="end"
                sideOffset={4}
            >
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src="" />
                            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{displayLabel}</span>
                            <span className="text-muted-foreground truncate text-xs">
                                {displayEmail}
                            </span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <BadgeCheck className="mr-2 h-4 w-4" />
                        Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDashboard}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
