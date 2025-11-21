import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import JSZip from "jszip";

const ExportCalendar = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all calendar entries
      const { data: entries, error } = await supabase
        .from("calendar_entries")
        .select("*")
        .order("day_number");

      if (error) throw error;
      if (!entries || entries.length === 0) {
        toast.error("Keine Einträge zum Exportieren gefunden");
        return;
      }

      const zip = new JSZip();
      
      // Create folders
      const textsFolder = zip.folder("texts");
      const imagesFolder = zip.folder("images");
      const audioFolder = zip.folder("audio");

      // Create manifest
      const manifest = {
        exported_at: new Date().toISOString(),
        total_entries: entries.length,
        entries: entries.map(e => ({
          day_number: e.day_number,
          title: e.title,
          title_en: e.title_en,
          has_audio: !!e.audio_url,
          image_count: e.image_urls ? (e.image_urls as string[]).length : 0
        }))
      };
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));

      // Process each entry
      for (const entry of entries) {
        // Add text content
        const textContent = {
          day_number: entry.day_number,
          title: entry.title,
          story: entry.story,
          title_en: entry.title_en,
          story_en: entry.story_en
        };
        textsFolder?.file(`day-${entry.day_number}.json`, JSON.stringify(textContent, null, 2));

        // Download and add images
        if (entry.image_urls && Array.isArray(entry.image_urls)) {
          const dayImagesFolder = imagesFolder?.folder(`day-${entry.day_number}`);
          const imageUrls = entry.image_urls as string[];
          
          for (let i = 0; i < imageUrls.length; i++) {
            const imageUrl = imageUrls[i];
            const fileName = imageUrl.split('/').pop() || `image-${i + 1}`;
            
            try {
              const { data: imageData, error: imageError } = await supabase.storage
                .from("calendar-images")
                .download(imageUrl);

              if (imageError) throw imageError;
              if (imageData) {
                dayImagesFolder?.file(fileName, imageData);
              }
            } catch (err) {
              console.error(`Error downloading image ${imageUrl}:`, err);
            }
          }
        }

        // Download and add audio
        if (entry.audio_url) {
          const fileName = entry.audio_url.split('/').pop() || `day-${entry.day_number}.mp3`;
          
          try {
            const { data: audioData, error: audioError } = await supabase.storage
              .from("calendar-images")
              .download(entry.audio_url);

            if (audioError) throw audioError;
            if (audioData) {
              audioFolder?.file(fileName, audioData);
            }
          } catch (err) {
            console.error(`Error downloading audio ${entry.audio_url}:`, err);
          }
        }
      }

      // Generate ZIP file
      const blob = await zip.generateAsync({ type: "blob" });
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `advent-calendar-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export erfolgreich abgeschlossen!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Fehler beim Exportieren der Daten");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kalender exportieren</CardTitle>
        <CardDescription>
          Exportiere alle Türchen mit Texten, Bildern und Audiodateien in eine ZIP-Datei
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full sm:w-auto"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exportiere...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Alle Türchen exportieren
            </>
          )}
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          Die ZIP-Datei enthält:
        </p>
        <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>manifest.json - Übersicht aller Einträge</li>
          <li>texts/ - JSON-Dateien mit allen Texten (DE/EN)</li>
          <li>images/ - Alle Bilder sortiert nach Türchen</li>
          <li>audio/ - Alle Audiodateien</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default ExportCalendar;
