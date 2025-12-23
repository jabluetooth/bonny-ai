"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

export function useAdminSettings() {
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [notificationsEnabled, setNotificationsEnabled] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        // Load initial state from localStorage
        const storedSound = localStorage.getItem("admin_sound_enabled")
        const storedNotif = localStorage.getItem("admin_notifications_enabled")

        if (storedSound !== null) {
            setSoundEnabled(storedSound === "true")
        }

        // For notifications, we also need to check actual browser permission
        // If stored says true but browser says denied, we must flip to false
        if (storedNotif === "true") {
            if ("Notification" in window && Notification.permission === "granted") {
                setNotificationsEnabled(true)
            } else {
                setNotificationsEnabled(false)
                localStorage.setItem("admin_notifications_enabled", "false")
            }
        } else {
            setNotificationsEnabled(false)
        }
        setIsLoaded(true)
    }, [])

    const toggleSound = (enabled: boolean) => {
        setSoundEnabled(enabled)
        localStorage.setItem("admin_sound_enabled", String(enabled))
    }

    const toggleNotifications = async (enabled: boolean) => {
        if (enabled) {
            // Requesting to turn ON
            if (!("Notification" in window)) {
                toast.error("This browser does not support desktop notifications")
                return
            }

            if (Notification.permission === "granted") {
                setNotificationsEnabled(true)
                localStorage.setItem("admin_notifications_enabled", "true")
            } else if (Notification.permission !== "denied") {
                const permission = await Notification.requestPermission()
                if (permission === "granted") {
                    setNotificationsEnabled(true)
                    localStorage.setItem("admin_notifications_enabled", "true")
                    new Notification("Notifications Enabled", { body: "You will now be notified of new messages." })
                } else {
                    toast.error("Permission denied. check browser settings.")
                    setNotificationsEnabled(false)
                    localStorage.setItem("admin_notifications_enabled", "false")
                }
            } else {
                toast.error("Permission denied previously. Please reset browser settings.")
            }
        } else {
            // Requesting to turn OFF
            setNotificationsEnabled(false)
            localStorage.setItem("admin_notifications_enabled", "false")
        }
    }

    return {
        soundEnabled,
        setSoundEnabled: toggleSound,
        notificationsEnabled,
        setNotificationsEnabled: toggleNotifications,
        isLoaded
    }
}
