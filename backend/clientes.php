<?php
// ============================================================
//  backend/clientes.php
//  Só lê/grava no banco. Toda decisão (campo obrigatório,
//  CPF/e-mail duplicado) é feita no JavaScript antes de chamar
//  este arquivo.
//  GET (lista todos, ?id=X ou ?cpf=X) / POST / PUT (?id=X) / DELETE (?id=X)
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
        $stmt = $conn->prepare("SELECT * FROM clientes WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_assoc() ?: []);
    } elseif (!empty($_GET['cpf'])) {
        $cpf = $_GET['cpf'];
        $stmt = $conn->prepare("SELECT * FROM clientes WHERE cpf = ?");
        $stmt->bind_param('s', $cpf);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_assoc() ?: []);
    } else {
        $resultado = $conn->query("SELECT * FROM clientes");
        $clientes = [];
        while ($linha = $resultado->fetch_assoc()) { $clientes[] = $linha; }
        echo json_encode($clientes);
    }
}

// ── POST ─────────────────────────────────────────────────────
elseif ($metodo === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);

    $stmt = $conn->prepare("INSERT INTO clientes (nome, sobrenome, cpf, data_nascimento, telefone, email) VALUES (?, ?, ?, ?, ?, ?)");
    $dataNascimento = $dados['data_nascimento'] ?: null;
    $telefone       = $dados['telefone'] ?: null;
    $stmt->bind_param('ssssss', $dados['nome'], $dados['sobrenome'], $dados['cpf'], $dataNascimento, $telefone, $dados['email']);

    if ($stmt->execute()) {
        echo json_encode(['mensagem' => 'Cliente cadastrado com sucesso!', 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['erro' => $conn->error]);
    }
}

// ── PUT ──────────────────────────────────────────────────────
elseif ($metodo === 'PUT') {
    $id = intval($_GET['id'] ?? 0);
    $dados = json_decode(file_get_contents('php://input'), true);

    $stmt = $conn->prepare("UPDATE clientes SET nome=?, sobrenome=?, cpf=?, data_nascimento=?, telefone=?, email=? WHERE id=?");
    $dataNascimento = $dados['data_nascimento'] ?: null;
    $telefone       = $dados['telefone'] ?: null;
    $stmt->bind_param('ssssssi', $dados['nome'], $dados['sobrenome'], $dados['cpf'], $dataNascimento, $telefone, $dados['email'], $id);

    if ($stmt->execute()) {
        echo json_encode(['mensagem' => 'Cliente atualizado com sucesso!']);
    } else {
        echo json_encode(['erro' => $conn->error]);
    }
}

// ── DELETE ───────────────────────────────────────────────────
elseif ($metodo === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM clientes WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode(['mensagem' => 'Cliente removido com sucesso.']);
}

$conn->close();
?>
