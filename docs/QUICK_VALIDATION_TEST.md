# Quick Validation Test - Sprint 1

## Objetivo
Validar performance básica do sistema com 1.000 empresas antes de adicionar novas features.

## Scripts Criados

### 1. `stress:generate` - Gerador de Dados
**Arquivo:** `tests/stress/generate-test-data.ts`

**O que faz:**
- Limpa dados de teste antigos
- Gera 1.000 empresas de teste
- Distribui por setores, estados e cidades
- CNPJs válidos (formato correto)
- Processa em batches de 50 (não sobrecarrega DB)

**Como rodar:**
```bash
npm run stress:generate
```

**Saída esperada:**
```
🚀 Iniciando geração de dados de teste...
📊 Total: 1000 empresas
📦 Batches: 20 (50 por batch)

🧹 Limpando dados de teste antigos...
✓ Dados antigos removidos

✓ Batch 0-50 criado
✓ Batch 50-100 criado
...
✓ Batch 950-1000 criado

✅ Geração concluída!
⏱️  Tempo total: 45.2s
📈 Taxa: 22 empresas/s
```

### 2. `stress:benchmark` - Benchmark de Performance
**Arquivo:** `tests/stress/performance-benchmark.ts`

**O que testa:**
- ✅ Paginação (página 1, meio, última)
- ✅ Busca (nome, CNPJ, combinada)
- ✅ Ordenação (nome, data, revenue)
- ✅ Filtros (indústria, estado, múltiplos)
- ✅ Agregações (count, group by)

**Como rodar:**
```bash
npm run stress:benchmark
```

**Saída esperada:**
```
📊 RELATÓRIO DE PERFORMANCE

✅ Operações bem-sucedidas: 15
❌ Operações com falha: 0

⏱️  Tempos de Resposta:
   Média: 180ms
   Mínimo: 95ms
   Máximo: 350ms

🐌 Top 5 Operações Mais Lentas:
   1. Múltiplos filtros: 350ms
   2. Busca combinada (OR): 280ms
   3. Última página: 245ms
   ...

📏 Análise de Performance:
   🟢 Rápidas (<200ms): 12
   🟡 Médias (200-500ms): 3
   🔴 Lentas (>500ms): 0

✅ Recomendações:
   🎉 Performance excelente! Sistema está otimizado.
```

### 3. `stress:full` - Teste Completo
Roda geração + benchmark em sequência:
```bash
npm run stress:full
```

## Benchmarks de Referência

### 🟢 Excelente (< 200ms)
- Paginação simples
- Buscas com índices
- Ordenação básica

### 🟡 Aceitável (200-500ms)
- Buscas complexas (OR, LIKE múltiplos)
- Filtros em JSON (location->>'state')
- Agregações simples

### 🔴 Atenção (> 500ms)
- Queries sem índices
- Muitos JOINs
- Scans completos de tabela

## Critérios de Sucesso

### ✅ Sistema Aprovado se:
1. **Performance**: Média < 300ms
2. **Estabilidade**: 0 erros em operações básicas
3. **Escalabilidade**: Paginação funciona até última página
4. **UX**: Todas as operações < 1s

### ⚠️ Atenção Necessária se:
1. Qualquer operação > 1s
2. Erros em paginação/busca
3. Degradação em páginas finais
4. Timeout em agregações

## Próximos Passos Após Validação

### Se Aprovado ✅
→ **Sprint 2**: Kanban + Bitrix24
- Sistema está sólido para adicionar features
- Base de performance confirmada

### Se Problemas Detectados ⚠️
→ **Otimizações Críticas**:
1. Adicionar índices necessários
2. Otimizar queries problemáticas
3. Implementar cache se necessário
4. Re-testar antes de prosseguir

## Comandos Rápidos

```bash
# Teste completo (recomendado)
npm run stress:full

# Ou separado
npm run stress:generate  # Gerar dados
npm run stress:benchmark # Testar performance

# Limpar dados de teste
# (rodar stress:generate novamente limpa automaticamente)
```

## Tempo Estimado
- **Geração de dados**: ~1 minuto
- **Benchmark**: ~30 segundos
- **Análise manual**: ~5 minutos
- **Total**: ~7 minutos

## O Que Observar

### Durante Geração
- Nenhum erro nos batches
- Taxa de inserção consistente
- Tempo total < 2 minutos

### Durante Benchmark
- Todas operações < 500ms
- 0 falhas
- Performance consistente (não degrada)

### Na Interface
1. Abrir `/companies`
2. Testar paginação (navegar páginas)
3. Testar busca (nome e CNPJ)
4. Testar sorting (clicar colunas)
5. Verificar que tudo carrega < 1s

## Métricas de Referência

Com 1.000 empresas, esperamos:
- **Página 1**: ~100-150ms
- **Busca simples**: ~150-200ms
- **Ordenação**: ~100-180ms
- **Filtros**: ~200-300ms
- **Count total**: ~50-100ms

Se estiver dentro desses valores, sistema está **excelente** para produção! 🚀
