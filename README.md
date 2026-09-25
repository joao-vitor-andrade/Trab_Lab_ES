# CyberZone Lan House

Sistema de gerenciamento de lan house: cadastro de clientes,
computadores, funcionários e produtos, controle de uso de
máquina (com tempo e valor por hora) e registro de vendas com
baixa de estoque.

Projeto acadêmico da disciplina de Laboratório de Engenharia de
Software (FATEC Presidente Prudente) — front-end em HTML, CSS e
JavaScript puro; o PHP é usado só como conector de banco de
dados (API simples de CRUD), e todas as regras de negócio
(login, duplicidade de cadastro, tempo de uso, controle de
estoque) ficam em JavaScript.

## Estrutura do projeto

```text
CyberZone_JS/
├── index.html            (tela de login)
├── css/
│   ├── base.css           (reset e estilos base)
│   ├── layout.css         (header, nav, footer, containers das telas)
│   └── components.css     (botões, formulários, tabelas, cards, badges)
├── js/
│   ├── main.js             (orquestrador: busca dados via fetch, chama a lógica, atualiza a tela)
│   ├── ui.js                (só lê/escreve no DOM — não decide nada)
│   └── logic.js              (regras de negócio — funções puras, não conhecem a tela)
├── backend/                  (API em PHP — só SQL puro, sem decisão nenhuma)
│   ├── conexao.php
│   ├── clientes.php
│   ├── funcionarios.php
│   ├── computadores.php
│   ├── produtos.php
│   └── banco.sql             (schema do banco de dados MySQL)
├── view/                      (as telas internas do sistema: cadastros, listas, uso de máquina, venda)
├── .gitignore
└── README.md
```
## Como funciona

Tela (HTML) → js/main.js --fetch()--> backend/*.php (SQL puro) → MySQL
                   │
                   └──> js/logic.js decide (login válido? CPF
                        duplicado? máquina venceu o tempo?
                        estoque suficiente?)

- **backend/*.php**: cada arquivo só faz SELECT/INSERT/UPDATE/DELETE. Não valida, não compara senha, não calcula nada.
- **js/logic.js**: funções puras (mesma entrada → mesma saída) que recebem os dados já buscados e decidem o que fazer com eles.
- **js/main.js**: busca os dados no backend, chama a lógica, manda a ui.js atualizar a tela e, se preciso, manda o backend gravar o resultado.
- **js/ui.js**: só lê e escreve no DOM (campos de formulário, tabelas, mensagens de feedback).

A sessão de login (quem está logado) fica no sessionStorage do navegador. Os dados reais (clientes, funcionários, computadores, produtos) ficam no MySQL, compartilhados entre qualquer computador que acesse o mesmo servidor.

**Atenção — trade-off de segurança conhecido:** como a comparação de senha acontece em JavaScript (e não no PHP), o funcionarios.php devolve a senha junto com os outros dados do funcionário para o navegador poder compará-la. Isso expõe a senha no DevTools do navegador e não seria aceitável num sistema em produção — foi uma decisão consciente para seguir a arquitetura "PHP só conecta o banco, toda decisão em JavaScript" pedida na disciplina.

## Como rodar

O PHP só funciona dentro de um servidor (Apache) — não dá para abrir o index.html clicando duas vezes.

1. Instale o XAMPP (apachefriends.org).
2. Copie a pasta CyberZone_JS inteira para dentro de C:\xampp\htdocs\ (Windows) ou /opt/lampp/htdocs/ (Linux).
3. Abra o XAMPP Control Panel e clique em Start no Apache e no MySQL.
4. Acesse http://localhost/phpmyadmin, crie um banco chamado cyberzone e importe o arquivo backend/banco.sql (aba "Importar").
5. Confira backend/conexao.php — os valores padrão (localhost, usuário root, senha vazia) já funcionam com o XAMPP padrão.
6. Acesse pelo navegador: http://localhost/CyberZone_JS/index.html (nunca file://).

Login padrão (já cadastrado pelo banco.sql):
- CPF: 12345678910
- Senha: admin123

## Tecnologias

- HTML5 semântico
- CSS3 (variáveis, Flexbox)
- JavaScript (ES Modules — import/export, fetch, async/await)
- PHP (mysqli, API JSON simples)
- MySQL
