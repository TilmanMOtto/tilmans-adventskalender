import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface DoorReactionsProps {
  dayNumber: number;
  userId: string;
}

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  reply_text: string | null;
  replied_at: string | null;
}

const DoorReactions = ({ dayNumber, userId }: DoorReactionsProps) => {
  const { t, language } = useLanguage();
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReactions();
  }, [dayNumber, userId]);

  const fetchReactions = async () => {
    // Fetch like count
    const { count } = await supabase
      .from("door_likes")
      .select("*", { count: "exact", head: true })
      .eq("day_number", dayNumber);

    setLikeCount(count || 0);

    // Check if user has liked
    const { data: userLike } = await supabase
      .from("door_likes")
      .select("id")
      .eq("day_number", dayNumber)
      .eq("user_id", userId)
      .maybeSingle();

    setHasLiked(!!userLike);

    // Fetch user's own comments
    const { data: userComments } = await supabase
      .from("door_comments")
      .select("id, comment_text, created_at, reply_text, replied_at")
      .eq("day_number", dayNumber)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setComments(userComments || []);
    setLoading(false);
  };

  const toggleLike = async () => {
    if (hasLiked) {
      await supabase
        .from("door_likes")
        .delete()
        .eq("day_number", dayNumber)
        .eq("user_id", userId);
      setLikeCount(prev => prev - 1);
      setHasLiked(false);
    } else {
      await supabase
        .from("door_likes")
        .insert({ day_number: dayNumber, user_id: userId });
      setLikeCount(prev => prev + 1);
      setHasLiked(true);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from("door_comments")
      .insert({ 
        day_number: dayNumber, 
        user_id: userId, 
        comment_text: newComment.trim() 
      })
      .select()
      .single();

    if (error) {
      toast.error(language === 'de' ? "Fehler beim Senden" : "Error sending message");
      return;
    }

    setComments([data, ...comments]);
    setNewComment("");
    toast.success(language === 'de' ? "Nachricht gesendet!" : "Message sent!");
  };

  const deleteComment = async (commentId: string) => {
    await supabase
      .from("door_comments")
      .delete()
      .eq("id", commentId);

    setComments(comments.filter(c => c.id !== commentId));
    toast.success(language === 'de' ? "Nachricht gelöscht" : "Message deleted");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="animate-pulse h-20 bg-muted rounded-lg" />;
  }

  return (
    <div className="mt-6 pt-6 border-t border-border space-y-4">
      {/* Like Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLike}
          className={cn(
            "gap-2 transition-all",
            hasLiked && "text-red-500 hover:text-red-600"
          )}
        >
          <Heart className={cn("w-5 h-5", hasLiked && "fill-current")} />
          {hasLiked ? t('door.unlikeStory') : t('door.likeStory')}
        </Button>
        <span className="text-sm text-muted-foreground">
          {likeCount} {t('door.likes')}
        </span>
      </div>

      {/* Comments Section */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">
          {t('door.yourMessage')}
        </h4>

        {comments.length > 0 ? (
          <div className="space-y-2">
            {comments.map((comment) => (
              <div 
                key={comment.id}
                className="bg-muted/50 rounded-lg p-3 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.created_at)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteComment(comment.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm">{comment.comment_text}</p>
                
                {/* Tilman's Reply */}
                {comment.reply_text && (
                  <div className="mt-2 pl-3 border-l-2 border-primary/50 bg-primary/5 rounded-r-lg p-2">
                    <div className="flex items-center gap-1 text-xs text-primary font-medium mb-1">
                      {t('door.myReply')}
                      {comment.replied_at && (
                        <span className="text-muted-foreground font-normal">
                          · {formatDate(comment.replied_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{comment.reply_text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {t('door.noMessages')}
          </p>
        )}

        {/* New Comment Input */}
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('door.writeMessage')}
            className="min-h-[60px] resize-none"
          />
          <Button 
            onClick={submitComment}
            disabled={!newComment.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DoorReactions;
