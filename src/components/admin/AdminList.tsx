import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AdminListProps {
  onEdit: (entry: any) => void;
  refreshTrigger: number;
}

const AdminList = ({ onEdit, refreshTrigger }: AdminListProps) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, [refreshTrigger]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("calendar_entries")
      .select("*")
      .order("day_number");

    setEntries(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    const { error } = await supabase
      .from("calendar_entries")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error deleting entry");
      return;
    }

    toast.success("Entry deleted successfully");
    fetchEntries();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Existing Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading entries...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Entries</CardTitle>
        <CardDescription>
          {entries.length} of 30 days configured
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No entries yet. Create your first one!
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {entries.map((entry) => (
              <div 
                key={entry.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">Day {entry.day_number}</span>
                    <span className="text-sm">•</span>
                    <span className="font-semibold">{entry.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {entry.story}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onEdit(entry)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminList;
