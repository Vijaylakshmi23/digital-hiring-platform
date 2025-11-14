import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, X, Image as ImageIcon, File } from "lucide-react";
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
  file_url: string | null;
  file_type: string | null;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('chat-files')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-files')
      .getPublicUrl(fileName);

    return { url: publicUrl, type: file.type };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    setLoading(true);
    setUploading(true);

    try {
      let fileUrl = null;
      let fileType = null;

      if (selectedFile) {
        const result = await uploadFile(selectedFile);
        fileUrl = result.url;
        fileType = result.type;
      }

      const { error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: otherUserId,
          content: newMessage.trim() || "Sent a file",
          file_url: fileUrl,
          file_type: fileType
        });

      if (error) {
        toast.error(handleSupabaseError(error, "Failed to send message"));
      } else {
        setNewMessage("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setLoading(false);
      setUploading(false);
    }
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
                  className={`inline-block rounded-lg px-4 py-2 max-w-md ${
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.file_url && message.file_type?.startsWith('image/') && (
                    <div className="mb-2">
                      <img 
                        src={message.file_url} 
                        alt="Shared image" 
                        className="rounded max-w-full h-auto max-h-64 object-cover cursor-pointer"
                        onClick={() => window.open(message.file_url!, '_blank')}
                      />
                    </div>
                  )}
                  {message.file_url && !message.file_type?.startsWith('image/') && (
                    <a 
                      href={message.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 mb-2 hover:underline"
                    >
                      <File className="h-4 w-4" />
                      <span className="text-sm">Download File</span>
                    </a>
                  )}
                  <div>{message.content}</div>
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

      {selectedFile && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg mb-2">
          {selectedFile.type.startsWith('image/') ? (
            <ImageIcon className="h-4 w-4" />
          ) : (
            <File className="h-4 w-4" />
          )}
          <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || uploading}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[80px]"
          disabled={uploading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button
          onClick={handleSendMessage}
          disabled={(!newMessage.trim() && !selectedFile) || loading || uploading}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
