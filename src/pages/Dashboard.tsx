import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Clock, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import EventFormDialog from "@/components/EventFormDialog";
import { eventsApi } from "@/integrations/api";

interface Event {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  event_type: string;
  status: 'pending' | 'approved' | 'rejected';
}

const Dashboard = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    try {
      const response = await eventsApi.getMyEvents();
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
    fetchEvents();
  }, []);

  const handleDelete = async (eventId: number) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    try {
      await eventsApi.deleteEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
      toast({
        title: "Evento excluído",
        description: "O evento foi removido com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir evento",
        description: error.response?.data?.error || error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      approved: { label: "Aprovado", icon: CheckCircle2, className: "bg-green-100 text-green-800" },
      rejected: { label: "Rejeitado", icon: XCircle, className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout activeTab="events">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Meus Eventos</CardTitle>
              <CardDescription>Gerencie seus eventos criados</CardDescription>
            </div>
            <Button onClick={() => {
              setEditingEvent(null);
              setShowEventDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando eventos...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum evento criado ainda</p>
              <Button onClick={() => setShowEventDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Evento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        {getStatusBadge(event.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <strong>Tipo:</strong> {event.event_type}
                        </p>
                        <p>
                          <strong>Data:</strong>{" "}
                          {format(new Date(event.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          {event.start_date !== event.end_date &&
                            ` até ${format(new Date(event.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                        </p>
                        {!event.all_day && event.start_time && (
                          <p>
                            <strong>Horário:</strong> {event.start_time} - {event.end_time}
                          </p>
                        )}
                        {event.description && (
                          <p className="mt-2">
                            <strong>Descrição:</strong> {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {event.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingEvent(event);
                            setShowEventDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EventFormDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        event={editingEvent}
        onSuccess={() => {
          fetchEvents();
          setShowEventDialog(false);
          setEditingEvent(null);
        }}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
