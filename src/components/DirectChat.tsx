import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { handleSupabaseError } from "@/lib/errorMessages";

interface DirectMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read_at: string | null;
}

interface DirectChatProps {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
}

export const DirectChat = ({ currentUserId, otherUserId, otherUserName }: DirectChatProps) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    
    // Subscribe to real-time messages
    const channel = supabase
      .channel(`direct-chat-${currentUserId}-${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=in.(${currentUserId},${otherUserId}),receiver_id=in.(${currentUserId},${otherUserId})`
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error(handleSupabaseError(error, "Failed to load messages"));
      return;
    }

    setMessages(data || []);

    // Mark messages as read
    const unreadMessages = data?.filter(
      (msg) => msg.receiver_id === currentUserId && !msg.read_at
    );
    
    if (unreadMessages && unreadMessages.length > 0) {
      await supabase
        .from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .in(
          "id",
          unreadMessages.map((msg) => msg.id)
        );
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content: newMessage.trim()
      });

    if (error) {
      toast.error(handleSupabaseError(error, "Failed to send message"));
    } else {
      setNewMessage("");
    }
    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Chat with {otherUserName}</h3>
      
      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(isOwnMessage ? "You" : otherUserName)}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 ${isOwnMessage ? "text-right" : ""}`}>
                <div className="text-xs text-muted-foreground mb-1">
                  {format(new Date(message.created_at), "MMM d, h:mm a")}
                </div>
                <div
                  className={`inline-block rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No messages yet. Start the conversation!
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[80px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || loading}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
