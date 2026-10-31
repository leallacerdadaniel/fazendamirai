import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Download, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFichasAnimais, fonteLabel, fonteClass, formatSize, cleanName, type Fonte } from '@/lib/fichas-animais';

const BUCKET = 'consultas-animais';

interface Props {
  animalId: string;
  animalNome?: string;
}

/**
 * Card de gestão das fichas das associações: envio, listagem, abertura e exclusão.
 * A listagem e a abertura ficam no hook compartilhado src/lib/fichas-animais.ts
 * (mesma origem dos botões rápidos abaixo da foto).
 */
export function AnimalConsultaArquivos({ animalId, animalNome }: Props) {
  const { arquivos, loading, refresh } = useFichasAnimais(animalId);
  const [uploading, setUploading] = useState(false);
  const [fonte, setFonte] = useState<Fonte>('girolando');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^\w.\-() ]/g, '_');
      const path = `${animalId}/${fonte}_${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
      } else {
        ok++;
      }
    }
    if (ok > 0) toast.success(ok === 1 ? 'Arquivo enviado!' : `${ok} arquivos enviados!`);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
    refresh();
  };

  const handleDownload = async (path: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      toast.error('Erro ao abrir arquivo');
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const handleDelete = async (path: string) => {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      toast.error('Erro ao excluir: ' + error.message);
    } else {
      toast.success('Arquivo excluído');
      refresh();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Fichas das Associações
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={fonte} onValueChange={(v) => setFonte(v as Fonte)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="girolando">Girolando</SelectItem>
              <SelectItem value="abcz">ABCZ</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
            Enviar ficha
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando arquivos…
          </div>
        ) : arquivos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Nenhuma ficha anexada{animalNome ? ` para ${animalNome}` : ''}. Envie o PDF ou a imagem gerada na
            consulta da Girolando ou da ABCZ para consultar aqui depois.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {arquivos.map((a) => (
              <li key={a.path} className="flex items-center gap-3 py-2.5">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{cleanName(a.name)}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.createdAt ? format(new Date(a.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}
                    {a.size ? ` · ${formatSize(a.size)}` : ''}
                  </p>
                </div>
                <Badge variant="outline" className={fonteClass[a.fonte]}>
                  {fonteLabel[a.fonte]}
                </Badge>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDownload(a.path)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.path)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
