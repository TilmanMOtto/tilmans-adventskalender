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
    if (!confirm("Bist du sicher, dass du diesen Eintrag löschen möchtest?")) return;

    const { error } = await supabase
      .from("calendar_entries")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Fehler beim Löschen des Eintrags");
      return;
    }

    toast.success("Eintrag erfolgreich gelöscht");
    fetchEntries();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vorhandene Einträge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Lade Einträge...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vorhandene Einträge</CardTitle>
        <CardDescription>
          {entries.length} von 24 Tagen konfiguriert
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Noch keine Einträge. Erstelle deinen ersten!
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
                    <span className="font-bold text-primary">Tag {entry.day_number}</span>
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
