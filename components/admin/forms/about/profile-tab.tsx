"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

export function ProfileTab() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [profileId, setProfileId] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('author_profiles')
            .select('*')
            .eq('is_active', true)
            .maybeSingle()

        if (data) {
            setTitle(data.title || "")
            setDescription(data.description || "")
            if (data.images && data.images.length > 0) {
                setImageUrl(data.images[0])
            }
            setProfileId(data.id)
        }
        setIsLoading(false)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const payload = {
                title,
                description,
                images: imageUrl ? [imageUrl] : [],
                is_active: true,
                updated_at: new Date().toISOString()
            }

            let error;
            if (profileId) {
                const result = await supabase.from('author_profiles').update(payload).eq('id', profileId)
                error = result.error
            } else {
                const result = await supabase.from('author_profiles').insert([payload]).select().single()
                if (result.data) setProfileId(result.data.id)
                error = result.error
            }

            if (error) throw error
            toast.success("Profile updated successfully")
        } catch (err: any) {
            console.error(err)
            toast.error("Failed to save: " + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Main Profile</CardTitle>
                <CardDescription>
                    Update the main "About" card introduction.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Title / Headline</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="I'm Fil, a creative engineer" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Bio</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[150px]" placeholder="Short bio..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="image">Profile Image URL</Label>
                    <div className="flex gap-4">
                        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                        {imageUrl && (
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                                <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Profile
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
