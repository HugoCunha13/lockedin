# 🔒 LockedIn - Aplicação Web de Produtividade

Uma aplicação web moderna e responsiva para gerir sessões de foco, tarefas e progresso pessoal — com gamificação, conquistas e missões para manter a motivação.

---

## 📖 Índice

- [Introdução](#introdução)
- [Funcionalidades](#funcionalidades)
- [Instalação](#instalação)
- [Utilização](#utilização)
- [Dependências](#dependências)
- [Contribuidores](#contribuidores)

---

## 🧭 Introdução

**LockedIn** é uma plataforma web de produtividade focada em jovens com TDAH que permite aos utilizadores:

- Gerir sessões de foco com temporizador (modo focado e modo livre)
- Organizar tarefas num calendário interativo
- Acompanhar o progresso através de estatísticas detalhadas
- Desbloquear conquistas e completar missões para ganhar XP e subir de nível

Foi construída com foco em responsividade, experiência de utilizador e tecnologias como **HTML**, **CSS**, **JavaScript** e **json-server** com autenticação via **json-server-auth**.

---

## ✨ Funcionalidades

### Utilizador

- Sessões de foco com temporizador circular e desbloqueio de cadeado
- Gestão de tarefas com calendário mensal e sessões rápidas (Pomodoro)
- Sistema de conquistas desbloqueadas automaticamente com base na atividade
- Missões com progresso acumulado e recompensas em XP
- Estatísticas semanais com gráfico interativo e acompanhamento mensal
- Perfil com nível, XP e definições de notificações

### Admin

- Gestão de utilizadores (atribuir/retirar admin, excluir contas)
- Criação de missões com tipo, meta e recompensa em XP

### Interface

- Totalmente responsiva (mobile, tablet, desktop)
- Navegação lateral com sidebar
- Animações e temporizador circular SVG

---

## 🛠 Instalação

1. Clonar o repositório: git clone https://github.com/HugoCunha13/lockedin
2. Iniciar o servidor: npm start
3. Abrir com Live Server em: http://localhost:3000

---

## ▶️ Utilização

### Exemplo de Contas para Teste

- 1 | Email: ronaldo@gmail.com - Password: ronaldo1234 - Tipo: Admin
- 2 | Email: cesar0santos6@gmail.com - Password: cesar1234 - Tipo: Utilizador

### Páginas principais

- index.html: Página de entrada com login e registo.
- principal.html: Dashboard com missões ativas e estatísticas rápidas.
- foco.html: Sessões de foco com temporizador (modo focado e modo livre).
- tarefas.html: Gestão de tarefas com calendário interativo.
- conquistas.html: Lista de conquistas desbloqueadas e por desbloquear.
- estatisticas.html: Estatísticas de progresso semanal e mensal.
- perfil.html: Perfil do utilizador com definições e notificações.
- admin.html: Painel de administração (gestão de utilizadores e missões).

---

## 📦 Dependências e tecnologias

- **json-server**: Servidor REST fake para persistência de dados.
- **json-server-auth**: Autenticação JWT sobre json-server.
- **Chart.js**: Gráficos de estatísticas.
- **Font Awesome**: Ícones.

---

## 👥 Contribuidores

- Hugo Cunha — [HugoCunha13](https://github.com/HugoCunha13)
- César Santos — [CesarSantos06](https://github.com/CesarSantos06)
- Helmer Antunes — [Helmerantunes4](https://github.com/Helmerantunes4)

---

