import {
  FolderKanban,
  LayoutDashboard,
  Mail,
} from "lucide-react";

export const navigationItems = [
  {
    title: "Visão geral",
    href: "/dashboard",
    icon: LayoutDashboard,
    disabled: false,
  },
  {
    title: "Projetos",
    href: "/projects",
    icon: FolderKanban,
    disabled: false,
  },
  {
    title: "Contato",
    href: "/contact",
    icon: Mail,
    disabled: false,
  },
];
