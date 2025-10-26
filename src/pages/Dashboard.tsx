import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ChatInterface from "@/components/ChatInterface";
import ConversationsList from "@/components/ConversationsList";
import { CalendarView } from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Sparkles, MessageSquare, Calendar, History, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HabitsGamification } from "@/components/HabitsGamification";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      initializeConversation();
    }
  }, [user]);

  const initializeConversation = async () => {
    if (!user) return;
    
    try {
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (conversations && conversations.length > 0) {
        setConversationId(conversations[0].id);
      } else {
        await createNewConversation();
      }
    } catch (error) {
      console.error("Error al inicializar conversación:", error);
    }
  };

  const createNewConversation = async () => {
    if (!user) return;
    
    try {
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert([{ user_id: user.id, title: "Nueva Conversación" }])
        .select()
        .single();

      if (error) throw error;
      setConversationId(newConversation.id);
      setActiveTab("chat");
      
      toast({
        title: "Nueva conversación",
        description: "Se ha creado una nueva conversación",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la conversación",
        variant: "destructive",
      });
    }
  };

  const handleConversationChange = () => {
    // Trigger para actualizar la lista de conversaciones
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Hasta pronto, te esperamos de vuelta",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary animate-pulse shadow-medium">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground animate-pulse">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-accent/20 to-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-soft">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BienesTia
              </h1>
              <p className="text-xs text-muted-foreground">Tu coach personal</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 hover:bg-accent/50 transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="habits" className="gap-2">
              <Trophy className="h-4 w-4" />
              Hábitos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat">
            <ChatInterface
              userId={user.id}
              conversationId={conversationId}
              onConversationChange={handleConversationChange}
            />
          </TabsContent>

          <TabsContent value="history">
            <div className="max-w-2xl mx-auto">
              <ConversationsList
                userId={user.id}
                currentConversationId={conversationId}
                onSelectConversation={setConversationId}
                onNewConversation={createNewConversation}
                onSwitchToChat={() => setActiveTab("chat")}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="calendar">
            <CalendarView userId={user.id} />
          </TabsContent>
          
          <TabsContent value="habits">
            <HabitsGamification userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
