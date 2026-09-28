// ============================================================
//  js/main.js  —  ORQUESTRADOR
//  É o único lugar que fala com o backend (fetch) e com o
//  sessionStorage. Busca os dados crus, pergunta pro logic.js
//  o que decidir, manda o resultado pra ui.js mostrar, e só
//  então manda o PHP gravar a decisão. O PHP nunca decide nada
//  sozinho — só grava/lê o que o JavaScript manda.
// ============================================================

import * as logic from './logic.js';
import * as ui    from './ui.js';

const CHAVE_SESSAO = 'cz_sessao'; // sessionStorage: dura só a aba, como um login


// ── Comunicação com o PHP (só CRUD — sem decisão nenhuma) ────

function caminhoBackend() {
    return window.location.pathname.includes('/view/') ? '../backend' : 'backend';
}

async function pedir(caminho, opcoes = {}) {
    const resposta = await fetch(`${caminhoBackend()}/${caminho}`, {
        headers: { 'Content-Type': 'application/json' },
        ...opcoes
    });
    const texto = await resposta.text();
    return texto ? JSON.parse(texto) : {};
}

async function listar(entidade)          { return await pedir(`${entidade}.php`); }
async function buscarPorId(entidade, id) { return await pedir(`${entidade}.php?id=${id}`); }
async function inserir(entidade, dados)  { return await pedir(`${entidade}.php`, { method: 'POST', body: JSON.stringify(dados) }); }
async function atualizar(entidade, id, dados) { return await pedir(`${entidade}.php?id=${id}`, { method: 'PUT', body: JSON.stringify(dados) }); }
async function remover(entidade, id)     { return await pedir(`${entidade}.php?id=${id}`, { method: 'DELETE' }); }


// ════════════════════════════════════════════════════════════
//  AUTENTICAÇÃO
// ════════════════════════════════════════════════════════════

async function realizarLogin() {
    const cpf   = ui.lerValor('cpf-login');
    const senha = ui.lerValorBruto('senha-login');

    if (!cpf || !senha) { ui.mostrarFeedback('Preencha CPF e senha.', 'erro'); return; }

    const funcionarios = await listar('funcionarios');           // PHP só devolve a lista
    const funcionario  = logic.autenticar(funcionarios, cpf, senha); // JS decide se está certo

    if (!funcionario) { ui.mostrarFeedback('CPF ou senha incorretos.', 'erro'); return; }

    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({
        id: funcionario.id, nome: funcionario.nome, cargo: funcionario.cargo
    }));

    ui.mostrarFeedback(`Bem-vindo, ${funcionario.nome}!`);

    const isInView = window.location.pathname.includes('/view/');
    setTimeout(() => {
        window.location.href = isInView ? 'home.html' : 'view/home.html';
    }, 1000);
}

function realizarLogoutView() {
    sessionStorage.removeItem(CHAVE_SESSAO);
    window.location.href = '../index.html';
}

function verificarSessao() {
    const isInView = window.location.pathname.includes('/view/');
    const isLoginPage = window.location.pathname.includes('login.html') ||
                        window.location.pathname.includes('recuperar-senha.html') ||
                        window.location.pathname.includes('redefinir-senha.html');

    const dadosSessao = sessionStorage.getItem(CHAVE_SESSAO);

    if (dadosSessao) {
        const sessao = JSON.parse(dadosSessao);
        ui.definirTexto('nome-usuario-logado', `Olá, ${sessao.nome}`);
    } else if (isInView && !isLoginPage) {
        window.location.href = '../index.html';
    }
}


// ════════════════════════════════════════════════════════════
//  RECUPERAR / REDEFINIR SENHA
// ════════════════════════════════════════════════════════════

let _recuperarId = null; // guarda o id enquanto a página não recarrega

async function recuperarSenha() {
    const cpf   = ui.lerValor('cpf-recuperar');
    const email = ui.lerValor('email-recuperar');

    if (!cpf || !email) { ui.mostrarFeedback('Preencha CPF e email.', 'erro'); return; }

    const funcionarios = await listar('funcionarios');
    const funcionario  = logic.contaParaRecuperacao(funcionarios, cpf, email); // JS confere

    if (!funcionario) { ui.mostrarFeedback('Conta não encontrada.', 'erro'); return; }

    _recuperarId = funcionario.id;
    ui.mostrarFeedback(`Conta de ${funcionario.nome} verificada!`);
    ui.mostrarElemento('form-recuperar-senha', false);
    ui.mostrarElemento('form-nova-senha', true);
}

async function redefinirSenha() {
    const novaSenha = ui.lerValor('nova-senha');
    const confirmar = ui.lerValor('confirmar-nova-senha');

    if (!novaSenha || !confirmar) { ui.mostrarFeedback('Preencha todos os campos.', 'erro'); return; }
    if (novaSenha !== confirmar)  { ui.mostrarFeedback('As senhas não coincidem.', 'erro'); return; }
    if (!_recuperarId) { ui.mostrarFeedback('Sessão inválida. Refaça a verificação.', 'erro'); return; }

    await atualizar('funcionarios', _recuperarId, { senha: novaSenha }); // PHP só grava
    _recuperarId = null;

    ui.mostrarFeedback('Senha alterada com sucesso!');
    setTimeout(() => { window.location.href = '../index.html'; }, 2000);
}


// ════════════════════════════════════════════════════════════
//  CADASTROS
// ════════════════════════════════════════════════════════════

async function cadastrarCliente() {
    const payload = {
        nome:            ui.lerValor('nome-cliente'),
        sobrenome:       ui.lerValor('sobrenome-cliente'),
        cpf:             ui.lerValor('cpf-cliente'),
        data_nascimento: ui.lerValor('data-nascimento-cliente'),
        telefone:        ui.lerValor('telefone-cliente'),
        email:           ui.lerValor('email-cliente')
    };

    if (!logic.camposObrigatoriosPreenchidos(payload, ['nome', 'sobrenome', 'cpf', 'email'])) {
        ui.mostrarFeedback('Preencha todos os campos obrigatórios.', 'erro'); return;
    }

    const clientes = await listar('clientes');
    if (logic.existeCpfOuEmailDuplicado(clientes, payload.cpf, payload.email)) {
        ui.mostrarFeedback('CPF ou e-mail já cadastrado.', 'erro'); return;
    }

    const resultado = await inserir('clientes', payload);
    if (resultado.erro) { ui.mostrarFeedback('Erro ao cadastrar: ' + resultado.erro, 'erro'); return; }

    ui.mostrarFeedback('✅ Cliente cadastrado com sucesso!');
    document.getElementById('form-cliente').reset();
}

async function cadastrarFuncionario() {
    const payload = {
        nome:            ui.lerValor('nome-funcionario'),
        sobrenome:       ui.lerValor('sobrenome-funcionario'),
        cpf:             ui.lerValor('cpf-funcionario'),
        data_nascimento: ui.lerValor('data-nascimento-funcionario'),
        telefone:        ui.lerValor('telefone-funcionario'),
        cargo:           ui.lerValor('cargo-funcionario'),
        salario:         ui.lerValor('salario-funcionario'),
        email:           ui.lerValor('email-funcionario'),
        senha:           ui.lerValorBruto('senha-funcionario')
    };

    if (!logic.camposObrigatoriosPreenchidos(payload, ['nome', 'sobrenome', 'cpf', 'cargo', 'email', 'senha'])) {
        ui.mostrarFeedback('Preencha todos os campos obrigatórios.', 'erro'); return;
    }

    const funcionarios = await listar('funcionarios');
    if (logic.existeCpfOuEmailDuplicado(funcionarios, payload.cpf, payload.email)) {
        ui.mostrarFeedback('CPF ou e-mail já cadastrado.', 'erro'); return;
    }

    const resultado = await inserir('funcionarios', payload);
    if (resultado.erro) { ui.mostrarFeedback('Erro ao cadastrar: ' + resultado.erro, 'erro'); return; }

    ui.mostrarFeedback('✅ Funcionário cadastrado com sucesso!');
    document.getElementById('form-funcionario').reset();
}

async function cadastrarComputador() {
    const payload = {
        numero:        ui.lerValor('numero-computador'),
        processador:   ui.lerValor('processador-computador'),
        memoria_ram:   ui.lerValor('memoria-ram-computador'),
        placa_video:   ui.lerValor('placa-video-computador'),
        armazenamento: ui.lerValor('armazenamento-computador'),
        monitor:       ui.lerValor('monitor-computador'),
        valor_hora:    logic.paraNumero(ui.lerValor('valor-hora-computador')),
        status:        ui.lerValor('status-computador') || 'livre'
    };

    if (!payload.numero || !payload.valor_hora) {
        ui.mostrarFeedback('Preencha número e valor por hora.', 'erro'); return;
    }

    const computadores = await listar('computadores');
    if (logic.existeNumeroDuplicado(computadores, payload.numero)) {
        ui.mostrarFeedback('Número/identificação já cadastrado.', 'erro'); return;
    }

    const resultado = await inserir('computadores', payload);
    if (resultado.erro) { ui.mostrarFeedback('Erro ao cadastrar: ' + resultado.erro, 'erro'); return; }

    ui.mostrarFeedback('✅ Computador cadastrado com sucesso!');
    document.getElementById('form-computador').reset();
}

async function cadastrarProduto() {
    const payload = {
        nome:      ui.lerValor('nome-produto'),
        categoria: ui.lerValor('categoria-produto'),
        descricao: ui.lerValor('descricao-produto'),
        preco:     logic.paraNumero(ui.lerValor('preco-produto')),
        estoque:   Number(ui.lerValor('estoque-produto')) || 0
    };

    if (!payload.nome || !payload.preco) {
        ui.mostrarFeedback('Nome e preço são obrigatórios.', 'erro'); return;
    }

    const resultado = await inserir('produtos', payload);
    if (resultado.erro) { ui.mostrarFeedback('Erro ao cadastrar: ' + resultado.erro, 'erro'); return; }

    ui.mostrarFeedback('✅ Produto cadastrado com sucesso!');
    document.getElementById('form-produto').reset();
}


// ════════════════════════════════════════════════════════════
//  VISUALIZAÇÃO
// ════════════════════════════════════════════════════════════

async function excluirRegistro(entidade, id, recarregarFn) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    await remover(entidade, id);
    ui.mostrarFeedback('Registro excluído com sucesso.');
    recarregarFn();
}

// ── Clientes ─────────────────────────────────────────────────
async function carregarClientes() {
    const clientes = await listar('clientes');
    ui.renderizarTabela(clientes, 'tbody-clientes', c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.nome} ${c.sobrenome}</td>
            <td>${c.cpf}</td>
            <td>${c.telefone || '—'}</td>
            <td>${c.email}</td>
            <td>${c.data_nascimento || '—'}</td>
            <td>${c.criado_em || ''}</td>
            <td>
                <button class="botao-editar" onclick="irEditarCliente(${c.id})">Editar</button>
                <button class="botao-excluir" onclick="excluirRegistro('clientes', ${c.id}, carregarClientes)">Excluir</button>
            </td>
        </tr>`
    );
}

function irEditarCliente(id) {
    window.location.href = `editar-cliente.html?id=${id}`;
}

async function carregarDadosEditarCliente() {
    const id = ui.idDaUrl();
    if (!id) return;
    const c = await buscarPorId('clientes', id);
    if (!c || !c.id) { ui.mostrarFeedback('Cliente não encontrado.', 'erro'); return; }

    ui.definirValor('editar-cliente-id', c.id);
    ui.definirValor('editar-nome-cliente', c.nome);
    ui.definirValor('editar-sobrenome-cliente', c.sobrenome);
    ui.definirValor('editar-cpf-cliente', c.cpf);
    ui.definirValor('editar-data-nascimento-cliente', c.data_nascimento || '');
    ui.definirValor('editar-telefone-cliente', c.telefone || '');
    ui.definirValor('editar-email-cliente', c.email);
}

async function salvarEdicaoCliente() {
    const id = Number(ui.lerValor('editar-cliente-id'));

    const resultado = await atualizar('clientes', id, {
        nome:            ui.lerValor('editar-nome-cliente'),
        sobrenome:       ui.lerValor('editar-sobrenome-cliente'),
        cpf:             ui.lerValor('editar-cpf-cliente'),
        data_nascimento: ui.lerValor('editar-data-nascimento-cliente'),
        telefone:        ui.lerValor('editar-telefone-cliente'),
        email:           ui.lerValor('editar-email-cliente')
    });

    if (resultado.erro) { ui.mostrarFeedback('Erro ao atualizar: ' + resultado.erro, 'erro'); return; }
    ui.mostrarFeedback('✅ Cliente atualizado!');
    setTimeout(() => { window.location.href = 'visualizar-clientes.html'; }, 1200);
}

// ── Funcionários ─────────────────────────────────────────────
async function carregarFuncionarios() {
    const funcionarios = await listar('funcionarios');
    ui.renderizarTabela(funcionarios, 'tbody-funcionarios', f => `
        <tr>
            <td>${f.id}</td>
            <td>${f.nome} ${f.sobrenome}</td>
            <td>${f.cpf}</td>
            <td>${f.cargo}</td>
            <td>${f.salario || '—'}</td>
            <td>${f.telefone || '—'}</td>
            <td>${f.email}</td>
            <td>
                <button class="botao-editar" onclick="irEditarFuncionario(${f.id})">Editar</button>
                <button class="botao-excluir" onclick="excluirRegistro('funcionarios', ${f.id}, carregarFuncionarios)">Excluir</button>
            </td>
        </tr>`
    );
}

function irEditarFuncionario(id) {
    window.location.href = `editar-funcionario.html?id=${id}`;
}

async function carregarDadosEditarFuncionario() {
    const id = ui.idDaUrl();
    if (!id) return;
    const f = await buscarPorId('funcionarios', id);
    if (!f || !f.id) { ui.mostrarFeedback('Funcionário não encontrado.', 'erro'); return; }

    ui.definirValor('editar-funcionario-id', f.id);
    ui.definirValor('editar-nome-funcionario', f.nome);
    ui.definirValor('editar-sobrenome-funcionario', f.sobrenome);
    ui.definirValor('editar-cpf-funcionario', f.cpf);
    ui.definirValor('editar-data-nascimento-funcionario', f.data_nascimento || '');
    ui.definirValor('editar-telefone-funcionario', f.telefone || '');
    ui.definirValor('editar-cargo-funcionario', f.cargo);
    ui.definirValor('editar-salario-funcionario', f.salario || '');
    ui.definirValor('editar-email-funcionario', f.email);
}

async function salvarEdicaoFuncionario() {
    const id = Number(ui.lerValor('editar-funcionario-id'));

    const payload = {
        nome:            ui.lerValor('editar-nome-funcionario'),
        sobrenome:       ui.lerValor('editar-sobrenome-funcionario'),
        cpf:             ui.lerValor('editar-cpf-funcionario'),
        data_nascimento: ui.lerValor('editar-data-nascimento-funcionario'),
        telefone:        ui.lerValor('editar-telefone-funcionario'),
        cargo:           ui.lerValor('editar-cargo-funcionario'),
        salario:         ui.lerValor('editar-salario-funcionario'),
        email:           ui.lerValor('editar-email-funcionario')
    };
    const novaSenha = ui.lerValorBruto('editar-senha-funcionario');
    if (novaSenha) payload.senha = novaSenha; // só troca se veio preenchida

    const resultado = await atualizar('funcionarios', id, payload);
    if (resultado.erro) { ui.mostrarFeedback('Erro ao atualizar: ' + resultado.erro, 'erro'); return; }
    ui.mostrarFeedback('✅ Funcionário atualizado!');
    setTimeout(() => { window.location.href = 'visualizar-funcionarios.html'; }, 1200);
}

// ── Computadores ─────────────────────────────────────────────

/** Busca a lista, decide (com logic.js) quais venceram, e só então manda o PHP gravar cada uma */
async function computadoresAtualizados() {
    const computadores = await listar('computadores');
    const vencidos = logic.computadoresVencidos(computadores, new Date());

    for (const c of vencidos) {
        await atualizar('computadores', c.id, { status: 'livre', horario_fim: null });
        c.status = 'livre';
        c.horario_fim = null;
    }
    return computadores;
}

async function carregarComputadores() {
    const statusLabel = { livre: '🟢 Livre', ocupado: '🔴 Ocupado', manutencao: '🟡 Manutenção' };
    const computadores = await computadoresAtualizados();

    ui.renderizarTabela(computadores, 'tbody-computadores', c => `
        <tr>
            <td>${c.id}</td>
            <td><strong>${c.numero}</strong></td>
            <td>${c.processador || '—'}</td>
            <td>${c.memoria_ram || '—'}</td>
            <td>${c.placa_video || '—'}</td>
            <td>${c.armazenamento || '—'}</td>
            <td>R$ ${Number(c.valor_hora).toFixed(2).replace('.', ',')}</td>
            <td>${statusLabel[c.status] || c.status}</td>
            <td>
                <button class="botao-editar" onclick="irEditarComputador(${c.id})">Editar</button>
                <button class="botao-excluir" onclick="excluirRegistro('computadores', ${c.id}, carregarComputadores)">Excluir</button>
            </td>
        </tr>`
    );
}

function irEditarComputador(id) {
    window.location.href = `editar-computador.html?id=${id}`;
}

async function carregarDadosEditarComputador() {
    const id = ui.idDaUrl();
    if (!id) return;
    const c = await buscarPorId('computadores', id);
    if (!c || !c.id) { ui.mostrarFeedback('Computador não encontrado.', 'erro'); return; }

    ui.definirValor('editar-computador-id', c.id);
    ui.definirValor('editar-numero-computador', c.numero);
    ui.definirValor('editar-processador-computador', c.processador || '');
    ui.definirValor('editar-memoria-ram-computador', c.memoria_ram || '');
    ui.definirValor('editar-placa-video-computador', c.placa_video || '');
    ui.definirValor('editar-armazenamento-computador', c.armazenamento || '');
    ui.definirValor('editar-monitor-computador', c.monitor || '');
    ui.definirValor('editar-valor-hora-computador', Number(c.valor_hora).toFixed(2).replace('.', ','));
    ui.definirValor('editar-status-computador', c.status);
}

async function salvarEdicaoComputador() {
    const id = Number(ui.lerValor('editar-computador-id'));

    const resultado = await atualizar('computadores', id, {
        numero:        ui.lerValor('editar-numero-computador'),
        processador:   ui.lerValor('editar-processador-computador'),
        memoria_ram:   ui.lerValor('editar-memoria-ram-computador'),
        placa_video:   ui.lerValor('editar-placa-video-computador'),
        armazenamento: ui.lerValor('editar-armazenamento-computador'),
        monitor:       ui.lerValor('editar-monitor-computador'),
        valor_hora:    logic.paraNumero(ui.lerValor('editar-valor-hora-computador')),
        status:        ui.lerValor('editar-status-computador'),
        horario_fim:   null
    });

    if (resultado.erro) { ui.mostrarFeedback('Erro ao atualizar: ' + resultado.erro, 'erro'); return; }
    ui.mostrarFeedback('✅ Computador atualizado!');
    setTimeout(() => { window.location.href = 'visualizar-computadores.html'; }, 1200);
}

// ── Produtos ─────────────────────────────────────────────────
async function carregarProdutos() {
    const produtos = await listar('produtos');
    ui.renderizarTabela(produtos, 'tbody-produtos', p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.nome}</td>
            <td>${p.categoria || '—'}</td>
            <td>${p.descricao || '—'}</td>
            <td>R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</td>
            <td>${p.estoque}</td>
            <td>
                <button class="botao-editar" onclick="irEditarProduto(${p.id})">Editar</button>
                <button class="botao-excluir" onclick="excluirRegistro('produtos', ${p.id}, carregarProdutos)">Excluir</button>
            </td>
        </tr>`
    );
}

function irEditarProduto(id) {
    window.location.href = `editar-produto.html?id=${id}`;
}

async function carregarDadosEditarProduto() {
    const id = ui.idDaUrl();
    if (!id) return;
    const p = await buscarPorId('produtos', id);
    if (!p || !p.id) { ui.mostrarFeedback('Produto não encontrado.', 'erro'); return; }

    ui.definirValor('editar-produto-id', p.id);
    ui.definirValor('editar-nome-produto', p.nome);
    ui.definirValor('editar-categoria-produto', p.categoria || '');
    ui.definirValor('editar-descricao-produto', p.descricao || '');
    ui.definirValor('editar-preco-produto', Number(p.preco).toFixed(2).replace('.', ','));
    ui.definirValor('editar-estoque-produto', p.estoque);
}

async function salvarEdicaoProduto() {
    const id = Number(ui.lerValor('editar-produto-id'));

    const resultado = await atualizar('produtos', id, {
        nome:      ui.lerValor('editar-nome-produto'),
        categoria: ui.lerValor('editar-categoria-produto'),
        descricao: ui.lerValor('editar-descricao-produto'),
        preco:     logic.paraNumero(ui.lerValor('editar-preco-produto')),
        estoque:   Number(ui.lerValor('editar-estoque-produto')) || 0
    });

    if (resultado.erro) { ui.mostrarFeedback('Erro ao atualizar: ' + resultado.erro, 'erro'); return; }
    ui.mostrarFeedback('✅ Produto atualizado!');
    setTimeout(() => { window.location.href = 'visualizar-produtos.html'; }, 1200);
}


// ════════════════════════════════════════════════════════════
//  USO DE MÁQUINA
// ════════════════════════════════════════════════════════════

let _usoComputadorId = null;
let _usoClienteNome  = null;
let _usoCountdown    = null;

async function carregarComputadoresLivres() {
    const sel = document.getElementById('uso-maquina');
    if (!sel) return;

    const computadores = await computadoresAtualizados();
    const livres = logic.computadoresLivres(computadores); // JS decide quais estão livres

    sel.innerHTML = '<option value="" disabled selected>Selecione a máquina</option>';
    if (livres.length === 0) {
        sel.innerHTML += '<option disabled>Nenhuma máquina livre no momento</option>';
        return;
    }

    livres.forEach(c => {
        const opt = document.createElement('option');
        opt.value          = c.id;
        opt.dataset.numero = c.numero;
        opt.dataset.valor  = c.valor_hora;
        opt.textContent    = `${c.numero} – ${c.processador || 'PC'} (R$ ${Number(c.valor_hora).toFixed(2).replace('.', ',')}/h)`;
        sel.appendChild(opt);
    });
}

function aoSelecionarMaquina() {
    const sel = document.getElementById('uso-maquina');
    const opt = sel.options[sel.selectedIndex];
    if (!opt || !opt.dataset.valor) return;
    _usoComputadorId = sel.value;
    ui.definirValor('uso-valor-hora', Number(opt.dataset.valor).toFixed(2));
    ui.definirValor('uso-numero-maquina', opt.dataset.numero);
}

function calcularUsoMaquina() {
    const sel       = document.getElementById('uso-maquina');
    const opt       = sel.options[sel.selectedIndex];
    const horas     = Number(ui.lerValor('uso-horas'));
    const valorHora = Number(ui.lerValor('uso-valor-hora'));

    if (!_usoClienteNome) { ui.mostrarFeedback('Identifique o cliente antes de continuar.', 'erro'); return; }
    if (!opt || !opt.value) { ui.mostrarFeedback('Selecione uma máquina.', 'erro'); return; }
    if (!horas || horas <= 0) { ui.mostrarFeedback('Informe um número de horas válido.', 'erro'); return; }

    const total = logic.calcularTotal(horas, valorHora); // JS calcula
    ui.definirTexto('resultado-maquina', opt.dataset.numero);
    ui.definirTexto('resultado-cliente', _usoClienteNome);
    ui.definirTexto('resultado-duracao', horas + (horas === 1 ? ' hora' : ' horas'));
    ui.definirTexto('resultado-total', 'R$ ' + total.toFixed(2).replace('.', ','));
    ui.mostrarElemento('resultado-uso', true);
}

async function iniciarUso() {
    if (!_usoComputadorId) { ui.mostrarFeedback('Nenhuma máquina selecionada.', 'erro'); return; }

    const horas = Number(ui.lerValor('uso-horas')) || 0;
    const fim   = logic.calcularHorarioFim(new Date(), horas); // JS calcula o horário de fim
    const horarioFim = fim ? logic.formatarData(fim) : null;

    await atualizar('computadores', Number(_usoComputadorId), { status: 'ocupado', horario_fim: horarioFim });

    ui.mostrarFeedback('✅ Sessão iniciada! Máquina marcada como ocupada.');
    document.getElementById('btn-iniciar-uso').style.display   = 'none';
    document.getElementById('btn-finalizar-uso').style.display = 'inline-block';

    // ── Contador regressivo visual (simples, em segundos) ──
    if (horas > 0) {
        let restanteSegundos = horas * 3600;

        let cdEl = document.getElementById('uso-countdown');
        if (!cdEl) {
            cdEl = document.createElement('p');
            cdEl.id = 'uso-countdown';
            cdEl.style.cssText = 'margin-top:1vh; font-size:0.95vw; color: rgb(0,200,160); font-weight:bold;';
            document.getElementById('resultado-uso').appendChild(cdEl);
        }

        _usoCountdown = setInterval(() => {
            restanteSegundos -= 1;
            if (restanteSegundos <= 0) {
                cdEl.textContent = '⏰ Tempo encerrado! A máquina será liberada automaticamente.';
                clearInterval(_usoCountdown);
                _usoCountdown = null;
                carregarComputadoresLivres();
            } else {
                const minutos = restanteSegundos / 60;
                cdEl.textContent = `⏱ Tempo restante: ${minutos.toFixed(1)} min`;
            }
        }, 1000);
    }
}

async function finalizarUso(automatico = false) {
    if (!_usoComputadorId) { ui.mostrarFeedback('Nenhuma máquina ativa.', 'erro'); return; }

    if (_usoCountdown) { clearInterval(_usoCountdown); _usoCountdown = null; }
    await atualizar('computadores', Number(_usoComputadorId), { status: 'livre', horario_fim: null });

    const msg = automatico
        ? '⏰ Tempo encerrado! Máquina liberada automaticamente.'
        : '✅ Sessão finalizada! Máquina liberada.';
    ui.mostrarFeedback(msg);

    _usoComputadorId = null;
    _usoClienteNome  = null;
    ui.definirValor('uso-cpf-cliente', '');
    ui.definirTexto('uso-cliente-info', '');
    ui.habilitarFormulario('form-uso', false);
    ui.mostrarElemento('resultado-uso', false);
    document.getElementById('btn-iniciar-uso').style.display   = 'inline-block';
    document.getElementById('btn-finalizar-uso').style.display = 'none';
    const cdEl = document.getElementById('uso-countdown');
    if (cdEl) cdEl.remove();
    carregarComputadoresLivres();
}

async function buscarClienteUso() {
    const cpf  = ui.lerValor('uso-cpf-cliente');
    const info = document.getElementById('uso-cliente-info');

    if (!cpf) { ui.mostrarFeedback('Digite o CPF do cliente.', 'erro'); return; }

    const cliente = await pedir(`clientes.php?cpf=${cpf}`);

    if (!cliente || !cliente.id) {
        info.textContent = '❌ Cliente não encontrado. Verifique o CPF ou cadastre o cliente.';
        info.style.color = '#e74c3c';
        _usoClienteNome  = null;
        ui.habilitarFormulario('form-uso', false);
        ui.mostrarFeedback('Cliente não encontrado. Verifique o CPF ou cadastre o cliente.', 'erro');
        return;
    }

    _usoClienteNome  = `${cliente.nome} ${cliente.sobrenome}`;
    info.textContent = `✅ Cliente identificado: ${_usoClienteNome}`;
    info.style.color = 'rgb(0,200,160)';
    ui.habilitarFormulario('form-uso', true);
    ui.mostrarFeedback(`Cliente ${_usoClienteNome} identificado!`);
}


// ════════════════════════════════════════════════════════════
//  VENDA DE PRODUTO
// ════════════════════════════════════════════════════════════

let _vendaProdutoId    = null;
let _vendaEstoqueAtual = 0;
let _vendaClienteNome  = null;

async function carregarProdutosVenda() {
    const sel = document.getElementById('venda-produto');
    if (!sel) return;

    const produtos = await listar('produtos');
    sel.innerHTML = '<option value="" disabled selected>Selecione o produto</option>';

    produtos.forEach(p => {
        const opt = document.createElement('option');
        opt.value           = p.id;
        opt.dataset.preco   = p.preco;
        opt.dataset.estoque = p.estoque;
        opt.dataset.nome    = p.nome;
        opt.textContent     = `${p.nome} – R$ ${Number(p.preco).toFixed(2).replace('.', ',')} (estoque: ${p.estoque})`;
        if (p.estoque <= 0) opt.disabled = true;
        sel.appendChild(opt);
    });
}

function aoSelecionarProduto() {
    const sel = document.getElementById('venda-produto');
    const opt = sel.options[sel.selectedIndex];
    if (!opt || !opt.dataset.preco) return;
    _vendaProdutoId    = sel.value;
    _vendaEstoqueAtual = Number(opt.dataset.estoque);
    ui.definirValor('venda-preco', Number(opt.dataset.preco).toFixed(2));
    ui.definirTexto('venda-estoque-info', `Estoque disponível: ${_vendaEstoqueAtual}`);
    document.getElementById('venda-quantidade').max = _vendaEstoqueAtual;
}

function calcularVenda() {
    const sel        = document.getElementById('venda-produto');
    const opt        = sel.options[sel.selectedIndex];
    const quantidade = Number(ui.lerValor('venda-quantidade'));
    const preco      = Number(ui.lerValor('venda-preco'));

    if (!opt || !opt.value) { ui.mostrarFeedback('Selecione um produto.', 'erro'); return; }
    if (!quantidade || quantidade <= 0) { ui.mostrarFeedback('Informe uma quantidade válida.', 'erro'); return; }
    if (quantidade > _vendaEstoqueAtual) {
        ui.mostrarFeedback(`Estoque insuficiente! Disponível: ${_vendaEstoqueAtual}`, 'erro'); return;
    }

    const total = logic.calcularTotal(quantidade, preco);
    ui.definirTexto('venda-resultado-produto', opt.dataset.nome);
    ui.definirTexto('venda-resultado-quantidade', quantidade);
    ui.definirTexto('venda-resultado-total', 'R$ ' + total.toFixed(2).replace('.', ','));
    ui.mostrarElemento('resultado-venda', true);
}

async function confirmarVenda() {
    const quantidade = Number(ui.lerValor('venda-quantidade'));
    const cliente    = _vendaClienteNome || '';

    if (!_vendaProdutoId) { ui.mostrarFeedback('Nenhum produto selecionado.', 'erro'); return; }
    if (!cliente)         { ui.mostrarFeedback('Identifique o cliente antes de confirmar a venda.', 'erro'); return; }

    // Busca o produto atual pra ter o estoque mais recente antes de decidir
    const produto = await buscarPorId('produtos', Number(_vendaProdutoId));
    if (!produto || !produto.id) { ui.mostrarFeedback('Produto não encontrado.', 'erro'); return; }

    if (!logic.estoqueSuficiente(produto, quantidade)) {           // JS decide
        ui.mostrarFeedback(`Estoque insuficiente! Disponível: ${produto.estoque}`, 'erro'); return;
    }

    const estoqueAtualizado = logic.calcularNovoEstoque(produto, quantidade); // JS calcula
    const resultado = await atualizar('produtos', produto.id, { estoque: estoqueAtualizado }); // PHP só grava

    if (resultado.erro) { ui.mostrarFeedback('Erro ao registrar venda: ' + resultado.erro, 'erro'); return; }

    ui.mostrarFeedback('✅ Venda registrada! Estoque atualizado.');
    _vendaProdutoId    = null;
    _vendaEstoqueAtual = 0;
    _vendaClienteNome  = null;
    ui.definirValor('venda-cpf-cliente', '');
    ui.definirTexto('venda-cliente-info', '');
    ui.habilitarFormulario('form-venda', false);
    ui.mostrarElemento('resultado-venda', false);
    ui.definirTexto('venda-estoque-info', '');
    carregarProdutosVenda();
}

async function buscarClienteVenda() {
    const cpf  = ui.lerValor('venda-cpf-cliente');
    const info = document.getElementById('venda-cliente-info');

    if (!cpf) { ui.mostrarFeedback('Digite o CPF do cliente.', 'erro'); return; }

    const cliente = await pedir(`clientes.php?cpf=${cpf}`);

    if (!cliente || !cliente.id) {
        info.textContent = '❌ Cliente não encontrado. Verifique o CPF ou cadastre o cliente.';
        info.style.color = '#e74c3c';
        _vendaClienteNome = null;
        ui.habilitarFormulario('form-venda', false);
        ui.mostrarFeedback('Cliente não encontrado. Verifique o CPF ou cadastre o cliente.', 'erro');
        return;
    }

    _vendaClienteNome = `${cliente.nome} ${cliente.sobrenome}`;
    info.textContent  = `✅ Cliente identificado: ${_vendaClienteNome}`;
    info.style.color  = 'rgb(0,200,160)';
    ui.habilitarFormulario('form-venda', true);
    ui.mostrarFeedback(`Cliente ${_vendaClienteNome} identificado!`);
}


// ════════════════════════════════════════════════════════════
//  HOME — ESTATÍSTICAS E GRID DE MÁQUINAS
// ════════════════════════════════════════════════════════════

async function carregarEstatisticasHome() {
    const clientes     = await listar('clientes');
    const funcionarios = await listar('funcionarios');
    const computadores = await computadoresAtualizados();
    const produtos     = await listar('produtos');

    ui.definirTexto('stat-clientes', clientes.length);

    const elM = document.getElementById('stat-maquinas');
    if (elM) {
        const livres = logic.computadoresLivres(computadores).length;
        elM.textContent = `${livres} / ${computadores.length}`;
    }

    ui.definirTexto('stat-funcionarios', funcionarios.length);

    const elP = document.getElementById('stat-produtos');
    if (elP) {
        let totalEstoque = 0;
        produtos.forEach(p => { totalEstoque += Number(p.estoque) || 0; });
        elP.textContent = totalEstoque;
    }
}

async function carregarMaquinasHome() {
    const grid = document.getElementById('maquinas-grid');
    if (!grid) return;

    const list = await computadoresAtualizados();

    if (list.length === 0) {
        grid.innerHTML = '<p style="color:#aaa; padding:2vh 2vw;">Nenhuma máquina cadastrada ainda.</p>';
        return;
    }

    grid.innerHTML = '';
    list.forEach(c => {
        const statusClass = c.status === 'livre' ? 'badge-livre'
                          : c.status === 'ocupado' ? 'badge-ocupado'
                          : 'badge-manutencao';
        const statusLabel = c.status === 'livre' ? 'Livre'
                          : c.status === 'ocupado' ? 'Ocupado'
                          : 'Manutenção';
        const preco = Number(c.valor_hora).toFixed(2).replace('.', ',');

        const specs = [
            c.processador   ? c.processador   : null,
            c.memoria_ram   ? c.memoria_ram   : null,
            c.placa_video   ? c.placa_video   : null,
            c.armazenamento ? c.armazenamento : null
        ].filter(Boolean);

        const card = document.createElement('article');
        card.className = 'maquina-card';
        card.innerHTML = `
            <h3>${c.numero}</h3>
            ${specs[0] ? `<p>${specs[0]}${specs[1] ? ' | ' + specs[1] : ''}</p>` : ''}
            ${specs[2] ? `<p>${specs[2]}${specs[3] ? ' | ' + specs[3] : ''}</p>` : ''}
            <p class="preco">R$ ${preco} / hora</p>
            <span class="badge-status ${statusClass}">${statusLabel}</span>`;
        grid.appendChild(card);
    });
}


// ════════════════════════════════════════════════════════════
//  INICIALIZAÇÃO AUTOMÁTICA
// ════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
    verificarSessao();

    if (document.getElementById('tbody-clientes'))     carregarClientes();
    if (document.getElementById('tbody-funcionarios')) carregarFuncionarios();
    if (document.getElementById('tbody-computadores')) carregarComputadores();
    if (document.getElementById('tbody-produtos'))     carregarProdutos();

    if (document.getElementById('uso-maquina'))   carregarComputadoresLivres();
    if (document.getElementById('venda-produto')) carregarProdutosVenda();

    if (document.getElementById('editar-cliente-id'))     carregarDadosEditarCliente();
    if (document.getElementById('editar-funcionario-id')) carregarDadosEditarFuncionario();
    if (document.getElementById('editar-computador-id'))  carregarDadosEditarComputador();
    if (document.getElementById('editar-produto-id'))     carregarDadosEditarProduto();

    if (document.getElementById('stat-clientes'))  carregarEstatisticasHome();
    if (document.getElementById('maquinas-grid'))  carregarMaquinasHome();
});


// ════════════════════════════════════════════════════════════
//  REGISTRO GLOBAL
//  Um <script type="module"> não expõe suas funções pro HTML
//  sozinho. As telas chamam essas funções com onclick="..." no
//  HTML, então elas precisam virar propriedades de "window".
// ════════════════════════════════════════════════════════════

window.realizarLogin = realizarLogin;
window.realizarLogoutView = realizarLogoutView;
window.recuperarSenha = recuperarSenha;
window.redefinirSenha = redefinirSenha;
window.cadastrarCliente = cadastrarCliente;
window.cadastrarFuncionario = cadastrarFuncionario;
window.cadastrarComputador = cadastrarComputador;
window.cadastrarProduto = cadastrarProduto;
window.excluirRegistro = excluirRegistro;
window.irEditarCliente = irEditarCliente;
window.carregarDadosEditarCliente = carregarDadosEditarCliente;
window.salvarEdicaoCliente = salvarEdicaoCliente;
window.irEditarFuncionario = irEditarFuncionario;
window.carregarDadosEditarFuncionario = carregarDadosEditarFuncionario;
window.salvarEdicaoFuncionario = salvarEdicaoFuncionario;
window.irEditarComputador = irEditarComputador;
window.carregarDadosEditarComputador = carregarDadosEditarComputador;
window.salvarEdicaoComputador = salvarEdicaoComputador;
window.irEditarProduto = irEditarProduto;
window.carregarDadosEditarProduto = carregarDadosEditarProduto;
window.salvarEdicaoProduto = salvarEdicaoProduto;
window.carregarComputadoresLivres = carregarComputadoresLivres;
window.aoSelecionarMaquina = aoSelecionarMaquina;
window.calcularUsoMaquina = calcularUsoMaquina;
window.iniciarUso = iniciarUso;
window.finalizarUso = finalizarUso;
window.buscarClienteUso = buscarClienteUso;
window.carregarProdutosVenda = carregarProdutosVenda;
window.aoSelecionarProduto = aoSelecionarProduto;
window.calcularVenda = calcularVenda;
window.confirmarVenda = confirmarVenda;
window.buscarClienteVenda = buscarClienteVenda;
window.carregarClientes = carregarClientes;
window.carregarFuncionarios = carregarFuncionarios;
window.carregarComputadores = carregarComputadores;
window.carregarProdutos = carregarProdutos;
