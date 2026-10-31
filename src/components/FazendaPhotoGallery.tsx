import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import vistaGeral from '@/assets/fazenda/vista-geral.jpeg.asset.json';
import pastagens from '@/assets/fazenda/pastagens.jpeg.asset.json';
import vistaAerea from '@/assets/fazenda/vista-aerea.jpeg.asset.json';
import pivo from '@/assets/fazenda/pivo-e-currais.jpeg.asset.json';
import lagos from '@/assets/fazenda/lagos-e-jardins.jpeg.asset.json';
import sede from '@/assets/fazenda/sede.jpeg.asset.json';
import instalacoes from '@/assets/fazenda/sede-e-instalacoes.jpeg.asset.json';

const photos = [
  { url: vistaGeral.url, title: 'Vista geral da fazenda' },
  { url: pastagens.url, title: 'Pastagens e estrada' },
  { url: vistaAerea.url, title: 'Vista aérea da fazenda' },
  { url: pivo.url, title: 'Pivô e currais' },
  { url: lagos.url, title: 'Lagos e jardins' },
  { url: sede.url, title: 'Sede da fazenda' },
  { url: instalacoes.url, title: 'Sede e instalações' },
];

export default function FazendaPhotoGallery() {
  const [selected, setSelected] = useState<number | null>(null);
  const photo = selected === null ? undefined : photos[selected];

  function navigate(direction: number) {
    setSelected(current => current === null ? null : (current + direction + photos.length) % photos.length);
  }

  return (
    <section className="space-y-4" aria-labelledby="fotos-fazenda-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="fotos-fazenda-title" className="text-xl font-heading font-semibold">Fotos da Fazenda</h2>
        <span className="text-sm text-muted-foreground">{photos.length} fotos</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((item, index) => (
          <figure key={item.url} className="min-w-0 space-y-2">
            <Button
              variant="ghost"
              className="block h-auto w-full overflow-hidden rounded-md p-0"
              aria-label={`Ampliar foto: ${item.title}`}
              onClick={() => setSelected(index)}
            >
              <img src={item.url} alt={item.title} loading="lazy" className="aspect-video w-full object-cover" />
            </Button>
            <figcaption className="text-sm text-muted-foreground">{item.title}</figcaption>
          </figure>
        ))}
      </div>
      <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-5xl gap-3 rounded-lg p-4"
          onKeyDown={event => {
            if (event.key === 'ArrowLeft') navigate(-1);
            if (event.key === 'ArrowRight') navigate(1);
          }}
        >
          <DialogTitle className="pr-8">{photo?.title}</DialogTitle>
          <DialogDescription className="sr-only">Fotos da Fazenda Miraí</DialogDescription>
          {photo && <img src={photo.url} alt={photo.title} className="max-h-[70vh] w-full object-contain" />}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" aria-label="Foto anterior" title="Foto anterior" onClick={() => navigate(-1)}><ChevronLeft /></Button>
            <span className="text-sm text-muted-foreground">{selected === null ? 0 : selected + 1} / {photos.length}</span>
            <Button variant="outline" size="icon" aria-label="Próxima foto" title="Próxima foto" onClick={() => navigate(1)}><ChevronRight /></Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}