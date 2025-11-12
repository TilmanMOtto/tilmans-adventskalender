import { Lock, CheckCircle2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarDoorProps {
  dayNumber: number;
  isOpened: boolean;
  isAvailable: boolean;
  hasContent: boolean;
  onClick: () => void;
}

const CalendarDoor = ({ dayNumber, isOpened, isAvailable, hasContent, onClick }: CalendarDoorProps) => {
  const getStatusColor = () => {
    if (isOpened) return "bg-door-opened border-door-opened";
    if (isAvailable && hasContent) return "bg-door-available border-door-available hover:scale-105";
    return "bg-door-locked border-door-locked";
  };

  const getStatusIcon = () => {
    if (isOpened) return <CheckCircle2 className="w-5 h-5" />;
    if (isAvailable) return <Calendar className="w-5 h-5" />;
    return <Lock className="w-4 h-4" />;
  };

  const canClick = isAvailable && hasContent && !isOpened;

  return (
    <button
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      className={cn(
        "relative aspect-square rounded-2xl border-2 transition-all duration-300",
        "flex flex-col items-center justify-center gap-2",
        "shadow-lg hover:shadow-xl",
        getStatusColor(),
        canClick && "cursor-pointer",
        !canClick && "cursor-not-allowed opacity-70"
      )}
    >
      <span className="text-3xl font-bold text-white drop-shadow-lg">
        {dayNumber}
      </span>
      <div className="text-white/90">
        {getStatusIcon()}
      </div>
      
      {isOpened && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 rounded-2xl" />
      )}
    </button>
  );
};

export default CalendarDoor;
