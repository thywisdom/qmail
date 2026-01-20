import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const nonce = crypto.randomUUID();
    const session = request.cookies.get("__session")?.value;
    const url = request.nextUrl.clone();

    // If user is authenticated and tries to access auth pages, redirect to mail
    if (session && (url.pathname === "/login" || url.pathname === "/")) {
        url.pathname = "/mail";
        return NextResponse.redirect(url);
    }

    // If user is NOT authenticated and tries to access protected pages, redirect to login
    if (!session && url.pathname.startsWith("/mail")) {
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/login", "/mail/:path*"],
};
