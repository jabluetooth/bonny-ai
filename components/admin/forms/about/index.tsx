import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileTab } from "./profile-tab"
import { BackgroundTab } from "./background-tab"
import { InterestsTab } from "./interests-tab"
import { VisionTab } from "./vision-tab"

export function AdminAboutForm() {
    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">About Section</h1>
                <p className="text-sm text-muted-foreground">Manage your bio, background, interests, and vision.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="background">Background</TabsTrigger>
                    <TabsTrigger value="interests">Interests</TabsTrigger>
                    <TabsTrigger value="vision">Vision</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <ProfileTab />
                </TabsContent>

                <TabsContent value="background" className="space-y-4">
                    <BackgroundTab />
                </TabsContent>

                <TabsContent value="interests" className="space-y-4">
                    <InterestsTab />
                </TabsContent>

                <TabsContent value="vision" className="space-y-4">
                    <VisionTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
