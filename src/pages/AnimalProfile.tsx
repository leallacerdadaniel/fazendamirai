import { cap } from "@/lib/labels";
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Edit, Milk, Baby, Scale, Syringe, HeartPulse, Calendar, DollarSign, Plus, GitBranch, Stethoscope, Droplets, Pill } from 'lucide-react';
import { useRef, useState } from 'react';
import { GenealogyTree } from '@/components/GenealogyTree';
import { AnimalCompare } from '@/components/AnimalCompare';
import { HerdKinship } from '@/components/HerdKinship';
import { AssociationBadge } from '@/components/AssociationBadge';
import { AnimalConsultaArquivos } from '@/components/AnimalConsultaArquivos';
import { AnimalFichaRapida } from '@/components/AnimalFichaRapida';
import { format, differenceInDays, differenceInMonths } from 'date-fns';

const statusColors: Record<string, string> = {
  ativo: 'bg-success/10 text-success border-success/20',
  vendido: 'bg-warning/10 text-warning border-warning/20',
  morto: 'bg-destructive/10 text-destructive border-destructive/20',
  descartado: 'bg-muted text-muted-foreground',
};

export default function AnimalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: animal, isLoading } = useQuery({
    queryKey: ['animal-profile', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('animais').select('*, lotes(nome)').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: producao } = useQuery({
    queryKey: ['animal-producao', id],
    queryFn: async () => {
      const { data } = await supabase.from('producao_leite_diaria').select('*').eq('animal_id', id!).order('data', { ascending: false }).limit(30);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: pesagens } = useQuery({
    queryKey: ['animal-pesagens', id],
    queryFn: async () => {
      const { data } = await supabase.from('pesagens').select('*').eq('animal_id', id!).order('data', { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: reproducoes } = useQuery({
    queryKey: ['animal-reproducoes', id],
    queryFn: async () => {
      const { data } = await supabase.from('reproducoes').select('*').eq('animal_id', id!).order('data', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: partos } = useQuery({
    queryKey: ['animal-partos', id],
    queryFn: async () => {
      const { data } = await supabase.from('partos').select('*, bezerro:animais!partos_bezerro_id_fkey(nome, brinco)').eq('vaca_id', id!).order('data', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: complicacoesParto } = useQuery({
    queryKey: ['animal-complicacoes-parto', id],
    queryFn: async () => {
      const { data } = await supabase.from('complicacoes_parto').select('*').eq('animal_id', id!).order('data_inicio', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: diagnosticos } = useQuery({
    queryKey: ['animal-diagnosticos', id],
    queryFn: async () => {
      const { data } = await supabase.from('diagnosticos_gestacao').select('*').eq('animal_id', id!).order('data', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: secagens } = useQuery({
    queryKey: ['animal-secagens', id],
    queryFn: async () => {
      const { data } = await supabase.from('secagens').select('*').eq('animal_id', id!).order('data_secagem', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: aplicacoesHormonais } = useQuery({
    queryKey: ['animal-aplicacoes-hormonais', id],
    queryFn: async () => {
      const { data } = await supabase.from('aplicacoes_hormonais').select('*').eq('animal_id', id!).order('data_aplicacao', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: vacinacoes } = useQuery({
    queryKey: ['animal-vacinacoes', id],
    queryFn: async () => {
      const { data } = await supabase.from('vacinacoes').select('*, vacinas(nome)').eq('animal_id', id!).order('data', { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: tratamentos } = useQuery({
    queryKey: ['animal-tratamentos', id],
    queryFn: async () => {
      const { data } = await supabase.from('tratamentos').select('*').eq('animal_id', id!).order('data_inicio', { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: controleLeiteiro } = useQuery({
    queryKey: ['animal-controle-leiteiro', id],
    queryFn: async () => {
      const { data } = await supabase.from('controle_leiteiro').select('*').eq('animal_id', id!).order('data_coleta', { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: dietas } = useQuery({
    queryKey: ['animal-dieta', animal?.lote_id],
    queryFn: async () => {
      if (!animal?.lote_id) return [];
      const { data } = await supabase.from('dietas_lote').select('*').eq('lote_id', animal.lote_id);
      return data || [];
    },
    enabled: !!animal?.lote_id,
  });

   const { data: vendasGenetica = [] } = useQuery({
    queryKey: ['animal-vendas-genetica', id],
    queryFn: async () => {
      const { data } = await supabase.from('vendas_genetica').select('*').eq('animal_id', id!).order('data', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: filhos = [] } = useQuery({
    queryKey: ['animal-filhos', id, animal?.nome, animal?.rgd],
    queryFn: async () => {
      const results: any[] = [];
      const seenIds = new Set<string>();

      // Via partos (vaca_id = this animal, get bezerro)
      const { data: partosFilhos } = await supabase
        .from('partos')
        .select('bezerro_id, bezerro:animais!partos_bezerro_id_fkey(id, nome, brinco, sexo, nascimento, status, rgd)')
        .eq('vaca_id', id!);
      partosFilhos?.forEach((p: any) => {
        if (p.bezerro && !seenIds.has(p.bezerro.id)) {
          seenIds.add(p.bezerro.id);
          results.push(p.bezerro);
        }
      });

      // Via vínculo direto mãe/pai
      const { data: byId } = await supabase
        .from('animais')
        .select('id, nome, brinco, sexo, nascimento, status, rgd')
        .or(`mae_id.eq.${id},pai_id.eq.${id}`);
      byId?.forEach((a: any) => {
        if (!seenIds.has(a.id)) { seenIds.add(a.id); results.push(a); }
      });

      // Via mae_nome/mae_rgd match
      if (animal?.nome) {
        const { data: byMae } = await supabase
          .from('animais')
          .select('id, nome, brinco, sexo, nascimento, status, rgd')
          .eq('mae_nome', animal.nome)
          .neq('id', id!);
        byMae?.forEach((a: any) => {
          if (!seenIds.has(a.id)) { seenIds.add(a.id); results.push(a); }
        });
      }

      // Via pai_nome match (if this animal is male)
      if (animal?.nome && animal?.sexo === 'macho') {
        const { data: byPai } = await supabase
          .from('animais')
          .select('id, nome, brinco, sexo, nascimento, status, rgd')
          .eq('pai_nome', animal.nome)
          .neq('id', id!);
        byPai?.forEach((a: any) => {
          if (!seenIds.has(a.id)) { seenIds.add(a.id); results.push(a); }
        });
      }

      results.sort((a, b) => (b.nascimento || '').localeCompare(a.nascimento || ''));
      return results;
    },
    enabled: !!id && !!animal,
  });

  const [openVendaGen, setOpenVendaGen] = useState(false);
  const [vendaGenForm, setVendaGenForm] = useState({ tipo: 'prenhez', comprador: '', valor: '', data: new Date().toISOString().slice(0, 10), observacao: '' });

  const saveVendaGen = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('vendas_genetica').insert({
        animal_id: id!,
        tipo: vendaGenForm.tipo,
        comprador: vendaGenForm.comprador || null,
        valor: Number(vendaGenForm.valor),
        data: vendaGenForm.data,
        observacao: vendaGenForm.observacao || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animal-vendas-genetica', id] });
      toast.success('Venda registrada!');
      setOpenVendaGen(false);
      setVendaGenForm({ tipo: 'prenhez', comprador: '', valor: '', data: new Date().toISOString().slice(0, 10), observacao: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('animal-photos').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('animal-photos').getPublicUrl(path);
      const { error: updateError } = await supabase.from('animais').update({ foto_url: urlData.publicUrl }).eq('id', id!);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ['animal-profile', id] });
      toast.success('Foto atualizada!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!animal) return <div className="text-center py-8">Animal não encontrado</div>;

  const idade = animal.nascimento
    ? (() => {
        const meses = differenceInMonths(new Date(), new Date(animal.nascimento));
        return meses < 12 ? `${meses} meses` : `${Math.floor(meses / 12)}a ${meses % 12}m`;
      })()
    : null;

  // DEL calculation
  const ultimoParto = partos?.[0];
  const del = ultimoParto ? differenceInDays(new Date(), new Date(ultimoParto.data)) : null;

  // Age at first calving
  const primeiroParto = partos?.length ? partos[partos.length - 1] : null;
  const idadePrimeiroParto = primeiroParto && animal.nascimento
    ? differenceInMonths(new Date(primeiroParto.data), new Date(animal.nascimento))
    : null;

  // Production stats
  const totalProducao30d = producao?.reduce((s, p) => s + Number(p.litros), 0) || 0;
  const mediaProducao = producao?.length ? totalProducao30d / producao.length : 0;

  // Weight stats
  const ultimoPeso = pesagens?.[0];
  const penultimoPeso = pesagens?.[1];
  const ganhoMedio = ultimoPeso && penultimoPeso
    ? ((Number(ultimoPeso.peso_kg) - Number(penultimoPeso.peso_kg)) / Math.max(1, differenceInDays(new Date(ultimoPeso.data), new Date(penultimoPeso.data)))).toFixed(2)
    : null;

  // Nutrition cost
  const custoDiaNutricao = dietas?.reduce((s, d: any) => s + (Number(d.quantidade_kg) * Number(d.custo_kg || 0)), 0) || 0;

  // CCS history
  const ultimoCCS = controleLeiteiro?.[0];
  const ccsVal = ultimoCCS ? Number(ultimoCCS.ccs) : null;
  const ccsColor = ccsVal == null ? undefined : ccsVal < 200 ? 'hsl(var(--success))' : ccsVal <= 500 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  // Genetic sales revenue
  const receitaGenetica = vendasGenetica.reduce((s: number, v: any) => s + Number(v.valor), 0);

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/animais')}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-2xl font-heading font-bold">Perfil do Animal</h1>
        <Button variant="outline" size="sm" onClick={() => navigate(`/animais/${id}`)}><Edit className="h-4 w-4 mr-1" /> Editar</Button>
      </div>

      {/* POKEMON CARD - Hero */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Photo + fichas rápidas */}
            <div className="flex flex-col w-full md:w-72 shrink-0">
              <div className="relative h-72 bg-muted flex items-center justify-center group">
                {animal.foto_url ? (
                  <img src={animal.foto_url} alt={animal.nome || 'Animal'} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Camera className="h-12 w-12" />
                    <span className="text-sm">Sem foto</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Camera className="h-4 w-4 mr-1" /> {uploading ? 'Enviando...' : 'Trocar Foto'}
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </div>
              <AnimalFichaRapida animalId={animal.id} />
            </div>

            {/* Main Info */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {animal.codigo_importacao && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--farm-gold))]/40 bg-[hsl(var(--farm-gold))]/10 px-2.5 py-1 text-xs font-bold tracking-wide text-[hsl(var(--farm-gold))]">
                        <span className="opacity-70 font-semibold">Brinco Geral Miraí</span>
                        {animal.codigo_importacao}
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-heading font-bold">{animal.nome || animal.brinco || 'Sem nome'}</h2>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    {animal.brinco && <span>Brinco: {animal.brinco}</span>}
                    {animal.rgd && <span>• RGD: {animal.rgd}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AssociationBadge animal={animal} />
                  <Badge variant="outline" className={`text-base px-3 py-1 ${statusColors[animal.status] || ''}`}>
                    {cap(animal.status)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                {([
                  ['Identificação', 'rebanho', [
                    ['Tipo', animal.tipo ? cap(animal.tipo) : '—'],
                    ['Raça', animal.raca_sangue ? cap(animal.raca_sangue) : '—'],
                    ['Idade', idade || '—'],
                    ['Tetos', `${animal.tetos}/4`, animal.tetos < 4],
                  ]],
                  ['Manejo', 'nutricao', [
                    ['Lote', (animal as any).lotes?.nome || '—'],
                    ['Localização', animal.localizacao ? cap(animal.localizacao) : '—', animal.localizacao === 'Fora da fazenda'],
                    ['Registro', animal.status_registro ? cap(animal.status_registro) : '—'],
                  ]],
                  ['Genética', 'reproducao', [
                    ['VG', animal.vg != null ? String(animal.vg) : '—'],
                    ['GPTA', animal.gpta != null ? Number(animal.gpta).toFixed(1) : '—'],
                    ['Betacaseína', animal.betacaseina || '—'],
                  ]],
                  ['Produção & Reprodução', 'producao', [
                    ['Lactação', animal.lactacao_kg ? `${Number(animal.lactacao_kg).toLocaleString('pt-BR')} kg` : '—'],
                    ['Previsão de Parto', animal.previsao_parto ? format(new Date(animal.previsao_parto + 'T12:00:00'), 'dd/MM/yy') : '—'],
                  ]],
                ] as [string, string, [string, string, boolean?][]][]).map(([titulo, tone, itens]) => (
                  <section key={titulo} style={{ ['--tone' as string]: `var(--tone-${tone})` }} className="border-l-4 pl-3 [border-left-color:hsl(var(--tone))]">
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--tone))]">{titulo}</h3>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {itens.map(([l, v, h]) => <StatBox key={l} label={l} value={v} highlight={h} />)}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniCard
          tone="var(--tone-producao)"
          icon={<Milk className="h-4 w-4" />}
          label="Prod. Média"
          value={mediaProducao > 0 ? `${mediaProducao.toFixed(1)} kg` : '—'}
          sub="últimas ordenhas"
          visual={producao && producao.length > 1 ? <SparkBars values={[...producao].slice(0, 14).reverse().map((p: any) => Number(p.litros) || 0)} tone="var(--tone-producao)" /> : undefined}
        />
        <MiniCard
          tone="var(--tone-reproducao)"
          icon={<Calendar className="h-4 w-4" />}
          label="DEL"
          value={del != null ? `${del} dias` : '—'}
          sub={del != null ? 'ciclo de 305 dias' : undefined}
          visual={del != null ? <MiniBar pct={(del / 305) * 100} tone="var(--tone-reproducao)" /> : undefined}
        />
        <MiniCard
          tone="var(--tone-comercial)"
          icon={<Baby className="h-4 w-4" />}
          label="Partos"
          value={String(partos?.length || 0)}
          sub={partos?.length ? 'registrados no sistema' : 'nenhum registro'}
        />
        <MiniCard
          tone="var(--tone-nutricao)"
          icon={<Scale className="h-4 w-4" />}
          label="Último Peso"
          value={ultimoPeso ? `${Number(ultimoPeso.peso_kg).toFixed(0)} kg` : '—'}
          sub={ganhoMedio ? `GMD: ${ganhoMedio} kg/dia` : undefined}
          subClassName={ganhoMedio ? (Number(ganhoMedio) >= 0 ? 'text-success' : 'text-destructive') : undefined}
        />
        <MiniCard
          tone="var(--tone-saude)"
          icon={<HeartPulse className="h-4 w-4" />}
          label="CCS Último"
          value={ultimoCCS ? String(Number(ultimoCCS.ccs)) : '—'}
          sub={ultimoCCS ? format(new Date(ultimoCCS.data_coleta + 'T12:00:00'), 'dd/MM/yy') : undefined}
          valueStyle={ccsVal != null ? { color: ccsColor } : undefined}
        />
      </div>

      {idadePrimeiroParto != null && (
        <Card className="border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <Baby className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Idade ao 1º Parto</p>
              <p className="font-bold text-lg">{Math.floor(idadePrimeiroParto / 12)}a {idadePrimeiroParto % 12}m ({idadePrimeiroParto} meses)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fichas das Associações — gestão (envio, lista, exclusão) */}
      <AnimalConsultaArquivos animalId={animal.id} animalNome={animal.nome} />

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Production History */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Milk className="h-4 w-4" /> Produção Recente (kg)</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-60 overflow-y-auto">
            {producao?.length ? (
              <table>
                <TableBodyCompact>
                  {producao.map(p => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-2 text-sm">{format(new Date(p.data + 'T12:00:00'), 'dd/MM/yy')}</td>
                      <td className="px-4 py-2 text-sm font-medium">{Number(p.litros).toFixed(1)} kg</td>
                      <td className="px-4 py-2 text-sm">{p.turno || ''}</td>
                      <td className="px-4 py-2">{p.com_mastite && <Badge variant="destructive" className="text-xs">Mastite</Badge>}</td>
                    </tr>
                  ))}
                </TableBodyCompact>
              </table>
            ) : <p className="p-4 text-sm text-muted-foreground">Sem registros</p>}
          </CardContent>
        </Card>

        {/* Weight History */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Scale className="h-4 w-4" /> Pesagens</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-60 overflow-y-auto">
            {pesagens?.length ? (
              <table>
                <TableBodyCompact>
                  {pesagens.map(p => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-2 text-sm">{format(new Date(p.data + 'T12:00:00'), 'dd/MM/yy')}</td>
                      <td className="px-4 py-2 text-sm font-medium">{Number(p.peso_kg).toFixed(0)} kg</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{p.ocasiao || ''}</td>
                    </tr>
                  ))}
                </TableBodyCompact>
              </table>
            ) : <p className="p-4 text-sm text-muted-foreground">Sem registros</p>}
          </CardContent>
        </Card>

        {/* Timeline Reprodutiva */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><GitBranch className="h-4 w-4" /> Timeline Reprodutiva</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-[28rem] overflow-y-auto">
            {(() => {
              type TimelineEvent = { date: string; type: string; icon: React.ReactNode; title: string; details: string; color: string };
              const events: TimelineEvent[] = [];

              reproducoes?.forEach((r: any) => {
                const resultBadge = r.resultado === 'positivo' ? '✅' : r.resultado === 'negativo' ? '❌' : '⏳';
                events.push({
                  date: r.data,
                  type: 'cobertura',
                  icon: <HeartPulse className="h-4 w-4" />,
                  title: `Cobertura — ${cap(r.metodo)}`,
                  details: [r.doadora && `Doadora: ${r.doadora}`, r.touro_nome && `Touro: ${r.touro_nome}`, r.sexo_feto && `Feto: ${r.sexo_feto}`, r.tecnico && `Téc: ${r.tecnico}`, r.protocolo && `Prot: ${r.protocolo}`, `${resultBadge} ${r.resultado || 'aguardando'}`].filter(Boolean).join(' · '),
                  color: 'text-pink-500 bg-pink-500/10',
                });
              });

              diagnosticos?.forEach((d: any) => {
                events.push({
                  date: d.data,
                  type: 'diagnostico',
                  icon: <Stethoscope className="h-4 w-4" />,
                  title: `Diagnóstico — ${d.resultado || 'pendente'}`,
                  details: [d.metodo && `Método: ${cap(d.metodo)}`, d.dias_gestacao != null && `${d.dias_gestacao} dias gestação`, d.previsao_parto && `Prev. parto: ${format(new Date(d.previsao_parto + 'T12:00:00'), 'dd/MM/yy')}`].filter(Boolean).join(' · '),
                  color: 'text-blue-500 bg-blue-500/10',
                });
              });

              partos?.forEach((p: any) => {
                const bezerroNome = p.bezerro?.nome || p.bezerro?.brinco;
                events.push({
                  date: p.data,
                  type: 'parto',
                  icon: <Baby className="h-4 w-4" />,
                  title: 'Parto',
                  details: [p.facilidade && `Facilidade: ${p.facilidade}`, p.peso_bezerro_kg && `Bezerro: ${Number(p.peso_bezerro_kg)} kg`, bezerroNome && `→ ${bezerroNome}`, p.colostro === false && '⚠️ Sem colostro'].filter(Boolean).join(' · '),
                  color: 'text-emerald-500 bg-emerald-500/10',
                });
              });

              secagens?.forEach((s: any) => {
                events.push({
                  date: s.data_secagem,
                  type: 'secagem',
                  icon: <Droplets className="h-4 w-4" />,
                  title: 'Secagem',
                  details: [s.tratamento && `Tratamento: ${s.tratamento}`, s.data_ultima_ordenha && `Última ordenha: ${format(new Date(s.data_ultima_ordenha + 'T12:00:00'), 'dd/MM/yy')}`].filter(Boolean).join(' · '),
                  color: 'text-amber-500 bg-amber-500/10',
                });
              });

              aplicacoesHormonais?.forEach((a: any) => {
                events.push({
                  date: a.data_aplicacao,
                  type: 'hormonal',
                  icon: <Pill className="h-4 w-4" />,
                  title: `Aplicação — ${cap(a.tipo)}`,
                  details: a.observacao || '',
                  color: 'text-purple-500 bg-purple-500/10',
                });
              });

              complicacoesParto?.forEach((c: any) => {
                events.push({
                  date: c.data_inicio,
                  type: 'complicacao',
                  icon: <HeartPulse className="h-4 w-4" />,
                  title: `Complicação — ${cap(c.tipo)}`,
                  details: [c.tratamento && `Tratamento: ${c.tratamento}`, c.data_fim && `Resolvida: ${format(new Date(c.data_fim + 'T12:00:00'), 'dd/MM/yy')}`, c.observacao].filter(Boolean).join(' · '),
                  color: 'text-red-500 bg-red-500/10',
                });
              });

              events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              if (!events.length) return <p className="p-4 text-sm text-muted-foreground">Sem eventos reprodutivos registrados</p>;

              return (
                <div className="relative pl-8 pr-4 py-4 space-y-0">
                  <div className="absolute left-[1.15rem] top-6 bottom-6 w-0.5 bg-border" />
                  {events.map((ev, i) => (
                    <div key={`${ev.type}-${i}`} className="relative flex items-start gap-3 pb-4 last:pb-0">
                      <div className={`absolute -left-[1.05rem] mt-1 flex items-center justify-center w-7 h-7 rounded-full border-2 border-background ${ev.color}`}>
                        {ev.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{ev.title}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(ev.date + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                        </div>
                        {ev.details && <p className="text-xs text-muted-foreground mt-0.5">{ev.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* CCS History */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4" /> Histórico CCS / Controle Leiteiro</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-60 overflow-y-auto">
            {controleLeiteiro?.length ? (
              <table>
                <TableBodyCompact>
                  {controleLeiteiro.map(c => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="px-4 py-2 text-sm">{format(new Date(c.data_coleta + 'T12:00:00'), 'dd/MM/yy')}</td>
                      <td className="px-4 py-2 text-sm font-medium">CCS: {c.ccs != null ? Number(c.ccs) : '—'}</td>
                      <td className="px-4 py-2 text-sm">Gord: {c.gordura_pct != null ? `${Number(c.gordura_pct)}%` : '—'}</td>
                      <td className="px-4 py-2 text-sm">Prot: {c.proteina_pct != null ? `${Number(c.proteina_pct)}%` : '—'}</td>
                    </tr>
                  ))}
                </TableBodyCompact>
              </table>
            ) : <p className="p-4 text-sm text-muted-foreground">Sem registros</p>}
          </CardContent>
        </Card>

        {/* Vaccinations */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Syringe className="h-4 w-4" /> Vacinações</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-60 overflow-y-auto">
            {vacinacoes?.length ? (
              <table>
                <TableBodyCompact>
                  {vacinacoes.map((v: any) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="px-4 py-2 text-sm">{format(new Date(v.data + 'T12:00:00'), 'dd/MM/yy')}</td>
                      <td className="px-4 py-2 text-sm font-medium">{v.vacinas?.nome || '—'}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{v.proxima_dose ? format(new Date(v.proxima_dose + 'T12:00:00'), 'dd/MM/yy') : ''}</td>
                    </tr>
                  ))}
                </TableBodyCompact>
              </table>
            ) : <p className="p-4 text-sm text-muted-foreground">Sem registros</p>}
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><Milk className="h-4 w-4" /> Nutrição Diária</span>
              <span className="text-sm font-normal text-muted-foreground">R$ {custoDiaNutricao.toFixed(2)}/dia</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-60 overflow-y-auto">
            {dietas?.length ? (
              <table>
                <TableBodyCompact>
                  {dietas.map((d: any) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="px-4 py-2 text-sm font-medium">{d.ingrediente}</td>
                      <td className="px-4 py-2 text-sm">{Number(d.quantidade_kg).toFixed(1)} kg</td>
                      <td className="px-4 py-2 text-sm">R$ {(Number(d.quantidade_kg) * Number(d.custo_kg || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </TableBodyCompact>
              </table>
            ) : <p className="p-4 text-sm text-muted-foreground">{animal.lote_id ? 'Sem dieta definida para este lote' : 'Animal sem lote atribuído'}</p>}
          </CardContent>
        </Card>

        {/* Genetic Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Vendas Genéticas</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-muted-foreground">Total: R$ {receitaGenetica.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <Dialog open={openVendaGen} onOpenChange={setOpenVendaGen}>
                  <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1" />Registrar</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Registrar Venda Genética</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1"><Label>Tipo</Label>
                        <Select value={cap(vendaGenForm.tipo)} onValueChange={v => setVendaGenForm(f => ({ ...f, tipo: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prenhez">Prenhez</SelectItem>
                            <SelectItem value="embriao">Embrião</SelectItem>
                            <SelectItem value="semen">Sêmen</SelectItem>
                            <SelectItem value="oocito">Oócito</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={vendaGenForm.valor} onChange={e => setVendaGenForm(f => ({ ...f, valor: e.target.value }))} /></div>
                        <div className="space-y-1"><Label>Data</Label><Input type="date" value={vendaGenForm.data} onChange={e => setVendaGenForm(f => ({ ...f, data: e.target.value }))} /></div>
                      </div>
                      <div className="space-y-1"><Label>Comprador</Label><Input value={vendaGenForm.comprador} onChange={e => setVendaGenForm(f => ({ ...f, comprador: e.target.value }))} /></div>
                      <div className="space-y-1"><Label>Observação</Label><Input value={vendaGenForm.observacao} onChange={e => setVendaGenForm(f => ({ ...f, observacao: e.target.value }))} /></div>
                      <Button onClick={() => saveVendaGen.mutate()} disabled={!vendaGenForm.valor} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-60 overflow-y-auto">
            {vendasGenetica.length ? (
              <table>
                <TableBodyCompact>
                  {vendasGenetica.map((v: any) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="px-4 py-2 text-sm">{format(new Date(v.data + 'T12:00:00'), 'dd/MM/yy')}</td>
                      <td className="px-4 py-2"><Badge variant="outline" className="text-xs capitalize">{cap(v.tipo)}</Badge></td>
                      <td className="px-4 py-2 text-sm font-medium text-success">R$ {Number(v.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{v.comprador || '—'}</td>
                    </tr>
                  ))}
                </TableBodyCompact>
              </table>
            ) : <p className="p-4 text-sm text-muted-foreground">Nenhuma venda genética registrada</p>}
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-card to-primary/5">
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Resultado Financeiro do Animal</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Custo Nutrição/dia" value={`R$ ${custoDiaNutricao.toFixed(2)}`} />
            <StatBox label="Receita Genética" value={`R$ ${receitaGenetica.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            <StatBox label="Valor Compra" value={animal.valor_compra ? `R$ ${Number(animal.valor_compra).toLocaleString('pt-BR')}` : '—'} />
            <StatBox label="Valor Venda" value={animal.valor_venda ? `R$ ${Number(animal.valor_venda).toLocaleString('pt-BR')}` : '—'} />
          </div>
        </CardContent>
      </Card>

      {/* Genealogy */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Genealogia</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Pai" value={animal.pai_nome || '—'} sub={animal.pai_rgd || undefined} />
            <StatBox label="Mãe" value={animal.mae_nome || '—'} sub={animal.mae_rgd || undefined} />
            <StatBox label="Origem" value={animal.origem || '—'} />
            <StatBox label="Receptora Usada" value={animal.receptora_usada || '—'} />
          </div>

          {/* Filhos e Filhas */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Baby className="h-4 w-4" /> Filhos / Filhas ({filhos.length})
            </h4>
            {filhos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {filhos.map((f: any) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/animais/${f.id}/perfil`)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${f.sexo === 'femea' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {f.sexo === 'femea' ? '♀' : '♂'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{f.nome || f.brinco || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.nascimento ? format(new Date(f.nascimento + 'T12:00:00'), 'dd/MM/yyyy') : '—'}
                        {f.rgd ? ` · ${f.rgd}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${statusColors[f.status] || ''}`}>{cap(f.status)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum filho/filha registrado</p>
            )}
          </div>
        </CardContent>
      </Card>

      <GenealogyTree animal={animal as any} />
      <HerdKinship animalId={animal.id} />
      <AnimalCompare animal={animal} />
    </div>
  );
}

function StatBox({ label, value, highlight, sub }: { label: string; value: string; highlight?: boolean; sub?: string }) {
  return (
    <div className={`p-2 rounded-lg ${highlight ? 'bg-destructive/10' : 'bg-muted/50'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-bold text-sm ${highlight ? 'text-destructive' : ''}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function MiniCard({ tone, icon, label, value, sub, visual, valueStyle, subClassName }: {
  tone: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  visual?: React.ReactNode;
  valueStyle?: React.CSSProperties;
  subClassName?: string;
}) {
  return (
    <Card className="overflow-hidden border-border/60">
      <div className="h-1" style={{ background: `hsl(${tone})` }} />
      <CardContent className="p-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md" style={{ color: `hsl(${tone})`, background: `hsl(${tone} / 0.12)` }}>{icon}</span>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className="font-bold text-xl leading-tight" style={valueStyle}>{value}</p>
        {visual}
        {sub && <p className={`text-[11px] text-muted-foreground ${subClassName || ''}`}>{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SparkBars({ values, tone }: { values: number[]; tone: string }) {
  const max = Math.max(...values, 0.0001);
  return (
    <div className="flex items-end gap-0.5 h-7 mt-0.5" aria-hidden>
      {values.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-sm min-h-[3px]"
          style={{ height: `${Math.max(10, (v / max) * 100)}%`, background: `hsl(${tone} / ${i === values.length - 1 ? 0.9 : 0.4})` }}
        />
      ))}
    </div>
  );
}

function MiniBar({ pct, tone }: { pct: number; tone: string }) {
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-0.5" aria-hidden>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: `hsl(${tone})` }} />
    </div>
  );
}

function TableBodyCompact({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}
