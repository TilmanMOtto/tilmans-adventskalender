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
  const [imageFile, setImageFile] = useState<File | null>(null);
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
    setImageFile(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${dayNumber}.${fileExt}`;
    const filePath = `day-${dayNumber}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('calendar-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      toast.error("Error uploading image: " + uploadError.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('calendar-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = editingEntry?.image_url;
      
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setUploading(false);
          return;
        }
      }

      const entryData = {
        day_number: parseInt(dayNumber),
        title,
        story,
        image_url: imageUrl,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from("calendar_entries")
          .update(entryData)
          .eq("id", editingEntry.id);

        if (error) throw error;
        toast.success("Entry updated successfully!");
      } else {
        const { error } = await supabase
          .from("calendar_entries")
          .insert(entryData);

        if (error) throw error;
        toast.success("Entry created successfully!");
      }

      resetForm();
      onSaveSuccess();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
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
            <Label htmlFor="dayNumber">Day Number (1-30)</Label>
            <Input
              id="dayNumber"
              type="number"
              min="1"
              max="30"
              value={dayNumber}
              onChange={(e) => setDayNumber(e.target.value)}
              required
              disabled={!!editingEntry}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="A special memory..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="story">Story</Label>
            <Textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              required
              placeholder="Tell your story here..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
            {editingEntry?.image_url && !imageFile && (
              <p className="text-sm text-muted-foreground">Current image will be kept if no new image is uploaded</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? "Saving..." : editingEntry ? "Update Entry" : "Create Entry"}
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
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminForm;
