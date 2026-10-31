import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const schema = z.object({
  brinco: z.string().optional(),
  cgn: z.string().optional(),
  rgd: z.string().optional(),
  nome: z.string().optional(),
  sexo: z.string().optional(),
  tipo: z.string().optional(),
  raca_sangue: z.string().optional(),
  nascimento: z.string().optional(),
  pai_nome: z.string().optional(),
  pai_rgd: z.string().optional(),
  mae_nome: z.string().optional(),
  mae_rgd: z.string().optional(),
  vg: z.coerce.number().optional().nullable(),
  gpta: z.coerce.number().optional().nullable(),
  pta: z.coerce.number().optional().nullable(),
  betacaseina: z.string().optional().nullable(),
  dna: z.string().optional(),
  registro_racial: z.string().optional(),
  cdc: z.string().optional(),
  cdn: z.string().optional(),
  avaliacao: z.string().optional(),
  origem: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.string().default('ativo'),
  causa_morte: z.string().optional(),
  data_morte: z.string().optional(),
  aspiracoes_fiv: z.coerce.number().optional().nullable(),
  tetos: z.coerce.number().default(4),
  receptora_usada: z.string().optional(),
  gta_numero: z.string().optional(),
  parceiro_nome: z.string().optional(),
  percentual_propriedade: z.coerce.number().optional().nullable(),
  peso_compra: z.coerce.number().optional().nullable(),
  valor_compra: z.coerce.number().optional().nullable(),
  data_compra: z.string().optional(),
  peso_venda: z.coerce.number().optional().nullable(),
  valor_venda: z.coerce.number().optional().nullable(),
  data_venda: z.string().optional(),
  comprador: z.string().optional(),
  lote_id: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

const racas = [
  'GIR PO', 'Girolando 1/4', 'Girolando 3/8', 'Girolando 1/2',
  'Girolando 5/8', 'Girolando 3/4', 'Girolando 7/8',
  'Holandês', 'Receptora', 'Nelore', 'Mestiço',
];

const avaliacoes = ['A+', 'A', 'B+', 'B', 'B-', 'C', 'D', 'V'];

export default function AnimalForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiNames, setAiNames] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const { data: animal } = useQuery({
    queryKey: ['animal', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('animais').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  const { data: lotes } = useQuery({
    queryKey: ['lotes'],
    queryFn: async () => {
      const { data } = await supabase.from('lotes').select('id, nome').order('nome');
      return data || [];
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'ativo', percentual_propriedade: 100 },
  });

  const { register, handleSubmit, setValue, watch, reset } = form;

  useEffect(() => {
    if (animal) {
      reset({
        ...animal,
        nascimento: animal.nascimento || '',
        data_compra: animal.data_compra || '',
        data_venda: animal.data_venda || '',
        vg: animal.vg ?? undefined,
        gpta: animal.gpta ? Number(animal.gpta) : undefined,
        pta: animal.pta ? Number(animal.pta) : undefined,
        aspiracoes_fiv: animal.aspiracoes_fiv ?? undefined,
        percentual_propriedade: animal.percentual_propriedade ? Number(animal.percentual_propriedade) : 100,
        peso_compra: animal.peso_compra ? Number(animal.peso_compra) : undefined,
        valor_compra: animal.valor_compra ? Number(animal.valor_compra) : undefined,
        peso_venda: animal.peso_venda ? Number(animal.peso_venda) : undefined,
        valor_venda: animal.valor_venda ? Number(animal.valor_venda) : undefined,
      } as any);
    }
  }, [animal, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const insertData: any = { ...data };
      Object.keys(insertData).forEach(k => {
        if (insertData[k] === '' || insertData[k] === undefined) delete insertData[k];
      });
      if (isEditing) {
        const { error } = await supabase.from('animais').update(insertData).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('animais').insert(insertData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animais'] });
      toast.success(isEditing ? 'Animal atualizado!' : 'Animal cadastrado!');
      navigate('/animais');
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao salvar animal'),
  });

  const suggestNames = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiNames([]);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-animal-names', {
        body: { prompt: aiPrompt, sexo: watch('sexo') || '' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiNames(data.names || []);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao sugerir nomes');
    } finally {
      setAiLoading(false);
    }
  };

  const Field = ({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) => (
    <div className={`space-y-2 ${className}`}><Label>{label}</Label>{children}</div>
  );

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/animais')}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">{isEditing ? 'Editar Animal' : 'Novo Animal'}</h1>
          <p className="text-muted-foreground">Cadastro completo do animal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Identificação</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Brinco"><Input {...register('brinco')} /></Field>
            <Field label="CGN"><Input {...register('cgn')} /></Field>
            <Field label="RGD"><Input {...register('rgd')} /></Field>
            <Field label="Nome">
              <div className="flex gap-1">
                <Input {...register('nome')} className="flex-1" />
                <Popover open={aiOpen} onOpenChange={setAiOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon" title="Sugerir nomes com IA">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Sugestão de nomes com IA</p>
                      <p className="text-xs text-muted-foreground">Descreva o tema: ex. "deusas gregas", "flores", "pedras preciosas"</p>
                      <div className="flex gap-2">
                        <Input
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                          placeholder="Ex: deusas gregas"
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); suggestNames(); } }}
                          className="text-sm"
                        />
                        <Button type="button" size="sm" onClick={suggestNames} disabled={aiLoading || !aiPrompt.trim()}>
                          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar'}
                        </Button>
                      </div>
                      {aiNames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {aiNames.map(name => (
                            <Button
                              key={name}
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setValue('nome', name);
                                setAiOpen(false);
                              }}
                            >
                              {name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </Field>
            <Field label="Sexo">
              <Select value={watch('sexo') || ''} onValueChange={(v) => setValue('sexo', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="femea">Fêmea</SelectItem>
                  <SelectItem value="macho">Macho</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tipo">
              <Select value={watch('tipo') || ''} onValueChange={(v) => setValue('tipo', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {['bezerra', 'bezerro', 'novilha', 'vaca', 'touro'].map(t => (
                    <SelectItem key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Raça / Sangue">
              <Select value={watch('raca_sangue') || ''} onValueChange={(v) => setValue('raca_sangue', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{racas.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Nascimento"><Input type="date" {...register('nascimento')} /></Field>
            <Field label="Registro Racial"><Input {...register('registro_racial')} /></Field>
            <Field label="GTA"><Input {...register('gta_numero')} /></Field>
            <Field label="Status">
              <Select value={watch('status') || 'ativo'} onValueChange={(v) => setValue('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="morto">Morto</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Lote">
              <Select value={watch('lote_id') || 'none'} onValueChange={(v) => setValue('lote_id', v === 'none' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {lotes?.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Genealogia</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Pai (Nome)"><Input {...register('pai_nome')} /></Field>
            <Field label="Pai (RGD)"><Input {...register('pai_rgd')} /></Field>
            <Field label="Mãe (Nome)"><Input {...register('mae_nome')} /></Field>
            <Field label="Mãe (RGD)"><Input {...register('mae_rgd')} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Dados Genéticos</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="VG"><Input type="number" {...register('vg')} /></Field>
            <Field label="GPTA"><Input type="number" step="0.01" {...register('gpta')} /></Field>
            <Field label="PTA"><Input type="number" step="0.01" {...register('pta')} /></Field>
            <Field label="Betacaseína">
              <Select value={watch('betacaseina') || ''} onValueChange={(v) => setValue('betacaseina', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1A1">A1A1</SelectItem>
                  <SelectItem value="A1A2">A1A2</SelectItem>
                  <SelectItem value="A2A2">A2A2</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="DNA"><Input {...register('dna')} /></Field>
            <Field label="CDC"><Input {...register('cdc')} /></Field>
            <Field label="CDN"><Input {...register('cdn')} /></Field>
            <Field label="Avaliação">
              <Select value={watch('avaliacao') || ''} onValueChange={(v) => setValue('avaliacao', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{avaliacoes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Aspirações FIV"><Input type="number" {...register('aspiracoes_fiv')} /></Field>
            <Field label="Tetos Funcionais">
              <Select value={String(watch('tetos') ?? 4)} onValueChange={(v) => setValue('tetos', Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 tetos</SelectItem>
                  <SelectItem value="3">3 tetos</SelectItem>
                  <SelectItem value="2">2 tetos</SelectItem>
                  <SelectItem value="1">1 teto</SelectItem>
                  <SelectItem value="0">Nenhum</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Origem / Compra</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Origem" className="md:col-span-3"><Input {...register('origem')} placeholder="Fazenda, leilão, nascimento próprio ou receptora usada" /></Field>
            <Field label="Receptora Usada"><Input {...register('receptora_usada')} placeholder="Nº ou nome da receptora" /></Field>
            <Field label="Data da Compra"><Input type="date" {...register('data_compra')} /></Field>
            <Field label="Peso na Compra (kg)"><Input type="number" step="0.1" {...register('peso_compra')} /></Field>
            <Field label="Valor de Compra (R$)"><Input type="number" step="0.01" {...register('valor_compra')} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Venda</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Data da Venda"><Input type="date" {...register('data_venda')} /></Field>
            <Field label="Peso na Venda (kg)"><Input type="number" step="0.1" {...register('peso_venda')} /></Field>
            <Field label="Valor de Venda (R$)"><Input type="number" step="0.01" {...register('valor_venda')} /></Field>
            <Field label="Comprador"><Input {...register('comprador')} /></Field>
          </CardContent>
        </Card>

        {(watch('status') === 'morto') && (
          <Card className="border-destructive/50">
            <CardHeader><CardTitle className="text-lg text-destructive">Baixa por Morte</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Data da Morte"><Input type="date" {...register('data_morte')} /></Field>
              <Field label="Causa da Morte">
                <Select value={watch('causa_morte') || ''} onValueChange={(v) => setValue('causa_morte', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione a causa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doença">Doença</SelectItem>
                    <SelectItem value="acidente">Acidente</SelectItem>
                    <SelectItem value="parto">Complicação no Parto</SelectItem>
                    <SelectItem value="picada_cobra">Picada de Cobra</SelectItem>
                    <SelectItem value="raio">Raio</SelectItem>
                    <SelectItem value="intoxicacao">Intoxicação</SelectItem>
                    <SelectItem value="desconhecida">Causa Desconhecida</SelectItem>
                    <SelectItem value="outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">Parceria</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Parceiro"><Input {...register('parceiro_nome')} /></Field>
            <Field label="% Propriedade"><Input type="number" step="0.1" {...register('percentual_propriedade')} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Observações</CardTitle></CardHeader>
          <CardContent>
            <Textarea {...register('observacoes')} rows={3} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Animal'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/animais')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
