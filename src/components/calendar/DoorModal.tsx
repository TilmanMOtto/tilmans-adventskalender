import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface DoorModalProps {
  dayNumber: number;
  userId: string;
  onClose: () => void;
}

const DoorModal = ({ dayNumber, userId, onClose }: DoorModalProps) => {
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
      toast.error("No content available for this day yet!");
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
    }
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
                Day {dayNumber}: {entry.title}
              </DialogTitle>
            </DialogHeader>
            
            {entry.image_urls && entry.image_urls.length > 0 && (
              <div className="space-y-4">
                {entry.image_urls.map((url: string, index: number) => (
                  <div key={index} className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={url} 
                      alt={`${entry.title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div className="prose prose-lg max-w-none">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {entry.story}
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default DoorModal;
