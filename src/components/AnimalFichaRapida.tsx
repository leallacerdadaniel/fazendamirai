import { FileText, ExternalLink } from 'lucide-react';
import { useFichasAnimais, fonteLabel, fonteTone, cleanName } from '@/lib/fichas-animais';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Botões compactos "Abrir ficha" renderizados logo abaixo da foto do animal.
 * Só aparece quando existe pelo menos uma ficha no sistema.
 */
export function AnimalFichaRapida({ animalId }: { animalId: string }) {
  const { arquivos, loading, abrir } = useFichasAnimais(animalId);

  if (loading) {
    return (
      <div className="w-full p-3 space-y-2 border-t border-border/60">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (arquivos.length === 0) return null;

  return (
    <div className="w-full p-3 border-t border-border/60 bg-background/60 space-y-2">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <FileText className="h-3.5 w-3.5" /> Ficha da associação
      </p>
      <div className="flex flex-col gap-1.5">
        {arquivos.map((a) => (
          <button
            key={a.path}
            onClick={() => abrir(a).catch(() => {})}
            className="group flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-colors hover:bg-muted/70"
            style={{ borderColor: `hsl(${fonteTone[a.fonte]} / 0.4)`, color: `hsl(${fonteTone[a.fonte]})` }}
            title={cleanName(a.name)}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate flex-1">{fonteLabel[a.fonte]}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
