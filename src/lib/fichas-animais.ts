import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'consultas-animais';

export type Fonte = 'girolando' | 'abcz' | 'outro';

export interface FichaArquivo {
  name: string;
  path: string;
  fonte: Fonte;
  createdAt: string | null;
  size: number | null;
}

export function fonteFromName(name: string): Fonte {
  const n = name.toLowerCase();
  if (n.includes('girolando')) return 'girolando';
  if (n.includes('abcz')) return 'abcz';
  return 'outro';
}

export const fonteLabel: Record<Fonte, string> = {
  girolando: 'Girolando',
  abcz: 'ABCZ',
  outro: 'Outro',
};

export const fonteClass: Record<Fonte, string> = {
  girolando: 'bg-[hsl(140_45%_22%)] text-white border-transparent',
  abcz: 'bg-background text-foreground',
  outro: 'bg-muted text-muted-foreground border-transparent',
};

export const fonteTone: Record<Fonte, string> = {
  girolando: '140 45% 22%',
  abcz: '32 85% 48%',
  outro: '213 30% 40%',
};

export function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function cleanName(name: string): string {
  return name.replace(/^\w+_\d+_/, '');
}

async function listar(animalId: string): Promise<FichaArquivo[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(animalId, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) throw error;
  return (data ?? [])
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => ({
      name: f.name,
      path: `${animalId}/${f.name}`,
      fonte: fonteFromName(f.name),
      createdAt: f.created_at,
      size: f.metadata?.size ?? null,
    }));
}

/** Lista os arquivos de ficha de um animal (bucket privado consultas-animais). */
export function useFichasAnimais(animalId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: arquivos = [], isLoading: loading } = useQuery({
    queryKey: ['fichas-animais', animalId],
    queryFn: () => listar(animalId!),
    enabled: !!animalId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['fichas-animais', animalId] });

  const abrir = async (arquivo: FichaArquivo) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(arquivo.path, 60);
    if (error || !data?.signedUrl) {
      throw new Error('Erro ao abrir arquivo');
    }
    window.open(data.signedUrl, '_blank');
  };

  return { arquivos, loading, refresh, abrir };
}
