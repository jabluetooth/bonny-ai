'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';

export default function TestChatPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    const addLog = (msg: string) => setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const startChat = async () => {
        setLoading(true);
        addLog('Authenticating anonymously...');
        try {
            const { error: authError } = await supabase.auth.signInAnonymously();
            if (authError) {
                addLog(`Auth Error: ${authError.message}`);
                setLoading(false);
                return;
            }
            addLog('Authenticated. Starting session...');

            const res = await fetch('/api/chat/start', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setConversationId(data.conversationId);
                addLog(`Session Started! Conversation ID: ${data.conversationId}`);
                addLog(`User ID: ${data.userId}`);
            } else {
                addLog(`Error: ${data.error}`);
            }
        } catch (e: any) {
            addLog(`Network Error: ${e.message}`);
        }
        setLoading(false);
    };

    const sendMessage = async () => {
        if (!conversationId) return alert('Start chat first');
        if (!message) return;

        setLoading(true);
        addLog(`Sending: "${message}"`);
        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, content: message }),
            });
            const data = await res.json();
            if (res.ok) {
                if (data.status === 'sent_to_admin') {
                    addLog('Status: Sent to Admin (No AI Reply)');
                } else {
                    addLog(`AI Reply: "${data.reply}"`);
                }
            } else {
                addLog(`Error: ${data.error}`);
            }
        } catch (e: any) {
            addLog(`Network Error: ${e.message}`);
        }
        setLoading(false);
        setMessage('');
    };

    return (
        <div className="p-10 font-mono">
            <h1 className="text-2xl mb-4">Chat API Test Harness</h1>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={startChat}
                    disabled={loading || !!conversationId}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    1. Start Session
                </button>

                <div className="flex gap-2">
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="border p-2 text-black"
                        disabled={!conversationId}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !conversationId}
                        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        2. Send
                    </button>
                </div>
            </div>

            <div className="bg-gray-900 text-green-400 p-4 rounded h-96 overflow-auto">
                {logs.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                ))}
            </div>
        </div>
    );
}
