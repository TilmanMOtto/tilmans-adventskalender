import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import DoorModal from "@/components/calendar/DoorModal";
import SnowAnimation from "@/components/calendar/SnowAnimation";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import heroBackground from "@/assets/hero-background.jpg";
import tilmanPhoto from "@/assets/tilman-welcome.jpg";
const Calendar = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    checkUser();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const checkUser = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    await fetchProfile(session.user.id);
    setLoading(false);
  };
  const fetchProfile = async (userId: string) => {
    const {
      data: profileData
    } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(profileData);

    // Check if user has admin role
    const {
      data: rolesData
    } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    setIsAdmin(!!rolesData);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(language === 'de' ? "Erfolgreich abgemeldet" : "Successfully logged out");
    navigate("/auth");
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lade Kalender...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen" style={{
    backgroundImage: `url(${heroBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed"
  }}>
      <SnowAnimation />
      <div className="absolute inset-0 bg-background/10 backdrop-blur-sm" />
      
      <div className="relative z-10 container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-8">
          <div className="flex items-stretch gap-3 md:gap-4">
            <img 
              src={tilmanPhoto} 
              alt="Tilman" 
              className="h-auto w-12 md:w-16 rounded-full object-cover shadow-lg self-stretch"
            />
            <div className="bg-background/80 backdrop-blur-md rounded-lg px-4 py-3 md:px-6 md:py-4 shadow-lg">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground drop-shadow-lg">
                {t('calendar.title')}
              </h1>
              <p className="text-sm md:text-base text-foreground/90 mt-1 md:mt-2 font-medium drop-shadow">
                {t('calendar.welcome')}, {profile?.username}! {isAdmin && `(${t('calendar.admin')})`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <LanguageToggle />
            {isAdmin && <Button onClick={() => navigate("/admin")} className="flex-1 md:flex-none text-sm md:text-base bg-door-available hover:bg-door-available/90 text-white border-2 border-door-available shadow-lg hover:shadow-xl rounded-lg md:rounded-2xl transition-all duration-300">
                {t('calendar.adminPanel')}
              </Button>}
            <Button onClick={handleLogout} className="flex-1 md:flex-none text-sm md:text-base bg-door-locked hover:bg-door-locked/90 text-white border-2 border-door-locked shadow-lg hover:shadow-xl rounded-lg md:rounded-2xl transition-all duration-300">
              <LogOut className="w-4 h-4 mr-2" />
              {t('calendar.logout')}
            </Button>
          </div>
        </div>

        <CalendarGrid key={refreshKey} onDoorClick={setSelectedDay} userId={user?.id} isAdmin={isAdmin} />
        
        {selectedDay && <DoorModal dayNumber={selectedDay} userId={user?.id} onClose={() => setSelectedDay(null)} onDoorOpened={() => setRefreshKey(prev => prev + 1)} />}
      </div>
    </div>;
};
export default Calendar;