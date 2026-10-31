import { cap } from "@/lib/labels";
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Copy, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (v: number) => (v === 0 ? '-' : v < 0 ? `(${brl(-v)})` : brl(v));

type Item = {
  id: string; fechamento_id: string; descritivo: string; tipo: string;
  qtd_animal: number | null; dias: number | null; valor_unit: number | null;
  qtd_kg: number | null; total_manual: number | null; ordem: number;
};

export const itemTotal = (i: Item) => {
  const bruto = i.total_manual != null
    ? Number(i.total_manual)
    : [i.qtd_animal, i.dias, i.valor_unit, i.qtd_kg].reduce<number>((acc, v) => acc * (v == null ? 1 : Number(v)), 1);
  return i.tipo === 'receita' ? bruto : -bruto;
};

function NumCell({ value, onSave, disabled }: { value: number | null; onSave: (v: number | null) => void; disabled?: boolean }) {
  const [v, setV] = useState(value == null ? '' : String(value));
  return (
    <Input
      className="h-8 text-center bg-warning/10 border-transparent focus:border-input"
      value={v}
      disabled={disabled}
      placeholder="N/A"
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const n = v.trim() === '' ? null : Number(v.replace(',', '.'));
        if (n !== value && (n === null || !isNaN(n))) onSave(n);
      }}
    />
  );
}

export default function GestaoSocios() {
  const qc = useQueryClient();
  const { isGestorOrAdmin } = useAuth();
  const [grupoId, setGrupoId] = useState<string>('');
  const [novoGrupo, setNovoGrupo] = useState(false);
  const [gNome, setGNome] = useState('');
  const [gDiv, setGDiv] = useState('2');
  const [addAnimal, setAddAnimal] = useState('');

  const { data: grupos } = useQuery({
    queryKey: ['grupos_socios'],
    queryFn: async () => (await supabase.from('grupos_socios').select('*').order('created_at')).data || [],
  });
  const grupo = grupos?.find(g => g.id === grupoId) || grupos?.[0];

  const { data: animaisGrupo } = useQuery({
    queryKey: ['grupo_animais', grupo?.id],
    enabled: !!grupo,
    queryFn: async () => (await supabase.from('grupo_animais').select('id, animal_id, animais(nome, brinco, tipo)').eq('grupo_id', grupo!.id)).data || [],
  });
  const { data: todosAnimais } = useQuery({
    queryKey: ['animais-select-socios'],
    queryFn: async () => (await supabase.from('animais').select('id, nome, brinco, tipo').eq('status', 'ativo').order('nome')).data || [],
  });
  const { data: fechamentos } = useQuery({
    queryKey: ['fechamentos_socios', grupo?.id],
    enabled: !!grupo,
    queryFn: async () => (await supabase.from('fechamentos_socios').select('*, fechamento_itens(*)').eq('grupo_id', grupo!.id).order('ano', { ascending: false }).order('mes', { ascending: false })).data || [],
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['fechamentos_socios'] });
    qc.invalidateQueries({ queryKey: ['grupo_animais'] });
    qc.invalidateQueries({ queryKey: ['grupos_socios'] });
  };
  const run = async (p: PromiseLike<{ error: any }>) => {
    const { error } = await p;
    if (error) toast.error(error.message); else refresh();
  };

  const criarGrupo = async () => {
    if (!gNome.trim()) return;
    const { data, error } = await supabase.from('grupos_socios').insert({ nome: gNome, divisor: Number(gDiv) || 1 }).select().single();
    if (error) return toast.error(error.message);
    setNovoGrupo(false); setGNome(''); setGrupoId(data.id); refresh();
  };

  const novoMes = async () => {
    if (!grupo) return;
    const now = new Date();
    let mes = now.getMonth() + 1, ano = now.getFullYear();
    const ultimo = fechamentos?.[0];
    if (ultimo) { mes = ultimo.mes === 12 ? 1 : ultimo.mes + 1; ano = ultimo.mes === 12 ? ultimo.ano + 1 : ultimo.ano; }
    const { data, error } = await supabase.from('fechamentos_socios').insert({ grupo_id: grupo.id, mes, ano }).select().single();
    if (error) return toast.error(error.message);
    const itens = (ultimo?.fechamento_itens as Item[] | undefined) || [];
    if (itens.length) {
      await supabase.from('fechamento_itens').insert(itens.map(({ id, fechamento_id, ...rest }: any) => ({ ...rest, created_at: undefined, fechamento_id: data.id })));
    }
    toast.success(`${MESES[mes - 1]}/${ano} criado${itens.length ? ' (copiado do mês anterior)' : ''}`);
    refresh();
  };

  const idsNoGrupo = new Set(animaisGrupo?.map(a => a.animal_id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Gestão de Sócios</h1>
          <p className="text-muted-foreground">Animais em sociedade e acertos mensais</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={grupo?.id || ''} onValueChange={setGrupoId}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
            <SelectContent>{grupos?.map(g => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}</SelectContent>
          </Select>
          {isGestorOrAdmin && <Button variant="outline" onClick={() => setNovoGrupo(true)}><Users className="h-4 w-4 mr-2" />Novo grupo</Button>}
        </div>
      </div>

      {grupo && (
        <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
          <div className="space-y-4">
            {isGestorOrAdmin && (
              <div className="flex justify-end"><Button onClick={novoMes}><Copy className="h-4 w-4 mr-2" />Novo mês</Button></div>
            )}
            {fechamentos?.length === 0 && <p className="text-muted-foreground text-sm">Nenhum fechamento ainda. Clique em "Novo mês".</p>}
            {fechamentos?.map(f => {
              const itens = [...((f.fechamento_itens as Item[]) || [])].sort((a, b) => a.ordem - b.ordem);
              const subtotal = itens.reduce((s, i) => s + itemTotal(i), 0);
              const porSocio = subtotal / Number(grupo.divisor || 1);
              return (
                <Card key={f.id} className="overflow-hidden">
                  <CardHeader className="py-3 bg-muted flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">{MESES[f.mes - 1]}/{f.ano} ({grupo.nome})</CardTitle>
                    <div className="flex items-center gap-2">
                      {f.pago
                        ? <Badge className="bg-success/10 text-success border-success/20" variant="outline"><CheckCircle2 className="h-3 w-3 mr-1" />Pago {f.data_pagamento ? new Date(f.data_pagamento + 'T12:00').toLocaleDateString('pt-BR') : ''}</Badge>
                        : <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pendente</Badge>}
                      {isGestorOrAdmin && (
                        <Button size="sm" variant="ghost" onClick={() => run(supabase.from('fechamentos_socios').update({ pago: !f.pago, data_pagamento: f.pago ? null : new Date().toISOString().slice(0, 10) }).eq('id', f.id))}>
                          {f.pago ? 'Desfazer' : 'Marcar pago'}
                        </Button>
                      )}
                      {isGestorOrAdmin && (
                        <Button size="icon" variant="ghost" onClick={() => confirm('Excluir este mês?') && run(supabase.from('fechamentos_socios').delete().eq('id', f.id))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary text-secondary-foreground">
                        <tr>
                          <th className="text-left px-3 py-2">Descritivo</th>
                          <th className="px-2 w-24">Tipo</th>
                          <th className="px-2 w-24">Qtde. Animal</th>
                          <th className="px-2 w-20">Dias</th>
                          <th className="px-2 w-24">Vlr.</th>
                          <th className="px-2 w-24">Qtde. KG</th>
                          <th className="px-2 w-28">Total fixo</th>
                          <th className="text-right px-3 w-28">Total</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map(i => {
                          const t = itemTotal(i);
                          const upd = (patch: Partial<Item>) => run(supabase.from('fechamento_itens').update(patch).eq('id', i.id));
                          return (
                            <tr key={i.id} className="border-b">
                              <td className="px-2 py-1">
                                <Input className="h-8 border-transparent" defaultValue={i.descritivo} disabled={!isGestorOrAdmin}
                                  onBlur={e => e.target.value !== i.descritivo && upd({ descritivo: e.target.value })} />
                              </td>
                              <td className="px-1">
                                <Select value={cap(i.tipo)} onValueChange={v => upd({ tipo: v })} disabled={!isGestorOrAdmin}>
                                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                  <SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
                                </Select>
                              </td>
                              {(['qtd_animal', 'dias', 'valor_unit', 'qtd_kg', 'total_manual'] as const).map(k => (
                                <td key={k} className="px-1"><NumCell value={i[k]} disabled={!isGestorOrAdmin} onSave={v => upd({ [k]: v })} /></td>
                              ))}
                              <td className={`text-right px-3 font-medium ${t < 0 ? 'text-destructive' : ''}`}>{fmt(t)}</td>
                              <td>{isGestorOrAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => run(supabase.from('fechamento_itens').delete().eq('id', i.id))}><Trash2 className="h-3 w-3" /></Button>}</td>
                            </tr>
                          );
                        })}
                        {isGestorOrAdmin && (
                          <tr><td colSpan={9} className="px-2 py-1">
                            <Button size="sm" variant="ghost" onClick={() => run(supabase.from('fechamento_itens').insert({ fechamento_id: f.id, descritivo: 'Novo item', tipo: 'despesa', ordem: itens.length + 1 }))}>
                              <Plus className="h-3 w-3 mr-1" />Adicionar linha
                            </Button>
                          </td></tr>
                        )}
                        <tr className="border-t-2 font-bold">
                          <td className="px-3 py-2" colSpan={7}>Subtotal mês</td>
                          <td className={`text-right px-3 ${subtotal < 0 ? 'text-destructive' : ''}`}>{fmt(subtotal)}</td><td />
                        </tr>
                        <tr className="border-t font-bold">
                          <td className="px-3 py-2" colSpan={7}>A pagar/receber por sócio (÷{Number(grupo.divisor)})</td>
                          <td className={`text-right px-3 ${porSocio < 0 ? 'text-destructive' : ''}`}>{fmt(porSocio)}</td><td />
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-xs text-muted-foreground px-3 py-2">Total = Qtde × Dias × Vlr × KG (campos vazios = N/A). Use "Total fixo" para valores fechados. Valores negativos = a pagar.</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{grupo.nome}: animais</CardTitle>
              {isGestorOrAdmin && (
                <div className="flex items-center gap-2 text-sm pt-2">
                  <span className="text-muted-foreground">Divisor:</span>
                  <Input className="h-8 w-20" type="number" defaultValue={Number(grupo.divisor)}
                    onBlur={e => Number(e.target.value) > 0 && Number(e.target.value) !== Number(grupo.divisor) && run(supabase.from('grupos_socios').update({ divisor: Number(e.target.value) }).eq('id', grupo.id))} />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {animaisGrupo?.map((a: any, idx) => (
                <div key={a.id} className="flex items-center justify-between border-b py-1 text-sm">
                  <span>{a.animais?.nome || '—'}{a.animais?.brinco ? ` - ${a.animais.brinco}` : ''} <span className="text-muted-foreground">({a.animais?.tipo})</span></span>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">{idx + 1}</span>
                    {isGestorOrAdmin && <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => run(supabase.from('grupo_animais').delete().eq('id', a.id))}><Trash2 className="h-3 w-3" /></Button>}
                  </div>
                </div>
              ))}
              {animaisGrupo?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum animal vinculado.</p>}
              {isGestorOrAdmin && (
                <Select value={addAnimal} onValueChange={v => { setAddAnimal(''); run(supabase.from('grupo_animais').insert({ grupo_id: grupo.id, animal_id: v })); }}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="+ Adicionar animal do rebanho" /></SelectTrigger>
                  <SelectContent>
                    {todosAnimais?.filter(a => !idsNoGrupo.has(a.id)).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.nome || 'Sem nome'}{a.brinco ? ` - ${a.brinco}` : ''} ({cap(a.tipo)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={novoGrupo} onOpenChange={setNovoGrupo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo grupo de sócios</DialogTitle></DialogHeader>
          <Input placeholder="Ex: Xande e Daniel" value={gNome} onChange={e => setGNome(e.target.value)} />
          <Input type="number" placeholder="Dividir por quantos?" value={gDiv} onChange={e => setGDiv(e.target.value)} />
          <Button onClick={criarGrupo}>Criar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
