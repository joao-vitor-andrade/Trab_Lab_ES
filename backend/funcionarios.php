<?php
// ============================================================
//  backend/funcionarios.php
//  Só lê/grava no banco. A comparação de senha do login e a
//  checagem de CPF/e-mail duplicado são feitas no JavaScript —
//  por isso este arquivo devolve a senha junto (o front decide
//  se está certa). GET (lista/?id=X/?cpf=X) / POST / PUT / DELETE
// ============================================================

require_once 'conexao.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$metodo = $_SERVER['REQUEST_METHOD'];

// ── GET ──────────────────────────────────────────────────────
if ($metodo === 'GET') {
    if (!empty($_GET['id'])) {
        $id = intval($_GET['id']);
        $stmt = $conn->prepare("SELECT * FROM funcionarios WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_assoc() ?: []);
    } elseif (!empty($_GET['cpf'])) {
        $cpf = $_GET['cpf'];
        $stmt = $conn->prepare("SELECT * FROM funcionarios WHERE cpf = ?");
        $stmt->bind_param('s', $cpf);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_assoc() ?: []);
    } else {
        $resultado = $conn->query("SELECT * FROM funcionarios");
        $funcionarios = [];
        while ($linha = $resultado->fetch_assoc()) { $funcionarios[] = $linha; }
        echo json_encode($funcionarios);
    }
}

// ── POST ─────────────────────────────────────────────────────
elseif ($metodo === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);

    $stmt = $conn->prepare("INSERT INTO funcionarios (nome, sobrenome, cpf, data_nascimento, telefone, cargo, salario, email, senha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $dataNascimento = $dados['data_nascimento'] ?: null;
    $telefone       = $dados['telefone'] ?: null;
    $salario        = $dados['salario'] ?: null;
    $stmt->bind_param('sssssssss', $dados['nome'], $dados['sobrenome'], $dados['cpf'], $dataNascimento, $telefone, $dados['cargo'], $salario, $dados['email'], $dados['senha']);

    if ($stmt->execute()) {
        echo json_encode(['mensagem' => 'Funcionário cadastrado com sucesso!', 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['erro' => $conn->error]);
    }
}

// ── PUT ──────────────────────────────────────────────────────
// Aceita atualização completa (edição de cadastro) ou parcial
// (ex.: só a senha, na recuperação de senha).
elseif ($metodo === 'PUT') {
    $id = intval($_GET['id'] ?? 0);
    $dados = json_decode(file_get_contents('php://input'), true);

    if (isset($dados['senha']) && count($dados) === 1) {
        // Atualização parcial: só a senha
        $stmt = $conn->prepare("UPDATE funcionarios SET senha = ? WHERE id = ?");
        $stmt->bind_param('si', $dados['senha'], $id);
    } else {
        // Atualização completa do cadastro
        $dataNascimento = $dados['data_nascimento'] ?: null;
        $telefone       = $dados['telefone'] ?: null;
        $salario        = $dados['salario'] ?: null;

        if (!empty($dados['senha'])) {
            $stmt = $conn->prepare("UPDATE funcionarios SET nome=?, sobrenome=?, cpf=?, data_nascimento=?, telefone=?, cargo=?, salario=?, email=?, senha=? WHERE id=?");
            $stmt->bind_param('sssssssssi', $dados['nome'], $dados['sobrenome'], $dados['cpf'], $dataNascimento, $telefone, $dados['cargo'], $salario, $dados['email'], $dados['senha'], $id);
        } else {
            $stmt = $conn->prepare("UPDATE funcionarios SET nome=?, sobrenome=?, cpf=?, data_nascimento=?, telefone=?, cargo=?, salario=?, email=? WHERE id=?");
            $stmt->bind_param('ssssssssi', $dados['nome'], $dados['sobrenome'], $dados['cpf'], $dataNascimento, $telefone, $dados['cargo'], $salario, $dados['email'], $id);
        }
    }

    if ($stmt->execute()) {
        echo json_encode(['mensagem' => 'Funcionário atualizado com sucesso!']);
    } else {
        echo json_encode(['erro' => $conn->error]);
    }
}

// ── DELETE ───────────────────────────────────────────────────
elseif ($metodo === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM funcionarios WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode(['mensagem' => 'Funcionário removido com sucesso.']);
}

$conn->close();
?>
