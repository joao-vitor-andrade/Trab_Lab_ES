-- ============================================================
--  CYBERZONE LAN HOUSE — Script de criação do banco de dados
--  Execute no phpMyAdmin ou via terminal:
--  mysql -u root -p < banco.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS cyberzone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cyberzone;

-- ── TABELA: clientes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,
    sobrenome       VARCHAR(100) NOT NULL,
    cpf             VARCHAR(14)  NOT NULL UNIQUE,
    data_nascimento DATE,
    telefone        VARCHAR(20),
    email           VARCHAR(150) NOT NULL UNIQUE,
    criado_em       DATETIME DEFAULT NOW()
);

-- ── TABELA: funcionarios ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS funcionarios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,
    sobrenome       VARCHAR(100) NOT NULL,
    cpf             VARCHAR(14)  NOT NULL UNIQUE,
    data_nascimento DATE,
    telefone        VARCHAR(20),
    cargo           VARCHAR(50)  NOT NULL,
    salario         VARCHAR(20),
    email           VARCHAR(150) NOT NULL UNIQUE,
    senha           VARCHAR(255) NOT NULL,
    criado_em       DATETIME DEFAULT NOW()
);

-- ── TABELA: computadores ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS computadores (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    numero          VARCHAR(20)  NOT NULL UNIQUE,
    processador     VARCHAR(100),
    memoria_ram     VARCHAR(50),
    placa_video     VARCHAR(100),
    armazenamento   VARCHAR(100),
    monitor         VARCHAR(100),
    valor_hora      DECIMAL(8,2) NOT NULL,
    status          ENUM('livre','ocupado','manutencao') DEFAULT 'livre',
    horario_fim     DATETIME DEFAULT NULL,
    criado_em       DATETIME DEFAULT NOW()
);

-- Adiciona coluna caso o banco já exista (atualização segura)
ALTER TABLE computadores ADD COLUMN IF NOT EXISTS horario_fim DATETIME DEFAULT NULL;

-- ── TABELA: produtos ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    categoria       VARCHAR(50),
    descricao       TEXT,
    preco           DECIMAL(8,2) NOT NULL,
    estoque         INT DEFAULT 0,
    criado_em       DATETIME DEFAULT NOW()
);

-- ── FUNCIONÁRIO ADMIN PADRÃO ──────────────────────────────────
-- Login: CPF = 12345678910 | Senha: admin123
INSERT INTO funcionarios (nome, sobrenome, cpf, data_nascimento, telefone, cargo, salario, email, senha)
VALUES (
    'Admin',
    'Sistema',
    '12345678910',
    '1990-01-01',
    '(11) 99999-0000',
    'gerente',
    '5.000,00',
    'admin@cyberzone.com',
    'admin123'

)
ON DUPLICATE KEY UPDATE senha = 'admin123';
