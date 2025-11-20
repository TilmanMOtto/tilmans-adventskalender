import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import heroBackground from "@/assets/hero-background.jpg";
import tilmanPhoto from "@/assets/tilman-welcome.jpg";
import SnowAnimation from "@/components/calendar/SnowAnimation";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      navigate("/calendar");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <SnowAnimation />
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <div className="mb-6 md:mb-8 flex justify-center animate-fade-in">
          <img
            src={tilmanPhoto}
            alt="Tilman mit Weihnachtsmütze"
            className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-full object-cover border-4 border-primary shadow-2xl"
          />
        </div>
        <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in">
          Tilman's Adventskalender
        </h1>
        <p className="text-base md:text-xl lg:text-2xl text-foreground/80 mb-6 md:mb-8 animate-fade-in">
          Ich nehme dich mit auf eine Reise durch mein Jahr 2025.
        </p>
        <Button
          onClick={() => navigate("/auth")}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base md:text-lg px-6 py-4 md:px-8 md:py-6 animate-fade-in shadow-xl hover:shadow-2xl transition-all hover:scale-105"
        >
          Los geht's
        </Button>
      </div>
    </div>
  );
};

export default Index;
