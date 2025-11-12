import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CalendarDoor from "./CalendarDoor";

interface CalendarGridProps {
  onDoorClick: (day: number) => void;
  userId: string;
}

const CalendarGrid = ({ onDoorClick, userId }: CalendarGridProps) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const totalDays = 30;

  useEffect(() => {
    fetchData();
  }, [userId]);

  useEffect(() => {
    // Set up real-time subscription for progress updates
    const channel = supabase
      .channel('progress-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchData = async () => {
    const { data: entriesData } = await supabase
      .from("calendar_entries")
      .select("*")
      .order("day_number");

    const { data: progressData } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId);

    setEntries(entriesData || []);
    setProgress(progressData || []);
  };

  const getCurrentDay = () => {
    const now = new Date();
    // For November testing: return current day of November
    if (now.getMonth() === 10) { // November is month 10 (0-indexed)
      return now.getDate();
    }
    // If not November, allow all doors for testing
    return totalDays;
  };

  const currentDay = getCurrentDay();

  const isDoorOpened = (day: number) => {
    return progress.some(p => p.day_number === day);
  };

  const isDoorAvailable = (day: number) => {
    return day <= currentDay;
  };

  const hasContent = (day: number) => {
    return entries.some(e => e.day_number === day);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
        <CalendarDoor
          key={day}
          dayNumber={day}
          isOpened={isDoorOpened(day)}
          isAvailable={isDoorAvailable(day)}
          hasContent={hasContent(day)}
          onClick={() => onDoorClick(day)}
        />
      ))}
    </div>
  );
};

export default CalendarGrid;
