<div align="center">

# 📬 Sistema de Notificações Automáticas

### Envie emails automaticamente no dia e hora certos

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Instalação](#-instalação) • [Configuração](#%EF%B8%8F-configuração) • [Uso](#-como-usar) • [Automação](#-automação) • [Docs](#-documentação)

</div>

---

## ✨ Funcionalidades

<table>
<tr>
<td width="50%">

### 📅 Notificações Recorrentes
Agende emails para serem enviados **todo mês no mesmo dia**
```
Exemplo: Todo dia 15 de cada mês
```

</td>
<td width="50%">

### 📆 Notificações Únicas
Agende emails para uma **data específica**
```
Exemplo: 25 de dezembro de 2026
```

</td>
</tr>
<tr>
<td>

### 🤖 Automação Completa
GitHub Actions envia automaticamente **todos os dias às 9h**

</td>
<td>

### 📧 Múltiplos Destinatários
Envie para **vários emails** de uma só vez

</td>
</tr>
<tr>
<td>

### 🔐 Área Admin Protegida
Interface web segura para gerenciar notificações

</td>
<td>

### 🚀 Deploy Fácil
Um clique no Vercel e está no ar

</td>
</tr>
</table>

---

## 🚀 Instalação

### Pré-requisitos

- **Node.js** 18 ou superior
- **Conta MongoDB** (gratuita no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Email SMTP** (Gmail, Outlook, etc.)

### Passos

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd notificacao

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais

# 4. Execute em desenvolvimento
npm run dev
```

🎉 Acesse [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Configuração

### 1️⃣ Variáveis de Ambiente

Edite o arquivo `.env` com suas credenciais:

```env
# MongoDB
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database

# Autenticação
JWT_SECRET=sua-chave-secreta-32-caracteres
ADMIN_PASSWORD=sua-senha-admin

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
FROM_EMAIL=seu-email@gmail.com

# Para automação
SCHEDULER_SECRET=outra-chave-secreta-32-caracteres
```

> 💡 **Dica:** Gere chaves seguras com:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 2️⃣ Configuração do Gmail

Para usar Gmail, você precisa de uma **Senha de App**:

1. Acesse [myaccount.google.com/security](https://myaccount.google.com/security)
2. Ative a **Verificação em duas etapas**
3. Vá em **Senhas de app**
4. Gere uma senha para "Email"
5. Use essa senha no `SMTP_PASS`

---

## 💻 Como Usar

### Interface Web

1. Acesse `/login` e faça login com `ADMIN_PASSWORD`
2. Vá para `/notifications`
3. Crie uma nova notificação:
   - **Título** e **mensagem**
   - **Destinatários** (um por linha)
   - Escolha entre:
     - **Recorrente**: Digite o dia do mês (1-31)
     - **Única**: Escolha a data específica
4. Clique em **Salvar**

### Envio Manual

Para testar ou enviar imediatamente:
- Clique no botão **"Enviar Agora"** na interface

### Teste via Terminal

```powershell
# Windows PowerShell
.\test-notifications.ps1

# Linux/Mac
./test-notifications.sh
```

---

## 🤖 Automação

Configure o envio automático diário - **nunca mais esqueça!**

### Como funciona

A **GitHub Action** executa automaticamente **todos os dias às 9h** (horário de Brasília) e varre todas as notificações pendentes do dia, enviando os emails.

### Configuração (3 minutos)

<details>
<summary><b>📖 Ver instruções passo a passo</b></summary>

#### 1. Configure os Secrets no GitHub

No seu repositório:
1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret**
3. Adicione:

| Nome | Valor | Exemplo |
|------|-------|---------|
| `APP_URL` | URL da sua aplicação deployada | `https://seu-app.vercel.app` |
| `SCHEDULER_SECRET` | Mesma chave do `.env` | `a1b2c3d4e5f6...` |

#### 2. Configure na Aplicação Deployada

Na Vercel (ou outro serviço):
1. Vá em **Settings** → **Environment Variables**
2. Adicione `SCHEDULER_SECRET` com o **mesmo valor** do GitHub

#### 3. Teste!

1. Vá em **Actions** no GitHub
2. Clique em "Cron - send notifications"
3. Clique em **Run workflow**
4. Veja os logs detalhados

✅ Se aparecer "SUCCESS!", está funcionando!

</details>

📚 **[Guia completo de configuração →](GITHUB_ACTION_SETUP.md)**

---

## 🐛 Troubleshooting

### "Não recebi o email"

1. ✅ Execute a Action manualmente e veja os logs
2. ✅ Verifique se a notificação estava agendada para hoje
3. ✅ Teste manualmente clicando em "Enviar Agora"
4. ✅ Veja os logs da aplicação (não da Action)

📚 **[Guia de diagnóstico completo →](DIAGNOSE.md)**

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `401 Unauthorized` | Secret incorreto | Verifique `SCHEDULER_SECRET` |
| `000 Connection Failed` | App offline ou URL errada | Verifique `APP_URL` |
| Email não enviado | SMTP incorreto | Teste manualmente na interface |
| Secret not configured | Secret não foi adicionado | Configure no GitHub Secrets |

---

## 📁 Estrutura do Projeto

```
notificacao/
├── 📂 app/
│   ├── 📂 api/
│   │   ├── auth/              # Login/logout
│   │   └── notifications/     # CRUD + envio
│   ├── login/                 # Página de login
│   ├── notifications/         # Dashboard admin
│   └── layout.tsx
├── 📂 lib/
│   ├── auth.ts               # JWT auth
│   └── mongodb.ts            # Database connection
├── 📂 models/
│   └── Notification.ts       # Schema MongoDB
├── 📂 worker/
│   └── sendWorker.js         # Worker standalone (opcional)
├── 📂 .github/workflows/
│   └── cron-send.yml         # GitHub Action
├── .env.example              # Template de config
├── test-notifications.ps1    # Script de teste (Windows)
└── test-notifications.sh     # Script de teste (Linux/Mac)
```

---

## 📖 Documentação

| Documento | Descrição |
|-----------|-----------|
| **[GITHUB_ACTION_SETUP.md](GITHUB_ACTION_SETUP.md)** | 📘 Guia completo de automação via GitHub Actions |
| **[DIAGNOSE.md](DIAGNOSE.md)** | 🔍 Troubleshooting: Por que não funcionou? |
| **[.env.example](.env.example)** | ⚙️ Todas as variáveis de ambiente |

---

## 🚀 Deploy

### Vercel (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Clique no botão acima
2. Conecte seu repositório
3. Configure as variáveis de ambiente
4. Deploy!

### Outras Plataformas

Funciona em qualquer plataforma que suporte Next.js:
- Railway
- Heroku
- DigitalOcean
- AWS

---

## 🛠️ Tecnologias

- **[Next.js](https://nextjs.org/)** - Framework React
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[MongoDB](https://www.mongodb.com/)** - Database NoSQL
- **[Mongoose](https://mongoosejs.com/)** - ODM para MongoDB
- **[Nodemailer](https://nodemailer.com/)** - Envio de emails
- **[Tailwind CSS](https://tailwindcss.com/)** - Estilização
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD e Automação

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. 🍴 Fazer fork do projeto
2. 🔨 Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. 💾 Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. 📤 Push para a branch (`git push origin feature/MinhaFeature`)
5. 🔃 Abrir um Pull Request

---

<div align="center">

**Feito com ❤️ usando Next.js**

[⬆ Voltar ao topo](#-sistema-de-notificações-automáticas)

</div>
