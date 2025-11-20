import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import heroBackground from "@/assets/hero-background.jpg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Willkommen zurück!");
        navigate("/calendar");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/calendar`,
            data: {
              username,
            },
          },
        });

        if (signUpError) throw signUpError;
        toast.success("Konto erstellt! Willkommen!");
        navigate("/calendar");
      }
    } catch (error: any) {
      toast.error(error.message || "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
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
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Adventskalender
          </CardTitle>
          <CardDescription className="text-base">
            {isLogin ? "Willkommen zurück! Melde dich an um fortzufahren" : "Erstelle dein Konto um zu beginnen"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Benutzername</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Gib deinen Benutzernamen ein"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="Gib deine E-Mail ein"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Gib dein Passwort ein"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? "Lädt..." : isLogin ? "Anmelden" : "Registrieren"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              {isLogin ? "Noch kein Konto? Registrieren" : "Bereits ein Konto? Anmelden"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
