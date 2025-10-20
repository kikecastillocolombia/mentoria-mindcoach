import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Target, Calendar as CalendarIcon, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: "cita" | "objetivo";
  completed: boolean;
}

interface CalendarViewProps {
  userId: string;
}

export const CalendarView = ({ userId }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "objetivo" as "cita" | "objetivo",
    time: "12:00",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [userId]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .order("event_date", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos",
        variant: "destructive",
      });
      return;
    }

    setEvents((data as Event[]) || []);
  };

  const handleAddEvent = async () => {
    if (!selectedDate || !formData.title.trim()) return;

    const eventDateTime = new Date(selectedDate);
    const [hours, minutes] = formData.time.split(":");
    eventDateTime.setHours(parseInt(hours), parseInt(minutes));

    const { error } = await supabase.from("events").insert({
      user_id: userId,
      title: formData.title,
      description: formData.description,
      event_date: eventDateTime.toISOString(),
      event_type: formData.event_type,
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el evento",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "✓ Evento creado",
      description: `${formData.event_type === "cita" ? "Cita" : "Objetivo"} agregado correctamente`,
    });

    setFormData({ title: "", description: "", event_type: "objetivo", time: "12:00" });
    setIsDialogOpen(false);
    fetchEvents();
  };

  const toggleComplete = async (eventId: string, completed: boolean) => {
    const { error } = await supabase
      .from("events")
      .update({ completed: !completed })
      .eq("id", eventId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el evento",
        variant: "destructive",
      });
      return;
    }

    fetchEvents();
  };

  const selectedDateEvents = events.filter((event) => {
    if (!selectedDate) return false;
    const eventDate = new Date(event.event_date);
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const datesWithEvents = events.map((event) => new Date(event.event_date));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border pointer-events-auto"
            locale={es}
            modifiers={{
              hasEvent: datesWithEvents,
            }}
            modifiersStyles={{
              hasEvent: {
                fontWeight: "bold",
                textDecoration: "underline",
              },
            }}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mt-4" disabled={!selectedDate}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Nuevo evento para {selectedDate && format(selectedDate, "PPP", { locale: es })}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="event-type">Tipo</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value: "cita" | "objetivo") =>
                      setFormData({ ...formData, event_type: value })
                    }
                  >
                    <SelectTrigger id="event-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="objetivo">Objetivo</SelectItem>
                      <SelectItem value="cita">Cita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Meditar 10 minutos"
                  />
                </div>
                <div>
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalles adicionales..."
                  />
                </div>
                <Button onClick={handleAddEvent} className="w-full">
                  Crear Evento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Selecciona una fecha"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay eventos para esta fecha
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border transition-all ${
                    event.completed ? "opacity-60 bg-muted" : "bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={event.event_type === "cita" ? "default" : "secondary"}>
                          {event.event_type === "cita" ? (
                            <CalendarIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <Target className="h-3 w-3 mr-1" />
                          )}
                          {event.event_type === "cita" ? "Cita" : "Objetivo"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(event.event_date), "HH:mm")}
                        </span>
                      </div>
                      <h4 className={`font-medium ${event.completed ? "line-through" : ""}`}>
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={event.completed ? "secondary" : "outline"}
                      onClick={() => toggleComplete(event.id, event.completed)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
