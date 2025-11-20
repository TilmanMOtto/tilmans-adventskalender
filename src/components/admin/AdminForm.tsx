import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface AdminFormProps {
  editingEntry: any;
  onSaveSuccess: () => void;
}

const AdminForm = ({ editingEntry, onSaveSuccess }: AdminFormProps) => {
  const [dayNumber, setDayNumber] = useState("");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setDayNumber(editingEntry.day_number.toString());
      setTitle(editingEntry.title);
      setStory(editingEntry.story);
    } else {
      resetForm();
    }
  }, [editingEntry]);

  const resetForm = () => {
    setDayNumber("");
    setTitle("");
    setStory("");
    setImageFiles([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${i}-${dayNumber}.${fileExt}`;
      const filePath = `day-${dayNumber}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('calendar-images')
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Fehler beim Hochladen von Bild ${i + 1}: ${uploadError.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('calendar-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrls = editingEntry?.image_urls || [];
      
      if (imageFiles.length > 0) {
        const newUrls = await uploadImages();
        if (newUrls.length === 0) {
          setUploading(false);
          return;
        }
        // Append new images to existing ones when editing
        imageUrls = editingEntry ? [...imageUrls, ...newUrls] : newUrls;
      }

      const entryData = {
        day_number: parseInt(dayNumber),
        title,
        story,
        image_urls: imageUrls,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from("calendar_entries")
          .update(entryData)
          .eq("id", editingEntry.id);

        if (error) throw error;
        toast.success("Eintrag erfolgreich aktualisiert!");
      } else {
        const { error } = await supabase
          .from("calendar_entries")
          .insert(entryData);

        if (error) throw error;
        toast.success("Eintrag erfolgreich erstellt!");
      }

      resetForm();
      onSaveSuccess();
    } catch (error: any) {
      toast.error(error.message || "Ein Fehler ist aufgetreten");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingEntry ? "Edit Entry" : "Create New Entry"}</CardTitle>
        <CardDescription>
          {editingEntry ? "Update the calendar entry" : "Add a new day to the advent calendar"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dayNumber">Tag Nummer (1-24)</Label>
            <Input
              id="dayNumber"
              type="number"
              min="1"
              max="24"
              value={dayNumber}
              onChange={(e) => setDayNumber(e.target.value)}
              required
              disabled={!!editingEntry}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Eine besondere Erinnerung..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="story">Geschichte</Label>
            <Textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              required
              placeholder="Erzähle deine Geschichte hier..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Bilder und Videos (Mehrere erlaubt)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
            {imageFiles.length > 0 && (
              <p className="text-sm text-muted-foreground">{imageFiles.length} Datei(en) ausgewählt</p>
            )}
            {editingEntry?.image_urls && editingEntry.image_urls.length > 0 && imageFiles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {editingEntry.image_urls.length} vorhandene(s) Datei(en). Neue hochladen um weitere hinzuzufügen.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? "Speichert..." : editingEntry ? "Eintrag aktualisieren" : "Eintrag erstellen"}
            </Button>
            {editingEntry && (
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onSaveSuccess();
                }}
              >
                Abbrechen
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminForm;
