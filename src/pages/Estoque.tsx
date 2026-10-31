import { cap } from "@/lib/labels";
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { KPICard } from '@/components/KPICard';
import { toast } from 'sonner';
import { Plus, Package, AlertTriangle, ArrowDown, ArrowUp, Camera, Loader2, FileText, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ReportMenu } from '@/components/ReportMenu';

const categorias = ['Ração', 'Medicamento', 'Suplemento', 'Fertilizante', 'Semente', 'Combustível', 'Peça', 'Material', 'Outro'];

interface InvoiceItem {
  nome: string;
  quantidade: number;
  unidade: string;
  valor_unitario?: number;
  valor_total: number;
  categoria: string;
  centro_custo?: string;
  compoe_nutricao?: boolean;
  selected?: boolean;
}

interface InvoiceData {
  fornecedor?: string;
  data_nota?: string;
  numero_nota?: string;
  itens: InvoiceItem[];
}

export default function Estoque() {
  const [openItem, setOpenItem] = useState(false);
  const [openMov, setOpenMov] = useState(false);
  const [openScan, setOpenScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const [itemForm, setItemForm] = useState({ nome: '', categoria: '', unidade: '', quantidade: '', quantidade_minima: '', custo: '', localizacao: '', validade: '' });
  const [movForm, setMovForm] = useState({ item_id: '', tipo: 'entrada', quantidade: '', data: new Date().toISOString().slice(0, 10), motivo: '' });

  const { data: itens = [] } = useQuery({ queryKey: ['estoque-itens'], queryFn: async () => { const { data } = await supabase.from('estoque_itens').select('*').order('nome'); return data || []; } });
  const { data: movs = [] } = useQuery({ queryKey: ['movimentacoes'], queryFn: async () => { const { data } = await supabase.from('movimentacoes_estoque').select('*, estoque_itens(nome)').order('data', { ascending: false }).limit(100); return data || []; } });

  const alertas = itens.filter(i => (i.quantidade ?? 0) <= (i.quantidade_minima ?? 0));

  const saveItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('estoque_itens').insert({ ...itemForm, quantidade: itemForm.quantidade ? Number(itemForm.quantidade) : 0, quantidade_minima: itemForm.quantidade_minima ? Number(itemForm.quantidade_minima) : 0, custo: itemForm.custo ? Number(itemForm.custo) : null, validade: itemForm.validade || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['estoque-itens'] }); toast.success('Item cadastrado!'); setOpenItem(false); setItemForm({ nome: '', categoria: '', unidade: '', quantidade: '', quantidade_minima: '', custo: '', localizacao: '', validade: '' }); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveMov = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('movimentacoes_estoque').insert({ ...movForm, quantidade: Number(movForm.quantidade) });
      if (error) throw error;
      const item = itens.find(i => i.id === movForm.item_id);
      if (item) {
        const novaQtd = movForm.tipo === 'entrada' ? (item.quantidade ?? 0) + Number(movForm.quantidade) : (item.quantidade ?? 0) - Number(movForm.quantidade);
        await supabase.from('estoque_itens').update({ quantidade: novaQtd }).eq('id', movForm.item_id);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['estoque-itens', 'movimentacoes'] }); toast.success('Movimentação registrada!'); setOpenMov(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const scanInvoice = async (file: File) => {
    setScanning(true);
    setInvoiceData(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('scan-invoice', {
        body: { imageBase64: base64 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const items = (data.itens || []).map((i: InvoiceItem) => ({ ...i, selected: true }));
      setInvoiceData({ ...data, itens: items });
      toast.success(`${items.length} itens extraídos da nota!`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao escanear nota');
    } finally {
      setScanning(false);
    }
  };

  const importInvoiceItems = async () => {
    if (!invoiceData) return;
    setImporting(true);
    try {
      const selected = invoiceData.itens.filter(i => i.selected);
      const dataNota = invoiceData.data_nota || new Date().toISOString().slice(0, 10);

      for (const item of selected) {
        // Check if item exists in stock
        const existing = itens.find(i => i.nome.toLowerCase() === item.nome.toLowerCase());

        if (existing) {
          // Update quantity and cost
          const novaQtd = (existing.quantidade ?? 0) + item.quantidade;
          await supabase.from('estoque_itens').update({
            quantidade: novaQtd,
            custo: item.valor_unitario || (item.valor_total / item.quantidade),
          }).eq('id', existing.id);

          // Register movement
          await supabase.from('movimentacoes_estoque').insert({
            item_id: existing.id,
            tipo: 'entrada',
            quantidade: item.quantidade,
            data: dataNota,
            motivo: `NF ${invoiceData.numero_nota || ''} - ${invoiceData.fornecedor || 'Compra'}`.trim(),
          });
        } else {
          // Create new item
          const { data: newItem } = await supabase.from('estoque_itens').insert({
            nome: item.nome,
            categoria: item.categoria,
            unidade: item.unidade,
            quantidade: item.quantidade,
            custo: item.valor_unitario || (item.valor_total / item.quantidade),
          }).select('id').single();

          if (newItem) {
            await supabase.from('movimentacoes_estoque').insert({
              item_id: newItem.id,
              tipo: 'entrada',
              quantidade: item.quantidade,
              data: dataNota,
              motivo: `NF ${invoiceData.numero_nota || ''} - ${invoiceData.fornecedor || 'Compra'}`.trim(),
            });
          }
        }

        // Register financial entry
        if (item.valor_total > 0) {
          await supabase.from('lancamentos').insert({
            data_lancamento: dataNota,
            descricao: `${item.nome} - NF ${invoiceData.numero_nota || ''} (${invoiceData.fornecedor || ''})`.trim(),
            tipo: 'despesa',
            valor: item.valor_total,
            centro_custo: item.centro_custo || 'Outros',
          });
        }

        // If it composes nutrition cost, update diet cost
        if (item.compoe_nutricao && item.valor_unitario) {
          // Update matching diet ingredients cost
          const { data: dietas } = await supabase.from('dietas_lote').select('*').ilike('ingrediente', `%${item.nome.split(' ')[0]}%`);
          if (dietas?.length) {
            for (const d of dietas) {
              await supabase.from('dietas_lote').update({ custo_kg: item.valor_unitario }).eq('id', d.id);
            }
          }
        }
      }

      qc.invalidateQueries({ queryKey: ['estoque-itens'] });
      qc.invalidateQueries({ queryKey: ['movimentacoes'] });
      qc.invalidateQueries({ queryKey: ['lancamentos'] });
      toast.success(`${selected.length} itens importados com sucesso!`);
      setOpenScan(false);
      setInvoiceData(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao importar');
    } finally {
      setImporting(false);
    }
  };

  const toggleItem = (idx: number) => {
    if (!invoiceData) return;
    const updated = [...invoiceData.itens];
    updated[idx] = { ...updated[idx], selected: !updated[idx].selected };
    setInvoiceData({ ...invoiceData, itens: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold">Estoque</h1><p className="text-muted-foreground">Controle de itens e movimentações</p></div>
        <div className="flex gap-2">
          <ReportMenu config={{
            title: 'Relatório de Estoque',
            columns: [
              { header: 'Item', key: 'nome' },
              { header: 'Categoria', key: 'categoria' },
              { header: 'Quantidade', key: 'quantidade' },
              { header: 'Unidade', key: 'unidade' },
              { header: 'Custo (R$)', key: 'custo' },
              { header: 'Mín.', key: 'quantidade_minima' },
            ],
            data: itens,
            kpis: [
              { label: 'Itens', value: itens.length },
              { label: 'Alertas', value: alertas.length },
            ],
          }} />
          <Dialog open={openScan} onOpenChange={(open) => { setOpenScan(open); if (!open) { setInvoiceData(null); setScanning(false); } }}>
            <DialogTrigger asChild><Button variant="outline" className="border-primary/50 text-primary"><Camera className="h-4 w-4 mr-1" />Escanear NF</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Escanear Nota Fiscal com IA</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {!invoiceData && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-sm text-muted-foreground text-center">
                      Tire uma foto ou faça upload da nota fiscal.<br />
                      A IA vai extrair automaticamente os itens, quantidades, valores e categorias.
                    </p>
                    <Button onClick={() => fileRef.current?.click()} disabled={scanning} size="lg">
                      {scanning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</> : <><Camera className="h-4 w-4 mr-2" />Selecionar Imagem</>}
                    </Button>
                    <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && scanInvoice(e.target.files[0])} />
                  </div>
                )}

                {invoiceData && (
                  <>
                    <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50">
                      <div><p className="text-xs text-muted-foreground">Fornecedor</p><p className="font-medium text-sm">{invoiceData.fornecedor || '—'}</p></div>
                      <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium text-sm">{invoiceData.data_nota || '—'}</p></div>
                      <div><p className="text-xs text-muted-foreground">Nº Nota</p><p className="font-medium text-sm">{invoiceData.numero_nota || '—'}</p></div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Centro Custo</TableHead>
                          <TableHead>Nutrição</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceData.itens.map((item, idx) => (
                          <TableRow key={idx} className={!item.selected ? 'opacity-40' : ''}>
                            <TableCell>
                              <Checkbox checked={item.selected} onCheckedChange={() => toggleItem(idx)} />
                            </TableCell>
                            <TableCell className="font-medium text-sm">{item.nome}</TableCell>
                            <TableCell className="text-sm">{item.quantidade} {item.unidade}</TableCell>
                            <TableCell className="text-sm">R$ {item.valor_total.toFixed(2)}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{cap(item.categoria)}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{item.centro_custo || '—'}</TableCell>
                            <TableCell>{item.compoe_nutricao && <Check className="h-4 w-4 text-success" />}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-between items-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        {invoiceData.itens.filter(i => i.selected).length} de {invoiceData.itens.length} itens selecionados ·
                        Total: R$ {invoiceData.itens.filter(i => i.selected).reduce((s, i) => s + i.valor_total, 0).toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setInvoiceData(null); fileRef.current?.click(); }}>Nova Foto</Button>
                        <Button onClick={importInvoiceItems} disabled={importing || !invoiceData.itens.some(i => i.selected)} className="bg-secondary text-secondary-foreground">
                          {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando...</> : <><Check className="h-4 w-4 mr-2" />Importar Selecionados</>}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openItem} onOpenChange={setOpenItem}><DialogTrigger asChild><Button variant="outline"><Package className="h-4 w-4 mr-1" />Novo Item</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Cadastrar Item</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Nome</Label><Input value={itemForm.nome} onChange={e => setItemForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Categoria</Label>
                    <Select value={cap(itemForm.categoria)} onValueChange={v => setItemForm(f => ({ ...f, categoria: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Unidade</Label><Input value={itemForm.unidade} onChange={e => setItemForm(f => ({ ...f, unidade: e.target.value }))} placeholder="kg, L, un" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Qtd Atual</Label><Input type="number" value={itemForm.quantidade} onChange={e => setItemForm(f => ({ ...f, quantidade: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Qtd Mínima</Label><Input type="number" value={itemForm.quantidade_minima} onChange={e => setItemForm(f => ({ ...f, quantidade_minima: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Custo (R$)</Label><Input type="number" step="0.01" value={itemForm.custo} onChange={e => setItemForm(f => ({ ...f, custo: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Localização</Label><Input value={cap(itemForm.localizacao)} onChange={e => setItemForm(f => ({ ...f, localizacao: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Validade</Label><Input type="date" value={itemForm.validade} onChange={e => setItemForm(f => ({ ...f, validade: e.target.value }))} /></div>
                </div>
                <Button onClick={() => saveItem.mutate()} disabled={!itemForm.nome} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openMov} onOpenChange={setOpenMov}><DialogTrigger asChild><Button className="bg-secondary text-secondary-foreground"><Plus className="h-4 w-4 mr-1" />Movimentação</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Nova Movimentação</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Item</Label>
                  <Select value={movForm.item_id} onValueChange={v => setMovForm(f => ({ ...f, item_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{itens.map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Tipo</Label>
                    <Select value={cap(movForm.tipo)} onValueChange={v => setMovForm(f => ({ ...f, tipo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Quantidade</Label><Input type="number" value={movForm.quantidade} onChange={e => setMovForm(f => ({ ...f, quantidade: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Data</Label><Input type="date" value={movForm.data} onChange={e => setMovForm(f => ({ ...f, data: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Motivo</Label><Input value={cap(movForm.motivo)} onChange={e => setMovForm(f => ({ ...f, motivo: e.target.value }))} /></div>
                <Button onClick={() => saveMov.mutate()} disabled={!movForm.item_id || !movForm.quantidade} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Itens Cadastrados" value={String(itens.length)} icon={<Package className="h-5 w-5" />} />
        <KPICard title="Alertas Estoque Baixo" value={String(alertas.length)} icon={<AlertTriangle className="h-5 w-5" />} />
        <KPICard title="Movimentações" value={String(movs.length)} icon={<ArrowDown className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="itens">
        <TabsList><TabsTrigger value="itens">Itens</TabsTrigger><TabsTrigger value="movimentacoes">Movimentações</TabsTrigger></TabsList>
        <TabsContent value="itens">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Qtd</TableHead><TableHead>Mínimo</TableHead><TableHead>Unidade</TableHead><TableHead>Custo</TableHead><TableHead>Local</TableHead></TableRow></TableHeader>
              <TableBody>
                {itens.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.nome}</TableCell>
                    <TableCell>{i.categoria || '-'}</TableCell>
                    <TableCell>
                      <span className={(i.quantidade ?? 0) <= (i.quantidade_minima ?? 0) ? 'text-destructive font-bold' : ''}>{i.quantidade ?? 0}</span>
                    </TableCell>
                    <TableCell>{i.quantidade_minima ?? 0}</TableCell>
                    <TableCell>{i.unidade || '-'}</TableCell>
                    <TableCell>{i.custo ? `R$ ${Number(i.custo).toFixed(2)}` : '-'}</TableCell>
                    <TableCell>{i.localizacao || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="movimentacoes">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Item</TableHead><TableHead>Tipo</TableHead><TableHead>Qtd</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader>
              <TableBody>
                {movs.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.data + 'T12:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{m.estoque_itens?.nome || '-'}</TableCell>
                    <TableCell>{m.tipo === 'entrada' ? <Badge variant="outline" className="text-green-600 border-green-600"><ArrowDown className="h-3 w-3 mr-1" />Entrada</Badge> : <Badge variant="outline" className="text-red-600 border-red-600"><ArrowUp className="h-3 w-3 mr-1" />Saída</Badge>}</TableCell>
                    <TableCell>{m.quantidade}</TableCell>
                    <TableCell>{m.motivo || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
