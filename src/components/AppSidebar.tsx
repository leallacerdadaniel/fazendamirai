import {
  Bug, BarChart3, Milk, DollarSign, Syringe, HeartPulse,
  Wheat, Package, Wrench, ClipboardList, Users, Settings,
  Baby, Scale, Layers, Map, Calendar, ShoppingBag, UtensilsCrossed,
  Activity, Stethoscope, Store, TrendingUp, Truck,
  Search, Droplets, CalendarCheck, FileBarChart,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
      { title: 'Tarefas', url: '/tarefas', icon: ClipboardList },
    ],
  },
  {
    label: 'Rebanho',
    items: [
      { title: 'Animais', url: '/animais', icon: Bug },
      { title: 'Lotes & Piquetes', url: '/lotes', icon: Layers },
      { title: 'Mapa da Fazenda', url: '/mapa', icon: Map },
      { title: 'Pesagens', url: '/pesagens', icon: Scale },
    ],
  },
  {
    label: 'Reprodução',
    items: [
      { title: 'Coberturas', url: '/reproducao/coberturas', icon: HeartPulse },
      { title: 'Diagnósticos', url: '/reproducao/diagnosticos', icon: Search },
      { title: 'Secagens', url: '/reproducao/secagens', icon: Droplets },
      { title: 'Partos', url: '/reproducao/partos', icon: Baby },
      { title: 'Protocolos IATF', url: '/protocolos-iatf', icon: CalendarCheck },
      { title: 'Relatório', url: '/reproducao/relatorio', icon: FileBarChart },
    ],
  },
  {
    label: 'Produção de Leite',
    items: [
      { title: 'Ordenha Diária', url: '/producao-leite', icon: Milk },
      { title: 'Cooperativa', url: '/cooperativa', icon: Store },
    ],
  },
  {
    label: 'Saúde Animal',
    items: [
      { title: 'Enfermaria', url: '/enfermaria', icon: Stethoscope },
      { title: 'Vacinação', url: '/vacinacao', icon: Syringe },
      { title: 'Calendário Vacinas', url: '/calendario-vacinas', icon: Calendar },
      { title: 'Tratamentos', url: '/tratamentos', icon: HeartPulse },
    ],
  },
  {
    label: 'Nutrição & Insumos',
    items: [
      { title: 'Dietas & Nutrição', url: '/nutricao', icon: UtensilsCrossed },
      { title: 'Plantio & Silo', url: '/plantio-silo', icon: Wheat },
      { title: 'Estoque', url: '/estoque', icon: Package },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
      { title: 'Silo/Esterco/Leite', url: '/vendas-avulsas', icon: ShoppingBag },
      { title: 'Gestão de Sócios', url: '/gestao-socios', icon: Users },
    ],
  },
  {
    label: 'Infraestrutura',
    items: [
      { title: 'Equipamentos', url: '/equipamentos', icon: Wrench },
    ],
  },
  {
    label: 'Administração',
    items: [
      { title: 'Usuários', url: '/usuarios', icon: Users },
      { title: 'Configurações', url: '/configuracoes', icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <Logo size="sm" />
        {!collapsed && (
          <span className="font-heading font-bold text-sidebar-foreground text-sm">
            Fazenda Miraí
          </span>
        )}
      </div>
      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url || location.pathname.startsWith(item.url + '/')}
                    >
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
