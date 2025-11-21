import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface AdminListProps {
  onEdit: (entry: any) => void;
  refreshTrigger: number;
}

interface SortableItemProps {
  entry: any;
  onEdit: (entry: any) => void;
  onDelete: (id: string) => void;
}

const SortableItem = ({ entry, onEdit, onDelete }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </button>
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = entries.findIndex((entry) => entry.id === active.id);
    const newIndex = entries.findIndex((entry) => entry.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newEntries = arrayMove(entries, oldIndex, newIndex);
    setEntries(newEntries);

    try {
      // Update all day_numbers based on new order
      const updates = newEntries.map((entry, index) => ({
        id: entry.id,
        day_number: index + 1,
      }));

      // Batch update all entries
      for (const update of updates) {
        const { error } = await supabase
          .from("calendar_entries")
          .update({ day_number: update.day_number })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast.success("Reihenfolge erfolgreich aktualisiert");
      fetchEntries();
    } catch (error) {
      toast.error("Fehler beim Aktualisieren der Reihenfolge");
      fetchEntries(); // Revert to original order
    }
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={entries.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {entries.map((entry) => (
                  <SortableItem
                    key={entry.id}
                    entry={entry}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminList;
