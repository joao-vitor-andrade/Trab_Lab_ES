<?php
// ============================================================
//  backend/computadores.php
//  Só lê/grava no banco. A checagem de número duplicado e a
//  liberação automática de máquina com tempo vencido são
//  decididas no JavaScript (logic.js) — este arquivo só executa
//  o que mandarem.
//  GET (lista/?id=X) / POST / PUT (?id=X, aceita atualização
//  parcial de status) / DELETE (?id=X)
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
        $stmt = $conn->prepare("SELECT * FROM computadores WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        echo json_encode($res->fetch_assoc() ?: []);
    } else {
        $resultado = $conn->query("SELECT * FROM computadores");
        $computadores = [];
        while ($linha = $resultado->fetch_assoc()) { $computadores[] = $linha; }
        echo json_encode($computadores);
    }
}

// ── POST ─────────────────────────────────────────────────────
elseif ($metodo === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);

    $stmt = $conn->prepare("INSERT INTO computadores (numero, processador, memoria_ram, placa_video, armazenamento, monitor, valor_hora, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $processador   = $dados['processador'] ?: null;
    $memoriaRam    = $dados['memoria_ram'] ?: null;
    $placaVideo    = $dados['placa_video'] ?: null;
    $armazenamento = $dados['armazenamento'] ?: null;
    $monitor       = $dados['monitor'] ?: null;
    $status        = $dados['status'] ?: 'livre';
    $valorHora     = $dados['valor_hora'];
    $stmt->bind_param('ssssssds', $dados['numero'], $processador, $memoriaRam, $placaVideo, $armazenamento, $monitor, $valorHora, $status);

    if ($stmt->execute()) {
        echo json_encode(['mensagem' => 'Computador cadastrado com sucesso!', 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['erro' => $conn->error]);
    }
}

// ── PUT ──────────────────────────────────────────────────────
elseif ($metodo === 'PUT') {
    $id = intval($_GET['id'] ?? 0);
    $dados = json_decode(file_get_contents('php://input'), true);

    if (isset($dados['status']) && !isset($dados['numero'])) {
        // Atualização parcial: só status (+ horario_fim) — usado no uso de máquina
        $horarioFim = $dados['horario_fim'] ?? null;
        $stmt = $conn->prepare("UPDATE computadores SET status = ?, horario_fim = ? WHERE id = ?");
        $stmt->bind_param('ssi', $dados['status'], $horarioFim, $id);
    } else {
        // Atualização completa (editar computador)
        $processador   = $dados['processador'] ?: null;
        $memoriaRam    = $dados['memoria_ram'] ?: null;
        $placaVideo    = $dados['placa_video'] ?: null;
        $armazenamento = $dados['armazenamento'] ?: null;
        $monitor       = $dados['monitor'] ?: null;
        $valorHora     = $dados['valor_hora'];
        $status        = $dados['status'] ?: 'livre';
        $stmt = $conn->prepare("UPDATE computadores SET numero=?, processador=?, memoria_ram=?, placa_video=?, armazenamento=?, monitor=?, valor_hora=?, status=?, horario_fim=NULL WHERE id=?");
        $stmt->bind_param('ssssssdsi', $dados['numero'], $processador, $memoriaRam, $placaVideo, $armazenamento, $monitor, $valorHora, $status, $id);
    }

    if ($stmt->execute()) {
        echo json_encode(['mensagem' => 'Computador atualizado com sucesso!']);
    } else {
        echo json_encode(['erro' => $conn->error]);
    }
}

// ── DELETE ───────────────────────────────────────────────────
elseif ($metodo === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM computadores WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode(['mensagem' => 'Computador removido com sucesso.']);
}

$conn->close();
?>
