import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Message {
  id: string;
  day_number: number;
  comment_text: string;
  created_at: string;
  reply_text: string | null;
  replied_at: string | null;
  is_read: boolean;
  user_response: string | null;
  user_response_at: string | null;
}

interface UserMessagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onMessagesRead: () => void;
}

const UserMessagesSheet = ({ open, onOpenChange, userId, onMessagesRead }: UserMessagesSheetProps) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchMessages();
    }
  }, [open, userId]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("door_comments")
      .select("*")
      .eq("user_id", userId)
      .order("day_number", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
      // Mark unread messages as read
      const unreadIds = (data || [])
        .filter(m => m.reply_text && !m.is_read)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        await supabase
          .from("door_comments")
          .update({ is_read: true })
          .in("id", unreadIds);
        onMessagesRead();
      }
    }
    setLoading(false);
  };

  const submitResponse = async (messageId: string) => {
    const text = responseText[messageId]?.trim();
    if (!text) return;

    setSubmitting(messageId);
    const { error } = await supabase
      .from("door_comments")
      .update({ 
        user_response: text, 
        user_response_at: new Date().toISOString() 
      })
      .eq("id", messageId);

    if (error) {
      toast.error(language === 'de' ? "Fehler beim Senden" : "Error sending response");
    } else {
      toast.success(language === 'de' ? "Antwort gesendet" : "Response sent");
      setResponseText(prev => ({ ...prev, [messageId]: "" }));
      fetchMessages();
    }
    setSubmitting(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group messages by door
  const groupedMessages = messages.reduce((acc, msg) => {
    if (!acc[msg.day_number]) {
      acc[msg.day_number] = [];
    }
    acc[msg.day_number].push(msg);
    return acc;
  }, {} as { [key: number]: Message[] });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('messages.title')}</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t('messages.empty')}</p>
        ) : (
          <div className="space-y-6 mt-4">
            {Object.entries(groupedMessages)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([dayNumber, msgs]) => (
                <div key={dayNumber} className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground border-b pb-1">
                    {t('messages.door')} {dayNumber}
                  </h3>
                  
                  {msgs.map((msg) => (
                    <div key={msg.id} className="space-y-2">
                      {/* User's original comment */}
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[80%]">
                          <p className="text-sm">{msg.comment_text}</p>
                          <p className="text-xs opacity-70 mt-1">{formatDate(msg.created_at)}</p>
                        </div>
                      </div>

                      {/* Tilman's reply */}
                      {msg.reply_text && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Tilman</p>
                            <p className="text-sm">{msg.reply_text}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {msg.replied_at && formatDate(msg.replied_at)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* User's response to Tilman */}
                      {msg.user_response && (
                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[80%]">
                            <p className="text-sm">{msg.user_response}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {msg.user_response_at && formatDate(msg.user_response_at)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Reply input - show only if Tilman has replied and user hasn't responded yet */}
                      {msg.reply_text && !msg.user_response && (
                        <div className="flex gap-2 pl-4">
                          <Textarea
                            value={responseText[msg.id] || ""}
                            onChange={(e) => setResponseText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                            placeholder={t('messages.replyPlaceholder')}
                            className="text-sm min-h-[60px]"
                          />
                          <Button
                            size="icon"
                            onClick={() => submitResponse(msg.id)}
                            disabled={!responseText[msg.id]?.trim() || submitting === msg.id}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default UserMessagesSheet;
