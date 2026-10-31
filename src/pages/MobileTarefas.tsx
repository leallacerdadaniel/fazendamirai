import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  nao_realizada: 'Não realizada',
};

const statusColors: Record<string, string> = {
  pendente: 'bg-warning/10 text-warning',
  em_andamento: 'bg-primary/10 text-primary',
  concluida: 'bg-success/10 text-success',
  nao_realizada: 'bg-destructive/10 text-destructive',
};

export default function MobileTarefas() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: tarefas, isLoading } = useQuery({
    queryKey: ['mobile-tarefas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .order('prazo', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: string }) => {
      const next = current === 'pendente' ? 'em_andamento' : current === 'em_andamento' ? 'concluida' : 'pendente';
      const { error } = await supabase.from('tarefas').update({ status: next }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mobile-tarefas'] });
      toast.success('Tarefa atualizada!');
    },
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-heading font-bold">Minhas Tarefas</h1>
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : tarefas && tarefas.length > 0 ? (
        tarefas.map((t) => (
          <Card key={t.id} className="active:scale-[0.98] transition-transform">
            <CardContent className="p-4">
              <button
                onClick={() => toggle.mutate({ id: t.id, current: t.status })}
                className="w-full text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">{t.titulo}</h3>
                  <Badge className={statusColors[t.status]}>{statusLabels[t.status]}</Badge>
                </div>
                {t.descricao && <p className="text-sm text-muted-foreground">{t.descricao}</p>}
                {t.prazo && (
                  <p className="text-xs text-muted-foreground">
                    Prazo: {new Date(t.prazo).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </button>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center text-muted-foreground py-8">Nenhuma tarefa</p>
      )}
    </div>
  );
}
