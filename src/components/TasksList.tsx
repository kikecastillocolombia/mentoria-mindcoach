import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  created_at: string;
}

interface TasksListProps {
  userId: string;
}

export const TasksList = ({ userId }: TasksListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId]);

  const fetchTasks = async () => {
    const { data: allTasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas",
        variant: "destructive",
      });
      return;
    }

    if (allTasks) {
      setTasks(allTasks.filter((task) => !task.completed));
      setCompletedTasks(allTasks.filter((task) => task.completed));
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "Error",
        description: "El título de la tarea es requerido",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("tasks").insert({
      user_id: userId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || null,
      completed: false,
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la tarea",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Éxito",
      description: "Tarea creada correctamente",
    });

    setNewTaskTitle("");
    setNewTaskDescription("");
    setIsDialogOpen(false);
    fetchTasks();
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: !completed })
      .eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      });
      return;
    }

    fetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Éxito",
      description: "Tarea eliminada",
    });

    fetchTasks();
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Mis tareas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full h-14 w-14">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva tarea</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título de la tarea"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
              />
              <Textarea
                placeholder="Descripción (opcional)"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddTask} className="w-full">
                Crear tarea
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 && completedTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="text-xl font-semibold mb-2">No hay tareas</h3>
          <p className="text-muted-foreground">
            Añade una tarea para comenzar
          </p>
        </div>
      ) : (
        <>
          {/* Tareas pendientes */}
          <div className="space-y-2 mb-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-4 rounded-lg bg-card border hover:bg-accent/50 transition-colors group"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() =>
                    handleToggleTask(task.id, task.completed)
                  }
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                  {task.due_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(task.due_date), "d 'de' MMM", {
                        locale: es,
                      })}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Tareas completadas */}
          {completedTasks.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-sm font-medium mb-2 w-full hover:bg-accent/50 p-2 rounded-lg transition-colors"
              >
                {showCompleted ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Completadas ({completedTasks.length})
              </button>
              {showCompleted && (
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-4 rounded-lg bg-card border hover:bg-accent/50 transition-colors group opacity-60"
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() =>
                          handleToggleTask(task.id, task.completed)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-through">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-through">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
