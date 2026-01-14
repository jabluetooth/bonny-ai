"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

export function useAdminSettings() {
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [notificationsEnabled, setNotificationsEnabled] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Resume state
    const [resumeUrl, setResumeUrl] = useState<string | null>(null)
    const [isUploadingResume, setIsUploadingResume] = useState(false)

    useEffect(() => {
        // Load initial state from localStorage
        if (typeof window === "undefined") return

        const storedSound = localStorage.getItem("admin_sound_enabled")
        const storedNotif = localStorage.getItem("admin_notifications_enabled")

        // Restore Sound
        if (storedSound !== null) {
            setSoundEnabled(storedSound === "true")
        }

        // Restore Notifications with double-check against Browser Permission
        if (storedNotif === "true") {
            if ("Notification" in window) {
                if (Notification.permission === "granted") {
                    setNotificationsEnabled(true)
                } else if (Notification.permission === "denied") {
                    setNotificationsEnabled(false)
                    localStorage.setItem("admin_notifications_enabled", "false")
                } else {
                    // Default/Prompt state - keep enabled UI but might need request
                    setNotificationsEnabled(false) // Safe default until requested
                }
            } else {
                setNotificationsEnabled(false)
            }
        } else {
            setNotificationsEnabled(false)
        }

        // Fetch resume URL from API
        fetchResumeUrl()

        setIsLoaded(true)
    }, [])

    // Fetch current resume URL from API
    const fetchResumeUrl = useCallback(async () => {
        try {
            const res = await fetch("/api/resume")
            if (res.ok) {
                const data = await res.json()
                setResumeUrl(data.resume_url)
            }
        } catch (error) {
            console.error("Failed to fetch resume URL:", error)
        }
    }, [])

    // Update resume URL in database
    const updateResumeUrl = useCallback(async (url: string) => {
        setIsUploadingResume(true)
        try {
            const res = await fetch("/api/resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resume_url: url })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to update resume")
            }

            setResumeUrl(url)
            toast.success("Resume updated successfully!")
            return true
        } catch (error: any) {
            console.error("Failed to update resume:", error)
            toast.error(error.message || "Failed to update resume")
            return false
        } finally {
            setIsUploadingResume(false)
        }
    }, [])

    // Delete resume URL from database
    const deleteResumeUrl = useCallback(async () => {
        setIsUploadingResume(true)
        try {
            const res = await fetch("/api/resume", {
                method: "DELETE"
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to delete resume")
            }

            setResumeUrl(null)
            toast.success("Resume removed successfully!")
            return true
        } catch (error: any) {
            console.error("Failed to delete resume:", error)
            toast.error(error.message || "Failed to delete resume")
            return false
        } finally {
            setIsUploadingResume(false)
        }
    }, [])

    const toggleSound = (enabled: boolean) => {
        setSoundEnabled(enabled)
        localStorage.setItem("admin_sound_enabled", String(enabled))
    }

    const toggleNotifications = async (enabled: boolean) => {
        if (!("Notification" in window)) {
            toast.error("This browser does not support desktop notifications")
            return
        }

        if (enabled) {
            // Turning ON
            if (Notification.permission === "granted") {
                setNotificationsEnabled(true)
                localStorage.setItem("admin_notifications_enabled", "true")
                try {
                    new Notification("Notifications Enabled", { body: "You will now be notified of new messages." })
                } catch (e) {
                    console.error("Notification test failed", e)
                }
            } else if (Notification.permission !== "denied") {
                // Request permission
                const permission = await Notification.requestPermission()
                if (permission === "granted") {
                    setNotificationsEnabled(true)
                    localStorage.setItem("admin_notifications_enabled", "true")
                    new Notification("Notifications Enabled", { body: "You will now be notified of new messages." })
                } else {
                    setNotificationsEnabled(false)
                    localStorage.setItem("admin_notifications_enabled", "false")
                    toast.error("Permission denied. Check browser settings.")
                }
            } else {
                // Denied
                toast.error("Permission denied previously. Please reset browser permissions.")
                setNotificationsEnabled(false)
            }
        } else {
            // Turning OFF
            setNotificationsEnabled(false)
            localStorage.setItem("admin_notifications_enabled", "false")
        }
    }

    return {
        soundEnabled,
        setSoundEnabled: toggleSound,
        notificationsEnabled,
        setNotificationsEnabled: toggleNotifications,
        isLoaded,
        // Resume functions
        resumeUrl,
        isUploadingResume,
        updateResumeUrl,
        deleteResumeUrl,
        fetchResumeUrl
    }
}
