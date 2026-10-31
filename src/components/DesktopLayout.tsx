import { ReactNode, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '@/hooks/useAuth';
import { ChevronDown, Home, LayoutGrid, LogOut, ClipboardList, Milk, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificacoesBell } from './NotificacoesBell';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { farmModules, moduleForPath } from '@/lib/modules';
import { cn } from '@/lib/utils';

export function DesktopLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { pathname } = useLocation();
  const activeModule = moduleForPath(pathname);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [pathname]);

  return (
    <div className="farm-shell min-h-dvh min-w-0 bg-background" style={{ ['--tone' as string]: `var(--tone-${activeModule?.id ?? 'inicio'})` }}>
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="tone-strip" aria-hidden />
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 md:px-8">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5" aria-label="Fazenda Miraí — início">
            <Logo size="md" />
            <span className="flex flex-col"><span className="text-lg font-heading font-bold leading-tight">Fazenda Miraí<span className="text-secondary">.</span></span><span className="text-[10px] font-semibold uppercase text-muted-foreground">Gestão agropecuária</span></span>
          </Link>
          <div className="flex items-center gap-1 md:gap-3">
            <Button asChild variant="ghost" className="hidden text-muted-foreground md:inline-flex"><Link to="/tarefas"><ClipboardList />Tarefas</Link></Button>
            <NotificacoesBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-1.5 md:px-2" aria-label="Menu da conta">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{profile?.nome?.charAt(0)?.toUpperCase() || 'U'}</span>
                  <span className="hidden max-w-36 truncate text-sm md:block">{profile?.nome?.split(' ')[0] || 'Minha conta'}</span>
                  <ChevronDown className="hidden text-muted-foreground md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{profile?.nome || 'Minha conta'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/configuracoes" className="gap-2"><Settings className="h-4 w-4" />Configurações</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={() => void signOut()} className="gap-2 text-destructive"><LogOut className="h-4 w-4" />Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <nav ref={navRef} aria-label="Módulos da fazenda" className="module-nav mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-4 md:px-8">
          <Button asChild variant="ghost" style={{ ['--tone' as string]: 'var(--tone-inicio)' }} className={cn('module-link h-14 shrink-0 rounded-none border-b-2 px-3 text-muted-foreground', pathname === '/dashboard' ? 'text-foreground' : 'border-transparent')}><Link to="/dashboard" aria-current={pathname === '/dashboard' ? 'page' : undefined}><Home />Início</Link></Button>
          {farmModules.map(module => (
            <Button asChild variant="ghost" key={module.id} style={{ ['--tone' as string]: `var(--tone-${module.id})` }} className={cn('module-link h-14 shrink-0 rounded-none border-b-2 px-3 text-muted-foreground', activeModule?.id === module.id ? 'text-foreground' : 'border-transparent')}>
              <Link to={`/modulos/${module.id}`} aria-current={activeModule?.id === module.id ? 'page' : undefined}><module.icon />{module.title}</Link>
            </Button>
          ))}
          <Button asChild variant="ghost" className="hidden h-10 shrink-0 text-muted-foreground xl:inline-flex" aria-label="Todos os módulos"><Link to="/modulos"><LayoutGrid /></Link></Button>
        </nav>
        {activeModule && pathname !== `/modulos/${activeModule.id}` && (
          <nav aria-label={`Submódulos de ${activeModule.title}`} className="module-nav border-t bg-background">
            <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 py-2 md:px-8">
              <Button asChild variant="ghost" className="h-10 shrink-0 text-muted-foreground"><Link to={`/modulos/${activeModule.id}`} aria-label={`Visão geral de ${activeModule.title}`}><LayoutGrid /></Link></Button>
              {activeModule.items.map(item => {
                const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
                return <Button asChild key={item.url} variant="ghost" className={cn('sub-pill h-10 shrink-0 rounded-full px-4 text-xs', !active && 'text-muted-foreground')}><Link to={item.url} aria-current={active ? 'page' : undefined}>{item.title}</Link></Button>;
              })}
            </div>
          </nav>
        )}
      </header>
      <main className="farm-content mx-auto min-w-0 max-w-[1440px] px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-12">{children}</main>
      <nav aria-label="Navegação rápida" className="mobile-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-card md:hidden">
        <div className="grid h-16 grid-cols-4">
          {[
            { title: 'Início', url: '/dashboard', icon: Home, active: pathname === '/dashboard' },
            { title: 'Módulos', url: '/modulos', icon: LayoutGrid, active: pathname.startsWith('/modulos') },
            { title: 'Tarefas', url: '/tarefas', icon: ClipboardList, active: pathname === '/tarefas' },
            { title: 'Ordenha', url: '/producao-leite', icon: Milk, active: pathname === '/producao-leite' },
          ].map(item => <Button asChild key={item.url} variant="ghost" className={cn('h-full flex-col gap-1 rounded-none text-[10px]', item.active ? 'text-primary bg-secondary/10' : 'text-muted-foreground')}><Link to={item.url} aria-current={item.active ? 'page' : undefined}><item.icon className="!h-5 !w-5" />{item.title}</Link></Button>)}
        </div>
      </nav>
    </div>
  );
}
