import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Info, Milk, DollarSign, Baby } from 'lucide-react';

export default function MobileMais() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const items = [
    { label: 'Reprodução', icon: Baby, action: () => navigate('/reproducao') },
    { label: 'Cooperativa', icon: Milk, action: () => navigate('/cooperativa') },
    { label: 'Financeiro', icon: DollarSign, action: () => navigate('/financeiro') },
  ];

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-heading font-bold">Mais</h1>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">{profile?.nome || 'Usuário'}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.label} className="active:scale-[0.98] transition-transform">
            <CardContent className="p-0">
              <button onClick={item.action} className="w-full flex items-center gap-4 p-4 min-h-[56px]">
                <item.icon className="h-5 w-5 text-secondary" />
                <span className="text-base font-medium">{item.label}</span>
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-destructive/20">
        <CardContent className="p-0">
          <button onClick={signOut} className="w-full flex items-center gap-4 p-4 text-destructive">
            <LogOut className="h-5 w-5" />
            <span className="text-base font-medium">Sair</span>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
