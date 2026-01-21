"use client"

export default function Page() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <h2 className="text-3xl font-bold tracking-tight">Data Control</h2>
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                        No tasks available
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Data control tasks will appear here.
                    </p>
                </div>
            </div>
        </div>
    )
}
