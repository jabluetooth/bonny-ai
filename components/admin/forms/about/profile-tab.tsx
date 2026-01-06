"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Save, Plus, X } from "lucide-react"

export function ProfileTab() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)


    const [description, setDescription] = useState("")
    const [status, setStatus] = useState("available_fulltime")
    const [imageUrls, setImageUrls] = useState<string[]>([])
    const [profileId, setProfileId] = useState<string | null>(null)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('author_profiles')
            .select('id, description, images, status, is_active')
            .eq('is_active', true)
            .maybeSingle()

        if (data) {
            setDescription(data.description || "")
            setStatus(data.status || "available_fulltime")
            if (data.images && Array.isArray(data.images)) {
                setImageUrls(data.images)
            } else {
                setImageUrls([])
            }
            setProfileId(data.id)
        }

        setIsLoading(false)
    }

    const addImage = () => setImageUrls([...imageUrls, ""])
    const removeImage = (index: number) => setImageUrls(imageUrls.filter((_, i) => i !== index))
    const updateImage = (index: number, value: string) => {
        const newImages = [...imageUrls]
        newImages[index] = value
        setImageUrls(newImages)
    }

    const DEMO_IMAGES = [
        "https://images.unsplash.com/photo-1507238691140-d94cf395349c?q=80&w=1000&auto=format&fit=crop", // Tech/Code
        "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?q=80&w=1000&auto=format&fit=crop", // Workspace
        "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=1000&auto=format&fit=crop"  // Coding Dark
    ]

    const fillStockImages = () => {
        // Merge current images with demo ones, avoiding duplicates
        const uniqueImages = Array.from(new Set([...imageUrls.filter(u => u), ...DEMO_IMAGES]))
        setImageUrls(uniqueImages)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const payload = {
                description,
                status,
                images: imageUrls.filter(url => url.trim() !== ""),
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
                    <Label htmlFor="status">Availability Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="available_fulltime">🟢 Available for Full-time</SelectItem>
                            <SelectItem value="available_parttime">🟡 Available for Part-time</SelectItem>
                            <SelectItem value="open_for_discussion">🔵 Open for Discussion</SelectItem>
                            <SelectItem value="busy">🔴 Busy / Not Looking</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Bio</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[150px]" placeholder="Short bio..." />
                </div>
                <div className="space-y-4">
                    <Label>Profile Images</Label>

                    {imageUrls.map((url, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <Input
                                value={url}
                                onChange={(e) => updateImage(index, e.target.value)}
                                placeholder="https://..."
                            />
                            {url && (
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                                    <img src={url} alt="Preview" className="h-full w-full object-cover" />
                                </div>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => removeImage(index)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={addImage} className="flex-1">
                            <Plus className="mr-2 h-4 w-4" /> Add Image URL
                        </Button>
                        <Button variant="secondary" size="sm" onClick={fillStockImages} className="flex-1">
                            <Save className="mr-2 h-4 w-4" /> Use Stock Photos
                        </Button>
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
