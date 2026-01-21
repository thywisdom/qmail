"use client"

import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive"
import { SectionCards } from "@/components/dashboard/section-cards"


export default function Page() {
    // Placeholder fetching for analytics - in real implementation this would query 'boxes'
    // const { data } = db.useQuery({ boxes: { $: { where: { userEmail: user.email } } } }) 

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            <SectionCards />
            <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min">
                <ChartAreaInteractive />
            </div>
        </div>
    )
}

