import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessages = (currentUserId: string | null) => {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentUserId) return;

    const loadUnreadCounts = async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("sender_id")
        .eq("receiver_id", currentUserId)
        .is("read_at", null);

      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((msg) => {
          counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
        });
        setUnreadCounts(counts);
      }
    };

    loadUnreadCounts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`unread-messages-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        () => {
          loadUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return unreadCounts;
};
