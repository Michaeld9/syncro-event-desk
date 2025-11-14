import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { eventsApi } from "@/integrations/api";

interface Event {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  event_type: string;
}

const CalendarView = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchApprovedEvents = async () => {
    try {
      const response = await eventsApi.getApprovedEvents();
      setEvents(response.data.events || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar eventos",
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedEvents();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);
      return day >= eventStart && day <= eventEnd;
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "Evento": "bg-gray-500",
      "Ação Pontual": "bg-yellow-500",
      "Projeto Institucional": "bg-green-400",
      "Projeto Pedagógico": "bg-blue-400",
      "Expedição Pedagógica": "bg-blue-600",
      "Formação": "bg-purple-500",
      "Festa": "bg-red-500",
    };
    return colors[type] || "bg-cyan-500";
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <DashboardLayout activeTab="calendar">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Calendário de Eventos</CardTitle>
              <CardDescription>Visualize todos os eventos aprovados</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold min-w-[200px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </div>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando calendário...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-sm text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[120px]" />
                ))}

                {daysInMonth.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "min-h-[120px] border border-border rounded-lg p-2 transition-all hover:shadow-md",
                        !isSameMonth(day, currentMonth) && "bg-muted/30 opacity-50",
                        isToday && "border-primary border-2 bg-primary/5"
                      )}
                    >
                      <div
                        className={cn(
                          "text-sm font-medium mb-2",
                          isToday && "text-primary font-bold"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs p-1 rounded text-white truncate",
                              getEventTypeColor(event.event_type)
                            )}
                            title={`${event.title} - ${event.event_type}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground pl-1">
                            +{dayEvents.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-semibold mb-3">Legenda:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { type: "Evento", color: "bg-gray-500" },
                    { type: "Ação Pontual", color: "bg-yellow-500" },
                    { type: "Projeto Institucional", color: "bg-green-400" },
                    { type: "Projeto Pedagógico", color: "bg-blue-400" },
                    { type: "Expedição Pedagógica", color: "bg-blue-600" },
                    { type: "Formação", color: "bg-purple-500" },
                    { type: "Festa", color: "bg-red-500" },
                  ].map(({ type, color }) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded", color)} />
                      <span className="text-sm">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default CalendarView;
