"use client"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, FileText, X, Link, ExternalLink, Download } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ResumeUploaderProps {
    /** Storage bucket name (default: "portfolio") */
    bucketName?: string
    /** Folder path within bucket */
    folder?: string
    /** Current resume URL */
    value?: string | null
    /** Callback when resume URL changes */
    onChange: (url: string) => Promise<boolean>
    /** Callback when resume is deleted */
    onDelete: () => Promise<boolean>
    /** Whether an operation is in progress */
    isLoading?: boolean
    /** Label text */
    label?: string
    /** Max file size in MB (default: 10) */
    maxSizeMB?: number
    /** Custom class for the container */
    className?: string
}

export function ResumeUploader({
    bucketName = "portfolio",
    folder = "resume",
    value = null,
    onChange,
    onDelete,
    isLoading = false,
    label = "Resume / CV",
    maxSizeMB = 10,
    className
}: ResumeUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [urlInput, setUrlInput] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const getPublicUrl = (path: string) => {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${path}`
    }

    const generateFilePath = (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const basePath = folder ? `${folder}/` : ""
        return `${basePath}resume-${timestamp}-${randomId}.${ext}`
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validation - allow PDF, DOC, DOCX
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ]

        if (!allowedTypes.includes(file.type)) {
            toast.error("Please select a PDF or Word document")
            return
        }

        const maxBytes = maxSizeMB * 1024 * 1024
        if (file.size > maxBytes) {
            toast.error(`File must be smaller than ${maxSizeMB}MB`)
            return
        }

        try {
            setIsUploading(true)

            const filePath = generateFilePath(file)

            const { error } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, {
                    cacheControl: '31536000',
                    upsert: false
                })

            if (error) throw error

            const publicUrl = getPublicUrl(filePath)
            await onChange(publicUrl)

        } catch (error: any) {
            console.error("Upload error:", error)
            if (error.message?.includes("Bucket not found")) {
                toast.error(`Storage bucket "${bucketName}" not found. Please create it in Supabase Dashboard.`)
            } else {
                toast.error(error.message || "Failed to upload resume")
            }
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleUrlSubmit = async () => {
        if (urlInput.trim()) {
            await onChange(urlInput.trim())
            setUrlInput("")
            setShowUrlInput(false)
        }
    }

    const handleClear = async () => {
        await onDelete()
    }

    const handleTriggerClick = () => {
        fileInputRef.current?.click()
    }

    const getFileName = (url: string) => {
        try {
            const pathname = new URL(url).pathname
            const segments = pathname.split('/')
            return segments[segments.length - 1] || "Resume"
        } catch {
            return "Resume"
        }
    }

    const busy = isUploading || isLoading

    return (
        <div className={cn("space-y-3", className)}>
            <Label>{label}</Label>

            {/* Current File Display */}
            <div
                className={cn(
                    "relative border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/50",
                    "transition-colors hover:border-muted-foreground/50",
                    "min-h-[120px] flex items-center justify-center",
                    !value && "cursor-pointer"
                )}
                onClick={!value ? handleTriggerClick : undefined}
            >
                {value ? (
                    <div className="flex items-center gap-4 p-4 w-full">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{getFileName(value)}</p>
                            <p className="text-xs text-muted-foreground truncate">{value}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(value, '_blank')
                                }}
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleClear()
                                }}
                                disabled={busy}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-6">
                        <FileText className="h-10 w-10 mb-2" />
                        <p className="text-sm">Click to upload your resume</p>
                        <p className="text-xs">PDF or Word document</p>
                    </div>
                )}

                {busy && (
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
                    disabled={busy}
                >
                    {busy ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="mr-2 h-4 w-4" />
                    )}
                    {value ? "Replace" : "Upload"}
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    disabled={busy}
                >
                    <Link className="mr-2 h-4 w-4" />
                    Use URL
                </Button>

                <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {/* External URL Input */}
            {showUrlInput && (
                <div className="flex gap-2">
                    <Input
                        placeholder="https://example.com/resume.pdf"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                handleUrlSubmit()
                            }
                        }}
                        disabled={busy}
                    />
                    <Button type="button" size="sm" onClick={handleUrlSubmit} disabled={busy}>
                        Set
                    </Button>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Max {maxSizeMB}MB. PDF, DOC, or DOCX files. This will be available for visitors to download.
            </p>
        </div>
    )
}
