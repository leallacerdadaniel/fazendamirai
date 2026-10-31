import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/KPICard';
import { Baby, HeartPulse, Droplets, CalendarCheck } from 'lucide-react';

export function ReproducaoKPIs() {
  const { data: coberturas } = useQuery({
    queryKey: ['reproducoes-count'],
    queryFn: async () => {
      const { count } = await supabase.from('reproducoes').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: prenhes } = useQuery({
    queryKey: ['diagnosticos-positivos-count'],
    queryFn: async () => {
      const { count } = await supabase.from('diagnosticos_gestacao').select('*', { count: 'exact', head: true }).eq('resultado', 'positivo');
      return count || 0;
    },
  });

  const { data: partos } = useQuery({
    queryKey: ['partos-count'],
    queryFn: async () => {
      const { count } = await supabase.from('partos').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: secagens } = useQuery({
    queryKey: ['secagens-count'],
    queryFn: async () => {
      const { count } = await supabase.from('secagens').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="Coberturas" value={coberturas ?? 0} icon={<HeartPulse className="h-5 w-5" />} color="default" />
      <KPICard title="Prenhes Confirmadas" value={prenhes ?? 0} icon={<Baby className="h-5 w-5" />} color="success" />
      <KPICard title="Partos Registrados" value={partos ?? 0} icon={<CalendarCheck className="h-5 w-5" />} color="warning" />
      <KPICard title="Vacas Secas" value={secagens ?? 0} icon={<Droplets className="h-5 w-5" />} color="default" />
    </div>
  );
}
