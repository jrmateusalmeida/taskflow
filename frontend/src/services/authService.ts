
const API_URL = 'http://localhost:8080/api/auth'

const TOKEN_KEY = 'taskflow_token'
const USER_KEY = 'taskflow_user'

export type AuthUser = {
  userId: number
  name: string
  email: string
}

export type LoginResponse = AuthUser & {
  token: string
  tokenType: string
}

export type RegisterRequest = {
  name: string
  email: string
  password: string
}

export type RegisterResponse = {
  id: number
  name: string
  email: string
}

// ========================================
// LER RESPOSTAS DA API
// ========================================

async function readResponse<T>(
  response: Response
): Promise<T> {

  if (!response.ok) {

    if (response.status === 401) {
      throw new Error('E-mail ou senha inválidos.')
    }

    if (response.status === 409) {
      throw new Error('Este e-mail já está cadastrado.')
    }

    throw new Error(
      `Não foi possível concluir a operação (${response.status}).`
    )
  }

  return response.json() as Promise<T>
}

// ========================================
// VERIFICAR EXPIRAÇÃO DO JWT
// ========================================

function isTokenExpired(token: string): boolean {

  try {

    const parts = token.split('.')

    if (parts.length !== 3) {
      return true
    }

    const payloadBase64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const payload = JSON.parse(
      atob(payloadBase64)
    ) as { exp?: unknown }

    // Sem data de expiração, não aceitamos
    if (
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp)
    ) {
      return true
    }

    // JWT utiliza segundos; Date.now() usa milissegundos
    return Date.now() >= payload.exp * 1000

  } catch {

    // Token malformado
    return true
  }
}

// ========================================
// SERVIÇO DE AUTENTICAÇÃO
// ========================================

export const authService = {

  // LOGIN

  async login(
    email: string,
    password: string
  ): Promise<AuthUser> {

    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const data = await readResponse<LoginResponse>(response)

    if (isTokenExpired(data.token)) {
      throw new Error(
        'O servidor retornou um token inválido ou expirado.'
      )
    }

    const user: AuthUser = {
      userId: data.userId,
      name: data.name,
      email: data.email
    }

    sessionStorage.setItem(TOKEN_KEY, data.token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))

    return user
  },

  // CADASTRO

  async register(
    data: RegisterRequest
  ): Promise<RegisterResponse> {

    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    return readResponse<RegisterResponse>(response)
  },

  // LOGOUT

  logout(): void {

    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  },

  // OBTER TOKEN VÁLIDO

  getToken(): string | null {

    const token = sessionStorage.getItem(TOKEN_KEY)

    if (!token) {
      return null
    }

    if (isTokenExpired(token)) {
      this.logout()
      return null
    }

    return token
  },

  // OBTER USUÁRIO

  getUser(): AuthUser | null {

    const token = this.getToken()

    if (!token) {
      return null
    }

    const saved = sessionStorage.getItem(USER_KEY)

    if (!saved) {
      return null
    }

    try {

      const user = JSON.parse(saved) as AuthUser

      if (
        typeof user.userId !== 'number' ||
        typeof user.name !== 'string' ||
        typeof user.email !== 'string'
      ) {
        return null
      }

      return user

    } catch {

      return null
    }
  },

  // VERIFICAR AUTENTICAÇÃO

  isAuthenticated(): boolean {

    return this.getToken() !== null &&
           this.getUser() !== null
  }
}
