"use client"

import { useState } from "react"
import * as React from "react"
import { db } from "@/lib/db"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
// import { toast } from "sonner" // Assuming sonner is installed, otherwise verify

import { enhanceUserPrompt } from "@/app/actions/enhance-prompt"
import { Sparkles, Loader2 } from "lucide-react"
import { KeyManagement } from "@/components/settings/key-management"

// ... imports remain the same, just appending/merging

export default function AccountPage() {
    const { user } = db.useAuth()

    // Fetch actual user data
    const { data: userData } = db.useQuery(user?.email ? { $users: { $: { where: { email: user.email } } } } : null)
    const userProfile = userData?.$users?.[0]

    const [name, setName] = useState("")
    const [bio, setBio] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("/images/logo.png")
    const [aiRule, setAiRule] = useState("standard")
    const [status, setStatus] = useState("open")
    const [completion, setCompletion] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    // New state for enhancement loading
    const [isEnhancing, setIsEnhancing] = useState(false)

    // Update state when data loads
    React.useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || "")
            setBio(userProfile.bio || "")
            setAvatarUrl(userProfile.avatarUrl || "/images/logo.png")
            setAiRule(userProfile.aiCustomPrompt || "")
            setStatus(userProfile.status || "open")
        }
    }, [userProfile])

    // Calculate completion percentage
    React.useEffect(() => {
        let completed = 0;
        if (name && name !== "shadcn" && name !== "User") completed += 20;
        if (bio && bio.length > 5) completed += 20;
        if (avatarUrl && avatarUrl !== "/images/logo.png") completed += 20;
        if (aiRule && aiRule.length > 10) completed += 20;
        if (status) completed += 20;
        setCompletion(completed);
    }, [name, bio, avatarUrl, aiRule, status])

    const handleSave = async () => {
        if (!user || !userProfile) return
        setIsSaving(true)

        try {
            await db.transact(
                db.tx.$users[userProfile.id].update({
                    name,
                    bio,
                    avatarUrl,
                    aiCustomPrompt: aiRule,
                    status,
                })
            )
            setIsSuccess(true)
            setTimeout(() => setIsSuccess(false), 3000)
        } catch (error) {
            console.error("Failed to save", error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleEnhance = async () => {
        if (!aiRule || aiRule.length < 3) return
        setIsEnhancing(true)
        try {
            const result = await enhanceUserPrompt(aiRule)
            if (result.success && result.text) {
                setAiRule(result.text)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsEnhancing(false)
        }
    }

    if (!user) {
        return <div className="p-8">Please log in to manage your account.</div>
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0 max-w-4xl mx-auto w-full">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
                <p className="text-muted-foreground">Manage your profile information and application preferences.</p>
            </div>

            <Card className="border-l-4 border-l-primary/60 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Profile Completion</CardTitle>
                        <span className="text-sm font-medium text-muted-foreground">{completion}%</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <Progress value={completion} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">Complete your profile to unlock full potential.</p>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Public facing information about you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-2 w-full max-w-md">
                                <Label htmlFor="picture">Profile Picture URL</Label>
                                <Input id="picture" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                                <p className="text-xs text-muted-foreground">Enter a URL for your profile picture. Defaults to local logo if empty.</p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={user.email || ''} disabled className="bg-muted text-muted-foreground" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a little bit about yourself" className="min-h-[100px]" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>AI Custom Role</CardTitle>
                        <CardDescription>Customize the AI assistant&apos;s system role to match your style.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="ai-custom-prompt">Your Custom System Prompt</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                    onClick={handleEnhance}
                                    disabled={isEnhancing || !aiRule}
                                >
                                    {isEnhancing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
                                    Enhance Prompt
                                </Button>
                            </div>
                            <Textarea
                                id="ai-custom-prompt"
                                value={aiRule}
                                onChange={(e) => setAiRule(e.target.value)}
                                placeholder="e.g. 'Always sign off with Best, Suman. Be concise and professional.'"
                                className="min-h-[120px] font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                This prompt will be appended to the system&apos;s default instructions when generating drafts.
                            </p>
                        </div>

                        <div className="rounded-md bg-muted p-4">
                            <h4 className="mb-2 text-sm font-semibold">Application System Prompt (Context)</h4>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                                {`You are an AI Mail Assistant.
Given a subject and short content, generate a complete, well‑structured email.

Tasks:
- Expand minimal input into a clear draft.
- Infer user intent and fill missing details naturally.
- Customize tone based on user instructions.

[YOUR CUSTOM PROMPT WILL BE INSERTED HERE]`}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2">
                    <KeyManagement />
                </div>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Availability Status</CardTitle>
                        <CardDescription>Set your current working status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Current Status</Label>
                            <div className="flex flex-wrap gap-2">
                                {['open', 'busy', 'dnd', 'confidential'].map((s) => (
                                    <Button
                                        key={s}
                                        variant={status === s ? "default" : "outline"}
                                        onClick={() => setStatus(s)}
                                        className="capitalize flex-1"
                                        size="sm"
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">Visible to other team members.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-4 pb-8">
                <Button
                    onClick={handleSave}
                    size="lg"
                    className={cn(
                        "w-full md:w-auto px-8 transition-all duration-300",
                        isSuccess ? "bg-green-600 hover:bg-green-700" : ""
                    )}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>Saving...</>
                    ) : isSuccess ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Changes Saved
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </div>
        </div>
    )
}
