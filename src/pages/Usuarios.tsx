import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

const roleLabels: Record<string, string> = {
  administrador: 'Administrador',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
};

const roleColors: Record<string, string> = {
  administrador: 'bg-destructive/10 text-destructive',
  gestor: 'bg-secondary/10 text-secondary',
  colaborador: 'bg-primary/10 text-primary',
};

export default function UsuariosPage() {
  const qc = useQueryClient();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from('profiles').select('*').order('nome');
      if (error) throw error;
      const { data: roles } = await supabase.from('user_roles').select('*');
      return profiles.map(p => ({
        ...p,
        role: roles?.find(r => r.user_id === p.id)?.role || 'colaborador',
        role_id: roles?.find(r => r.user_id === p.id)?.id,
      }));
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const existing = usuarios?.find(u => u.id === userId);
      if (existing?.role_id) {
        const { error } = await supabase.from('user_roles').update({ role: role as any }).eq('id', existing.role_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: role as any });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Papel atualizado!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ userId, ativo }: { userId: string; ativo: boolean }) => {
      const { error } = await supabase.from('profiles').update({ ativo }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Status atualizado!'); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Usuários</h1>
        <p className="text-muted-foreground">Gerenciar colaboradores e permissões</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : usuarios?.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome || '—'}</TableCell>
                  <TableCell>{u.email || '—'}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => updateRole.mutate({ userId: u.id, role: v })}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrador">Administrador</SelectItem>
                        <SelectItem value="gestor">Gestor</SelectItem>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Switch checked={u.ativo} onCheckedChange={(v) => toggleAtivo.mutate({ userId: u.id, ativo: v })} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
