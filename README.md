# CyberZone Lan House — JavaScript + PHP/MySQL (API)

Sistema de gerenciamento de lan house (clientes, computadores,
funcionários, produtos, uso de máquina e vendas). O front-end é
HTML + CSS + JavaScript puro; os dados ficam num banco MySQL
real, acessados através de uma API em PHP — dessa forma, todos
os computadores da lan house compartilham os mesmos cadastros.

## Estrutura de pastas

```
CyberZone_JS/
├── index.html
├── assets/
│   ├── img/
│   └── icons/
├── css/
│   ├── base.css
│   ├── layout.css
│   └── components.css
├── js/
│   ├── main.js     (orquestrador — liga clique da tela à lógica)
│   ├── ui.js        (só lê/escreve na tela)
│   └── logic.js      (regras de negócio + fala com o backend via fetch)
├── backend/           (API em PHP — recebe fetch do JS e consulta o MySQL)
│   ├── conexao.php
│   ├── login.php, logout.php, sessao.php
│   ├── recuperar-senha.php, redefinir-senha.php
│   ├── clientes.php, funcionarios.php, computadores.php, produtos.php
│   ├── venda.php
│   └── banco.sql
├── view/               (as telas internas do sistema)
├── .gitignore
└── README.md
```

## Como rodar

O PHP só funciona dentro de um servidor (Apache), então **não dá
pra abrir o `index.html` clicando duas vezes** — precisa passar
pelo XAMPP.

1. Instale o [XAMPP](https://www.apachefriends.org/).
2. Copie a pasta `CyberZone_JS` inteira para dentro de
   `C:\xampp\htdocs\` (Windows) ou `/opt/lampp/htdocs/` (Linux).
3. Abra o XAMPP Control Panel e clique em **Start** no Apache e
   no MySQL.
4. Acesse `http://localhost/phpmyadmin`, crie um banco chamado
   `cyberzone` e importe o arquivo `backend/banco.sql` (aba
   "Importar").
5. Confira `backend/conexao.php` — os valores padrão (`localhost`,
   usuário `root`, senha vazia) já funcionam com o XAMPP padrão.
6. Acesse pelo navegador: `http://localhost/CyberZone_JS/index.html`
   (não `file://`).

Login padrão (já vem cadastrado pelo `banco.sql`):
- CPF: `12345678910`
- Senha: `admin123`

## Como os dados fluem agora (full JavaScript, PHP só conecta o banco)

```
Tela → js/main.js --fetch()--> backend/*.php (só SQL puro) --> MySQL
         │
         └──> js/logic.js decide tudo (login válido? CPF duplicado?
              máquina venceu o tempo? estoque suficiente?)
```

Todo o PHP virou "CRUD burro": cada arquivo em `backend/` só
recebe um pedido e faz um SELECT/INSERT/UPDATE/DELETE — ele não
decide mais nada. Quem decide é o `js/logic.js`, com funções
puras (mesma entrada → mesma saída, sem tocar em tela nem em
rede), exatamente como o exemplo do professor
(`adicionarTarefa(lista, texto)`). O `js/main.js` é quem busca os
dados brutos do PHP, pergunta pro `logic.js` o que fazer, manda o
resultado pro `js/ui.js` mostrar, e só então manda o PHP gravar.

A sessão de login (quem está logado agora) fica no
`sessionStorage` do navegador — os dados de verdade (clientes,
computadores, funcionários, produtos) é que ficam no MySQL,
compartilhados entre qualquer computador que acessar o mesmo
servidor.

**Atenção:** como a checagem de senha agora acontece no
JavaScript, o `funcionarios.php` precisa devolver a senha junto
com os outros dados pro navegador conseguir comparar. Isso não é
uma boa prática de segurança num sistema real (a senha fica
visível no DevTools do navegador) — é uma simplificação aceita
aqui porque o objetivo é seguir exatamente a arquitetura pedida
pelo professor (PHP só conecta o banco, tudo o resto em
JavaScript).
