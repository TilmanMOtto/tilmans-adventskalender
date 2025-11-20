import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CalendarDoor from "./CalendarDoor";

interface CalendarGridProps {
  onDoorClick: (day: number) => void;
  userId: string;
  isAdmin: boolean;
}

const CalendarGrid = ({ onDoorClick, userId, isAdmin }: CalendarGridProps) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const totalDays = 24;

  useEffect(() => {
    fetchData();
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
    // For December advent calendar: return current day of December
    if (now.getMonth() === 11) { // December is month 11 (0-indexed)
      return now.getDate();
    }
    // If not December, no doors available for regular users
    return 0;
  };

  const currentDay = getCurrentDay();

  const isDoorOpened = (day: number) => {
    return progress.some(p => p.day_number === day);
  };

  const isDoorAvailable = (day: number) => {
    return isAdmin || day <= currentDay;
  };

  const hasContent = (day: number) => {
    return entries.some(e => e.day_number === day);
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
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
