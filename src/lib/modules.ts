import { Baby, BriefcaseBusiness, CalendarDays, ClipboardList, Droplets, HeartPulse, Map, Milk, Package, Search, Settings, ShieldCheck, Sprout, Stethoscope, Syringe, Users, Wallet, Wheat, Wrench, Camera, Scale, Layers, FileChartColumn, ShoppingBag, UtensilsCrossed, type LucideIcon } from 'lucide-react';

export interface FarmModule {
  id: string;
  title: string;
  icon: LucideIcon;
  items: { title: string; url: string; icon: LucideIcon }[];
}

export const farmModules: FarmModule[] = [
  { id: 'rebanho', title: 'Rebanho', icon: Users, items: [
    { title: 'Animais', url: '/animais', icon: Users },
    { title: 'Lotes & Piquetes', url: '/lotes', icon: Layers },
    { title: 'Pesagens', url: '/pesagens', icon: Scale },
    { title: 'Mapa da Fazenda', url: '/mapa', icon: Map },
    { title: 'Identificar por Foto', url: '/identificar', icon: Camera },
  ] },
  { id: 'reproducao', title: 'Reprodução', icon: HeartPulse, items: [
    { title: 'Coberturas', url: '/reproducao/coberturas', icon: HeartPulse },
    { title: 'Diagnósticos', url: '/reproducao/diagnosticos', icon: Search },
    { title: 'Secagens', url: '/reproducao/secagens', icon: Droplets },
    { title: 'Partos', url: '/reproducao/partos', icon: Baby },
    { title: 'Protocolos IATF', url: '/protocolos-iatf', icon: CalendarDays },
    { title: 'Relatório', url: '/reproducao/relatorio', icon: FileChartColumn },
  ] },
  { id: 'producao', title: 'Produção', icon: Milk, items: [
    { title: 'Ordenha Diária', url: '/producao-leite', icon: Milk },
    { title: 'Cooperativa', url: '/cooperativa', icon: BriefcaseBusiness },
  ] },
  { id: 'saude', title: 'Saúde', icon: Stethoscope, items: [
    { title: 'Enfermaria', url: '/enfermaria', icon: Stethoscope },
    { title: 'Vacinação', url: '/vacinacao', icon: Syringe },
    { title: 'Calendário Vacinas', url: '/calendario-vacinas', icon: CalendarDays },
    { title: 'Tratamentos', url: '/tratamentos', icon: ShieldCheck },
  ] },
  { id: 'nutricao', title: 'Nutrição', icon: Sprout, items: [
    { title: 'Dietas & Nutrição', url: '/nutricao', icon: UtensilsCrossed },
    { title: 'Plantio & Silo', url: '/plantio-silo', icon: Wheat },
    { title: 'Estoque', url: '/estoque', icon: Package },
  ] },
  { id: 'comercial', title: 'Comercial', icon: Wallet, items: [
    { title: 'Financeiro', url: '/financeiro', icon: Wallet },
    { title: 'Silo/Esterco/Leite', url: '/vendas-avulsas', icon: ShoppingBag },
    { title: 'Gestão de Sócios', url: '/gestao-socios', icon: Users },
  ] },
  { id: 'estrutura', title: 'Estrutura', icon: Wrench, items: [
    { title: 'Equipamentos', url: '/equipamentos', icon: Wrench },
  ] },
  { id: 'gestao', title: 'Gestão', icon: Settings, items: [
    { title: 'Pessoal & Tarefas', url: '/tarefas', icon: ClipboardList },
    { title: 'Usuários', url: '/usuarios', icon: Users },
    { title: 'Pendências da Importação', url: '/pendencias-importacao', icon: ClipboardList },
    { title: 'Configurações', url: '/configuracoes', icon: Settings },
  ] },
];

export function moduleForPath(path: string) {
  return farmModules.find(module => path === `/modulos/${module.id}` || module.items.some(item => path === item.url || path.startsWith(`${item.url}/`)));
}