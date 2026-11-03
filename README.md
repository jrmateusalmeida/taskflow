# TaskFlow Dark Pro

**Sistema full-stack de gerenciamento de tarefas e projetos**, desenvolvido com React, TypeScript, Java, Spring Boot e PostgreSQL.

O TaskFlow reúne organização de atividades, acompanhamento de projetos e indicadores de produtividade em uma interface de tema escuro. Este repositório faz parte do meu portfólio de desenvolvimento de software.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Java, Spring Boot, Spring Security, Spring Data JPA |
| Banco de dados | PostgreSQL |
| Autenticação | JWT e hash de senhas com BCrypt |
| Ferramentas | Git, GitHub, Maven, VS Code |

## Funcionalidades

- **Autenticação:** cadastro, login e gerenciamento de sessão com JWT.
- **Conta:** visualização e atualização de dados do perfil e alteração de senha.
- **Dashboard:** indicadores de tarefas por status, progresso geral e próximas entregas.
- **Tarefas:** criação, edição e exclusão, com prioridade, status, descrição, projeto e prazo.
- **Kanban:** organização de tarefas em *A fazer*, *Em andamento* e *Concluída*.
- **Projetos:** criação, edição, exclusão e acompanhamento do progresso.
- **Calendário:** visualização das tarefas por data e acesso às ações de gerenciamento.
- **Relatórios:** distribuição por status, progresso por projeto e identificação de tarefas atrasadas.
- **Persistência:** tarefas e projetos armazenados no PostgreSQL, associados ao usuário autenticado.

## Arquitetura

```text
Navegador
   |
   v
Frontend — React + TypeScript (Vite)
   |
   | Requisições HTTP / API REST
   | Autorização: Bearer JWT
   v
Backend — Java + Spring Boot
   |
   | Spring Security / JPA
   v
PostgreSQL
```

A aplicação é dividida em `frontend/` e `backend/`. O backend disponibiliza uma API REST e utiliza autenticação para proteger os dados de cada usuário.

## Como executar localmente

### Pré-requisitos

- Node.js e npm
- Java compatível com a versão configurada no projeto (Java 21 no ambiente de desenvolvimento)
- PostgreSQL
- Git (opcional, para clonar o repositório)

### 1. Clonar o repositório

```bash
git clone https://github.com/jrmateusalmeida/taskflow.git
cd taskflow
```

### 2. Preparar o banco de dados

Crie um banco PostgreSQL chamado `taskflow_db`, ou ajuste a URL de conexão na configuração do backend. No ambiente local de desenvolvimento, a conexão utiliza `localhost:5432`.

O backend espera as variáveis de ambiente abaixo:

| Variável | Finalidade |
| --- | --- |
| `DB_PASSWORD` | Senha do usuário PostgreSQL configurado na aplicação |
| `JWT_SECRET` | Chave secreta de assinatura dos tokens JWT |

**Nunca publique senhas ou chaves reais no repositório.** Configure-as no seu ambiente antes de iniciar o backend. Verifique também o usuário, a porta e as demais propriedades de conexão em `backend/src/main/resources/`.

> Durante o desenvolvimento, o projeto utiliza `spring.jpa.hibernate.ddl-auto=update`. Para uma implantação em produção, prefira migrações versionadas e uma configuração específica para o ambiente.

### 3. Iniciar o backend

No PowerShell, a partir da pasta raiz do projeto:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

A API utiliza, por padrão, `http://localhost:8080`.

### 4. Iniciar o frontend

Em **outro terminal PowerShell**, a partir da pasta raiz do projeto:

```powershell
cd frontend
npm install
npm run dev
```

Abra o endereço exibido pelo Vite (normalmente `http://localhost:5173`).

### 5. Validar a compilação

No frontend:

```powershell
npm run build
```

No backend:

```powershell
.\mvnw.cmd test
```

> A execução depende de um PostgreSQL acessível e das variáveis de ambiente configuradas corretamente. O backend não deve ser publicado na internet com as configurações locais de desenvolvimento.

## 📸 Capturas de tela

### Dashboard
![Dashboard](docs/images/screenshots/dashboard.png)

### Quadro Kanban
![Kanban](docs/images/screenshots/kanban.png)

### Projetos
![Projetos](docs/images/screenshots/projetos.png)

### Calendário
![Calendário](docs/images/screenshots/calendario.png)

### Relatórios
![Relatórios](docs/images/screenshots/relatorios.png)

### Criação de tarefas
![Nova tarefa](docs/images/screenshots/nova-tarefa.png)

## Estado atual e próximos passos

O projeto está em desenvolvimento contínuo. Entre as melhorias previstas estão a recuperação de senha por e-mail, a evolução do módulo de equipes e o aprimoramento do histórico de atividades e dos relatórios.

**Limitações atuais:** comentários e histórico de tarefas podem depender de armazenamento local; os relatórios representam principalmente o estado atual dos dados, não uma série histórica de produtividade. O módulo de equipes ainda não está disponível como funcionalidade completa.

## Autor

**Mateus Almeida**  
[GitHub](https://github.com/jrmateusalmeida) · [LinkedIn](https://www.linkedin.com/in/jrmateusalmeida/)

---

*Projeto desenvolvido para prática de desenvolvimento full-stack e composição de portfólio profissional.*
