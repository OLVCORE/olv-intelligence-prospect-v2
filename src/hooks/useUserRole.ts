import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = 'admin' | 'user' | 'viewer';

export function useUserRole() {
  const { user } = useAuth();

  const { data: userRole, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching user role:', error);
        return 'user' as AppRole; // Default to 'user' if error
      }

      const roleRow = Array.isArray(data) ? data[0] : (data as any);
      return (roleRow?.role as AppRole) || 'user';
    },
    enabled: !!user?.id,
  });

  return {
    role: userRole || 'user',
    isAdmin: userRole === 'admin',
    isLoading,
  };
}
