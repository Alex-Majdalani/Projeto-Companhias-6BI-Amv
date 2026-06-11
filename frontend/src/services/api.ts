import axios from 'axios';

/**
 * Instância configurada do Axios para comunicação com o backend (Express).
 *
 * Comportamentos:
 *  1. Request Interceptor: Injeta automaticamente o Bearer Token JWT
 *     no cabeçalho Authorization de todas as requisições autenticadas.
 *
 *  2. Response Interceptor: Ao receber um erro HTTP 401 (Unauthorized),
 *     limpa os dados de sessão do localStorage e redireciona o usuário
 *     para a página de login. Isso garante que sessões expiradas ou
 *     inválidas sejam tratadas de forma automática e transparente.
 */
export const api = axios.create({
  baseURL: 'http://localhost:3333/api',
});

// Interceptor de Requisição: adiciona o token JWT no header de cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@SisGAdm:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de Resposta: trata respostas 401 (token inválido ou expirado)
api.interceptors.response.use(
  (response) => response, // Resposta bem-sucedida → retorna normalmente
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado detectado pelo backend
      console.warn('[api] Token expirado ou inválido. Encerrando sessão.');
      localStorage.removeItem('@SisGAdm:token');
      localStorage.removeItem('@SisGAdm:refreshToken');
      // Redireciona para o login usando o navegador diretamente (fora do contexto React)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
