"use client"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, User, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface AvatarUploaderProps {
    bucketName?: string
    filePath: string
    label: string
    defaultPreview?: string
    onUploadComplete?: (url: string) => void
}

export function AvatarUploader({
    bucketName = "avatars",
    filePath,
    label,
    defaultPreview,
    onUploadComplete
}: AvatarUploaderProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(defaultPreview || null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Construct public URL helper
    const getPublicUrl = (path: string) => {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${path}`
    }

    // Initialize preview with timestamp to bust cache if it's the default path
    useState(() => {
        if (filePath && !previewUrl) {
            setPreviewUrl(`${getPublicUrl(filePath)}?t=${Date.now()}`)
        }
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast.error("Image must be smaller than 2MB")
            return
        }

        try {
            setIsLoading(true)

            // Create local preview immediately
            const objectUrl = URL.createObjectURL(file)
            setPreviewUrl(objectUrl)

            // Upload to Supabase Storage
            const { error } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (error) throw error

            toast.success("Avatar updated successfully")

            // Construct the final public URL with cache busting
            const publicUrl = `${getPublicUrl(filePath)}?t=${Date.now()}`

            // Wait a bit for propagation logic if needed, but usually instant for overwrite
            if (onUploadComplete) {
                onUploadComplete(publicUrl)
            }

        } catch (error: any) {
            console.error("Upload error:", error)
            toast.error(error.message || "Failed to upload avatar")
            // Revert preview on error if needed, but treating as "try again" is fine
        } finally {
            setIsLoading(false)
        }
    }

    const handleTriggerClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="flex flex-col gap-3">
            <Label>{label}</Label>
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-muted">
                    <AvatarImage src={previewUrl || ""} className="object-cover" />
                    <AvatarFallback className="bg-muted">
                        <User className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTriggerClick}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="mr-2 h-4 w-4" />
                            )}
                            {isLoading ? "Uploading..." : "Change Image"}
                        </Button>
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Max 2MB. PNG, JPG, or WEBP.
                    </p>
                </div>
            </div>
        </div>
    )
}
