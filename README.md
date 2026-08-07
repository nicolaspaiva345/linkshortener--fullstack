# 🔗 LinkShortener — Encurtador de URLs

![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

Aplicação Fullstack moderna desenvolvida para encurtamento de URLs, geração de QR Codes e acompanhamento de métricas de acesso em tempo real. O projeto adota uma arquitetura desacoplada, utilizando **Spring Boot 3** no backend e **React com TypeScript** no frontend, além de persistência gerenciada no **PostgreSQL via Supabase Connection Pooling**.

---

## 🚀 Aplicação em Produção

- 🌐 Link do deploy: https://link-shortener-d5ht.onrender.com/

---

## ✨ Funcionalidades Principais

- ✂️ **Encurtamento de URL:** Transformação de URLs longas em hashes curtos e únicos.
- ⚡ **Redirecionamento Rápido:** Resolução de links otimizada para baixo tempo de resposta.
- 📊 **Dashboard de Analytics:** Visualização de estatísticas de acesso, total de cliques e métricas de uso.
- 📱 **Gerador de QR Code:** Criação automática de QR Codes para compartilhamento ágil em dispositivos móveis.
- ✒️ **Aliases Personalizados:** Permite ao usuário customizar a terminação da URL encurtada.
- 🛡️ **Validação e Tratamento de Erros:** Sanitização de entradas e respostas tratadas para URLs inválidas ou inexistentes.

---

## 🛠️ Tech Stack & Arquitetura

### **Backend (Spring Boot)**
- **Linguagem/Framework:** Java 17+ / Spring Boot 3.x
- **Persistência & ORM:** Spring Data JPA / Hibernate
- **Database Connection:** HikariCP configurado com **Supavisor (Transaction Pooler da Supabase)** na porta `6543`
- **Build Tool:** Maven

### **Frontend (React)**
- **Linguagem/Framework:** React 18 + TypeScript
- **Bundler:** Vite
- **Cliente HTTP:** Axios
- **UI & Iconografia:** Lucide React, Tailwind CSS

### **Infraestrutura & Cloud**
- **Database Cloud:** PostgreSQL hospedado no Supabase
- **Hosting Backend:** Render (Web Service)
- **Hosting Frontend:** Vercel

---

## 📐 Decisões Arquiteturais e Desafios Superados

1. **Transaction Pooling com Supavisor (Supabase):**
   - Para garantir resiliência do pool de conexões e contornar restrições de rotas IPv6 diretas em ambientes serverless/cloud como a Render, foi implementada a conexão com o **Supavisor (Pooler)** na porta `6543`, otimizando o gerenciamento via **HikariCP**.
2. **Desacoplamento e Segurança com CORS:**
   - Implementação de políticas granulares de CORS no Spring Boot (`WebMvcConfigurer`), permitindo requisições apenas de origens autorizadas (`localhost` e subdomínios da Vercel).
3. **Padrão DTO e Organização em Camadas:**
   - Estrutura estrita baseada em Controller -> Service -> Repository e utilização de DTOs para garantir isolamento da camada de domínio e APIs limpas.

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
- **Java 17+**
- **Node.js 18+**
- Instância do **PostgreSQL** ativa (local ou Supabase)

---
