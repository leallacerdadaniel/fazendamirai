import { cap } from "@/lib/labels";
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, AlertTriangle, Syringe, Filter, ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ReportMenu } from '@/components/ReportMenu';

const tipoLabels: Record<string, string> = {
  bezerra: 'Bezerra',
  novilha: 'Novilha',
  vaca: 'Vaca',
  touro: 'Touro',
  bezerro: 'Bezerro',
};

const statusColors: Record<string, string> = {
  ativo: 'bg-success/10 text-success border-success/20',
  vendido: 'bg-warning/10 text-warning border-warning/20',
  morto: 'bg-destructive/10 text-destructive border-destructive/20',
  descartado: 'bg-muted text-muted-foreground',
};

export default function Animais() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [flagFilter, setFlagFilter] = useState('todos');
  const navigate = useNavigate();
  const { isGestorOrAdmin } = useAuth();

  const [tipoFilter, setTipoFilter] = useState('todos');
  const [loteFilter, setLoteFilter] = useState('todos');
  const [racaFilter, setRacaFilter] = useState('todos');
  const [localFilter, setLocalFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('codigo');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data: animais, isLoading } = useQuery({
    queryKey: ['animais'],
    queryFn: async () => {
      const all: any[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from('animais').select('*')
          .order('codigo_importacao', { ascending: true, nullsFirst: false }).range(from, from + 999);
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      return all;
    },
  });

  const { data: lotes } = useQuery({
    queryKey: ['lotes-filtro'],
    queryFn: async () => {
      const { data } = await supabase.from('lotes').select('id, nome').order('nome');
      return data || [];
    },
  });
  const loteNome = useMemo(() => new Map((lotes || []).map(l => [l.id, l.nome])), [lotes]);
  const opcoes = (campo: string) => Array.from(new Set((animais || []).map(a => a[campo]).filter(Boolean))).sort() as string[];

  // Buscar flags de mastite/ocitocina do último registro de produção por animal
  const { data: producaoFlags } = useQuery({
    queryKey: ['producao-flags-animais'],
    queryFn: async () => {
      const { data } = await supabase
        .from('producao_leite_diaria')
        .select('animal_id, com_mastite, usa_ocitocina, data, created_at')
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });
      if (!data) return { mastite: new Set<string>(), ocitocina: new Set<string>() };

      const vistos = new Set<string>();
      const mastite = new Set<string>();
      const ocitocina = new Set<string>();
      for (const r of data) {
        if (!r.animal_id || vistos.has(r.animal_id)) continue;
        vistos.add(r.animal_id);
        if (r.com_mastite) mastite.add(r.animal_id);
        if (r.usa_ocitocina) ocitocina.add(r.animal_id);
      }
      return { mastite, ocitocina };
    },
  });

  // Filtrar animais
  const animaisFiltrados = useMemo(() => {
    if (!animais) return [];
    let lista = animais;
    const termo = search.trim().toLowerCase();
    if (termo) {
      lista = lista.filter(a => [a.nome, a.brinco, a.rgd, a.codigo_importacao].some(v => v && String(v).toLowerCase().includes(termo)));
    }
    if (tipoFilter !== 'todos') lista = lista.filter(a => a.tipo === tipoFilter);
    if (racaFilter !== 'todos') lista = lista.filter(a => (a.raca || a.raca_sangue) === racaFilter);
    if (localFilter !== 'todos') lista = lista.filter(a => a.localizacao === localFilter);
    if (loteFilter === 'sem') lista = lista.filter(a => !a.lote_id);
    else if (loteFilter !== 'todos') lista = lista.filter(a => a.lote_id === loteFilter);

    if (statusFilter !== 'todos') {
      lista = lista.filter(a => a.status === statusFilter);
    }

    if (flagFilter === 'mastite') {
      lista = lista.filter(a => producaoFlags?.mastite.has(a.id));
    } else if (flagFilter === 'ocitocina') {
      lista = lista.filter(a => producaoFlags?.ocitocina.has(a.id));
    } else if (flagFilter === 'sem_lote') {
      lista = lista.filter(a => !a.lote_id);
    }

    const sorted = [...lista];
    const cmp = (x: any, y: any) => String(x ?? '\uffff').localeCompare(String(y ?? '\uffff'), 'pt-BR', { numeric: true });
    if (sortBy === 'codigo') sorted.sort((a, b) => cmp(a.codigo_importacao, b.codigo_importacao));
    if (sortBy === 'nome') sorted.sort((a, b) => cmp(a.nome, b.nome));
    if (sortBy === 'brinco') sorted.sort((a, b) => cmp(a.brinco, b.brinco));
    if (sortBy === 'idade') sorted.sort((a, b) => cmp(a.nascimento, b.nascimento));
    if (sortBy === 'recentes') sorted.sort((a, b) => cmp(b.created_at, a.created_at));
    return sorted;
  }, [animais, search, statusFilter, flagFilter, tipoFilter, racaFilter, localFilter, loteFilter, sortBy, producaoFlags]);

  useEffect(() => { setPage(1); }, [search, statusFilter, flagFilter, tipoFilter, racaFilter, localFilter, loteFilter, sortBy, pageSize]);
  const totalPages = Math.max(1, Math.ceil(animaisFiltrados.length / pageSize));
  const pagina = animaisFiltrados.slice((page - 1) * pageSize, page * pageSize);
  const filtrosAtivos = [statusFilter, tipoFilter, racaFilter, localFilter, loteFilter, flagFilter].filter(f => f !== 'todos').length + (search ? 1 : 0);
  const limpar = () => { setSearch(''); setStatusFilter('todos'); setTipoFilter('todos'); setRacaFilter('todos'); setLocalFilter('todos'); setLoteFilter('todos'); setFlagFilter('todos'); };

  const calcIdade = (nascimento: string | null) => {
    if (!nascimento) return '—';
    const meses = Math.floor(
      (Date.now() - new Date(nascimento).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );
    if (meses < 12) return `${meses}m`;
    return `${Math.floor(meses / 12)}a ${meses % 12}m`;
  };

  const countMastite = producaoFlags?.mastite.size || 0;
  const countOcitocina = producaoFlags?.ocitocina.size || 0;
  const countSemLote = animais?.filter(a => a.status === 'ativo' && !a.lote_id).length || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Animais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {animaisFiltrados.length === (animais?.length || 0)
              ? `${animais?.length || 0} animais cadastrados`
              : `${animaisFiltrados.length} de ${animais?.length || 0} animais (filtrados)`}
          </p>
        </div>
        <div className="flex gap-2">
          <ReportMenu config={{
            title: 'Relatório do Rebanho',
            columns: [
              { header: 'Brinco', key: 'brinco' },
              { header: 'Nome', key: 'nome' },
              { header: 'Tipo', key: 'tipo' },
              { header: 'Raça/Sangue', key: 'raca_sangue' },
              { header: 'Nascimento', key: 'nascimento' },
              { header: 'Status', key: 'status' },
            ],
            data: (animaisFiltrados || []).map(a => ({ ...a, tipo: tipoLabels[a.tipo || ''] || a.tipo })),
            kpis: [
              { label: 'Total', value: animaisFiltrados?.length || 0 },
              { label: 'Ativos', value: animaisFiltrados?.filter(a => a.status === 'ativo').length || 0 },
            ],
          }} disabled={isLoading} />
          {isGestorOrAdmin && (
            <Button onClick={() => navigate('/animais/novo')} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Plus className="h-4 w-4 mr-2" />
              Novo Animal
            </Button>
          )}
        </div>
      </div>

      {/* Quick filter badges */}
      {(countMastite > 0 || countOcitocina > 0 || countSemLote > 0) && (
        <div className="flex flex-wrap gap-2">
          {countMastite > 0 && (
            <Button
              variant={flagFilter === 'mastite' ? 'default' : 'outline'}
              size="sm" aria-pressed={flagFilter === 'mastite'}
              onClick={() => setFlagFilter(f => f === 'mastite' ? 'todos' : 'mastite')}
            >
              <AlertTriangle className="h-3 w-3" /> Com Mastite ({countMastite})
            </Button>
          )}
          {countOcitocina > 0 && (
            <Button
              variant={flagFilter === 'ocitocina' ? 'default' : 'outline'}
              size="sm" aria-pressed={flagFilter === 'ocitocina'}
              onClick={() => setFlagFilter(f => f === 'ocitocina' ? 'todos' : 'ocitocina')}
            >
              <Syringe className="h-3 w-3" /> Usa Ocitocina ({countOcitocina})
            </Button>
          )}
          {countSemLote > 0 && (
            <Button
              variant={flagFilter === 'sem_lote' ? 'default' : 'outline'}
              size="sm" aria-pressed={flagFilter === 'sem_lote'}
              onClick={() => setFlagFilter(f => f === 'sem_lote' ? 'todos' : 'sem_lote')}
            >
              <Filter className="h-3 w-3" /> Sem Lote ({countSemLote})
            </Button>
          )}
        </div>
      )}

      <section aria-label="Listagem de animais">
        <div className="border-y py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0 basis-full sm:basis-auto">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, brinco ou RGD..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm" aria-label="Buscar animais"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                {opcoes('status').map(v => <SelectItem key={v} value={v}>{cap(v)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[140px]" aria-label="Categoria"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas categorias</SelectItem>
                {opcoes('tipo').map(v => <SelectItem key={v} value={v}>{tipoLabels[v] || cap(v)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={racaFilter} onValueChange={setRacaFilter}>
              <SelectTrigger className="w-[150px]" aria-label="Raça"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas raças</SelectItem>
                {Array.from(new Set((animais || []).map(a => a.raca || a.raca_sangue).filter(Boolean))).sort().map((v: any) => <SelectItem key={v} value={v}>{cap(v)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={loteFilter} onValueChange={setLoteFilter}>
              <SelectTrigger className="w-[140px]" aria-label="Lote"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos lotes</SelectItem>
                <SelectItem value="sem">Sem lote</SelectItem>
                {(lotes || []).map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={localFilter} onValueChange={setLocalFilter}>
              <SelectTrigger className="w-[150px]" aria-label="Localização"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Toda localização</SelectItem>
                {opcoes('localizacao').map(v => <SelectItem key={v} value={v}>{cap(v)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]" aria-label="Ordenar"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="codigo">Ordem: código MIR</SelectItem>
                <SelectItem value="nome">Ordem: nome</SelectItem>
                <SelectItem value="brinco">Ordem: brinco</SelectItem>
                <SelectItem value="idade">Ordem: mais velhos</SelectItem>
                <SelectItem value="recentes">Ordem: recentes</SelectItem>
              </SelectContent>
            </Select>
            {filtrosAtivos > 0 && <Button variant="ghost" size="sm" onClick={limpar}>Limpar filtros ({filtrosAtivos})</Button>}
          </div>
        </div>
        <div className="divide-y md:hidden">
          {isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p> : pagina.length ? pagina.map(a => (
            <Button asChild variant="ghost" key={a.id} className="h-auto w-full justify-start gap-3 whitespace-normal rounded-none px-0 py-5 text-left">
              <Link to={`/animais/${a.id}/perfil`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-sm text-primary">{a.brinco || '—'}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-base font-semibold">{a.nome || 'Sem nome'}</span>
                  <span className="text-xs font-normal text-muted-foreground">{[tipoLabels[a.tipo || ''] || a.tipo, a.raca_sangue, calcIdade(a.nascimento)].filter(Boolean).join(' · ')}</span>
                  <span className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={statusColors[a.status]}>{cap(a.status)}</Badge>
                    {producaoFlags?.mastite.has(a.id) && <Badge variant="outline" className="text-destructive">Mastite</Badge>}
                    {producaoFlags?.ocitocina.has(a.id) && <Badge variant="outline" className="text-warning">Ocitocina</Badge>}
                  </span>
                </span>
                <ArrowUpRight className="shrink-0 text-muted-foreground" />
              </Link>
            </Button>
          )) : <p className="py-8 text-center text-sm text-muted-foreground">{flagFilter !== 'todos' ? 'Nenhum animal com esse filtro' : 'Nenhum animal cadastrado'}</p>}
        </div>
          <div className="hidden overflow-x-auto md:block">
            <Table filterable={false}>
              <TableHeader>
                <TableRow>
                  <TableHead>Brinco</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Raça/Sangue</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : animaisFiltrados && animaisFiltrados.length > 0 ? (
                  pagina.map((a) => {
                    const hasMastite = producaoFlags?.mastite.has(a.id);
                    const hasOcitocina = producaoFlags?.ocitocina.has(a.id);
                    return (
                      <TableRow
                        key={a.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/animais/${a.id}/perfil`)}
                      >
                        <TableCell className="font-mono font-medium">{a.brinco || '—'}</TableCell>
                        <TableCell className="font-medium">{a.nome || '—'}</TableCell>
                        <TableCell>{tipoLabels[a.tipo || ''] || a.tipo || '—'}</TableCell>
                        <TableCell>{a.raca_sangue || '—'}</TableCell>
                        <TableCell>{calcIdade(a.nascimento)}</TableCell>
                        <TableCell>{a.lote_id ? loteNome.get(a.lote_id) || '—' : <span className="text-muted-foreground">Sem lote</span>}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[a.status] || ''}>
                            {cap(a.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {hasMastite && (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs gap-1">
                                <AlertTriangle className="h-3 w-3" /> Mastite
                              </Badge>
                            )}
                            {hasOcitocina && (
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs gap-1">
                                <Syringe className="h-3 w-3" /> Ocitocina
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {flagFilter !== 'todos' ? 'Nenhum animal com esse filtro' : 'Nenhum animal cadastrado'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        {animaisFiltrados.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
            <span className="text-muted-foreground">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, animaisFiltrados.length)} de {animaisFiltrados.length}
            </span>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
                <SelectTrigger className="w-[110px]" aria-label="Por página"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[25, 50, 100, 500].map(n => <SelectItem key={n} value={String(n)}>{n} / página</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>«</Button>
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="px-1">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
