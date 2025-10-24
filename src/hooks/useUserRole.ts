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
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return 'user' as AppRole; // Default to 'user' if no role found
      }

      return data?.role as AppRole;
    },
    enabled: !!user?.id,
  });

  return {
    role: userRole || 'user',
    isAdmin: userRole === 'admin',
    isLoading,
  };
}
