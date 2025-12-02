import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Languages, Mic, X } from "lucide-react";

interface AdminFormProps {
  editingEntry: any;
  onSaveSuccess: () => void;
}

const AdminForm = ({ editingEntry, onSaveSuccess }: AdminFormProps) => {
  const [dayNumber, setDayNumber] = useState("");
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [story, setStory] = useState("");
  const [storyEn, setStoryEn] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setDayNumber(editingEntry.day_number.toString());
      setTitle(editingEntry.title);
      setTitleEn(editingEntry.title_en || "");
      setStory(editingEntry.story);
      setStoryEn(editingEntry.story_en || "");
      setExistingImageUrls(editingEntry.image_urls || []);
    } else {
      resetForm();
    }
  }, [editingEntry]);

  const resetForm = () => {
    setDayNumber("");
    setTitle("");
    setTitleEn("");
    setStory("");
    setStoryEn("");
    setImageFiles([]);
    setExistingImageUrls([]);
    setAudioFile(null);
  };

  const handleDeleteExistingImage = (urlToDelete: string) => {
    setExistingImageUrls(prev => prev.filter(url => url !== urlToDelete));
    toast.success("Bild wird beim Speichern entfernt");
  };

  const getImageFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleTranslate = async () => {
    if (!title || !story) {
      toast.error("Bitte Titel und Geschichte ausfüllen");
      return;
    }

    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-story', {
        body: { title, story }
      });

      if (error) throw error;

      if (data.title_en && data.story_en) {
        setTitleEn(data.title_en);
        setStoryEn(data.story_en);
        toast.success("Übersetzung erfolgreich!");
      }
    } catch (error: any) {
      console.error("Translation error:", error);
      toast.error(error.message || "Fehler bei der Übersetzung");
    } finally {
      setTranslating(false);
    }
  };

  const handleTranscribeAndRefine = async () => {
    if (!audioFile) {
      toast.error("Bitte zuerst eine Audio-Datei auswählen");
      return;
    }

    setTranscribing(true);
    toast.info("Audio wird transkribiert und verfeinert... Dies kann 10-30 Sekunden dauern.");

    try {
      // Convert audio file to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just the base64 data
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
      });

      const { data, error } = await supabase.functions.invoke('transcribe-and-refine', {
        body: { audio: base64Audio, mimeType: audioFile.type }
      });

      if (error) throw error;

      if (data.refinedText) {
        setStory(data.refinedText);
        toast.success("Transkription und Verfeinerung erfolgreich!");
      }
    } catch (error: any) {
      console.error("Transcription error:", error);
      toast.error(error.message || "Fehler bei der Transkription");
    } finally {
      setTranscribing(false);
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

  const uploadAudio = async (): Promise<string | null> => {
    if (!audioFile) return null;

    const fileExt = audioFile.name.split('.').pop();
    const fileName = `${Date.now()}-audio-${dayNumber}.${fileExt}`;
    const filePath = `day-${dayNumber}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('calendar-images')
      .upload(filePath, audioFile);

    if (uploadError) {
      toast.error(`Fehler beim Hochladen der Audio-Datei: ${uploadError.message}`);
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
      // Start with existing image URLs (handles manual deletions)
      // For new entries, existingImageUrls will be empty
      // For edits, it contains the current images (minus any manually deleted)
      let imageUrls = [...existingImageUrls];
      
      if (imageFiles.length > 0) {
        const newUrls = await uploadImages();
        if (newUrls.length === 0) {
          setUploading(false);
          return;
        }
        imageUrls = [...imageUrls, ...newUrls];
      }

      let audioUrl = editingEntry?.audio_url || null;
      if (audioFile) {
        const newAudioUrl = await uploadAudio();
        if (newAudioUrl) {
          audioUrl = newAudioUrl;
        }
      }

      const entryData = {
        day_number: parseInt(dayNumber),
        title,
        title_en: titleEn || null,
        story,
        story_en: storyEn || null,
        image_urls: imageUrls,
        audio_url: audioUrl,
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
            <Label htmlFor="title">Titel (Deutsch)</Label>
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
            <Label htmlFor="titleEn">Titel (Englisch)</Label>
            <Input
              id="titleEn"
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="A special memory..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="story">Geschichte (Deutsch)</Label>
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
            <Label htmlFor="storyEn">Geschichte (Englisch)</Label>
            <Textarea
              id="storyEn"
              value={storyEn}
              onChange={(e) => setStoryEn(e.target.value)}
              placeholder="Tell your story here..."
              rows={6}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleTranslate}
            disabled={translating || !title || !story}
            className="w-full"
          >
            <Languages className="w-4 h-4 mr-2" />
            {translating ? "Wird übersetzt..." : "Ins Englische übersetzen"}
          </Button>

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
              <p className="text-sm text-muted-foreground">{imageFiles.length} neue Datei(en) ausgewählt</p>
            )}
          </div>

          {existingImageUrls.length > 0 && (
            <div className="space-y-2">
              <Label>Vorhandene Dateien</Label>
              <div className="space-y-1">
                {existingImageUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span className="truncate flex-1">{getImageFileName(url)}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteExistingImage(url)}
                      className="h-6 w-6 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="audio">Audio-Datei (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="audio"
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="cursor-pointer"
              />
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
            {audioFile && (
              <p className="text-sm text-muted-foreground">Audio-Datei ausgewählt: {audioFile.name}</p>
            )}
            {editingEntry?.audio_url && !audioFile && (
              <p className="text-sm text-muted-foreground">Vorhandene Audio-Datei. Neue hochladen zum Ersetzen.</p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleTranscribeAndRefine}
            disabled={transcribing || !audioFile}
            className="w-full"
          >
            <Mic className="w-4 h-4 mr-2" />
            {transcribing ? "Wird transkribiert..." : "Audio transkribieren und verfeinern"}
          </Button>

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
