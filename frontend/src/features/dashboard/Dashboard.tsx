
import { useState } from 'react'

import {
  Activity,
  CheckCircle2,
  Clock3,
  ListTodo,
  Plus,
  Database,
  CalendarDays
} from 'lucide-react'

import { useTaskStore } from '../tasks/TaskContext'
import { TaskModal } from '../tasks/TaskModal'

export function Dashboard() {
  const {
    tasks,
    projects,
    apiLoading,
    apiError
  } = useTaskStore()

  const [open, setOpen] = useState(false)

  // ========================================
  // INDICADORES
  // ========================================

  const done = tasks.filter(
    task => task.status === 'Concluída'
  ).length

  const ongoing = tasks.filter(
    task => task.status === 'Em andamento'
  ).length

  const pending = tasks.filter(
    task => task.status === 'A fazer'
  ).length

  const pct = tasks.length
    ? Math.round((done / tasks.length) * 100)
    : 0

  // ========================================
  // PRÓXIMAS ENTREGAS
  // ========================================

  const upcomingTasks = tasks
    .filter(task => task.status !== 'Concluída')
    .sort((a, b) =>
      (a.due || '9999-12-31').localeCompare(
        b.due || '9999-12-31'
      )
    )
    .slice(0, 6)

  // ========================================
  // CARTÕES DO DASHBOARD
  // ========================================

  const metrics = [
    {
      label: 'Total de tarefas',
      value: tasks.length,
      icon: ListTodo,
      color: 'text-violet-400'
    },
    {
      label: 'Concluídas',
      value: done,
      icon: CheckCircle2,
      color: 'text-emerald-400'
    },
    {
      label: 'Em andamento',
      value: ongoing,
      icon: Activity,
      color: 'text-sky-400'
    },
    {
      label: 'Pendentes',
      value: pending,
      icon: Clock3,
      color: 'text-amber-400'
    }
  ]

  return (
    <main className="min-w-0 flex-1 p-5 md:p-9 xl:p-12">
      <div className="mx-auto max-w-7xl">

        {/* CABEÇALHO */}

        <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[.2em] text-violet-400">
              WORKSPACE / VISÃO GERAL
            </div>

            <h1 className="mt-3 text-3xl font-bold md:text-4xl">
              Bom trabalho hoje 👋
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Acompanhe projetos, prioridades e entregas em um só lugar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold transition hover:bg-violet-500"
          >
            <Plus size={17} />
            Nova tarefa
          </button>
        </div>

        {/* INDICADORES */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(metric => (
            <div
              key={metric.label}
              className="rounded-2xl border border-white/10 bg-[#191b29] p-5"
            >
              <div className="mb-5 flex items-center justify-between text-sm text-slate-400">
                <span>{metric.label}</span>

                <metric.icon
                  size={20}
                  className={metric.color}
                />
              </div>

              <div className="text-3xl font-bold">
                {metric.value}
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Database
                  size={13}
                  className={
                    apiError
                      ? 'text-red-400'
                      : 'text-emerald-400'
                  }
                />

                <span>
                  {apiLoading
                    ? 'Carregando dados...'
                    : apiError
                      ? 'Conexão indisponível'
                      : 'Dados do PostgreSQL'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* PROGRESSO E PROJETOS */}

        <div className="mb-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">

          <section className="rounded-2xl border border-white/10 bg-[#191b29] p-6">
            <div className="mb-5 flex justify-between">
              <h2 className="font-semibold">
                Progresso geral
              </h2>

              <span className="text-violet-300">
                {pct}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="mt-4 text-sm text-slate-400">
              {done} de {tasks.length} tarefas concluídas
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#191b29] p-6">
            <h2 className="mb-4 font-semibold">
              Projetos ativos
            </h2>

            <div className="flex flex-wrap gap-2">
              {projects.map(project => (
                <span
                  key={project.id}
                  className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-200"
                >
                  {project.name}
                </span>
              ))}

              {projects.length === 0 && (
                <p className="text-sm text-slate-500">
                  Nenhum projeto cadastrado.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* PRÓXIMAS ENTREGAS */}

        <section className="rounded-2xl border border-white/10 bg-[#191b29] p-6">
          <div className="mb-5 flex items-center gap-2">
            <CalendarDays
              size={19}
              className="text-violet-400"
            />

            <h2 className="text-lg font-semibold">
              Próximas entregas
            </h2>
          </div>

          <div className="space-y-3">
            {upcomingTasks.map(task => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-[#11121d] p-4"
              >
                <div>
                  <div className="font-medium">
                    {task.title}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {task.project} · {task.status}
                  </div>
                </div>

                <div className="text-sm text-slate-400">
                  {task.due || 'Sem prazo'}
                </div>
              </div>
            ))}

            {upcomingTasks.length === 0 && (
              <p className="text-sm text-slate-500">
                {tasks.length === 0
                  ? 'Nenhuma tarefa cadastrada.'
                  : 'Todas as tarefas foram concluídas! 🎉'}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* MODAL DE CRIAÇÃO */}

      {open && (
        <TaskModal
          onClose={() => setOpen(false)}
        />
      )}
    </main>
  )
}
