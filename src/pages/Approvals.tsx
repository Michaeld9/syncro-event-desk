import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  status: string;
  created_at: string;
  creator?: { full_name: string; email: string };
}

const Approvals = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchPendingEvents = async () => {
    try {
      const response = await eventsApi.getPendingEvents();
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
    fetchPendingEvents();
  }, []);

  const handleApprove = async (eventId: number) => {
    setProcessing(eventId);
    try {
      await eventsApi.approveEvent(eventId);

      toast({
        title: "Evento aprovado",
        description: "O evento foi aprovado com sucesso.",
      });

      fetchPendingEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao aprovar evento",
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (eventId: number) => {
    if (!confirm("Tem certeza que deseja rejeitar este evento?")) return;

    setProcessing(eventId);
    try {
      await eventsApi.rejectEvent(eventId);

      toast({
        title: "Evento rejeitado",
        description: "O evento foi rejeitado.",
        variant: "destructive",
      });

      fetchPendingEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao rejeitar evento",
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <DashboardLayout activeTab="approvals">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Aprovações Pendentes</CardTitle>
          <CardDescription>
            Revise e aprove eventos criados pelos coordenadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando eventos pendentes...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <p className="text-muted-foreground">
                Não há eventos pendentes de aprovação
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-border rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendente
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>
                          Solicitado por: <strong>{event.creator?.full_name || event.creator?.email}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong className="text-foreground">Tipo:</strong>
                          <p className="text-muted-foreground">{event.event_type}</p>
                        </div>
                        <div>
                          <strong className="text-foreground">Data:</strong>
                          <p className="text-muted-foreground">
                            {format(new Date(event.start_date), "dd/MM/yyyy", { locale: ptBR })}
                            {event.start_date !== event.end_date &&
                              ` até ${format(new Date(event.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                          </p>
                        </div>
                        {!event.all_day && event.start_time && (
                          <div className="col-span-2">
                            <strong className="text-foreground">Horário:</strong>
                            <p className="text-muted-foreground">
                              {event.start_time} - {event.end_time}
                            </p>
                          </div>
                        )}
                        {event.description && (
                          <div className="col-span-2">
                            <strong className="text-foreground">Descrição:</strong>
                            <p className="text-muted-foreground">{event.description}</p>
                          </div>
                        )}
                        <div className="col-span-2 text-xs text-muted-foreground">
                          Criado em {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleApprove(event.id)}
                        disabled={processing === event.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {processing === event.id ? "Processando..." : "Aprovar"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(event.id)}
                        disabled={processing === event.id}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Approvals;
