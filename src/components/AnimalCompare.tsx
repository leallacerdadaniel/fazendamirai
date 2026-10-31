import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Scale, X } from 'lucide-react';
import { differenceInMonths } from 'date-fns';

const fmt = (v: any, suf = '') => (v === null || v === undefined || v === '' ? '—' : `${typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : v}${suf}`);

async function stats(id: string) {
  const since = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const [prod, peso, partos, repro] = await Promise.all([
    supabase.from('producao_leite_diaria').select('litros, data').eq('animal_id', id).gte('data', since),
    supabase.from('pesagens').select('peso_kg, data').eq('animal_id', id).order('data', { ascending: false }).limit(1),
    supabase.from('partos').select('id', { count: 'exact', head: true }).eq('vaca_id', id),
    supabase.from('reproducoes').select('id', { count: 'exact', head: true }).eq('animal_id', id),
  ]);
  const l = prod.data || [];
  const dias = new Set(l.map(r => r.data)).size;
  const total = l.reduce((s, r) => s + Number(r.litros || 0), 0);
  return { media: dias ? total / dias : null, peso: peso.data?.[0]?.peso_kg ?? null, partos: partos.count ?? 0, coberturas: repro.count ?? 0 };
}

export function AnimalCompare({ animal }: { animal: any }) {
  const [busca, setBusca] = useState('');
  const [outros, setOutros] = useState<any[]>([]);

  const { data: resultados = [] } = useQuery({
    queryKey: ['comparar-busca', busca],
    enabled: busca.trim().length >= 2,
    queryFn: async () => {
      const t = busca.trim();
      const { data } = await supabase.from('animais').select('*').or(`nome.ilike.%${t}%,brinco.ilike.%${t}%,rgd.ilike.%${t}%`).neq('id', animal.id).limit(8);
      return data || [];
    },
  });

  const todos = useMemo(() => [animal, ...outros], [animal, outros]);
  const { data: st = {} } = useQuery({
    queryKey: ['comparar-stats', todos.map(a => a.id).join(',')],
    queryFn: async () => Object.fromEntries(await Promise.all(todos.map(async a => [a.id, await stats(a.id)]))),
  });

  const idade = (n: string | null) => (n ? `${Math.floor(differenceInMonths(new Date(), new Date(n)) / 12)}a ${differenceInMonths(new Date(), new Date(n)) % 12}m` : '—');
  const linhas: [string, (a: any) => string, ((a: any) => number | null)?][] = [
    ['Brinco', a => fmt(a.brinco)], ['RGD', a => fmt(a.rgd)], ['Categoria', a => fmt(a.tipo)], ['Raça / sangue', a => fmt(a.raca || a.raca_sangue)],
    ['Idade', a => idade(a.nascimento)], ['Pai', a => fmt(a.pai_nome)], ['Mãe', a => fmt(a.mae_nome)],
    ['VG', a => fmt(a.vg), a => a.vg], ['GPTA', a => fmt(a.gpta), a => a.gpta], ['PTA', a => fmt(a.pta), a => a.pta],
    ['Índice genético', a => fmt(a.indice_genetico), a => a.indice_genetico], ['Lactação (kg)', a => fmt(a.lactacao_kg), a => a.lactacao_kg],
    ['Beta-caseína', a => fmt(a.betacaseina)],
    ['Leite/dia (90d)', a => fmt(st[a.id]?.media, ' L'), a => st[a.id]?.media ?? null], ['Último peso', a => fmt(st[a.id]?.peso, ' kg'), a => st[a.id]?.peso ?? null],
    ['Partos', a => fmt(st[a.id]?.partos), a => st[a.id]?.partos ?? null], ['Coberturas', a => fmt(st[a.id]?.coberturas)],
    ['Status', a => fmt(a.status)],
  ];

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4" />Comparar com outros animais</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-md">
          <Input placeholder="Buscar por nome, brinco ou RGD..." value={busca} onChange={e => setBusca(e.target.value)} />
          {resultados.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover shadow-md">
              {resultados.filter(r => !outros.some(o => o.id === r.id)).map(r => (
                <button key={r.id} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => { if (outros.length < 3) setOutros(o => [...o, r]); setBusca(''); }}>
                  {r.brinco ? `${r.brinco} · ` : ''}{r.nome || 'Sem nome'}
                </button>
              ))}
            </div>
          )}
        </div>
        {outros.length === 0 ? <p className="text-sm text-muted-foreground">Adicione até 3 animais para comparar lado a lado.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="border-b">
                <th className="py-2 pr-3 text-left text-xs font-semibold text-muted-foreground"></th>
                {todos.map((a, i) => (
                  <th key={a.id} className="py-2 pr-3 text-left">
                    <span className="flex items-center gap-1 font-semibold">{a.nome || a.brinco}
                      {i > 0 && <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setOutros(o => o.filter(x => x.id !== a.id))}><X className="h-3 w-3" /></Button>}
                    </span>
                  </th>
                ))}
              </tr></thead>
              <tbody>
                {linhas.map(([label, get, num]) => {
                  const vals = num ? todos.map(a => num(a)).filter((v): v is number => v !== null && v !== undefined) : [];
                  const max = vals.length > 1 ? Math.max(...vals.map(Number)) : null;
                  return (
                    <tr key={label} className="border-b last:border-0">
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{label}</td>
                      {todos.map(a => {
                        const best = max !== null && num && Number(num(a)) === max;
                        return <td key={a.id} className={`py-2 pr-3 ${best ? 'font-bold text-[hsl(var(--tone-rebanho))]' : ''}`}>{get(a)}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">Em verde, o melhor valor de cada indicador.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
