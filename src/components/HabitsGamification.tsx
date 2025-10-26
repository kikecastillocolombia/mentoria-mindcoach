import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Trash2, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Habit {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
}

interface HabitTracking {
  id: string;
  habit_id: string;
  date: string;
  status: "completed" | "failed" | "pending";
}

interface HabitsGamificationProps {
  userId: string;
}

export const HabitsGamification = ({ userId }: HabitsGamificationProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tracking, setTracking] = useState<HabitTracking[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitColor, setNewHabitColor] = useState("#10b981");
  const { toast } = useToast();

  useEffect(() => {
    fetchHabits();
    fetchTracking();
  }, [userId, currentDate]);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los hábitos",
        variant: "destructive",
      });
      return;
    }

    setHabits((data as Habit[]) || []);
  };

  const fetchTracking = async () => {
    const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
    const end = format(endOfMonth(currentDate), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("habit_tracking")
      .select("*")
      .gte("date", start)
      .lte("date", end);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el seguimiento",
        variant: "destructive",
      });
      return;
    }

    setTracking((data as HabitTracking[]) || []);
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;

    const { error } = await supabase.from("habits").insert({
      user_id: userId,
      name: newHabitName,
      color: newHabitColor,
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el hábito",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "✓ Hábito creado",
      description: "Nuevo hábito agregado correctamente",
    });

    setNewHabitName("");
    setNewHabitColor("#10b981");
    setIsDialogOpen(false);
    fetchHabits();
  };

  const handleDeleteHabit = async (habitId: string) => {
    const { error } = await supabase
      .from("habits")
      .update({ is_active: false })
      .eq("id", habitId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el hábito",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "✓ Hábito eliminado",
      description: "El hábito ha sido eliminado correctamente",
    });

    fetchHabits();
  };

  const handleCellClick = async (habitId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = tracking.find(
      (t) => t.habit_id === habitId && t.date === dateStr
    );

    const statusCycle: ("pending" | "completed" | "failed")[] = [
      "pending",
      "completed",
      "failed",
    ];
    const currentIndex = existing
      ? statusCycle.indexOf(existing.status)
      : -1;
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    if (existing) {
      const { error } = await supabase
        .from("habit_tracking")
        .update({ status: nextStatus })
        .eq("id", existing.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado",
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error } = await supabase.from("habit_tracking").insert({
        habit_id: habitId,
        date: dateStr,
        status: nextStatus,
      });

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo crear el registro",
          variant: "destructive",
        });
        return;
      }
    }

    fetchTracking();
  };

  const getCellStatus = (habitId: string, date: Date): "pending" | "completed" | "failed" => {
    const dateStr = format(date, "yyyy-MM-dd");
    const track = tracking.find(
      (t) => t.habit_id === habitId && t.date === dateStr
    );
    return track?.status || "pending";
  };

  const getCellColor = (status: "pending" | "completed" | "failed") => {
    switch (status) {
      case "completed":
        return "bg-green-500 hover:bg-green-600";
      case "failed":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-background hover:bg-accent";
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const calculateCompletionRate = (habitId: string) => {
    const habitTrackings = tracking.filter((t) => t.habit_id === habitId);
    const completed = habitTrackings.filter((t) => t.status === "completed").length;
    const total = habitTrackings.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Gamificación de Hábitos
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Hábito
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nuevo hábito</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="habit-name">Nombre del hábito</Label>
                    <Input
                      id="habit-name"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="Ej: Ejercicio diario"
                    />
                  </div>
                  <div>
                    <Label htmlFor="habit-color">Color</Label>
                    <div className="flex gap-2">
                      {["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map(
                        (color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              newHabitColor === color
                                ? "border-foreground scale-110"
                                : "border-border"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewHabitColor(color)}
                          />
                        )
                      )}
                    </div>
                  </div>
                  <Button onClick={handleAddHabit} className="w-full">
                    Crear Hábito
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </h3>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">
                No tienes hábitos configurados
              </p>
              <p className="text-sm text-muted-foreground">
                Crea tu primer hábito para comenzar a seguir tu progreso
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Header con días */}
                <div className="flex gap-1 mb-2 ml-40">
                  {daysInMonth.map((day) => (
                    <div
                      key={day.toISOString()}
                      className="w-8 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                    >
                      {format(day, "d")}
                    </div>
                  ))}
                </div>

                {/* Filas de hábitos */}
                {habits.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-2 mb-2">
                    <div className="w-32 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                      <span className="text-sm font-medium truncate flex-1">
                        {habit.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="w-12 text-xs">
                      {calculateCompletionRate(habit.id)}%
                    </Badge>
                    <div className="flex gap-1">
                      {daysInMonth.map((day) => {
                        const status = getCellStatus(habit.id, day);
                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => handleCellClick(habit.id, day)}
                            className={`w-8 h-8 rounded border border-border transition-all ${getCellColor(
                              status
                            )}`}
                            title={`${habit.name} - ${format(day, "d MMM", { locale: es })}`}
                          />
                        );
                      })}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="h-8 w-8 flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Card */}
      {habits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estadísticas del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {habits.map((habit) => {
                const rate = calculateCompletionRate(habit.id);
                const habitTrackings = tracking.filter((t) => t.habit_id === habit.id);
                const completed = habitTrackings.filter((t) => t.status === "completed").length;
                
                return (
                  <div
                    key={habit.id}
                    className="p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <span className="text-sm font-medium truncate">
                        {habit.name}
                      </span>
                    </div>
                    <div className="text-2xl font-bold">{rate}%</div>
                    <div className="text-xs text-muted-foreground">
                      {completed} días completados
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
