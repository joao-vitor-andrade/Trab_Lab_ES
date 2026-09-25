<?php
// ============================================================
//  backend/produtos.php
//  Só lê/grava no banco. A conferência de estoque e o cálculo
//  do total da venda são feitos no JavaScript: ele busca o
//  produto, decide, e manda aqui só o novo valor de estoque via
//  PUT — por isso não existe mais um arquivo venda.php separado.
//  GET (lista/?id=X) / POST / PUT (?id=X) / DELETE (?id=X)
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
        $stmt = $conn->prepare("SELECT * FROM produtos WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_assoc() ?: []);
    } else {
        $resultado = $conn->query("SELECT * FROM produtos");
        $produtos = [];
        while ($linha = $resultado->fetch_assoc()) { $produtos[] = $linha; }
        echo json_encode($produtos);
    }
}

// ── POST ─────────────────────────────────────────────────────
elseif ($metodo === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);

    $stmt = $conn->prepare("INSERT INTO produtos (nome, categoria, descricao, preco, estoque) VALUES (?, ?, ?, ?, ?)");
    $categoria = $dados['categoria'] ?: null;
    $descricao = $dados['descricao'] ?: null;
    $preco     = $dados['preco'];
    $estoque   = $dados['estoque'] ?? 0;
    $stmt->bind_param('sssdi', $dados['nome'], $categoria, $descricao, $preco, $estoque);

    if ($stmt->execute()) {
        echo json_encode(['mensagem' => 'Produto cadastrado com sucesso!', 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['erro' => $conn->error]);
    }
}

// ── PUT ──────────────────────────────────────────────────────
// Aceita atualização completa (edição) ou parcial (só o
// estoque, quando é uma venda registrada pelo JavaScript).
elseif ($metodo === 'PUT') {
    $id = intval($_GET['id'] ?? 0);
    $dados = json_decode(file_get_contents('php://input'), true);

    if (isset($dados['estoque']) && count($dados) === 1) {
        $stmt = $conn->prepare("UPDATE produtos SET estoque = ? WHERE id = ?");
        $stmt->bind_param('ii', $dados['estoque'], $id);
    } else {
        $categoria = $dados['categoria'] ?: null;
        $descricao = $dados['descricao'] ?: null;
        $preco     = $dados['preco'];
        $estoque   = $dados['estoque'] ?? 0;
        $stmt = $conn->prepare("UPDATE produtos SET nome=?, categoria=?, descricao=?, preco=?, estoque=? WHERE id=?");
        $stmt->bind_param('sssdii', $dados['nome'], $categoria, $descricao, $preco, $estoque, $id);
    }

    if ($stmt->execute()) {
        echo json_encode(['mensagem' => 'Produto atualizado com sucesso!']);
    } else {
        echo json_encode(['erro' => $conn->error]);
    }
}

// ── DELETE ───────────────────────────────────────────────────
elseif ($metodo === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM produtos WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode(['mensagem' => 'Produto removido com sucesso.']);
}

$conn->close();
?>
