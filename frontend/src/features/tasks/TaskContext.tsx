import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

import { taskService } from '../../services/taskService'
import { projectService } from '../../services/projectService'

import type { Task, Project, Status } from '../../types/task'

// ========================================
// TIPOS DO CONTEXTO
// ========================================

type State = {
  tasks: Task[]
  projects: Project[]
  apiLoading: boolean
  apiError: string | null
  retryConnection: () => Promise<void>
  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (
    id: string,
    changes: Partial<Omit<Task, 'id'>>
  ) => void
  removeTask: (id: string) => void
  addProject: (name: string, description: string) => void
  updateProject: (
    id: string,
    name: string,
    description: string
  ) => void
  removeProject: (id: string) => void
  setStatus: (id: string, status: Status) => void
}

const Context = createContext<State | null>(null)

// ========================================
// PROVIDER PRINCIPAL
// ========================================

export function TaskProvider({
  children
}: {
  children: React.ReactNode
}) {
  // Tarefas e projetos agora vêm do PostgreSQL.
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  // Referências com o estado mais recente, úteis nas operações em fila.
  const tasksRef = useRef<Task[]>([])
  const projectsRef = useRef<Project[]>([])
  const operationQueue = useRef<Promise<void>>(Promise.resolve())
  const requestVersion = useRef(0)

  const applyTasks = useCallback((next: Task[]) => {
    tasksRef.current = next
    setTasks(next)
  }, [])

  const applyProjects = useCallback((next: Project[]) => {
    projectsRef.current = next
    setProjects(next)
  }, [])

  function reportError(error: unknown) {
    console.error('Erro na API do TaskFlow:', error)
    setApiError('Não foi possível salvar a alteração no PostgreSQL.')
  }

  // ========================================
  // CARREGAR / RECONECTAR ÀS DUAS APIS
  // ========================================

  const retryConnection = useCallback(async () => {
    const version = ++requestVersion.current
    setApiLoading(true)
    setApiError(null)

    try {
      // Não recarrega dados enquanto há gravações pendentes.
      await operationQueue.current

      const [loadedTasks, loadedProjects] = await Promise.all([
        taskService.list(),
        projectService.list()
      ])

      if (version !== requestVersion.current) return

      applyTasks(loadedTasks)
      applyProjects(loadedProjects)
      setApiError(null)
    } catch (error) {
      if (version !== requestVersion.current) return

      console.error('Erro ao conectar ao backend:', error)
      setApiError('Não foi possível conectar às APIs do TaskFlow.')
    } finally {
      if (version === requestVersion.current) {
        setApiLoading(false)
      }
    }
  }, [applyTasks, applyProjects])

  useEffect(() => {
    void retryConnection()

    return () => {
      // Ignora respostas de carregamentos anteriores.
      requestVersion.current += 1
    }
  }, [retryConnection])

  // ========================================
  // FILA DE OPERAÇÕES DE GRAVAÇÃO
  // ========================================

  function enqueue(operation: () => Promise<void>) {
    operationQueue.current = operationQueue.current
      .then(operation)
      .catch(reportError)
  }

  // ========================================
  // CRUD DE TAREFAS
  // ========================================

  const addTask = (task: Omit<Task, 'id'>) => {
    if (apiLoading || apiError) return

    enqueue(async () => {
      const created = await taskService.create(task)
      applyTasks([created, ...tasksRef.current])
      setApiError(null)
    })
  }

  const updateTask = (
    id: string,
    changes: Partial<Omit<Task, 'id'>>
  ) => {
    if (apiLoading || apiError) return

    enqueue(async () => {
      const current = tasksRef.current.find(task => task.id === id)
      if (!current) return

      const updatedTask: Task = {
        ...current,
        ...changes,
        activity: [
          ...(changes.activity ?? current.activity ?? []),
          {
            id: crypto.randomUUID(),
            message: 'Tarefa atualizada',
            createdAt: new Date().toISOString()
          }
        ]
      }

      const saved = await taskService.update(updatedTask)
      applyTasks(
        tasksRef.current.map(task => task.id === id ? saved : task)
      )
      setApiError(null)
    })
  }

  const removeTask = (id: string) => {
    if (apiLoading || apiError) return

    enqueue(async () => {
      await taskService.remove(id)
      applyTasks(tasksRef.current.filter(task => task.id !== id))
      setApiError(null)
    })
  }

  const setStatus = (id: string, status: Status) => {
    updateTask(id, { status })
  }

  // ========================================
  // CRUD DE PROJETOS NO POSTGRESQL
  // ========================================

  const addProject = (name: string, description: string) => {
    if (apiLoading || apiError) return

    const cleanName = name.trim()
    if (!cleanName) return

    enqueue(async () => {
      const colors = ['#8b5cf6', '#38bdf8', '#34d399', '#f59e0b']
      const color = colors[projectsRef.current.length % colors.length]

      const created = await projectService.create({
        name: cleanName,
        description,
        color
      })

      applyProjects([...projectsRef.current, created])
      setApiError(null)
    })
  }

  const updateProject = (
    id: string,
    name: string,
    description: string
  ) => {
    if (apiLoading || apiError) return

    const cleanName = name.trim()
    if (!cleanName) return

    enqueue(async () => {
      const current = projectsRef.current.find(project => project.id === id)
      if (!current) return

      const nameChanged = current.name !== cleanName
      const hasTasks = tasksRef.current.some(
        task => task.project === current.name
      )

      // A API também impede renomear projetos com tarefas associadas.
      if (nameChanged && hasTasks) {
        console.warn('Não é possível renomear um projeto com tarefas.')
        return
      }

      const saved = await projectService.update({
        ...current,
        name: cleanName,
        description
      })

      applyProjects(
        projectsRef.current.map(project => project.id === id ? saved : project)
      )
      setApiError(null)
    })
  }

  const removeProject = (id: string) => {
    if (apiLoading || apiError) return

    enqueue(async () => {
      const current = projectsRef.current.find(project => project.id === id)
      if (!current) return

      const hasTasks = tasksRef.current.some(
        task => task.project === current.name
      )

      if (hasTasks) {
        console.warn('Não é possível excluir um projeto com tarefas.')
        return
      }

      await projectService.remove(id)
      applyProjects(projectsRef.current.filter(project => project.id !== id))
      setApiError(null)
    })
  }

  return (
    <Context.Provider
      value={{
        tasks,
        projects,
        apiLoading,
        apiError,
        retryConnection,
        addTask,
        updateTask,
        removeTask,
        addProject,
        updateProject,
        removeProject,
        setStatus
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useTaskStore() {
  const value = useContext(Context)

  if (!value) {
    throw new Error('TaskProvider ausente')
  }

  return value
}
