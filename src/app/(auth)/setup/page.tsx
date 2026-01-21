import { type Metadata } from "next"
import Image from "next/image"

import { ProfileSetupForm } from "@/components/auth/profile-setup-form"

export const metadata: Metadata = {
    title: "Profile Setup",
    description: "Complete your profile to get started.",
}

export default function ProfileSetupPage() {
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
                            &ldquo;Welcome! Let&apos;s get you set up.&rdquo;
                        </p>
                    </blockquote>
                </div>
            </div>
            <div className="flex h-full items-center justify-center lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Profile Setup
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            We just need a few details from you.
                        </p>
                    </div>
                    <ProfileSetupForm />
                </div>
            </div>
        </div>
    )
}
