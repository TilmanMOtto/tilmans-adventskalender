import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface AdminListProps {
  onEdit: (entry: any) => void;
  refreshTrigger: number;
}

interface EntryItemProps {
  entry: any;
  onEdit: (entry: any) => void;
  onDelete: (id: string) => void;
  onMoveUp: (entry: any) => void;
  onMoveDown: (entry: any) => void;
  isFirst: boolean;
  isLast: boolean;
}

const EntryItem = ({ entry, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: EntryItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
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
      </div>
      <div className="flex gap-2 ml-4">
        <Button
          size="icon"
          variant="outline"
          onClick={() => onMoveUp(entry)}
          disabled={isFirst}
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => onMoveDown(entry)}
          disabled={isLast}
        >
          <ArrowDown className="w-4 h-4" />
        </Button>
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
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

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

  const handleMoveUp = async (entry: any) => {
    const currentIndex = entries.findIndex(e => e.id === entry.id);
    if (currentIndex <= 0) return;

    const previousEntry = entries[currentIndex - 1];
    await swapEntries(entry, previousEntry);
  };

  const handleMoveDown = async (entry: any) => {
    const currentIndex = entries.findIndex(e => e.id === entry.id);
    if (currentIndex >= entries.length - 1) return;

    const nextEntry = entries[currentIndex + 1];
    await swapEntries(entry, nextEntry);
  };

  const swapEntries = async (entry1: any, entry2: any) => {
    const tempDayNumber = 9999;

    // Use temporary value to avoid unique constraint violation
    const { error: tempError } = await supabase
      .from("calendar_entries")
      .update({ day_number: tempDayNumber })
      .eq("id", entry1.id);

    if (tempError) {
      toast.error("Fehler beim Verschieben des Eintrags");
      return;
    }

    const { error: error1 } = await supabase
      .from("calendar_entries")
      .update({ day_number: entry2.day_number })
      .eq("id", entry1.id);

    const { error: error2 } = await supabase
      .from("calendar_entries")
      .update({ day_number: entry1.day_number })
      .eq("id", entry2.id);

    if (error1 || error2) {
      toast.error("Fehler beim Verschieben des Eintrags");
      return;
    }

    toast.success("Eintrag verschoben");
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
            {entries.map((entry, index) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                onEdit={onEdit}
                onDelete={handleDelete}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={index === 0}
                isLast={index === entries.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminList;
