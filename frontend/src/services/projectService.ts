
import type { Project } from '../types/task'
import { authService } from './authService'

const API_URL = 'http://localhost:8080/api/projects'

// ========================================
// TIPOS DA API
// ========================================

type ApiProject = {
  id: number
  name: string
  description: string | null
  color: string | null
}

// ========================================
// CONVERTER DADOS DA API PARA O REACT
// ========================================

function fromApi(project: ApiProject): Project {
  return {
    id: String(project.id),
    name: project.name,
    description: project.description ?? '',
    color: project.color ?? '#8b5cf6'
  }
}

// ========================================
// CONVERTER DADOS DO REACT PARA A API
// ========================================

function toApi(project: Omit<Project, 'id'>) {
  return {
    name: project.name,
    description: project.description,
    color: project.color
  }
}

// ========================================
// REQUISIÇÕES HTTP COM AUTENTICAÇÃO JWT
// ========================================

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {

  // Recupera o token e verifica a expiração
  const token = authService.getToken()

  // Impede requisições sem uma sessão válida
  if (!token) {

    window.dispatchEvent(
      new Event('taskflow:session-expired')
    )

    throw new Error(
      'Sua sessão expirou. Faça login novamente.'
    )
  }

  // Prepara os cabeçalhos HTTP
  const headers = new Headers(options?.headers)

  headers.set('Content-Type', 'application/json')
  headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, {
    ...options,
    headers
  })

  // Token rejeitado pelo backend
  if (response.status === 401) {

    // Evita encerrar uma sessão nova por causa
    // de uma resposta atrasada da sessão anterior
    if (authService.getToken() === token) {

      authService.logout()

      window.dispatchEvent(
        new Event('taskflow:session-expired')
      )
    }

    throw new Error(
      'Sua sessão expirou ou foi invalidada. Faça login novamente.'
    )
  }

  // Outros erros da API
  if (!response.ok) {
    throw new Error(
      `Erro na API de projetos: ${response.status}`
    )
  }

  // Exclusão bem-sucedida
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

// ========================================
// SERVIÇO DE PROJETOS
// ========================================

export const projectService = {

  // LISTAR PROJETOS DO USUÁRIO

  async list(): Promise<Project[]> {

    const data = await request<ApiProject[]>(API_URL)

    return data.map(fromApi)
  },

  // CRIAR PROJETO

  async create(
    project: Omit<Project, 'id'>
  ): Promise<Project> {

    const data = await request<ApiProject>(
      API_URL,
      {
        method: 'POST',
        body: JSON.stringify(toApi(project))
      }
    )

    return fromApi(data)
  },

  // ATUALIZAR PROJETO

  async update(project: Project): Promise<Project> {

    const data = await request<ApiProject>(
      `${API_URL}/${project.id}`,
      {
        method: 'PUT',
        body: JSON.stringify(toApi(project))
      }
    )

    return fromApi(data)
  },

  // EXCLUIR PROJETO

  async remove(id: string): Promise<void> {

    await request<void>(
      `${API_URL}/${id}`,
      {
        method: 'DELETE'
      }
    )
  }
}
