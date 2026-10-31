import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Bug, FileText, MoreHorizontal } from 'lucide-react';

const navItems = [
  { label: 'Início', icon: Home, path: '/mobile' },
  { label: 'Tarefas', icon: ClipboardList, path: '/mobile/tarefas' },
  { label: 'Rebanho', icon: Bug, path: '/mobile/rebanho' },
  { label: 'Registros', icon: FileText, path: '/mobile/registros' },
  { label: 'Mais', icon: MoreHorizontal, path: '/mobile/mais' },
];

export function MobileLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t safe-area-bottom z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[56px] rounded-lg transition-colors ${
                  active ? 'text-secondary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
