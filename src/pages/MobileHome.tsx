import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Milk, Syringe, HeartPulse, Scale, ClipboardList, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'BOM DIA';
  if (h < 18) return 'BOA TARDE';
  return 'BOA NOITE';
};

const quickActions = [
  { label: 'Registrar Produção de Leite', icon: Milk, path: '/mobile/registros' },
  { label: 'Marcar Vacinação Realizada', icon: Syringe, path: '/mobile/registros' },
  { label: 'Registrar Tratamento', icon: HeartPulse, path: '/mobile/registros' },
  { label: 'Pesar Animal', icon: Scale, path: '/mobile/registros' },
  { label: 'Ver Minhas Tarefas', icon: ClipboardList, path: '/mobile/tarefas' },
];

export default function MobileHome() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: tarefasCount } = useQuery({
    queryKey: ['mobile-tarefas-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('tarefas')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pendente', 'em_andamento']);
      return count || 0;
    },
  });

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-heading font-bold">
            {getGreeting()}, {profile?.nome?.split(' ')[0] || 'Colaborador'}!
          </p>
          <p className="text-muted-foreground">
            Você tem <span className="font-bold text-secondary">{tarefasCount || 0}</span> tarefa(s) pendente(s)
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading font-bold text-lg">Ações Rápidas</h2>
        {quickActions.map((action) => (
          <Card key={action.label} className="active:scale-[0.98] transition-transform">
            <CardContent className="p-0">
              <button
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-4 p-4 min-h-[56px] text-left"
              >
                <div className="p-3 rounded-xl bg-secondary/10">
                  <action.icon className="h-6 w-6 text-secondary" />
                </div>
                <span className="text-base font-medium">{action.label}</span>
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
