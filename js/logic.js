// ============================================================
//  js/logic.js  —  REGRAS DE NEGÓCIO
//  Calcula, valida e decide. NÃO conhece a tela (nenhum
//  document.*) e NÃO fala com a rede (nenhum fetch). Recebe os
//  dados prontos (que o main.js já buscou) e devolve a decisão.
//  Funções puras: mesma entrada → mesma saída.
// ============================================================

/** Converte "10,50" ou "10.50" em número */
export function paraNumero(valor) {
    return Number(String(valor).replace(',', '.')) || 0;
}

/** Formata uma data no padrão "AAAA-MM-DD HH:MM:SS" (usado no horário de fim de uso) */
export function formatarData(data) {
    const pad = n => String(n).padStart(2, '0');
    return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())} `
         + `${pad(data.getHours())}:${pad(data.getMinutes())}:${pad(data.getSeconds())}`;
}

export function calcularTotal(quantidadeOuHoras, valorUnitario) {
    return Math.round(quantidadeOuHoras * valorUnitario * 100) / 100;
}


// ── Autenticação / recuperação de senha ─────────────────────
// (o PHP só devolve a lista de funcionários; quem decide é aqui)

export function autenticar(funcionarios, cpf, senha) {
    const encontrados = funcionarios.filter(f => f.cpf === cpf && f.senha === senha);
    return encontrados.length ? encontrados[0] : null;
}

export function contaParaRecuperacao(funcionarios, cpf, email) {
    const encontrados = funcionarios.filter(f => f.cpf === cpf && f.email === email);
    return encontrados.length ? encontrados[0] : null;
}


// ── Cadastro — validações e duplicidade ─────────────────────
// (o PHP só insere o que mandarem; quem confere duplicado é aqui)

export function camposObrigatoriosPreenchidos(payload, campos) {
    return campos.filter(campo => !payload[campo]).length === 0;
}

export function existeCpfOuEmailDuplicado(lista, cpf, email) {
    return lista.filter(item => item.cpf === cpf || item.email === email).length > 0;
}

export function existeNumeroDuplicado(computadores, numero) {
    return computadores.filter(c => c.numero === numero).length > 0;
}


// ── Computadores / uso de máquina ────────────────────────────

export function computadoresLivres(computadores) {
    return computadores.filter(c => c.status === 'livre');
}

/** Recebe a lista de computadores e a hora atual; devolve só os que já venceram e precisam ser liberados */
export function computadoresVencidos(computadores, agora) {
    return computadores.filter(c =>
        c.status === 'ocupado' &&
        c.horario_fim &&
        new Date(c.horario_fim.replace(' ', 'T')) <= agora
    );
}

export function calcularHorarioFim(agora, horas) {
    return horas > 0 ? new Date(agora.getTime() + horas * 3600000) : null;
}


// ── Produtos / venda ─────────────────────────────────────────

export function estoqueSuficiente(produto, quantidade) {
    return produto.estoque >= quantidade;
}

export function calcularNovoEstoque(produto, quantidade) {
    return produto.estoque - quantidade;
}
