"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api/axios";

import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ChatMessage = {
  _id: string;
  sender: {
    name: string;
    email: string;
    role: string;
  };
  text: string;
  createdAt: string;
};

export default function JobChatLogPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const loadChat = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/admin/chats/jobs/${jobId}/messages`);
        setMessages(res.data.messages || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load chat logs.");
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [jobId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>← Back</Button>
        <ModuleHeader
          title={`Job Chat Log`}
          description={`Viewing conversation history for Job ID: ${jobId}`}
        />
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Conversation History</span>
            <Badge variant="outline" className="font-mono">{jobId}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-20 text-center text-sm text-muted-foreground">Loading chat logs...</div>
          ) : error ? (
            <div className="py-20 text-center text-sm text-red-600">{error}</div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground">No messages found for this job.</div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m._id} className="flex flex-col border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{m.sender?.name}</span>
                      <Badge variant="secondary" className="text-[10px] h-4">{m.sender?.role}</Badge>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}