<?php
// ============================================================
//  backend/conexao.php
//  Responsável por conectar ao banco de dados MySQL.
//  Este arquivo é incluído por todos os outros arquivos PHP
//  que precisam acessar o banco.
// ============================================================

// ── Configurações de acesso ao MySQL ────────────────────────
// Altere os valores abaixo de acordo com seu ambiente (XAMPP, etc.)
define('DB_HOST', 'localhost');   // Endereço do servidor MySQL
define('DB_USER', 'root');        // Usuário do banco (padrão XAMPP: root)
define('DB_PASS', '');            // Senha do banco   (padrão XAMPP: vazio)
define('DB_NAME', 'cyberzone');   // Nome do banco criado em banco.sql

// ── Cria a conexão usando MySQLi ─────────────────────────────
// mysqli() tenta abrir uma conexão com os parâmetros acima
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// ── Verifica se a conexão falhou ─────────────────────────────
if ($conn->connect_error) {
    // Retorna JSON de erro e encerra o script
    // (os arquivos de cadastro esperam respostas em JSON)
    http_response_code(500);
    echo json_encode(['erro' => 'Falha na conexão com o banco: ' . $conn->connect_error]);
    exit;
}

// ── Define o charset para suportar acentos e emojis ─────────
$conn->set_charset('utf8mb4');
?>
