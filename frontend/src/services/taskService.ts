
import type { Task, Status, Priority } from '../types/task'
import { authService } from './authService'

const API_URL = 'http://localhost:8080/api/tasks'

// ========================================
// TIPOS DA API
// ========================================

type ApiTask = {
  id: number
  title: string
  description?: string | null
  project: string
  status: string
  priority: string
  dueDate: string | null
  subtasks?: Task['subtasks'] | null
  comments?: Task['comments'] | null
  activity?: Task['activity'] | null
}

// ========================================
// CONVERSÃO DE STATUS
// ========================================

function toStatus(status: string): Status {
  switch (status) {
    case 'DONE':
    case 'COMPLETED':
    case 'Concluída':
      return 'Concluída'

    case 'IN_PROGRESS':
    case 'Em andamento':
      return 'Em andamento'

    default:
      return 'A fazer'
  }
}

// ========================================
// CONVERSÃO DE PRIORIDADE
// ========================================

function toPriority(priority: string): Priority {
  switch (priority) {
    case 'HIGH':
    case 'Alta':
      return 'Alta'

    case 'LOW':
    case 'Baixa':
      return 'Baixa'

    default:
      return 'Média'
  }
}

// ========================================
// CONVERTER API PARA REACT
// ========================================

function fromApi(task: ApiTask): Task {
  return {
    id: String(task.id),
    title: task.title,
    description: task.description ?? '',
    project: task.project,
    status: toStatus(task.status),
    priority: toPriority(task.priority),
    due: task.dueDate ?? '',
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks
      : [],
    comments: Array.isArray(task.comments)
      ? task.comments
      : [],
    activity: Array.isArray(task.activity)
      ? task.activity
      : []
  }
}

// ========================================
// CONVERTER REACT PARA API
// ========================================

function toApi(task: Omit<Task, 'id'>) {
  const statusMap: Record<Status, string> = {
    'A fazer': 'TODO',
    'Em andamento': 'IN_PROGRESS',
    'Concluída': 'DONE'
  }

  const priorityMap: Record<Priority, string> = {
    'Alta': 'HIGH',
    'Média': 'MEDIUM',
    'Baixa': 'LOW'
  }

  return {
    title: task.title,
    description: task.description ?? '',
    project: task.project,
    status: statusMap[task.status],
    priority: priorityMap[task.priority],
    dueDate: task.due || null,
    subtasks: task.subtasks ?? [],
    comments: task.comments ?? [],
    activity: task.activity ?? []
  }
}

// ========================================
// REQUISIÇÕES HTTP COM JWT
// ========================================

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {

  // Obtém o token e verifica sua expiração
  const token = authService.getToken()

  // Se a sessão já expirou, avisa o aplicativo
  if (!token) {
    window.dispatchEvent(
      new Event('taskflow:session-expired')
    )

    throw new Error(
      'Sua sessão expirou. Faça login novamente.'
    )
  }

  const headers = new Headers(options?.headers)

  headers.set('Content-Type', 'application/json')
  headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, {
    ...options,
    headers
  })

  // Token rejeitado pelo backend
  if (response.status === 401) {

    // Evita encerrar uma sessão nova por uma
    // resposta atrasada da sessão anterior
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
      `Erro na API de tarefas: ${response.status}`
    )
  }

  // Exclusão bem-sucedida
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

// ========================================
// SERVIÇO DE TAREFAS
// ========================================

export const taskService = {

  // LISTAR TAREFAS

  async list(): Promise<Task[]> {
    const data = await request<ApiTask[]>(API_URL)

    return data.map(fromApi)
  },

  // CRIAR TAREFA

  async create(
    task: Omit<Task, 'id'>
  ): Promise<Task> {

    const data = await request<ApiTask>(
      API_URL,
      {
        method: 'POST',
        body: JSON.stringify(toApi(task))
      }
    )

    return fromApi(data)
  },

  // ATUALIZAR TAREFA

  async update(task: Task): Promise<Task> {

    const data = await request<ApiTask>(
      `${API_URL}/${task.id}`,
      {
        method: 'PUT',
        body: JSON.stringify(toApi(task))
      }
    )

    return fromApi(data)
  },

  // EXCLUIR TAREFA

  async remove(id: string): Promise<void> {

    await request<void>(
      `${API_URL}/${id}`,
      {
        method: 'DELETE'
      }
    )
  }
}
