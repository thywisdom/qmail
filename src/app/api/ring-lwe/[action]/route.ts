import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ action: string }> }
) {
    const { action } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_RING_LWE_URL || "https://ring-lwe.onrender.com";

    // Validate allowed actions to prevent arbitrary proxying
    const allowedActions = ["keygen", "encrypt", "decrypt"];
    if (!allowedActions.includes(action)) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    try {
        const body = await request.json();

        const response = await fetch(`${baseUrl}/${action}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Upstream error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
