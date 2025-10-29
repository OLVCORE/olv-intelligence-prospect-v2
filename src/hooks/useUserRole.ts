import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'moderator' | 'user';

export function useUserRole() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: roles, isLoading } = useQuery({
    queryKey: ['user-roles', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      return data?.map(r => r.role as UserRole) || [];
    },
    enabled: !!session?.user?.id,
  });

  const isAdmin = roles?.includes('admin') || false;
  const isModerator = roles?.includes('moderator') || false;
  
  return {
    roles: roles || [],
    isAdmin,
    isModerator,
    isLoading,
    userId: session?.user?.id,
  };
}
