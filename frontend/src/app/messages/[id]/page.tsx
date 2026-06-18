"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface Message {
  id: number;
  sender_id: number;
  contenu: string;
  image_url: string | null;
  is_lu: boolean;
  created_at: string;
}

interface ConversationDetail {
  id: number;
  client_id: number;
  shop_id: number;
  shop_nom: string;
  order_id: number | null;
  messages: Message[];
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [texte, setTexte] = useState("");

  const { data: conv, isLoading } = useQuery<ConversationDetail>({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const { data } = await api.get(`/messages/${id}`);
      return data;
    },
    refetchInterval: 5000, // polling toutes les 5s
  });

  const sendMessage = useMutation({
    mutationFn: (contenu: string) =>
      api.post(`/messages/${id}/messages`, { contenu }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setTexte("");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages]);

  function handleSend() {
    const t = texte.trim();
    if (!t || sendMessage.isPending) return;
    sendMessage.mutate(t);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-tf-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-tf-border flex-shrink-0">
        <Link href="/messages" className="text-tf-text-muted hover:text-tf-text transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="w-9 h-9 rounded-full bg-tf-black flex items-center justify-center">
          <span className="font-serif text-[13px] text-tf-gold">{conv?.shop_nom?.[0] ?? "?"}</span>
        </div>
        <div>
          <p className="font-sans text-[14px] font-semibold text-tf-text leading-none">{conv?.shop_nom ?? "..."}</p>
          {conv?.order_id && (
            <Link href={`/commandes/${conv.order_id}`} className="font-sans text-[11px] text-tf-gold hover:underline">
              Commande liée
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                <div className="h-10 w-48 bg-white rounded-2xl animate-pulse border border-tf-border" />
              </div>
            ))}
          </div>
        ) : (
          conv?.messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl font-sans text-[14px] leading-relaxed ${
                    isMe
                      ? "bg-tf-black text-white rounded-br-sm"
                      : "bg-white text-tf-text border border-tf-border rounded-bl-sm"
                  }`}
                >
                  {msg.contenu}
                  <p className={`text-[10px] mt-1 ${isMe ? "text-white/50" : "text-tf-text-muted"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-3 px-4 py-3 bg-white border-t border-tf-border flex-shrink-0">
        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écris un message..."
          rows={1}
          className="flex-1 resize-none px-4 py-2.5 rounded-2xl border border-tf-border bg-tf-bg font-sans text-[14px] text-tf-text placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!texte.trim() || sendMessage.isPending}
          className="w-10 h-10 bg-tf-gold text-tf-black rounded-full flex items-center justify-center hover:bg-tf-gold-light transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
