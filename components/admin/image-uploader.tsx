"use client"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Image as ImageIcon, X, Link } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
    /** Storage bucket name (default: "portfolio") */
    bucketName?: string
    /** Folder path within bucket (e.g., "projects", "interests") */
    folder?: string
    /** Current image URL (for editing existing items) */
    value?: string
    /** Callback when image URL changes */
    onChange: (url: string) => void
    /** Label text */
    label?: string
    /** Show URL input for external links */
    allowExternalUrl?: boolean
    /** Aspect ratio for preview (e.g., "16/9", "1/1", "4/3") */
    aspectRatio?: string
    /** Max file size in MB (default: 5) */
    maxSizeMB?: number
    /** Custom class for the container */
    className?: string
}

export function ImageUploader({
    bucketName = "portfolio",
    folder = "",
    value = "",
    onChange,
    label = "Image",
    allowExternalUrl = true,
    aspectRatio = "16/9",
    maxSizeMB = 5,
    className
}: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [urlInput, setUrlInput] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const getPublicUrl = (path: string) => {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${path}`
    }

    const generateFilePath = (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const basePath = folder ? `${folder}/` : ""
        return `${basePath}${timestamp}-${randomId}.${ext}`
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validation
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }

        const maxBytes = maxSizeMB * 1024 * 1024
        if (file.size > maxBytes) {
            toast.error(`Image must be smaller than ${maxSizeMB}MB`)
            return
        }

        try {
            setIsUploading(true)

            const filePath = generateFilePath(file)

            const { error } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, {
                    cacheControl: '31536000', // 1 year cache
                    upsert: false
                })

            if (error) throw error

            const publicUrl = getPublicUrl(filePath)
            onChange(publicUrl)
            toast.success("Image uploaded successfully")

        } catch (error: any) {
            console.error("Upload error:", error)
            if (error.message?.includes("Bucket not found")) {
                toast.error(`Storage bucket "${bucketName}" not found. Please create it in Supabase Dashboard.`)
            } else {
                toast.error(error.message || "Failed to upload image")
            }
        } finally {
            setIsUploading(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleUrlSubmit = () => {
        if (urlInput.trim()) {
            onChange(urlInput.trim())
            setUrlInput("")
            setShowUrlInput(false)
            toast.success("Image URL updated")
        }
    }

    const handleClear = () => {
        onChange("")
    }

    const handleTriggerClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className={cn("space-y-3", className)}>
            <Label>{label}</Label>

            {/* Preview Area */}
            <div
                className={cn(
                    "relative border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/50",
                    "transition-colors hover:border-muted-foreground/50",
                    !value && "cursor-pointer"
                )}
                style={{ aspectRatio }}
                onClick={!value ? handleTriggerClick : undefined}
            >
                {value ? (
                    <>
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='12'%3EError%3C/text%3E%3C/svg%3E"
                            }}
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleClear()
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10 mb-2" />
                        <p className="text-sm">Click to upload</p>
                        <p className="text-xs">or drag and drop</p>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTriggerClick}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="mr-2 h-4 w-4" />
                    )}
                    {value ? "Replace" : "Upload"}
                </Button>

                {allowExternalUrl && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                    >
                        <Link className="mr-2 h-4 w-4" />
                        Use URL
                    </Button>
                )}

                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {/* External URL Input */}
            {showUrlInput && (
                <div className="flex gap-2">
                    <Input
                        placeholder="https://example.com/image.jpg"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                handleUrlSubmit()
                            }
                        }}
                    />
                    <Button type="button" size="sm" onClick={handleUrlSubmit}>
                        Set
                    </Button>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Max {maxSizeMB}MB. PNG, JPG, WEBP, or GIF.
            </p>
        </div>
    )
}
