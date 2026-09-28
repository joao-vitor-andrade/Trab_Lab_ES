// ============================================================
//  js/ui.js  —  INTERFACE (DOM)
//  Só sabe pintar a tela: ler valores dos campos, mostrar
//  mensagens, montar tabelas. Não sabe POR QUE — não valida
//  CPF duplicado, não calcula total, não mexe no localStorage.
// ============================================================

export function mostrarFeedback(msg, tipo = 'sucesso') {
    let div = document.getElementById('feedback-global');
    if (!div) {
        div = document.createElement('div');
        div.id = 'feedback-global';
        div.style.cssText = `
            position:fixed;top:80px;right:20px;z-index:9999;
            padding:14px 22px;border-radius:8px;font-weight:bold;
            font-size:0.95rem;box-shadow:0 4px 16px rgba(0,0,0,0.25);
            transition:opacity 0.4s;max-width:340px;cursor:pointer;`;
        div.addEventListener('click', () => { div.style.opacity = '0'; });
        document.body.appendChild(div);
    }
    div.style.background = tipo === 'sucesso' ? 'rgb(0,200,160)' : '#e74c3c';
    div.style.color = '#fff';
    div.textContent = msg;
    div.style.opacity = '1';
    clearTimeout(div._timer);
    div._timer = setTimeout(() => { div.style.opacity = '0'; }, 3500);
}

// ── Leitura/escrita simples de campos ────────────────────────

export function lerValor(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

/** Igual a lerValor, mas sem tirar espaços (usado em senha) */
export function lerValorBruto(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

export function definirValor(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor;
}

export function definirTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

export function mostrarElemento(id, mostrar) {
    const el = document.getElementById(id);
    if (el) el.style.display = mostrar ? 'block' : 'none';
}

export function idDaUrl() {
    return Number(new URLSearchParams(window.location.search).get('id'));
}

// ── Tabelas ───────────────────────────────────────────────────

/**
 * Monta a tabela linha por linha com forEach + createElement + appendChild,
 * igual ao padrão da Aula 5 (renderizarLista da lista de tarefas).
 * "gerarCelulasHtml" recebe um item e devolve só o conteúdo das <td>.
 */
export function renderizarTabela(lista, tbodyId, gerarCelulasHtml) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = ''; // limpa, igual ao exemplo da Aula 5

    if (!lista.length) {
        const linhaVazia = document.createElement('tr');
        linhaVazia.innerHTML = '<td colspan="10" style="text-align:center;padding:20px;color:#999;">Nenhum registro cadastrado ainda.</td>';
        tbody.appendChild(linhaVazia);
        return;
    }

    lista.forEach(item => {
        const linha = document.createElement('tr');
        linha.innerHTML = gerarCelulasHtml(item);
        tbody.appendChild(linha);
    });
}

// ── Bloqueio/desbloqueio de formulário (uso de máquina / venda) ──

export function habilitarFormulario(formId, habilitar) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.style.opacity       = habilitar ? '1' : '0.4';
    form.style.pointerEvents = habilitar ? 'auto' : 'none';
    if (!habilitar) form.reset();
}
