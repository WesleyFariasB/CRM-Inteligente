import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  ContactRound,
  Gauge,
  UsersRound,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}
export const navItems: NavItem[] = [
  { href: '/app/dashboard', label: 'Visão geral', icon: Gauge },
  { href: '/app/leads', label: 'Leads', icon: UsersRound },
  { href: '/app/companies', label: 'Empresas', icon: Building2 },
  { href: '/app/contacts', label: 'Contatos', icon: ContactRound },
  { href: '/app/opportunities', label: 'Pipeline', icon: BriefcaseBusiness },
  { href: '/app/tasks', label: 'Tarefas', icon: CheckSquare },
  { href: '/app/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/app/automations', label: 'Automações', icon: WandSparkles },
];
