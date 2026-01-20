"use client"

import * as React from "react"
import { db } from "@/lib/db"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/registry/new-york/ui/select" // Adapted
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { LogOut } from "lucide-react"

interface AccountSwitcherProps {
    isCollapsed: boolean
    accounts: {
        label: string
        email: string
        icon: React.ReactNode
    }[]
}

export function AccountSwitcher({
    isCollapsed,
    accounts,
}: AccountSwitcherProps) {
    const router = useRouter()
    const [selectedAccount, setSelectedAccount] = React.useState<string>(
        accounts[0].email
    )

    const handleValueChange = async (value: string) => {
        if (value === "logout") {
            try {
                await db.auth.signOut()
                router.push("/login")
            } catch (err) {
                console.error("Failed to sign out", err)
            }
        } else {
            setSelectedAccount(value)
        }
    }

    return (
        <Select defaultValue={selectedAccount} onValueChange={handleValueChange}>
            <SelectTrigger
                className={cn(
                    "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
                    isCollapsed &&
                    "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
                )}
                aria-label="Select account"
            >
                <SelectValue placeholder="Select an account">
                    {accounts.find((account) => account.email === selectedAccount)?.icon}
                    <span className={cn("ml-2", isCollapsed && "hidden")}>
                        {
                            accounts.find((account) => account.email === selectedAccount)
                                ?.label
                        }
                    </span>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {accounts.map((account) => (
                    <SelectItem key={account.email} value={account.email}>
                        <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
                            {account.icon}
                            {account.email}
                        </div>
                    </SelectItem>
                ))}
                <SelectItem value="logout">
                    <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground text-red-500">
                        <LogOut />
                        Log out
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    )
}
