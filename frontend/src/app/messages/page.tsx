"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface Conversation {
  id: number;
  shop_id: number;
  shop_nom: string;
  client_id: number;
  dernier_message: string | null;
  dernier_message_at: string | null;
  nb_non_lus: number;
  created_at: string;
}

export default function MessagesPage() {
  const { isAuthenticated } = useAuthStore();

  const { data: convs, isLoading } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await api.get("/messages");
      return data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-tf-bg flex flex-col items-center justify-center text-center px-4">
        <MessageCircle size={48} className="text-tf-border mb-4" />
        <p className="font-sans text-[16px] font-semibold text-tf-text mb-2">Connecte-toi pour accéder à tes messages</p>
        <Link href="/auth/login" className="btn-gold mt-4">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tf-bg">
      <div className="max-w-screen-md mx-auto px-4 py-8">
        <h1 className="font-sans text-h2 font-bold text-tf-text mb-6">Messages</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-tf-border" />)}
          </div>
        ) : !convs?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageCircle size={56} className="text-tf-border mb-4" />
            <p className="font-sans text-[16px] font-semibold text-tf-text mb-2">Aucune conversation</p>
            <p className="font-sans text-[13px] text-tf-text-muted">
              Tes échanges avec les boutiques apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {convs.map((conv) => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-start gap-4 bg-white rounded-xl border border-tf-border p-4 hover:border-tf-gold/40 hover:shadow-card transition-all"
              >
                {/* Avatar boutique */}
                <div className="w-10 h-10 rounded-full bg-tf-black flex items-center justify-center flex-shrink-0">
                  <span className="font-serif text-[14px] text-tf-gold">{conv.shop_nom[0]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-sans text-[14px] font-semibold text-tf-text">{conv.shop_nom}</p>
                    {conv.dernier_message_at && (
                      <p className="font-sans text-[11px] text-tf-text-muted flex-shrink-0 ml-2">
                        {new Date(conv.dernier_message_at).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "short"
                        })}
                      </p>
                    )}
                  </div>
                  <p className="font-sans text-[13px] text-tf-text-muted truncate">
                    {conv.dernier_message ?? "Conversation démarrée"}
                  </p>
                </div>

                {conv.nb_non_lus > 0 && (
                  <span
                    aria-label={`${conv.nb_non_lus} message${conv.nb_non_lus > 1 ? "s" : ""} non lu${conv.nb_non_lus > 1 ? "s" : ""}`}
                    className="bg-tf-gold text-tf-black text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  >
                    {conv.nb_non_lus}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
