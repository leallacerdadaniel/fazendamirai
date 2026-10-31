import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

type Row = { id: string; nome: string | null; brinco: string | null; rgd: string | null; sexo: string | null; pai_id: string | null; mae_id: string | null; pai_nome: string | null; pai_rgd: string | null; mae_nome: string | null; mae_rgd: string | null };
export type TreeNode = { id?: string; nome: string; rgd?: string | null; sexo: 'macho' | 'femea'; pai?: TreeNode | null; mae?: TreeNode | null };

const COLS = 'id, nome, brinco, rgd, sexo, pai_id, mae_id, pai_nome, pai_rgd, mae_nome, mae_rgd';

async function findParent(id: string | null, nome: string | null, rgd: string | null): Promise<Row | null> {
  if (id) {
    const { data } = await supabase.from('animais').select(COLS).eq('id', id).maybeSingle();
    if (data) return data as Row;
  }
  if (rgd) {
    const { data } = await supabase.from('animais').select(COLS).eq('rgd', rgd).limit(1);
    if (data?.[0]) return data[0] as Row;
  }
  if (nome) {
    const { data } = await supabase.from('animais').select(COLS).ilike('nome', nome.trim()).limit(1);
    if (data?.[0]) return data[0] as Row;
  }
  return null;
}

async function build(row: Row, depth: number): Promise<TreeNode['pai'][]> {
  if (depth === 0) return [null, null];
  const [p, m] = await Promise.all([
    findParent(row.pai_id, row.pai_nome, row.pai_rgd),
    findParent(row.mae_id, row.mae_nome, row.mae_rgd),
  ]);
  const mk = async (r: Row | null, nome: string | null, rgd: string | null, sexo: 'macho' | 'femea'): Promise<TreeNode | null> => {
    if (!r && !nome) return null;
    const node: TreeNode = { id: r?.id, nome: r?.nome || r?.brinco || nome || '—', rgd: r?.rgd || rgd, sexo };
    if (r) { const [pp, mm] = await build(r, depth - 1); node.pai = pp; node.mae = mm; }
    return node;
  };
  return Promise.all([mk(p, row.pai_nome, row.pai_rgd, 'macho'), mk(m, row.mae_nome, row.mae_rgd, 'femea')]);
}

export function GenealogyTree({ animal }: { animal: Row }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['genealogia', animal.id],
    queryFn: async () => { const [pai, mae] = await build(animal, 3); return { pai, mae }; },
  });

  const gens: (TreeNode | null | undefined)[][] = [[data?.pai, data?.mae]];
  for (let g = 1; g < 3; g++) gens.push(gens[g - 1].flatMap(n => [n?.pai, n?.mae]));
  const labels = ['Pais', 'Avós', 'Bisavós'];

  const Box = ({ n, slot }: { n?: TreeNode | null; slot: number }) => {
    const sexo = slot % 2 === 0 ? 'macho' : 'femea';
    return (
      <button type="button" disabled={!n?.id} onClick={() => n?.id && navigate(`/animais/${n.id}/perfil`)}
        className={cn('flex min-h-[52px] w-full flex-col justify-center rounded-lg border-l-4 bg-muted/50 px-3 py-2 text-left transition-colors',
          sexo === 'macho' ? 'border-l-[hsl(var(--tone-producao))]' : 'border-l-[hsl(var(--tone-reproducao))]',
          n?.id ? 'hover:bg-muted cursor-pointer' : 'cursor-default', !n && 'opacity-40')}>
        <span className="truncate text-sm font-semibold">{n?.nome || 'Desconhecido'}</span>
        <span className="truncate text-[11px] text-muted-foreground">{sexo === 'macho' ? '♂ ' : '♀ '}{n?.rgd || (n && !n.id ? 'fora do rebanho' : '')}</span>
      </button>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><GitBranch className="h-4 w-4" />Árvore Genealógica</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <div className="h-40 animate-pulse rounded-lg bg-muted" /> : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[720px] grid-cols-[180px_1fr_1fr_1fr] gap-3">
              <div className="flex flex-col justify-center">
                <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Animal</p>
                <div className="rounded-lg bg-primary px-3 py-3 text-primary-foreground">
                  <p className="truncate font-bold">{animal.nome || animal.brinco}</p>
                  <p className="truncate text-xs opacity-80">{animal.rgd || animal.brinco || ''}</p>
                </div>
              </div>
              {gens.map((col, g) => (
                <div key={g} className="flex flex-col">
                  <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">{labels[g]}</p>
                  <div className="flex flex-1 flex-col justify-around gap-2">
                    {col.map((n, i) => <Box key={i} n={n} slot={i} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Clique em um ancestral cadastrado para abrir o perfil dele.</p>
      </CardContent>
    </Card>
  );
}
