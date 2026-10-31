import { supabase } from '@/integrations/supabase/client';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * After registering a breeding event (cobertura/IA/TE/IATF):
 * → Task to confirm pregnancy at +30 days
 */
export async function criarTarefasCobertura(animalId: string, animalLabel: string, dataCobertura: string) {
  const tarefas = [
    {
      titulo: `Confirmar prenhez: ${animalLabel}`,
      descricao: `Realizar diagnóstico de gestação (ultrassom) para ${animalLabel}. Cobertura realizada em ${new Date(dataCobertura + 'T12:00:00').toLocaleDateString('pt-BR')}.`,
      prazo: addDays(dataCobertura, 30),
      prioridade: 'alta',
      modulo_relacionado: 'reproducao',
    },
  ];
  await supabase.from('tarefas').insert(tarefas);
}

/**
 * After confirming pregnancy (diagnóstico positivo):
 * → Task for sexing at +70 days from breeding (40 days from diagnosis if diagnosis at 30 days)
 * → Task for drying off at 60 days before expected calving
 */
export async function criarTarefasDiagnosticoPositivo(
  animalId: string,
  animalLabel: string,
  dataDiagnostico: string,
  diasGestacao: number | null,
  previsaoParto: string | null
) {
  const tarefas: any[] = [];

  // Sexing at ~70 days of gestation
  const diasAteSexagem = diasGestacao ? (70 - diasGestacao) : 40;
  if (diasAteSexagem > 0) {
    tarefas.push({
      titulo: `Sexagem: ${animalLabel}`,
      descricao: `Realizar sexagem fetal de ${animalLabel} (~70 dias de gestação).`,
      prazo: addDays(dataDiagnostico, diasAteSexagem),
      prioridade: 'media',
      modulo_relacionado: 'reproducao',
    });
  }

  // Drying off 60 days before expected calving
  if (previsaoParto) {
    tarefas.push({
      titulo: `Secagem: ${animalLabel}`,
      descricao: `Realizar secagem de ${animalLabel}. Previsão de parto: ${new Date(previsaoParto + 'T12:00:00').toLocaleDateString('pt-BR')}.`,
      prazo: addDays(previsaoParto, -60),
      prioridade: 'alta',
      modulo_relacionado: 'reproducao',
    });
  }

  if (tarefas.length > 0) {
    await supabase.from('tarefas').insert(tarefas);
  }
}

/**
 * After registering a birth (parto):
 * → Retention monitoring tasks at day 1, 10, 20, 30
 * → Start new reproductive protocol at +35 days
 */
export async function criarTarefasParto(animalId: string, animalLabel: string, dataParto: string) {
  const tarefas = [
    {
      titulo: `Retenção 1º dia: ${animalLabel}`,
      descricao: `Verificar retenção de placenta - 1º dia pós-parto de ${animalLabel}.`,
      prazo: addDays(dataParto, 1),
      prioridade: 'alta',
      modulo_relacionado: 'reproducao',
    },
    {
      titulo: `Retenção 10º dia: ${animalLabel}`,
      descricao: `Acompanhamento de retenção - 10º dia pós-parto de ${animalLabel}.`,
      prazo: addDays(dataParto, 10),
      prioridade: 'alta',
      modulo_relacionado: 'reproducao',
    },
    {
      titulo: `Retenção 20º dia: ${animalLabel}`,
      descricao: `Acompanhamento de retenção - 20º dia pós-parto de ${animalLabel}.`,
      prazo: addDays(dataParto, 20),
      prioridade: 'media',
      modulo_relacionado: 'reproducao',
    },
    {
      titulo: `Retenção 30º dia: ${animalLabel}`,
      descricao: `Acompanhamento de retenção - 30º dia pós-parto de ${animalLabel}.`,
      prazo: addDays(dataParto, 30),
      prioridade: 'media',
      modulo_relacionado: 'reproducao',
    },
    {
      titulo: `Iniciar protocolo reprodutivo: ${animalLabel}`,
      descricao: `Iniciar novo protocolo de reprodução para ${animalLabel}. Completou 35 dias pós-parto.`,
      prazo: addDays(dataParto, 35),
      prioridade: 'alta',
      modulo_relacionado: 'reproducao',
    },
  ];
  await supabase.from('tarefas').insert(tarefas);
}
