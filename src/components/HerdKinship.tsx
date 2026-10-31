import { cap } from "@/lib/labels";
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

type A = { id: string; nome: string | null; brinco: string | null; status: string; sexo: string | null; mae_id: string | null; pai_id: string | null; mae_nome: string | null; pai_nome: string | null };

const norm = (s: string | null) => (s || '').trim().toUpperCase().replace(/\s+/g, ' ');
const MAX_GEN = 4;

export function HerdKinship({ animalId }: { animalId: string }) {
  const [todos, setTodos] = useState(false);
  const { data: animais } = useQuery({
    queryKey: ['parentesco-rebanho'],
    queryFn: async () => {
      const all: A[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from('animais')
          .select('id, nome, brinco, status, sexo, mae_id, pai_id, mae_nome, pai_nome').range(from, from + 999);
        if (error) throw error;
        all.push(...((data || []) as A[]));
        if (!data || data.length < 1000) break;
      }
      return all;
    },
  });

  const parentes = useMemo(() => {
    if (!animais) return [];
    const byId = new Map(animais.map(a => [a.id, a]));
    const nameCount = new Map<string, string[]>();
    animais.forEach(a => { const n = norm(a.nome); if (n) nameCount.set(n, [...(nameCount.get(n) || []), a.id]); });
    const keyFor = (id: string | null, nome: string | null) => {
      if (id) return id;
      const n = norm(nome);
      if (!n) return null;
      const ids = nameCount.get(n);
      return ids && ids.length === 1 ? ids[0] : 'nome:' + n;
    };
    const parentsOf = (key: string): string[] => {
      const a = byId.get(key);
      if (!a) return [];
      return [keyFor(a.mae_id, a.mae_nome), keyFor(a.pai_id, a.pai_nome)].filter(Boolean) as string[];
    };
    const ancestors = (key: string) => {
      const m = new Map<string, number[]>();
      const walk = (k: string, d: number) => {
        m.set(k, [...(m.get(k) || []), d]);
        if (d < MAX_GEN) parentsOf(k).forEach(p => walk(p, d + 1));
      };
      walk(key, 0);
      return m;
    };
    const isAncestor = (anc: string, of: string) => ancestors(of).has(anc) && anc !== of;
    const mine = ancestors(animalId);
    const out: { a: A; r: number; label: string }[] = [];
    for (const b of animais) {
      if (b.id === animalId) continue;
      const theirs = ancestors(b.id);
      const comuns = [...mine.keys()].filter(k => theirs.has(k));
      if (!comuns.length) continue;
      const fechados = comuns.filter(c => !comuns.some(o => o !== c && isAncestor(c, o)));
      let r = 0; let best: [number, number] = [99, 99]; let n11 = 0;
      for (const c of fechados) {
        for (const d1 of mine.get(c)!) for (const d2 of theirs.get(c)!) {
          r += Math.pow(0.5, d1 + d2);
          if (d1 + d2 < best[0] + best[1]) best = [d1, d2];
          if (d1 === 1 && d2 === 1) n11++;
        }
      }
      const f = b.sexo === 'femea' || b.sexo === 'F';
      const [x, y] = best;
      let label = 'Parente distante';
      if (x === 0 && y === 1) label = f ? 'Filha' : 'Filho';
      else if (x === 1 && y === 0) label = f ? 'Mãe' : 'Pai';
      else if (x === 0 && y === 2) label = f ? 'Neta' : 'Neto';
      else if (x === 2 && y === 0) label = f ? 'Avó' : 'Avô';
      else if (x === 1 && y === 1) label = n11 >= 2 ? (f ? 'Irmã' : 'Irmão') : (f ? 'Meia-irmã' : 'Meio-irmão');
      else if (x === 2 && y === 1) label = f ? 'Tia' : 'Tio';
      else if (x === 1 && y === 2) label = f ? 'Sobrinha' : 'Sobrinho';
      else if (x === 2 && y === 2) label = f ? 'Prima' : 'Primo';
      out.push({ a: b, r, label });
    }
    return out.sort((p, q) => q.r - p.r);
  }, [animais, animalId]);

  const lista = parentes.filter(p => todos || p.a.status === 'ativo');
  const cor = (r: number) => r >= 0.25 ? 'bg-destructive/10 text-destructive border-destructive/20'
    : r >= 0.125 ? 'bg-warning/10 text-warning border-warning/20' : 'bg-muted text-muted-foreground';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" /> Parentes no rebanho</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setTodos(t => !t)}>{todos ? 'Só ativos' : 'Incluir vendidos/baixados'}</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Grau de parentesco calculado pela genealogia (até 4 gerações), usando mãe e pai cadastrados ou pelo nome.
          Vermelho = parentesco próximo (≥ 25%), laranja = moderado (≥ 12,5%).
        </p>
        {!animais ? <p className="text-sm text-muted-foreground">Calculando...</p> : lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum parente encontrado no rebanho com os dados de genealogia atuais.</p>
        ) : (
          <div className="divide-y">
            {lista.slice(0, 60).map(({ a, r, label }) => (
              <Link key={a.id} to={`/animais/${a.id}/perfil`} className="flex items-center gap-3 py-2 hover:bg-muted/50 rounded px-1">
                <span className="w-14 shrink-0 font-mono text-xs text-primary">{a.brinco || '—'}</span>
                <span className="flex-1 min-w-0 truncate text-sm font-medium">{a.nome || 'Sem nome'}</span>
                <span className="hidden sm:block text-xs text-muted-foreground">{label}</span>
                {a.status !== 'ativo' && <Badge variant="outline" className="text-xs">{cap(a.status)}</Badge>}
                <Badge variant="outline" className={cor(r)}>{(r * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</Badge>
              </Link>
            ))}
          </div>
        )}
        {lista.length > 60 && <p className="text-xs text-muted-foreground">Mostrando os 60 mais próximos de {lista.length}.</p>}
      </CardContent>
    </Card>
  );
}
