import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/auth.module.css';
import logoEb from '../assets/ebicon.png';
import { api } from '../services/api';

export function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [companhia, setCompanhia] = useState('');
  const [pg, setPg] = useState('');

  const [postos, setPostos] = useState<any[]>([]);
  const [companhias, setCompanhias] = useState<any[]>([]);

  // ── ESTADO DE LOADING PARA EVITAR CLIQUES DUPLOS E DADOS DUPLICADOS ─────────
  const [isLoading, setIsLoading] = useState(false);

  // ── ESTADO PARA EXIBIÇÃO DE MENSAGEM DE ERRO NA TELA ───────────────────────
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const response = await api.get('/auth/metadata');
        setPostos(response.data.postos);
        setCompanhias(response.data.companhias);
      } catch (err) {
        console.error('Erro ao buscar dados do banco:', err);
      }
    }
    fetchMetadata();
  }, []);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (senha !== senha2) {
      setErrorMsg('As senhas não coincidem!');
      return;
    }
    
    // Evita múltiplas submissões se já estiver carregando
    if (isLoading) return;

    setIsLoading(true);
    try {
      await api.post('/auth/register', { nome, email, senha, companhia, pg });
      alert('Cadastro realizado com sucesso!');
      navigate('/login');
    } catch (err: any) {
      // Coleta a mensagem de erro específica vinda da resposta da API
      const apiError = err.response?.data?.error || err.message;
      setErrorMsg(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles['auth-screen']}>
      <div className={styles['auth-card']} style={{ maxWidth: '480px' }}>
        <div className={styles['auth-logo']}>
          <img src={logoEb} alt="Brasão EB" />
          <span className={styles['auth-logo__title']}>Crie sua Conta</span>
          <span className={styles['auth-logo__sub']}>Preencha seus dados institucionais abaixo</span>
        </div>

        {/* Exibe mensagem de erro caso ocorra falha no cadastro */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 mb-4 text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form className={styles['auth-form']} onSubmit={handleCadastro}>
          <div className={styles['auth-field']}>
            <label htmlFor="inome">Nome Completo</label>
            <input
              className={styles['auth-input']}
              type="text"
              id="inome"
              placeholder="Digite seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className={styles['auth-field']}>
            <label htmlFor="iemail">Email</label>
            <input
              className={styles['auth-input']}
              type="email"
              id="iemail"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles['auth-form__row']}>
            <div className={styles['auth-field']}>
              <label htmlFor="ipg">Posto / Graduação</label>
              <select
                className={styles['auth-select']}
                id="ipg"
                value={pg}
                onChange={(e) => setPg(e.target.value)}
                required
              >
                <option value="" disabled>— Selecione —</option>
                {postos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className={styles['auth-field']}>
              <label htmlFor="icompanhia">Companhia</label>
              <select
                className={styles['auth-select']}
                id="icompanhia"
                value={companhia}
                onChange={(e) => setCompanhia(e.target.value)}
                required
              >
                <option value="" disabled>— Selecione —</option>
                {companhias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles['auth-form__row']}>
            <div className={styles['auth-field']}>
              <label htmlFor="isenha">Senha</label>
              <input
                className={styles['auth-input']}
                type="password"
                id="isenha"
                placeholder="Crie uma senha forte"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className={styles['auth-field']}>
              <label htmlFor="isenha2">Confirmar Senha</label>
              <input
                className={styles['auth-input']}
                type="password"
                id="isenha2"
                placeholder="Repita a senha"
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className={styles['auth-divider']} style={{ margin: '12px 0' }} />

          {/* Botão de envio desabilitado durante o carregamento para evitar duplicidade */}
          <button 
            className={`${styles['auth-btn']} ${styles['auth-btn--primary']}`} 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Cadastrando...' : 'Finalizar Cadastro'}
          </button>

          <button
            className={`${styles['auth-btn']} ${styles['auth-btn--secondary']}`}
            type="button"
            onClick={() => navigate('/login')}
          >
            Já tenho uma conta (Login)
          </button>
        </form>
      </div>
    </div>
  );
}

