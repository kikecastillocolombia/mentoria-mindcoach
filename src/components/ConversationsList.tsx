import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { z } from "zod";

const conversationTitleSchema = z.string()
  .trim()
  .min(1, "El título no puede estar vacío")
  .max(100, "El título debe tener menos de 100 caracteres");

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ConversationsListProps {
  userId: string;
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onSwitchToChat?: () => void;
}

const ConversationsList = ({
  userId,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onSwitchToChat,
}: ConversationsListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, [userId]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error al cargar conversaciones:", error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== id));
      
      if (currentConversationId === id) {
        onSelectConversation(null as any);
      }

      toast({
        title: "Conversación eliminada",
        description: "La conversación se ha eliminado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la conversación",
        variant: "destructive",
      });
    }
  };

  const startEditing = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(title);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingTitle("");
  };

  const saveTitle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const validatedTitle = conversationTitleSchema.parse(editingTitle);
      
      const { error } = await supabase
        .from("conversations")
        .update({ title: validatedTitle })
        .eq("id", id);

      if (error) throw error;

      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, title: validatedTitle } : c))
      );
      
      setEditingId(null);
      setEditingTitle("");

      toast({
        title: "Título actualizado",
        description: "El nombre de la conversación se ha actualizado",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el título",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Conversaciones
        </h3>
        <Button
          size="sm"
          onClick={onNewConversation}
          className="gap-2 bg-gradient-to-br from-primary to-secondary hover:shadow-soft transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Nueva
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                if (editingId !== conv.id) {
                  onSelectConversation(conv.id);
                  onSwitchToChat?.();
                }
              }}
              className={`group p-3 rounded-xl transition-all duration-300 flex items-center justify-between ${
                currentConversationId === conv.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-accent/50 border border-transparent"
              } ${editingId === conv.id ? "" : "cursor-pointer"}`}
            >
              <div className="flex-1 min-w-0 mr-2">
                {editingId === conv.id ? (
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 text-sm"
                    maxLength={100}
                    autoFocus
                  />
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground truncate">
                      {conv.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.updated_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {editingId === conv.id ? (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => saveTitle(conv.id, e)}
                      className="h-8 w-8 text-primary hover:bg-primary/10"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelEditing}
                      className="h-8 w-8 text-muted-foreground hover:bg-accent"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => startEditing(conv.id, conv.title, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-accent"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handleDelete(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationsList;
