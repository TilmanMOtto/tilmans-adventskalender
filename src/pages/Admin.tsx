import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AdminForm from "@/components/admin/AdminForm";
import AdminList from "@/components/admin/AdminList";
import UserDashboard from "@/components/admin/UserDashboard";
import ExportCalendar from "@/components/admin/ExportCalendar";
import AdminNotifications from "@/components/admin/AdminNotifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user has admin role
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!rolesData) {
      toast.error("Zugriff verweigert. Nur für Admins.");
      navigate("/calendar");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const handleSaveSuccess = () => {
    setEditingEntry(null);
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lädt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button 
            onClick={() => navigate("/calendar")}
            variant="outline"
            size="icon"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="content">Inhaltsverwaltung</TabsTrigger>
            <TabsTrigger value="reactions">Reaktionen</TabsTrigger>
            <TabsTrigger value="progress">Benutzerfortschritt</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AdminForm 
                editingEntry={editingEntry}
                onSaveSuccess={handleSaveSuccess}
              />
              <AdminList 
                onEdit={setEditingEntry}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </TabsContent>

          <TabsContent value="reactions">
            <AdminNotifications />
          </TabsContent>

          <TabsContent value="progress">
            <UserDashboard />
          </TabsContent>

          <TabsContent value="export">
            <ExportCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
