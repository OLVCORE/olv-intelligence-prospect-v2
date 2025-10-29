# 🎯 Guia de Uso: DraggableDialog

## O que é?

O `DraggableDialog` é um componente wrapper que torna os diálogos do sistema **arrastáveis** pela tela. Isso permite que o usuário mova os pop-ups para qualquer posição e visualize conteúdo que estaria sobreposto.

## Como usar?

### 1. Importar o componente

```tsx
import { DraggableDialog } from '@/components/ui/draggable-dialog';
```

### 2. Substituir `<Dialog>` por `<DraggableDialog>`

**Antes:**
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Meu Título</DialogTitle>
      <DialogDescription>Minha descrição</DialogDescription>
    </DialogHeader>
    
    {/* Conteúdo */}
    <form>...</form>
  </DialogContent>
</Dialog>
```

**Depois:**
```tsx
<DraggableDialog 
  open={open} 
  onOpenChange={setOpen}
  title="Meu Título"
  description="Minha descrição"
  className="max-w-2xl"
>
  {/* Conteúdo */}
  <form>...</form>
</DraggableDialog>
```

## Props disponíveis

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controla se o diálogo está aberto |
| `onOpenChange` | `(open: boolean) => void` | Callback quando o estado muda |
| `title` | `string` (opcional) | Título do diálogo |
| `description` | `string` (opcional) | Descrição do diálogo |
| `children` | `ReactNode` | Conteúdo do diálogo |
| `className` | `string` (opcional) | Classes CSS adicionais (padrão: `max-w-2xl`) |
| `maxWidth` | `string` (opcional) | Largura máxima customizada |

## Funcionalidades

- ✅ **Arraste pela barra superior**: Clique e arraste na área do cabeçalho (com ícone de grip)
- ✅ **Conteúdo selecionável**: O conteúdo dentro do diálogo continua selecionável normalmente
- ✅ **Responsivo**: Funciona em diferentes tamanhos de tela
- ✅ **Acessível**: Mantém todas as funcionalidades de acessibilidade do Dialog original

## Exemplos de uso

### Exemplo 1: Formulário simples

```tsx
function MyFormDialog() {
  const [open, setOpen] = useState(false);
  
  return (
    <DraggableDialog
      open={open}
      onOpenChange={setOpen}
      title="Criar Novo Item"
      description="Preencha os dados abaixo"
    >
      <form className="space-y-4">
        <Input placeholder="Nome" />
        <Input placeholder="Email" />
        <Button type="submit">Salvar</Button>
      </form>
    </DraggableDialog>
  );
}
```

### Exemplo 2: Diálogo de confirmação

```tsx
<DraggableDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  title="Confirmar Exclusão"
  description="Esta ação não pode ser desfeita"
  className="max-w-md"
>
  <div className="flex gap-2 justify-end mt-4">
    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
      Cancelar
    </Button>
    <Button variant="destructive" onClick={handleDelete}>
      Excluir
    </Button>
  </div>
</DraggableDialog>
```

### Exemplo 3: Diálogo sem título

```tsx
<DraggableDialog
  open={open}
  onOpenChange={setOpen}
>
  {/* Conteúdo sem cabeçalho */}
  <div>Meu conteúdo customizado</div>
</DraggableDialog>
```

## Componentes que já usam DraggableDialog

- ✅ `DealFormDialog` - Criação de novo deal no SDR Suite

## Boas práticas

1. **Use para diálogos complexos**: Ideal para formulários longos ou diálogos com muito conteúdo
2. **Mantenha o título claro**: O ícone de grip aparece ao lado do título, indicando que é arrastável
3. **Teste em mobile**: Em telas menores, o comportamento pode ser diferente
4. **Não abuse**: Nem todos os diálogos precisam ser arrastáveis - use quando fizer sentido para a UX

## Troubleshooting

**O diálogo não arrasta?**
- Certifique-se de que está clicando na área do cabeçalho (com o ícone de grip)
- Verifique se não há conflito de eventos de pointer

**O conteúdo não é selecionável?**
- Todo conteúdo dentro do `children` é selecionável por padrão
- Apenas o cabeçalho é a área de arraste

**Problemas de posicionamento?**
- O diálogo reseta a posição quando fecha e reabre
- Use `bounds="parent"` para manter dentro dos limites da janela
