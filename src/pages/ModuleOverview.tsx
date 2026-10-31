import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, LayoutGrid } from 'lucide-react';
import { farmModules } from '@/lib/modules';
import { Button } from '@/components/ui/button';
import { ReproducaoKPIs } from '@/components/ReproducaoKPIs';

export default function ModuleOverview() {
  const { moduleId } = useParams();
  const module = farmModules.find(item => item.id === moduleId);

  if (moduleId && !module) return (
    <section className="space-y-4"><h1 className="text-2xl font-bold">Módulo não encontrado</h1><Button asChild variant="outline"><Link to="/modulos">Ver módulos</Link></Button></section>
  );

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Fazenda Miraí / {module ? 'Módulos' : 'Gestão da fazenda'}</p>
          <h1 className="text-3xl font-heading font-bold md:text-4xl">{module?.title || 'Todos os módulos'}</h1>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full tone-icon">{module ? <module.icon className="h-6 w-6" /> : <LayoutGrid className="h-6 w-6" />}</div>
      </header>
      {module?.id === 'reproducao' && <ReproducaoKPIs />}
      {module ? (
        <section className="grid gap-x-8 md:grid-cols-2" aria-label={`Submódulos de ${module.title}`}>
          {module.items.map((item, index) => (
            <Button asChild variant="ghost" key={item.url} className="group h-auto justify-start gap-4 rounded-none border-b px-1 py-6 text-left hover:bg-muted/60">
              <Link to={item.url}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg tone-icon"><item.icon className="!h-5 !w-5" /></span>
                <span className="flex min-w-0 flex-1 flex-col gap-1"><span className="text-xs font-normal text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><span className="whitespace-normal text-lg font-semibold">{item.title}</span></span>
                <ArrowUpRight className="!h-5 !w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Todos os módulos">
          {farmModules.map(item => (
            <Button asChild variant="outline" key={item.id} style={{ ["--tone" as string]: `var(--tone-${item.id})` }} className="group h-auto border-t-4 justify-start whitespace-normal bg-card [border-top-color:hsl(var(--tone))] p-5 text-left hover:bg-muted">
              <Link to={`/modulos/${item.id}`} className="flex flex-col !items-start gap-5">
                <span className="flex w-full items-center justify-between"><span className="tone-icon flex h-11 w-11 items-center justify-center rounded-lg"><item.icon className="!h-6 !w-6" /></span><ArrowUpRight className="text-muted-foreground" /></span>
                <span><span className="block text-lg font-semibold">{item.title}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{item.items.length} {item.items.length === 1 ? 'área' : 'áreas'}</span></span>
              </Link>
            </Button>
          ))}
        </section>
      )}
      {module && <Button asChild variant="link" className="px-0"><Link to="/modulos">Todos os módulos <ArrowRight /></Link></Button>}
    </div>
  );
}