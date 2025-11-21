import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { toast } from "sonner";

interface DoorModalProps {
  dayNumber: number;
  userId: string;
  onClose: () => void;
  onDoorOpened?: () => void;
}

const DoorModal = ({ dayNumber, userId, onClose, onDoorOpened }: DoorModalProps) => {
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntry();
  }, [dayNumber]);

  const fetchEntry = async () => {
    const { data } = await supabase
      .from("calendar_entries")
      .select("*")
      .eq("day_number", dayNumber)
      .single();

    if (data) {
      setEntry(data);
      await markAsOpened();
    } else {
      toast.error("Noch kein Inhalt für diesen Tag verfügbar!");
      onClose();
    }
    setLoading(false);
  };

  const markAsOpened = async () => {
    const { error } = await supabase
      .from("user_progress")
      .insert({ user_id: userId, day_number: dayNumber })
      .select()
      .single();

    // Ignore duplicate errors (already opened)
    if (error && !error.message.includes("duplicate")) {
      console.error("Error marking as opened:", error);
    } else {
      // Notify parent that door was opened
      onDoorOpened?.();
    }
  };

  const parseStoryText = (text: string) => {
    const parts = text.split('*');
    return parts.map((part, index) => {
      // Odd indices are between asterisks, so make them bold
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const isVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : entry ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Tag {dayNumber}: {entry.title}
              </DialogTitle>
            </DialogHeader>
            
            {entry.image_urls && entry.image_urls.length > 0 && (
              <Carousel className="w-full">
                <CarouselContent>
                   {entry.image_urls.map((url: string, index: number) => (
                    <CarouselItem key={index}>
                      <div className="relative w-full max-h-[60vh] rounded-lg overflow-hidden shadow-lg bg-muted/20 flex items-center justify-center">
                        {isVideoUrl(url) ? (
                          <video 
                            src={url}
                            controls
                            className="w-full h-full object-contain bg-black"
                          >
                            Ihr Browser unterstützt das Video-Tag nicht.
                          </video>
                        ) : (
                          <img 
                            src={url} 
                            alt={`${entry.title} - Bild ${index + 1}`}
                            className="w-full max-h-[60vh] object-contain"
                          />
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {entry.image_urls.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>
            )}
            
            {entry.audio_url && (
              <div className="my-4">
                <audio 
                  controls 
                  className="w-full"
                  preload="metadata"
                >
                  <source src={entry.audio_url} type="audio/mpeg" />
                  <source src={entry.audio_url} type="audio/wav" />
                  <source src={entry.audio_url} type="audio/ogg" />
                  Ihr Browser unterstützt das Audio-Element nicht.
                </audio>
              </div>
            )}
            
            <div className="prose prose-lg max-w-none">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {parseStoryText(entry.story)}
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default DoorModal;
