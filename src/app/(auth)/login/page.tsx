import { type Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { UserAuthForm } from "@/components/auth/user-auth-form"

export const metadata: Metadata = {
    title: "Authentication",
    description: "Authentication forms built using the components.",
}

export default function AuthenticationPage() {
    return (
        <div className="grid min-h-screen w-full lg:grid-cols-2 overflow-hidden">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/Auth_background.webp"
                        alt="Background"
                        fill
                        className="object-cover opacity-90 brightness-50"
                        priority
                    />
                </div>
                {/* Overlay for text readability if needed, handled by brightness above or extra div */}
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Image
                        src="/images/logo.png"
                        alt="Logo"
                        width={32}
                        height={32}
                        className="mr-2 rounded-full"
                    />
                    Mail App
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;A simple, elegant mail application.&rdquo;
                        </p>
                    </blockquote>
                </div>
            </div>
            <div className="flex h-full items-center justify-center lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Create an account
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your email below to create your account
                        </p>
                    </div>
                    <UserAuthForm />
                    <p className="px-8 text-center text-sm text-muted-foreground">
                        By clicking continue, you agree to our{" "}
                        <Link
                            href="/terms"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                            href="/privacy"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    )
}

