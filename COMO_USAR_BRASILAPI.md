# 🚀 COMO USAR A BRASILAPI NO STRATEVO V2

## 📦 O QUE FOI CRIADO

### ✅ **3 Arquivos Principais:**

1. **`src/services/brasilapi.ts`** - Cliente direto da BrasilAPI
2. **`src/services/cnpj-service.ts`** - Serviço unificado (prioriza BrasilAPI, fallback ReceitaWS)
3. **`test-brasilapi-integracao.ts`** - Testes completos

---

## 🎯 USO SIMPLES

### **Opção 1: Serviço Unificado (RECOMENDADO)**

```typescript
import { cnpjService } from './src/services/cnpj-service';

// Consultar CNPJ (automático: tenta BrasilAPI, se falhar usa ReceitaWS)
const dados = await cnpjService.consultar('27865757000102');

console.log(dados.razao_social);     // GLOBO COMUNICACAO...
console.log(dados.fonte);             // 'brasilapi' ou 'receitaws'
console.log(dados.campos_disponiveis); // 48 ou 32
console.log(dados.capital_social);    // 6983568400
console.log(dados.opcao_simples);     // false
console.log(dados.socios.length);     // 5
```

### **Opção 2: BrasilAPI Direta (Máximo de Campos)**

```typescript
import { brasilAPI } from './src/services/brasilapi';

// Consulta completa (48 campos)
const dados = await brasilAPI.consultarCNPJ('27865757000102');

console.log(dados.razao_social);      // Nome completo
console.log(dados.capital_social);    // Número
console.log(dados.qsa);               // Array de sócios
console.log(dados.opcao_pelo_simples); // boolean
console.log(dados.ddd_telefone_1);    // Telefone
```

---

## 📊 TODOS OS 48 CAMPOS DA BRASILAPI

### 🏢 **Identificação (8 campos)**
```typescript
dados.cnpj                     // "27865757000102"
dados.razao_social             // "GLOBO COMUNICACAO..."
dados.nome_fantasia            // "TV/REDE/GLOBO..."
dados.codigo_natureza_juridica // 2062
dados.natureza_juridica        // "Sociedade Anônima Fechada"
dados.data_inicio_atividade    // "1986-01-31"
dados.pais                     // null (se no Brasil)
dados.nome_cidade_exterior     // null (se no Brasil)
```

### 📍 **Endereço Completo (10 campos)**
```typescript
dados.descricao_tipo_de_logradouro // "RUA"
dados.logradouro               // "LOPES QUINTAS"
dados.numero                   // "303"
dados.complemento              // ""
dados.bairro                   // "JARDIM BOTANICO"
dados.cep                      // "22460901"
dados.uf                       // "RJ"
dados.codigo_municipio         // 3304557
dados.municipio                // "RIO DE JANEIRO"
```

### 📞 **Contatos (4 campos)**
```typescript
dados.ddd_telefone_1           // "2121554551"
dados.ddd_telefone_2           // ""
dados.ddd_fax                  // ""
dados.email                    // null ou "email@empresa.com"
```

### 💼 **Atividades Econômicas (3 campos)**
```typescript
dados.cnae_fiscal              // 6010100
dados.cnae_fiscal_descricao    // "Atividades de televisão aberta"
dados.cnaes_secundarios        // Array de objetos {codigo, descricao}
```

### 📊 **Situação Cadastral (6 campos)**
```typescript
dados.situacao_cadastral       // "2" (ativa)
dados.data_situacao_cadastral  // "2005-11-03"
dados.descricao_situacao_cadastral // "Ativa"
dados.motivo_situacao_cadastral    // ""
dados.situacao_especial        // null
dados.data_situacao_especial   // null
```

### 💰 **Dados Financeiros (7 campos)**
```typescript
dados.capital_social           // 6983568400.00
dados.porte                    // "DEMAIS" (grande porte)
dados.qualificacao_do_responsavel // "10"
dados.opcao_pelo_simples       // false
dados.data_opcao_pelo_simples  // null
dados.data_exclusao_do_simples // null
dados.opcao_pelo_mei           // false
```

### 👥 **Quadro Societário - QSA (Array completo)**
```typescript
dados.qsa                      // Array de sócios
// Cada sócio contém:
{
  identificador_de_socio: 2,
  nome_socio: "JOÃO DA SILVA",
  cnpj_cpf_do_socio: "12345678900",
  codigo_qualificacao_socio: 49,
  percentual_capital_social: 50,
  data_entrada_sociedade: "2020-01-01",
  cpf_representante_legal: null,
  nome_representante_legal: null,
  codigo_qualificacao_representante_legal: null
}
```

---

## 🛠️ FUNÇÕES ÚTEIS

### ✅ **Validar CNPJ**
```typescript
const valido = cnpjService.validarCNPJ('27.865.757/0001-02');
// true ou false (valida dígitos verificadores)
```

### ✅ **Formatar CNPJ**
```typescript
const formatado = cnpjService.formatarCNPJ('27865757000102');
// "27.865.757/0001-02"
```

### ✅ **Dados Essenciais (Para Stratevo)**
```typescript
const essenciais = await brasilAPI.getDadosEssenciais('27865757000102');

// Retorna objeto otimizado:
{
  cnpj, razao_social, nome_fantasia,
  porte, natureza_juridica, atividade_principal,
  cidade, estado, endereco_completo,
  telefone, telefone_2, email,
  capital_social, opcao_simples, opcao_mei,
  situacao, data_abertura,
  total_socios, socios_principais (top 3)
}
```

### ✅ **Formato Compatível com ReceitaWS**
```typescript
const simplificado = await brasilAPI.consultarCNPJSimplificado('27865757000102');
// Retorna no mesmo formato do ReceitaWS para compatibilidade
```

---

## 🎯 CASOS DE USO NO STRATEVO

### **1. Enriquecimento de Leads**
```typescript
async function enriquecerLead(cnpj: string) {
  const dados = await cnpjService.consultar(cnpj);
  
  return {
    empresa: dados.razao_social,
    fantasia: dados.nome_fantasia,
    porte: dados.porte,
    cidade: dados.cidade,
    estado: dados.estado,
    capital: dados.capital_social,
    total_socios: dados.socios?.length || 0,
    simples: dados.opcao_simples,
    mei: dados.opcao_mei,
    situacao: dados.situacao,
    fonte_dados: dados.fonte // 'brasilapi' ou 'receitaws'
  };
}
```

### **2. Análise de Fit TOTVS**
```typescript
async function analisarFitTOTVS(cnpj: string) {
  const dados = await brasilAPI.getDadosEssenciais(cnpj);
  
  // Critérios de fit
  const fitScore = {
    porte: dados.porte === 'DEMAIS' ? 100 : dados.porte === 'MÉDIA' ? 70 : 40,
    capital: dados.capital_social > 10000000 ? 100 : 50,
    complexidade: dados.total_socios > 3 ? 80 : 50
  };
  
  return {
    empresa: dados.razao_social,
    score: Math.round((fitScore.porte + fitScore.capital + fitScore.complexidade) / 3),
    recomendacao: fitScore.porte > 70 ? 'Alta prioridade' : 'Média prioridade'
  };
}
```

### **3. Busca de Decisores**
```typescript
async function buscarDecisores(cnpj: string) {
  const dados = await brasilAPI.consultarCNPJ(cnpj);
  
  // Lista de sócios (potenciais decisores)
  const decisores = dados.qsa.map(socio => ({
    nome: socio.nome_socio,
    cpf: socio.cnpj_cpf_do_socio,
    participacao: socio.percentual_capital_social,
    cargo: `Sócio (Código ${socio.codigo_qualificacao_socio})`
  }));
  
  return {
    empresa: dados.razao_social,
    total_decisores: decisores.length,
    decisores: decisores
  };
}
```

### **4. Validação de Prospects**
```typescript
async function validarProspect(cnpj: string) {
  // Validar formato
  if (!cnpjService.validarCNPJ(cnpj)) {
    return { valido: false, motivo: 'CNPJ inválido' };
  }
  
  try {
    const dados = await cnpjService.consultar(cnpj);
    
    // Verificar se está ativa
    if (dados.situacao.toLowerCase().includes('inapta') || 
        dados.situacao.toLowerCase().includes('baixada')) {
      return { valido: false, motivo: 'Empresa inativa' };
    }
    
    // Verificar porte mínimo
    if (dados.porte === 'ME' || dados.porte === 'MICRO') {
      return { valido: false, motivo: 'Porte muito pequeno para TOTVS' };
    }
    
    return {
      valido: true,
      dados: {
        nome: dados.razao_social,
        porte: dados.porte,
        cidade: dados.cidade
      }
    };
  } catch (error) {
    return { valido: false, motivo: 'CNPJ não encontrado' };
  }
}
```

---

## 🔄 FALLBACK AUTOMÁTICO

O `cnpjService` implementa fallback automático:

```typescript
// Ordem de tentativa:
// 1️⃣ BrasilAPI (48 campos, grátis)
// 2️⃣ ReceitaWS (32 campos, grátis, fallback)
// 3️⃣ EmpresasAqui (quando disponível em 12h)

const dados = await cnpjService.consultar(cnpj);
// Se BrasilAPI falhar, automaticamente tenta ReceitaWS
// dados.fonte indica qual API respondeu
```

---

## 📦 PREPARADO PARA EMPRESASAQUI

Quando EmpresasAqui voltar (em 12h), o código já está preparado:

```typescript
// Em cnpj-service.ts, adicione antes do fallback ReceitaWS:

// Tentar EmpresasAqui
try {
  const dados = await this.consultarEmpresasAqui(cnpjLimpo);
  return this.normalizarEmpresasAqui(dados);
} catch (error) {
  console.warn('EmpresasAqui falhou, tentando ReceitaWS...', error);
}
```

---

## 🧪 TESTAR A INTEGRAÇÃO

```bash
npx tsx test-brasilapi-integracao.ts
```

**Resultado esperado:**
```
✅ Testes passaram: 4/4
🎉 BRASILAPI TOTALMENTE INTEGRADA E FUNCIONANDO!
```

---

## 📊 COMPARAÇÃO FINAL

| Fonte | Campos | Custo | API Key | Status |
|-------|--------|-------|---------|--------|
| **BrasilAPI** | **48** 🏆 | Grátis | ❌ Não | ✅ Online |
| ReceitaWS | 32 | Grátis | ❌ Não | ✅ Online |
| EmpresasAqui | ~35 | Pago | ✅ Sim | ⏳ 12h |

---

## 🎯 PRÓXIMOS PASSOS

1. **✅ FEITO:** Integração BrasilAPI completa
2. **✅ FEITO:** Serviço unificado com fallback
3. **✅ FEITO:** Validação e formatação
4. **✅ FEITO:** Testes automatizados
5. **⏳ AGUARDANDO:** EmpresasAqui (12 horas)
6. **🔜 TODO:** Integrar na interface do Stratevo
7. **🔜 TODO:** Usar no módulo de prospecção
8. **🔜 TODO:** Integrar com Apollo.io para decisores

---

## 🆘 SUPORTE

**Documentação oficial:** https://brasilapi.com.br/docs  
**GitHub:** https://github.com/BrasilAPI/BrasilAPI  
**Swagger:** https://brasilapi.com.br/docs#tag/CNPJ

---

**Criado em:** 03/11/2025  
**Status:** ✅ Produção-ready  
**Commit:** 7ee0cd7

