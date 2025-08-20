# Sistema de Notificações - Guia de Teste

## 🔔 Como Testar as Notificações

### 1. Acesse a Página de Teste
Vá para: `/test-notifications`

### 2. Cenários de Teste

#### **Para Donos de Delivery:**
1. **Login**: Clique em "Login como Dono"
   - Email: `delivery4@teste.com`
   - Senha: `teste123`

2. **Teste Novo Pedido**:
   - Clique em "Criar Pedido de Teste"
   - **Esperado**: 
     - ✅ Toast "🎉 Novo Pedido!" aparece
     - ✅ Sininho vermelho com número aparece no canto superior direito
     - ✅ Console mostra logs de notificação

3. **Verificar Sininho**:
   - Clique no sininho vermelho
   - **Esperado**: Lista de notificações de pedidos

#### **Para Clientes:**
1. **Login**: Clique em "Login como Cliente"
   - Email: `maria@teste.com`
   - Senha: `teste123`

2. **Teste Atualização de Status**:
   - Clique em "Atualizar Status do Pedido"
   - **Esperado**:
     - ✅ Toast "👨‍🍳 Em preparação" aparece
     - ✅ Sininho vermelho aparece
     - ✅ Console mostra logs de atualização

### 3. Verificar Console
Abra as ferramentas de desenvolvedor (F12) e verifique:
- `🔔 Setting up notifications for user: [ID]`
- `🎉 New order for business owner:` (para donos)
- `🔄 Order update for customer:` (para clientes)
- `Business/Customer channel subscription status: SUBSCRIBED`

## 🐛 Problemas Conhecidos e Soluções

### Se as notificações não funcionarem:

1. **Verificar Realtime**:
   - A tabela `orders` está na publicação `supabase_realtime` ✅
   - `REPLICA IDENTITY FULL` está configurado ✅

2. **Verificar Autenticação**:
   - Usuário deve estar logado
   - Logs devem mostrar user_id válido

3. **Verificar RLS Policies**:
   - Policies permitem INSERT/UPDATE nas tabelas
   - Business owners podem ver pedidos do seu negócio
   - Clientes podem ver seus próprios pedidos

4. **Verificar Canais Realtime**:
   - Canais únicos por usuário/role
   - Status de subscrição deve ser "SUBSCRIBED"

## 🔧 Debug Logs Úteis

No console, procure por:
```
👂 NotificationsListener ativo - user: [ID] initialized: true
🔔 Setting up notifications for user: [ID]
🏢 Setting up business owner notifications for business: [ID]
👤 Setting up customer notifications for customer: [ID]
Business/Customer channel subscription status: SUBSCRIBED
```

## 📝 Estrutura das Notificações

### Para Donos:
- **INSERT** em `orders` → Toast + Sininho
- **UPDATE** em `orders` → Atualiza sininho (sem toast)

### Para Clientes:
- **INSERT** em `orders` → Sininho (sem toast)
- **UPDATE** em `orders` → Toast + Sininho (se mudança de status)

## ⚠️ Notas Importantes

1. **Senhas**: As senhas dos usuários de teste podem precisar ser redefinidas
2. **Realtime**: Pode haver delay de 1-2 segundos nas notificações
3. **Som**: Sistema de som desabilitado temporariamente
4. **Browser**: Certifique-se de que JavaScript está habilitado

---

🎯 **Status**: Sistema configurado e pronto para teste
📍 **URL**: `/test-notifications`