import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import heroBackground from "@/assets/hero-background.jpg";
import tilmanWelcome from "@/assets/tilman-welcome.jpg";
const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (session) {
      navigate("/calendar");
    }
  };
  return <div className="min-h-screen flex items-center justify-center p-4" style={{
    backgroundImage: `url(${heroBackground})`,
    backgroundSize: "cover",
    backgroundPosition: "center"
  }}>
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <img 
          src={tilmanWelcome} 
          alt="Tilman mit Weihnachtsmütze" 
          className="w-48 h-48 md:w-64 md:h-64 rounded-full mx-auto mb-8 object-cover object-[60%_35%] border-4 border-primary/30 shadow-2xl animate-fade-in scale-125"
        />
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in">Tilman's Adventskalender</h1>
        <p className="text-xl md:text-2xl text-foreground/80 mb-8 animate-fade-in">Ich nehme dich mit auf eine Reise durch mein Jahr 2025.       </p>
        <Button onClick={() => navigate("/auth")} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg px-8 py-6 animate-fade-in shadow-xl hover:shadow-2xl transition-all hover:scale-105">
          Los geht's
        </Button>
      </div>
    </div>;
};
export default Index;