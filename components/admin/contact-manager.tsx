"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import * as Icons from "lucide-react";

interface ContactLink {
    id: string;
    platform: string;
    url: string;
    icon: string;
    is_active: boolean;
}

export function ContactManager() {
    const [links, setLinks] = useState<ContactLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // New Link State
    const [newPlatform, setNewPlatform] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [newIcon, setNewIcon] = useState("Link"); // Default icon

    useEffect(() => {
        fetchLinks();
    }, []);

    async function fetchLinks() {
        try {
            const { data, error } = await supabase
                .from('contact_links')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setLinks(data || []);
        } catch (error) {
            console.error('Error fetching links:', error);
            toast.error("Failed to load contact links");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAddLink() {
        if (!newPlatform || !newUrl) {
            toast.error("Please fill in Platform and URL");
            return;
        }

        try {
            const { error } = await supabase
                .from('contact_links')
                .insert({
                    platform: newPlatform,
                    url: newUrl,
                    icon: newIcon,
                    is_active: true
                });

            if (error) throw error;

            toast.success("Link added successfully");
            setNewPlatform("");
            setNewUrl("");
            setNewIcon("Link");
            fetchLinks();
        } catch (error) {
            console.error('Error adding link:', error);
            toast.error("Failed to add link");
        }
    }

    async function handleDelete(id: string) {
        try {
            const { error } = await supabase
                .from('contact_links')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setLinks(links.filter(l => l.id !== id));
            toast.success("Link deleted");
        } catch (error) {
            console.error('Error deleting link:', error);
            toast.error("Failed to delete link");
        }
    }

    async function toggleActive(id: string, currentState: boolean) {
        try {
            const { error } = await supabase
                .from('contact_links')
                .update({ is_active: !currentState })
                .eq('id', id);

            if (error) throw error;

            setLinks(links.map(l => l.id === id ? { ...l, is_active: !currentState } : l));
        } catch (error) {
            console.error('Error updating link:', error);
            toast.error("Failed to update status");
        }
    }

    // Helper to verify icon exists
    const isValidIcon = (name: string) => {
        // @ts-ignore
        return !!Icons[name];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Contact Links</CardTitle>
                <CardDescription>Manage your social media and contact links visible to the AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Add New Link Section */}
                <div className="grid gap-4 p-4 border rounded-lg bg-muted/20">
                    <h3 className="font-medium text-sm">Add New Link</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="platform">Platform</Label>
                            <Input
                                id="platform"
                                placeholder="e.g. GitHub"
                                value={newPlatform}
                                onChange={(e) => setNewPlatform(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                id="url"
                                placeholder="https://..."
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon (Lucide)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="icon"
                                    placeholder="Github"
                                    value={newIcon}
                                    onChange={(e) => setNewIcon(e.target.value)}
                                />
                                <div className="flex items-center justify-center w-10 h-10 border rounded bg-background">
                                    {/* @ts-ignore */}
                                    {isValidIcon(newIcon) ? React.createElement(Icons[newIcon], { size: 18 }) : <Icons.HelpCircle size={18} />}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleAddLink} className="w-full md:w-auto self-end">
                        <Plus className="w-4 h-4 mr-2" /> Add Link
                    </Button>
                </div>

                {/* List Section */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Icon</TableHead>
                                <TableHead>Platform</TableHead>
                                <TableHead className="hidden md:table-cell">URL</TableHead>
                                <TableHead className="w-[100px]">Active</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                                </TableRow>
                            ) : links.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No links added yet.</TableCell>
                                </TableRow>
                            ) : (
                                links.map((link) => (
                                    <TableRow key={link.id}>
                                        <TableCell>
                                            {/* @ts-ignore */}
                                            {isValidIcon(link.icon) ? React.createElement(Icons[link.icon], { size: 18 }) : <Icons.Link size={18} />}
                                        </TableCell>
                                        <TableCell className="font-medium">{link.platform}</TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[200px]">
                                            <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center hover:text-primary">
                                                {link.url} <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={link.is_active}
                                                onCheckedChange={() => toggleActive(link.id, link.is_active)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive/90"
                                                onClick={() => handleDelete(link.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
