import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Syringe, Calendar } from 'lucide-react';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type Evento = {
  id: string;
  data: string;
  tipo: 'vacinacao' | 'proxima_dose' | 'campanha';
  titulo: string;
  detalhe: string;
};

export default function CalendarioVacinas() {
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  // Vacinações realizadas
  const { data: vacinacoes = [] } = useQuery({
    queryKey: ['vacinacoes-calendario'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vacinacoes')
        .select('id, data, proxima_dose, animais(nome, brinco), vacinas(nome)')
        .order('data');
      return data || [];
    },
  });

  // Campanhas
  const { data: campanhas = [] } = useQuery({
    queryKey: ['campanhas-calendario'],
    queryFn: async () => {
      const { data } = await supabase
        .from('campanhas_vacinacao')
        .select('id, data, nome, vacinas(nome)')
        .order('data');
      return data || [];
    },
  });

  // Build events
  const eventos = useMemo(() => {
    const evts: Evento[] = [];
    vacinacoes.forEach((v: any) => {
      evts.push({
        id: v.id,
        data: v.data,
        tipo: 'vacinacao',
        titulo: v.vacinas?.nome || 'Vacina',
        detalhe: v.animais?.nome || v.animais?.brinco || 'Animal',
      });
      if (v.proxima_dose) {
        evts.push({
          id: `${v.id}-prox`,
          data: v.proxima_dose,
          tipo: 'proxima_dose',
          titulo: `Reforço: ${v.vacinas?.nome || 'Vacina'}`,
          detalhe: v.animais?.nome || v.animais?.brinco || 'Animal',
        });
      }
    });
    campanhas.forEach((c: any) => {
      if (c.data) {
        evts.push({
          id: c.id,
          data: c.data,
          tipo: 'campanha',
          titulo: c.nome,
          detalhe: c.vacinas?.nome || '',
        });
      }
    });
    return evts;
  }, [vacinacoes, campanhas]);

  // Calendar grid
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date().toISOString().split('T')[0];

  const eventosDoMes = useMemo(() => {
    const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`;
    return eventos.filter(e => e.data.startsWith(prefix));
  }, [eventos, ano, mes]);

  const eventosPorDia = useMemo(() => {
    const map: Record<string, Evento[]> = {};
    eventosDoMes.forEach(e => {
      const dia = e.data;
      if (!map[dia]) map[dia] = [];
      map[dia].push(e);
    });
    return map;
  }, [eventosDoMes]);

  const eventosDoDia = diaSelecionado ? eventosPorDia[diaSelecionado] || [] : [];

  const prevMes = () => { if (mes === 0) { setMes(11); setAno(a => a - 1); } else setMes(m => m - 1); };
  const nextMes = () => { if (mes === 11) { setMes(0); setAno(a => a + 1); } else setMes(m => m + 1); };

  const tipoColors: Record<string, string> = {
    vacinacao: 'bg-green-500',
    proxima_dose: 'bg-amber-500',
    campanha: 'bg-blue-500',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Calendário de Vacinas</h1>
        <p className="text-muted-foreground">Vacinações realizadas, reforços pendentes e campanhas</p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-green-500" /> Vacinação realizada</div>
        <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-amber-500" /> Reforço / Próxima dose</div>
        <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-blue-500" /> Campanha</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMes}><ChevronLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-lg font-heading">{MESES[mes]} {ano}</CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMes}><ChevronRight className="h-5 w-5" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {/* Empty cells before first day */}
              {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
              {/* Days */}
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const evts = eventosPorDia[dataStr];
                const isHoje = dataStr === hoje;
                const isSelecionado = dataStr === diaSelecionado;

                return (
                  <button
                    key={dia}
                    onClick={() => setDiaSelecionado(dataStr)}
                    className={`relative p-1 rounded-lg text-sm min-h-[52px] flex flex-col items-center transition-colors
                      ${isHoje ? 'bg-secondary/20 font-bold' : ''}
                      ${isSelecionado ? 'ring-2 ring-secondary' : ''}
                      ${evts ? 'hover:bg-accent' : 'hover:bg-muted/50'}
                    `}
                  >
                    <span className={isHoje ? 'text-secondary' : ''}>{dia}</span>
                    {evts && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {evts.slice(0, 3).map((e, idx) => (
                          <div key={idx} className={`w-2 h-2 rounded-full ${tipoColors[e.tipo]}`} />
                        ))}
                        {evts.length > 3 && <span className="text-[10px] text-muted-foreground">+{evts.length - 3}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {diaSelecionado
                ? new Date(diaSelecionado + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Selecione um dia'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventosDoDia.length > 0 ? (
              <div className="space-y-3">
                {eventosDoDia.map(e => (
                  <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${tipoColors[e.tipo]}`} />
                    <div>
                      <p className="font-medium text-sm">{e.titulo}</p>
                      <p className="text-xs text-muted-foreground">{e.detalhe}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {e.tipo === 'vacinacao' ? 'Realizada' : e.tipo === 'proxima_dose' ? 'Reforço' : 'Campanha'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Syringe className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">{diaSelecionado ? 'Nenhum evento neste dia' : 'Clique em um dia para ver os detalhes'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Próximos Reforços e Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const proximos = eventos
              .filter(e => e.data >= hoje && (e.tipo === 'proxima_dose' || e.tipo === 'campanha'))
              .sort((a, b) => a.data.localeCompare(b.data))
              .slice(0, 10);
            return proximos.length > 0 ? (
              <div className="space-y-2">
                {proximos.map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className={`w-2 h-2 rounded-full ${tipoColors[e.tipo]}`} />
                    <span className="text-sm font-medium w-24">{new Date(e.data + 'T12:00').toLocaleDateString('pt-BR')}</span>
                    <span className="text-sm flex-1">{e.titulo}</span>
                    <span className="text-xs text-muted-foreground">{e.detalhe}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum reforço ou campanha pendente</p>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
