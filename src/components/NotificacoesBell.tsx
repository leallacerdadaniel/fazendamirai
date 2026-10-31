import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface Notificacao {
  id: string;
  titulo: string;
  tipo: 'atrasada' | 'proxima' | 'hoje';
  prazo: string;
  diasRestantes: number;
}

export function NotificacoesBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes-tarefas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tarefas')
        .select('id, titulo, prazo, status')
        .in('status', ['pendente', 'em_andamento'])
        .not('prazo', 'is', null)
        .order('prazo', { ascending: true });

      if (!data) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result: Notificacao[] = [];

      for (const t of data) {
        if (!t.prazo) continue;
        const prazoDate = new Date(t.prazo + 'T12:00');
        const diff = Math.ceil((prazoDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diff < 0) {
          result.push({ id: t.id, titulo: t.titulo, tipo: 'atrasada', prazo: t.prazo, diasRestantes: diff });
        } else if (diff === 0) {
          result.push({ id: t.id, titulo: t.titulo, tipo: 'hoje', prazo: t.prazo, diasRestantes: 0 });
        } else if (diff <= 3) {
          result.push({ id: t.id, titulo: t.titulo, tipo: 'proxima', prazo: t.prazo, diasRestantes: diff });
        }
      }

      return result;
    },
    refetchInterval: 60000,
  });

  const atrasadas = notificacoes.filter(n => n.tipo === 'atrasada').length;
  const total = notificacoes.length;

  const formatLabel = (n: Notificacao) => {
    if (n.tipo === 'atrasada') return `${Math.abs(n.diasRestantes)}d atrasada`;
    if (n.tipo === 'hoje') return 'Vence hoje';
    return `Vence em ${n.diasRestantes}d`;
  };

  const iconFor = (tipo: string) => {
    if (tipo === 'atrasada') return <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
    if (tipo === 'hoje') return <Clock className="h-4 w-4 text-warning shrink-0" />;
    return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <span className={`absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-primary-foreground ${atrasadas > 0 ? 'bg-destructive' : 'bg-warning'}`}>
              {total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h3 className="font-heading font-semibold text-sm">Notificações</h3>
          <p className="text-xs text-muted-foreground">{total} alerta(s) de tarefas</p>
        </div>
        <div className="max-h-72 overflow-auto">
          {notificacoes.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Tudo em dia!</p>
            </div>
          ) : (
            notificacoes.map(n => (
              <button
                key={n.id}
                onClick={() => { setOpen(false); navigate('/tarefas'); }}
                className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b last:border-0"
              >
                {iconFor(n.tipo)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{n.titulo}</p>
                  <p className={`text-xs ${n.tipo === 'atrasada' ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {formatLabel(n)}
                  </p>
                </div>
                {n.tipo === 'atrasada' && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">Urgente</Badge>
                )}
              </button>
            ))
          )}
        </div>
        {total > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setOpen(false); navigate('/tarefas'); }}>
              Ver todas as tarefas →
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
