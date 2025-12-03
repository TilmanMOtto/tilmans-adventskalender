import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MessageCircle, Trash2, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Comment {
  id: string;
  user_id: string;
  day_number: number;
  comment_text: string;
  created_at: string;
  username?: string;
}

interface LikeSummary {
  day_number: number;
  count: number;
}

const AdminNotifications = () => {
  const { t, language } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [likeSummary, setLikeSummary] = useState<LikeSummary[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    // Fetch all comments with usernames
    const { data: commentsData } = await supabase
      .from("door_comments")
      .select("id, user_id, day_number, comment_text, created_at")
      .order("created_at", { ascending: false });

    if (commentsData) {
      // Fetch usernames for each comment
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);
      
      const commentsWithUsernames = commentsData.map(c => ({
        ...c,
        username: profileMap.get(c.user_id) || 'Unbekannt'
      }));

      setComments(commentsWithUsernames);
    }

    // Fetch likes and aggregate by day
    const { data: likesData } = await supabase
      .from("door_likes")
      .select("day_number");

    if (likesData) {
      setTotalLikes(likesData.length);
      
      const likeCounts: Record<number, number> = {};
      likesData.forEach(like => {
        likeCounts[like.day_number] = (likeCounts[like.day_number] || 0) + 1;
      });

      const summary = Object.entries(likeCounts)
        .map(([day, count]) => ({ day_number: parseInt(day), count }))
        .sort((a, b) => a.day_number - b.day_number);

      setLikeSummary(summary);
    }

    setLoading(false);
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("door_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error(language === 'de' ? "Fehler beim Löschen" : "Error deleting");
      return;
    }

    setComments(comments.filter(c => c.id !== commentId));
    toast.success(language === 'de' ? "Kommentar gelöscht" : "Comment deleted");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 {t('admin.overview')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-semibold">{totalLikes}</span>
              <span className="text-muted-foreground">{t('door.likes')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="font-semibold">{comments.length}</span>
              <span className="text-muted-foreground">{t('admin.comments')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.latestComments')}</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {language === 'de' ? 'Noch keine Kommentare' : 'No comments yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div 
                  key={comment.id}
                  className="bg-muted/50 rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {t('admin.door')} {comment.day_number}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {comment.username}
                      </span>
                      <span>{formatDate(comment.created_at)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-foreground">{comment.comment_text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Likes per Door */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.likesPerDoor')}</CardTitle>
        </CardHeader>
        <CardContent>
          {likeSummary.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {language === 'de' ? 'Noch keine Likes' : 'No likes yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {likeSummary.map((item) => (
                <div key={item.day_number} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-medium">
                    {t('admin.door')} {item.day_number}:
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(item.count, 10) }).map((_, i) => (
                      <Heart key={i} className="w-4 h-4 text-red-500 fill-red-500" />
                    ))}
                    {item.count > 10 && <span className="text-sm text-muted-foreground">+{item.count - 10}</span>}
                  </div>
                  <span className="text-sm text-muted-foreground">({item.count})</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
