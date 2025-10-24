# 🚀 PLANO DE OTIMIZAÇÃO IMEDIATA
**Prioridade:** ALTA | **Duração Estimada:** 4-6 horas

---

## 🎯 OBJETIVOS

1. Remover 172 console.logs de produção
2. Implementar sistema de logging profissional
3. Adicionar cache global para queries frequentes
4. Otimizar componentes pesados

---

## ✅ FASE 1: SISTEMA DE LOGGING (1h)

### Arquivo: `src/lib/utils/logger.ts`
**Já existe**, mas precisa ser usado consistentemente.

### Estratégia:
```typescript
// Criar wrapper para ambientes
const logger = {
  debug: (context: string, msg: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[${context}] ${msg}`, data);
    }
  },
  error: (context: string, msg: string, error?: any) => {
    console.error(`[${context}] ${msg}`, error);
    // TODO: Enviar para Sentry em produção
  },
  warn: (context: string, msg: string, data?: any) => {
    console.warn(`[${context}] ${msg}`, data);
  }
};
```

### Substituições Necessárias:
```typescript
// ❌ Antes
console.log('Geocodificando:', searchText);

// ✅ Depois  
logger.debug('LocationMap', 'Geocodificando endereço', { searchText });
```

---

## ✅ FASE 2: CACHE GLOBAL (2-3h)

### Criar: `src/lib/cache/queryCache.ts`
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

// Cache específico para dados que mudam raramente
export const STATIC_CACHE_TIME = 30 * 60 * 1000; // 30 minutos
export const DYNAMIC_CACHE_TIME = 2 * 60 * 1000; // 2 minutos
```

### Aplicar em Hooks:
```typescript
// src/hooks/useCompanies.ts
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: DYNAMIC_CACHE_TIME,
    cacheTime: STATIC_CACHE_TIME,
  });
}
```

---

## ✅ FASE 3: OTIMIZAR QUERIES DO DASHBOARD (1-2h)

### Problema Identificado:
O `useDashboardExecutive` faz múltiplas queries em série.

### Solução:
Criar uma **view materializada** no Supabase ou usar `.rpc()` com função agregadora.

```sql
-- Criar função agregadora no Supabase
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalCompanies', (SELECT COUNT(*) FROM companies),
    'totalDecisors', (SELECT COUNT(*) FROM decision_makers),
    'totalConversations', (SELECT COUNT(*) FROM conversations),
    'pipelineValue', (SELECT COALESCE(SUM(annual_value), 0) FROM account_strategies)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Usar no Hook:
```typescript
const { data } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: async () => {
    const { data } = await supabase.rpc('get_dashboard_stats');
    return data;
  },
  staleTime: 60000, // 1 minuto
});
```

---

## ✅ FASE 4: LAZY LOADING AGRESSIVO (1h)

### Componentes Pesados para Lazy Load:
```typescript
// src/App.tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CompaniesMap = lazy(() => import('./components/map/CompaniesMap'));
const Intelligence360 = lazy(() => import('./pages/Intelligence360Page'));
const CanvasPage = lazy(() => import('./pages/CanvasPage'));
```

### Adicionar Suspense Boundaries:
```tsx
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Suspense>
```

---

## ✅ FASE 5: OTIMIZAR IMAGENS E ASSETS (30min)

### Adicionar ao `vite.config.ts`:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'charts': ['recharts'],
          'maps': ['mapbox-gl'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
```

---

## 📊 MÉTRICAS DE SUCESSO

### Antes:
- ❌ 172 console.logs
- ❌ Cache hit rate: ~30%
- ❌ Dashboard load: ~2.5s
- ❌ Initial bundle: ~800kb

### Depois (Target):
- ✅ 0 console.logs em produção
- ✅ Cache hit rate: >70%
- ✅ Dashboard load: <1.8s
- ✅ Initial bundle: <500kb

---

## 🎯 CHECKLIST DE EXECUÇÃO

- [ ] Criar sistema de logging centralizado
- [ ] Substituir 172 console.logs
- [ ] Implementar cache global
- [ ] Criar função SQL agregadora para dashboard
- [ ] Adicionar lazy loading em 10+ componentes
- [ ] Configurar code splitting no Vite
- [ ] Testar performance antes/depois
- [ ] Atualizar documentação

---

## 🚨 NOTAS IMPORTANTES

1. **NÃO REMOVER** console.error - apenas refatorar
2. **MANTER** logs de debug em desenvolvimento
3. **TESTAR** cada mudança incrementalmente
4. **DOCUMENTAR** mudanças significativas

---

**Próximo Passo:** Você quer que eu execute este plano agora ou prefere validar o upload CSV primeiro?
