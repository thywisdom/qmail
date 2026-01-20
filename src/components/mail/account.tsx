"use client"

import * as React from "react"
import { db } from "@/lib/db"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { LogOut, LayoutDashboard } from "lucide-react"
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

    // We'll use the first account as the current logged-in user for display purposes 
    // since the original switcher logic implies selection from the list.
    // However, the request says "Account picture on left, Email id on right". 
    // And "on click it must list two option ( Dashboard , Logout )".
    // This suggests it's less of a "Switcher" and more of a "User Profile" menu.
    // The original switcher allowed selecting generic accounts. 
    // I will retain the prop `accounts` to find the current user info if needed, 
    // or just use the first one as "current". 
    // The db.useAuth() hook probably gives the real user.

    const { user } = db.useAuth()

    // Fallback if no auth user, use first from props or generic
    const displayEmail = user?.email || accounts[0]?.email || "user@example.com"
    const displayLabel = accounts.find(a => a.email === displayEmail)?.label || "User"
    // Use the icon from props if available for this email, otherwise default is used in logical display

    const handleLogout = async () => {
        try {
            await db.auth.signOut()
            router.push("/login")
        } catch (err) {
            console.error("Failed to sign out", err)
        }
    }

    const handleDashboard = () => {
        // Placeholder for dashboard navigation - maybe just log or do nothing if no route exists yet
        console.log("Navigate to dashboard")
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("flex w-full items-center gap-2 pl-0 pr-0 hover:bg-transparent", isCollapsed ? "justify-center" : "justify-start px-2")}>
                    {/* Account picture (Avatar) - always visible */}
                    <Avatar className="h-8 w-8">
                        {/* Assuming no specific image URL in accounts prop, using fallback */}
                        <AvatarImage src="" />
                        <AvatarFallback>
                            {displayEmail.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    {/* Email - hidden if collapsed */}
                    {!isCollapsed && (
                        <div className="flex flex-col items-start text-xs overflow-hidden">
                            <span className="font-semibold truncate w-full text-left">{displayEmail}</span>
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem onClick={handleDashboard}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
