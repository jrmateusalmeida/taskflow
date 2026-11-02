
import { useMemo, useState } from 'react'

import { useTaskStore } from '../tasks/TaskContext'

import type {
  Task,
  Priority,
  Status
} from '../../types/task'

// ========================================
// TIPOS E CONSTANTES
// ========================================

const weekDays = [
  'Dom',
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb'
]

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric'
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
})

const priorities: Priority[] = [
  'Alta',
  'Média',
  'Baixa'
]

const statuses: Status[] = [
  'A fazer',
  'Em andamento',
  'Concluída'
]

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function statusColor(status: Status): string {
  switch (status) {
    case 'Concluída':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'

    case 'Em andamento':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30'

    default:
      return 'bg-violet-500/15 text-violet-300 border-violet-500/30'
  }
}

function priorityColor(priority: Priority): string {
  switch (priority) {
    case 'Alta':
      return 'text-red-400'

    case 'Média':
      return 'text-amber-400'

    default:
      return 'text-emerald-400'
  }
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export function Calendar() {
  const {
    tasks,
    projects,
    addTask,
    updateTask,
    removeTask,
    setStatus,
    apiLoading,
    apiError
  } = useTaskStore()

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date()

    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  })

  const [selectedDate, setSelectedDate] = useState(
    () => dateKey(new Date())
  )

  // Modal de criação e edição
  const [showModal, setShowModal] = useState(false)

  // Modal de detalhes
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Tarefa selecionada
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Tarefa em edição
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Campos do formulário
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [project, setProject] = useState('')
  const [priority, setPriority] = useState<Priority>('Média')
  const [status, setTaskStatus] = useState<Status>('A fazer')
  const [dueDate, setDueDate] = useState(
    () => dateKey(new Date())
  )

  const todayKey = dateKey(new Date())

  // ========================================
  // ABRIR MODAL DE CRIAÇÃO
  // ========================================

  function openCreateModal(date: string) {
    setSelectedDate(date)
    setDueDate(date)

    setEditingTask(null)

    setTitle('')
    setDescription('')
    setProject(projects[0]?.name ?? '')
    setPriority('Média')
    setTaskStatus('A fazer')

    setShowDetailsModal(false)
    setShowModal(true)
  }

  // ========================================
  // ABRIR DETALHES DA TAREFA
  // ========================================

  function openTaskDetails(task: Task) {
    setSelectedTask(task)
    setShowDetailsModal(true)
  }

  // ========================================
  // ABRIR EDIÇÃO DA TAREFA
  // ========================================

  function openEditModal() {
    if (!selectedTask) return

    const task = selectedTask

    setEditingTask(task)

    setTitle(task.title)
    setDescription(task.description ?? '')
    setProject(task.project === 'Sem projeto' ? '' : task.project)
    setPriority(task.priority)
    setTaskStatus(task.status)
    setDueDate(task.due || todayKey)

    setSelectedDate(task.due || todayKey)

    if (task.due) {
      const [year, month] = task.due.split('-').map(Number)

      setCurrentMonth(
        new Date(year, month - 1, 1)
      )
    }

    setShowDetailsModal(false)
    setShowModal(true)
  }

  // ========================================
  // FECHAR MODAIS
  // ========================================

  function closeModal() {
    setShowModal(false)
    setEditingTask(null)
  }

  function closeDetailsModal() {
    setShowDetailsModal(false)
    setSelectedTask(null)
  }

  // ========================================
  // EXCLUIR TAREFA
  // ========================================

  function handleDeleteTask() {
    if (!selectedTask || apiLoading || apiError) return

    const confirmed = window.confirm(
      `Deseja realmente excluir a tarefa "${selectedTask.title}"?`
    )

    if (!confirmed) return

    removeTask(selectedTask.id)

    setShowDetailsModal(false)
    setSelectedTask(null)
  }

  // ========================================
  // CRIAR OU ATUALIZAR TAREFA
  // ========================================

  function handleSaveTask(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (
      !title.trim() ||
      !dueDate ||
      apiLoading ||
      apiError
    ) {
      return
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      project: project.trim() || 'Sem projeto',
      status,
      priority,
      due: dueDate
    }

    if (editingTask) {
      updateTask(editingTask.id, taskData)
    } else {
      const newTask: Omit<Task, 'id'> = {
        ...taskData,
        subtasks: [],
        comments: [],
        activity: []
      }

      addTask(newTask)
    }

    setSelectedDate(dueDate)

    const [year, month] = dueDate.split('-').map(Number)

    setCurrentMonth(
      new Date(year, month - 1, 1)
    )

    closeModal()
  }

  // ========================================
  // ORGANIZAR TAREFAS POR DATA
  // ========================================

  const tasksByDate = useMemo(() => {
    const result = new Map<string, Task[]>()

    for (const task of tasks) {
      if (!task.due) continue

      const existing = result.get(task.due) ?? []

      existing.push(task)

      result.set(task.due, existing)
    }

    return result
  }, [tasks])

  // ========================================
  // CONSTRUIR DIAS DO MÊS
  // ========================================

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const result: Array<Date | null> = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      result.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      result.push(new Date(year, month, day))
    }

    while (result.length % 7 !== 0) {
      result.push(null)
    }

    return result
  }, [currentMonth])

  // ========================================
  // TAREFAS DA DATA SELECIONADA
  // ========================================

  const selectedTasks = tasksByDate.get(selectedDate) ?? []

  const selectedDateObject = new Date(
    `${selectedDate}T12:00:00`
  )

  // ========================================
  // NAVEGAR ENTRE MESES
  // ========================================

  function changeMonth(offset: number) {
    const next = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1
    )

    setCurrentMonth(next)
    setSelectedDate(dateKey(next))
  }

  function goToToday() {
    const today = new Date()

    setCurrentMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    )

    setSelectedDate(dateKey(today))
  }

  // ========================================
  // ESTATÍSTICAS
  // ========================================

  const monthPrefix = dateKey(currentMonth).slice(0, 7)

  const monthTasks = tasks.filter(
    task => task.due?.startsWith(monthPrefix)
  )

  const pendingTasks = monthTasks.filter(
    task => task.status !== 'Concluída'
  )

  const completedTasks = monthTasks.filter(
    task => task.status === 'Concluída'
  )

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <main className="flex-1 p-6 lg:p-10">

      <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
        Workspace / Calendário
      </p>

      <h1 className="mt-4 text-3xl font-bold text-white">
        Calendário
      </h1>

      <p className="mt-2 text-slate-400">
        Organize suas tarefas e acompanhe seus prazos.
      </p>

      {/* ESTATÍSTICAS */}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">

        <StatCard
          title="Tarefas no mês"
          value={monthTasks.length}
          color="text-violet-300"
        />

        <StatCard
          title="Pendentes"
          value={pendingTasks.length}
          color="text-amber-300"
        />

        <StatCard
          title="Concluídas"
          value={completedTasks.length}
          color="text-emerald-300"
        />

      </div>

      {/* CALENDÁRIO */}

      <div className="mt-8 rounded-2xl border border-white/10 bg-[#151625] p-5">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <h2 className="text-xl font-semibold capitalize">
            {monthFormatter.format(currentMonth)}
          </h2>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Mês anterior"
              className="rounded-lg border border-white/10 px-4 py-2 hover:bg-white/10"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg border border-violet-500/30 px-4 py-2 text-sm text-violet-300 hover:bg-violet-500/10"
            >
              Hoje
            </button>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Próximo mês"
              className="rounded-lg border border-white/10 px-4 py-2 hover:bg-white/10"
            >
              ›
            </button>

          </div>

        </div>

        {/* DIAS DA SEMANA */}

        <div className="grid grid-cols-7 gap-1 sm:gap-2">

          {weekDays.map(day => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-slate-400"
            >
              {day}
            </div>
          ))}

          {/* DIAS DO MÊS */}

          {calendarDays.map((day, index) => {

            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-20 rounded-lg bg-white/[0.02] sm:min-h-28"
                />
              )
            }

            const key = dateKey(day)
            const dayTasks = tasksByDate.get(key) ?? []

            const isToday = key === todayKey
            const isSelected = key === selectedDate

            return (
              <div
                key={key}
                className={[
                  'min-h-20 min-w-0 overflow-hidden rounded-lg border p-1 transition sm:min-h-28 sm:p-2',
                  isSelected
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-white/10 bg-[#0d0e16] hover:border-violet-500/40'
                ].join(' ')}
              >

                <button
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  aria-label={`Selecionar ${dateFormatter.format(day)}`}
                  className="block"
                >
                  <span
                    className={[
                      'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                      isToday
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-300 hover:bg-white/10'
                    ].join(' ')}
                  >
                    {day.getDate()}
                  </span>
                </button>

                <div className="mt-2 space-y-1">

                  {dayTasks.slice(0, 2).map(task => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => openTaskDetails(task)}
                      title={`Ver detalhes: ${task.title}`}
                      className={[
                        'block w-full truncate rounded border px-1 py-1 text-left text-[10px] transition hover:brightness-125',
                        statusColor(task.status)
                      ].join(' ')}
                    >
                      {task.title}
                    </button>
                  ))}

                  {dayTasks.length > 2 && (
                    <p className="text-[10px] text-slate-400">
                      +{dayTasks.length - 2} tarefas
                    </p>
                  )}

                </div>

              </div>
            )
          })}

        </div>

        <p className="mt-4 text-xs text-slate-500">
          Selecione um dia para visualizar suas tarefas. Clique em uma tarefa para abrir seus detalhes.
        </p>

      </div>

      {/* TAREFAS DO DIA SELECIONADO */}

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#151625] p-6">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <h2 className="text-lg font-semibold">
            Tarefas de {dateFormatter.format(selectedDateObject)}
          </h2>

          <button
            type="button"
            onClick={() => openCreateModal(selectedDate)}
            disabled={apiLoading || Boolean(apiError)}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Nova tarefa
          </button>

        </div>

        {selectedTasks.length === 0 ? (

          <p className="mt-4 text-sm text-slate-400">
            Nenhuma tarefa programada para esta data.
          </p>

        ) : (

          <div className="mt-5 space-y-3">

            {selectedTasks.map(task => {

              const projectData = projects.find(
                item => item.name === task.project
              )

              return (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0d0e16] p-4"
                >

                  <button
                    type="button"
                    onClick={() => openTaskDetails(task)}
                    className="min-w-0 flex-1 text-left"
                  >

                    <h3 className="font-semibold text-white transition hover:text-violet-300">
                      {task.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {projectData?.name ?? task.project}
                      {' • '}
                      Prioridade: {task.priority}
                    </p>

                    <p className="mt-1 text-xs text-violet-400">
                      Ver detalhes →
                    </p>

                  </button>

                  <select
                    aria-label={`Status da tarefa ${task.title}`}
                    value={task.status}
                    onChange={event =>
                      setStatus(
                        task.id,
                        event.target.value as Status
                      )
                    }
                    disabled={apiLoading || Boolean(apiError)}
                    className="rounded-lg border border-white/10 bg-[#151625] px-3 py-2 text-sm text-slate-200"
                  >

                    {statuses.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}

                  </select>

                </div>
              )
            })}

          </div>
        )}

      </div>

      {/* ========================================
          MODAL DE DETALHES DA TAREFA
      ======================================== */}

      {showDetailsModal && selectedTask && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              closeDetailsModal()
            }
          }}
        >

          <div className="my-auto w-full max-w-lg rounded-2xl border border-violet-500/20 bg-[#151625] p-6 shadow-2xl">

            <div className="mb-6 flex items-start justify-between gap-4">

              <div className="min-w-0">

                <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Detalhes da tarefa
                </p>

                <h2 className="mt-2 break-words text-2xl font-bold text-white">
                  {selectedTask.title}
                </h2>

              </div>

              <button
                type="button"
                onClick={closeDetailsModal}
                aria-label="Fechar"
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-white/10 hover:text-white"
              >
                ×
              </button>

            </div>

            <div className="space-y-5">

              {/* DESCRIÇÃO */}

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Descrição
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-300">
                  {selectedTask.description?.trim() || 'Nenhuma descrição informada.'}
                </p>
              </div>

              {/* PROJETO */}

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Projeto
                </p>

                <p className="mt-2 text-sm text-slate-200">
                  {selectedTask.project || 'Sem projeto'}
                </p>
              </div>

              {/* PRIORIDADE */}

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Prioridade
                </p>

                <p className={`mt-2 text-sm font-semibold ${priorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </p>
              </div>

              {/* STATUS */}

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Status
                </p>

                <span className={`mt-2 inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold ${statusColor(selectedTask.status)}`}>
                  {selectedTask.status}
                </span>
              </div>

              {/* VENCIMENTO */}

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Data de vencimento
                </p>

                <p className="mt-2 text-sm text-slate-200">
                  {selectedTask.due
                    ? dateFormatter.format(
                        new Date(`${selectedTask.due}T12:00:00`)
                      )
                    : 'Sem data definida'}
                </p>
              </div>

            </div>

            {/* ERRO DA API */}

            {apiError && (
              <p className="mt-5 text-sm text-red-400">
                {apiError}
              </p>
            )}

            {/* AÇÕES */}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={apiLoading || Boolean(apiError)}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Excluir tarefa
              </button>

              <button
                type="button"
                onClick={openEditModal}
                disabled={apiLoading || Boolean(apiError)}
                className="rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Editar tarefa
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ========================================
          MODAL DE CRIAÇÃO / EDIÇÃO
      ======================================== */}

      {showModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >

          <div className="my-auto w-full max-w-lg rounded-2xl border border-violet-500/20 bg-[#151625] p-6 shadow-2xl">

            {/* CABEÇALHO */}

            <div className="mb-6 flex items-center justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Calendário
                </p>

                <h2 className="mt-2 text-xl font-bold text-white">
                  {editingTask ? 'Editar tarefa' : 'Nova tarefa'}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {dueDate
                    ? dateFormatter.format(
                        new Date(`${dueDate}T12:00:00`)
                      )
                    : ''}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Fechar"
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-white/10 hover:text-white"
              >
                ×
              </button>

            </div>

            {/* FORMULÁRIO */}

            <form
              onSubmit={handleSaveTask}
              className="space-y-5"
            >

              {/* TÍTULO */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Título da tarefa *
                </label>

                <input
                  type="text"
                  required
                  maxLength={150}
                  autoFocus
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  placeholder="Ex.: Entregar relatório"
                  className="w-full rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 text-white outline-none transition focus:border-violet-500"
                />

              </div>

              {/* DESCRIÇÃO */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Descrição
                </label>

                <textarea
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Descreva os detalhes da tarefa..."
                  className="w-full resize-none rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 text-white outline-none transition focus:border-violet-500"
                />

              </div>

              {/* PROJETO */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Projeto
                </label>

                <select
                  value={project}
                  onChange={event => setProject(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 text-white outline-none focus:border-violet-500"
                >

                  <option value="">
                    Sem projeto
                  </option>

                  {projects.map(item => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}

                </select>

              </div>

              {/* PRIORIDADE E STATUS */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Prioridade
                  </label>

                  <select
                    value={priority}
                    onChange={event =>
                      setPriority(event.target.value as Priority)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 text-white outline-none focus:border-violet-500"
                  >

                    {priorities.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}

                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={event =>
                      setTaskStatus(event.target.value as Status)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 text-white outline-none focus:border-violet-500"
                  >

                    {statuses.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}

                  </select>

                </div>

              </div>

              {/* DATA */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Data de vencimento *
                </label>

                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={event => setDueDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 text-white outline-none focus:border-violet-500"
                />

              </div>

              {/* ERRO DA API */}

              {apiError && (
                <p className="text-sm text-red-400">
                  {apiError}
                </p>
              )}

              {/* BOTÕES */}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    !title.trim() ||
                    !dueDate ||
                    apiLoading ||
                    Boolean(apiError)
                  }
                  className="rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingTask ? 'Salvar alterações' : 'Criar tarefa'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  )
}

// ========================================
// CARD DE ESTATÍSTICA
// ========================================

function StatCard({
  title,
  value,
  color
}: {
  title: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#151625] p-5">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className={`mt-3 text-3xl font-bold ${color}`}>
        {value}
      </p>

    </div>
  )
}
