"use client"

import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { buttonVariants } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavProps {
    isCollapsed: boolean
    links: {
        title: string
        label?: string
        icon: LucideIcon
        variant: "default" | "ghost"
        onClick?: () => void
    }[]
}

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAtom } from "jotai"
import { isQuantumModeAtom } from "@/hooks/use-quantum-mode"
import { useQuantumAuth } from "@/hooks/use-quantum-auth"
import { QuantumLoginDialog } from "./quantum-login-dialog"
import React from "react"
import { toast } from "sonner"

export function Nav({ links, isCollapsed }: NavProps) {
    const [isQuantum, setIsQuantum] = useAtom(isQuantumModeAtom)
    const { isQuantumReady } = useQuantumAuth()
    const [showLogin, setShowLogin] = React.useState(false)

    const handleToggle = (checked: boolean) => {
        if (checked) {
            // Turning ON
            if (isQuantumReady) {
                setIsQuantum(true)
                toast.success("Quantum Mode Active")
            } else {
                // Need login
                setShowLogin(true)
            }
        } else {
            // Turning OFF
            setIsQuantum(false)
        }
    }
    return (
        <div
            data-collapsed={isCollapsed}
            className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
        >
            <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                {links.map((link, index) =>
                    isCollapsed ? (
                        <Tooltip key={index} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <span
                                    onClick={link.onClick}
                                    className={cn(
                                        buttonVariants({ variant: link.variant, size: "icon" }),
                                        "h-9 w-9 cursor-pointer",
                                        link.variant === "default" &&
                                        "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                                    )}
                                >
                                    <link.icon className="h-4 w-4" />
                                    <span className="sr-only">{link.title}</span>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="flex items-center gap-4">
                                {link.title}
                                {link.label && (
                                    <span className="ml-auto text-muted-foreground">
                                        {link.label}
                                    </span>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <span
                            key={index}
                            onClick={link.onClick}
                            className={cn(
                                buttonVariants({ variant: link.variant, size: "sm" }),
                                link.variant === "default" &&
                                "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
                                "justify-start cursor-pointer transition-colors"
                            )}
                        >
                            <link.icon className="mr-2 h-4 w-4" />
                            {link.title}
                            {link.label && (
                                <span
                                    className={cn(
                                        "ml-auto",
                                        link.variant === "default" &&
                                        "text-background dark:text-white"
                                    )}
                                >
                                    {link.label}
                                </span>
                            )}
                        </span>
                    )
                )}
            </nav>


            <div className="mt-auto p-4">
                <QuantumLoginDialog
                    open={showLogin}
                    onOpenChange={setShowLogin}
                    onSuccess={() => {
                        setIsQuantum(true)
                        toast.success("Quantum Mode Active")
                    }}
                />

                <div className={cn(
                    "flex items-center gap-2",
                    isCollapsed ? "justify-center" : "justify-between"
                )}>
                    {!isCollapsed && (
                        <Label htmlFor="quantum-mode" className="text-sm font-medium">
                            QuantumSecure
                        </Label>
                    )}
                    <Switch
                        id="quantum-mode"
                        checked={isQuantum}
                        onCheckedChange={handleToggle}
                        className={isCollapsed ? "scale-75" : ""}
                    />
                </div>
            </div>
        </div>
    )
}
