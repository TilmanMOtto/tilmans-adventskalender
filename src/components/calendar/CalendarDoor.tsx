import { Lock, CheckCircle2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CalendarDoorProps {
  dayNumber: number;
  isOpened: boolean;
  isAvailable: boolean;
  hasContent: boolean;
  onClick: () => void;
}

const CalendarDoor = ({ dayNumber, isOpened, isAvailable, hasContent, onClick }: CalendarDoorProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleClick = () => {
    if (canClick) {
      setIsAnimating(true);
      setTimeout(() => {
        onClick();
        setIsAnimating(false);
      }, 400);
    }
  };
  
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

  const canClick = isAvailable && hasContent;

  return (
    <button
      onClick={handleClick}
      disabled={!canClick}
      className={cn(
        "relative aspect-square rounded-2xl border-2 transition-all duration-400",
        "flex flex-col items-center justify-center gap-2",
        "shadow-lg hover:shadow-xl",
        getStatusColor(),
        canClick && "cursor-pointer",
        !canClick && "cursor-not-allowed opacity-70",
        isAnimating && "animate-[scale-in_0.4s_ease-out]"
      )}
      style={isAnimating ? {
        transform: "scale(1.05) rotateY(10deg)",
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
      } : undefined}
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
