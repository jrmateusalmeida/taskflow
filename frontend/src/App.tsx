
import { useEffect, useState } from 'react'

import { Sidebar } from './components/layout/Sidebar'

import {
  TaskProvider,
  useTaskStore
} from './features/tasks/TaskContext'

import { Dashboard } from './features/dashboard/Dashboard'
import { Kanban } from './features/tasks/Kanban'
import { Projects } from './features/projects/Projects'
import { Reports } from './features/reports/Reports'
import { Calendar } from './features/calendar/Calendar'

import {
  authService,
  type AuthUser
} from './services/authService'

// ========================================
// CONTEÚDO PRINCIPAL DO TASKFLOW
// ========================================

function TaskFlowContent({
  user,
  onLogout,
  onUserUpdated
}: {
  user: AuthUser
  onLogout: () => void
  onUserUpdated: (user: AuthUser) => void
}) {
  const [section, setSection] = useState('Visão geral')

  const {
    apiLoading,
    apiError,
    retryConnection
  } = useTaskStore()

  function renderSection() {
    switch (section) {
      case 'Tarefas':
        return <Kanban />

      case 'Projetos':
        return <Projects />

      case 'Relatórios':
        return <Reports />

      case 'Calendário':
        return <Calendar />

      case 'Visão geral':
        return <Dashboard />

      case 'Minha conta':
        return <AccountScreen user={user} onUserUpdated={onUserUpdated} />

      default:
        return (
          <main className="flex-1 p-10">
            <h1 className="text-3xl font-bold">
              {section}
            </h1>

            <p className="mt-4 text-slate-400">
              Módulo planejado para as próximas versões.
            </p>
          </main>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0e16] text-slate-100 lg:flex">

      <Sidebar
        active={section}
        onChange={setSection}
      />

      <div className="flex min-w-0 flex-1 flex-col">

        {/* BARRA DO USUÁRIO */}

        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#151625] px-6 py-4">

          <div className="min-w-0">

            <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
              Conta conectada
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-100">
              {user.name}
            </p>

            <p className="truncate text-xs text-slate-400">
              {user.email}
            </p>

          </div>

          <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSection('Minha conta')}
            className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20"
          >
            Minha conta
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-200"
          >
            Sair da conta
          </button>
          </div>

        </header>

        {/* CARREGAMENTO */}

        {apiLoading && (
          <div className="border-b border-violet-500/20 bg-violet-500/10 px-6 py-3 text-sm text-violet-200">

            <div className="flex items-center gap-3">

              <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />

              <span>
                Conectando ao servidor e carregando tarefas...
              </span>

            </div>

          </div>
        )}

        {/* ERROS DA API */}

        {apiError && !apiLoading && (
          <div
            role="alert"
            className="border-b border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-200"
          >

            <div className="flex flex-wrap items-center justify-between gap-4">

              <div>

                <p className="font-semibold text-red-300">
                  Não foi possível conectar ao servidor
                </p>

                <p className="mt-1 text-red-200/80">
                  {apiError}
                </p>

              </div>

              <button
                type="button"
                onClick={() => void retryConnection()}
                className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 font-semibold text-red-100 transition hover:bg-red-500/20"
              >
                Tentar novamente
              </button>

            </div>

          </div>
        )}

        {/* CONTEÚDO PRINCIPAL */}

        {!apiLoading && !apiError && renderSection()}

      </div>
    </div>
  )
}

// ========================================
// MINHA CONTA
// ========================================

function AccountScreen({
  user,
  onUserUpdated
}: {
  user: AuthUser
  onUserUpdated: (user: AuthUser) => void
}) {
  const [name, setName] = useState(user.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    setName(user.name)
  }, [user.name])

  async function handleSave(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setError('')
    setSuccess('')

    const normalizedName = name.trim()
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setError('O nome deve ter entre 2 e 100 caracteres.')
      return
    }

    const token = authService.getToken()
    if (!token) {
      window.dispatchEvent(new Event('taskflow:session-expired'))
      return
    }

    setSaving(true)
    try {
      const response = await fetch('http://localhost:8080/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: normalizedName })
      })

      if (response.status === 401) {
        if (authService.getToken() === token) {
          authService.logout()
          window.dispatchEvent(new Event('taskflow:session-expired'))
        }
        return
      }

      if (!response.ok) {
        throw new Error(`Não foi possível atualizar o perfil (${response.status}).`)
      }

      const updated = await response.json() as AuthUser
      // Não aplica respostas de uma sessão anterior.
      if (authService.getToken() !== token) return
      onUserUpdated({ userId: updated.userId, name: updated.name, email: updated.email })
      setSuccess('Nome atualizado com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (changingPassword) return

    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Preencha todos os campos de senha.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('A confirmação da nova senha não coincide.')
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('A nova senha deve ser diferente da senha atual.')
      return
    }

    const token = authService.getToken()
    if (!token) {
      window.dispatchEvent(new Event('taskflow:session-expired'))
      return
    }

    setChangingPassword(true)
    try {
      const response = await fetch('http://localhost:8080/api/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (response.status === 401) {
        if (authService.getToken() === token) {
          authService.logout()
          window.dispatchEvent(new Event('taskflow:session-expired'))
        }
        return
      }
      if (authService.getToken() !== token) return

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Não foi possível alterar a senha. Confira a senha atual e tente novamente.')
        }
        throw new Error(`Não foi possível alterar a senha (${response.status}).`)
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setPasswordSuccess('Senha alterada com sucesso! Use a nova senha no próximo login.')
    } catch (err) {
      if (authService.getToken() === token) {
        setPasswordError(err instanceof Error ? err.message : 'Erro ao alterar a senha.')
      }
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <main className="flex-1 p-6 lg:p-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Workspace / Minha conta</p>
      <h1 className="mt-4 text-3xl font-bold text-white">Minha conta</h1>
      <p className="mt-2 text-slate-400">Gerencie os dados do seu perfil.</p>

      <div className="mt-8 max-w-xl rounded-2xl border border-white/10 bg-[#151625] p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Dados pessoais</h2>
        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div>
            <label htmlFor="account-name" className="mb-2 block text-sm text-slate-300">Nome completo</label>
            <input
              id="account-name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              value={name}
              onChange={event => setName(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label htmlFor="account-email" className="mb-2 block text-sm text-slate-300">E-mail</label>
            <input
              id="account-email"
              type="email"
              value={user.email}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 text-slate-400"
            />
            <p className="mt-2 text-xs text-slate-500">A alteração de e-mail ainda não está disponível.</p>
          </div>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          {success && <p role="status" className="text-sm text-emerald-400">{success}</p>}
          <button
            type="submit"
            disabled={saving || name.trim() === user.name}
            className="rounded-lg bg-violet-600 px-5 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
      <div className="mt-6 max-w-xl rounded-2xl border border-white/10 bg-[#151625] p-6">
        <h2 className="text-lg font-semibold">Segurança</h2>
        <p className="mt-2 text-sm text-slate-400">Atualize sua senha com segurança. Você precisará informar a senha atual.</p>
        <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
          <div>
            <label htmlFor="current-password" className="mb-2 block text-sm text-slate-300">Senha atual</label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={event => setCurrentPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm text-slate-300">Nova senha</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
              placeholder="Mínimo de 8 caracteres"
              className="w-full rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label htmlFor="confirm-new-password" className="mb-2 block text-sm text-slate-300">Confirmar nova senha</label>
            <input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmNewPassword}
              onChange={event => setConfirmNewPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>
          {passwordError && <p role="alert" className="text-sm text-red-400">{passwordError}</p>}
          {passwordSuccess && <p role="status" className="text-sm text-emerald-400">{passwordSuccess}</p>}
          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-lg bg-violet-600 px-5 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changingPassword ? 'Alterando senha...' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </main>
  )
}

// ========================================
// LOGIN E CADASTRO
// ========================================

function LoginScreen({
  onLogin
}: {
  onLogin: (user: AuthUser) => void
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function changeMode(nextMode: 'login' | 'register') {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    setError('')
    setSuccess('')

    const normalizedEmail = email.trim().toLowerCase()

    if (mode === 'register') {
      if (name.trim().length < 2) {
        setError('Informe um nome com pelo menos 2 caracteres.')
        return
      }
      if (password.length < 8) {
        setError('A senha deve ter pelo menos 8 caracteres.')
        return
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        await authService.register({
          name: name.trim(),
          email: normalizedEmail,
          password
        })
        setPassword('')
        setConfirmPassword('')
        setMode('login')
        setSuccess('Conta criada com sucesso! Entre com seu e-mail e senha.')
      } else {
        const authenticatedUser = await authService.login(
          normalizedEmail,
          password
        )
        onLogin(authenticatedUser)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível concluir a operação.'
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-700 bg-[#0d0e16] px-4 py-3 outline-none focus:border-violet-500'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0e16] px-4 py-8 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-violet-500/20 bg-[#151625] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">TaskFlow</h1>
          <p className="mt-2 text-sm text-violet-300">DARK PRO</p>
          <p className="mt-4 text-sm text-slate-400">
            {mode === 'login'
              ? 'Entre na sua conta para continuar'
              : 'Crie sua conta gratuitamente'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'register' && (
            <div>
              <label htmlFor="register-name" className="mb-2 block text-sm text-slate-300">
                Nome completo
              </label>
              <input
                id="register-name"
                type="text"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Seu nome"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-2 block text-sm text-slate-300">
              E-mail
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="seu@email.com"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-2 block text-sm text-slate-300">
              Senha
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder={mode === 'register' ? 'Mínimo de 8 caracteres' : 'Digite sua senha'}
              className={inputClass}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="register-confirm-password" className="mb-2 block text-sm text-slate-300">
                Confirmar senha
              </label>
              <input
                id="register-confirm-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                placeholder="Repita sua senha"
                className={inputClass}
              />
            </div>
          )}

          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          {success && <p role="status" className="text-sm text-emerald-400">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 px-4 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? (mode === 'login' ? 'Entrando...' : 'Criando conta...')
              : (mode === 'login' ? 'Entrar' : 'Criar minha conta')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {mode === 'login' ? 'Ainda não tem uma conta? ' : 'Já tem uma conta? '}
          <button
            type="button"
            disabled={loading}
            onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}
            className="font-semibold text-violet-300 hover:text-violet-200 disabled:opacity-50"
          >
            {mode === 'login' ? 'Criar conta' : 'Entrar'}
          </button>
        </div>
      </div>
    </main>
  )
}

// ========================================
// APLICAÇÃO PRINCIPAL
// ========================================

export default function App() {

  const [user, setUser] = useState<AuthUser | null>(
    () => {
      if (!authService.isAuthenticated()) {
        return null
      }

      return authService.getUser()
    }
  )

  // ========================================
  // MONITORAR EXPIRAÇÃO DA SESSÃO
  // ========================================

  useEffect(() => {

    if (!user) {
      return
    }

    // Encerra a sessão e retorna ao login
    function handleSessionExpired() {
      authService.logout()
      setUser(null)
    }

    // Verifica se o token continua válido
    function checkSession() {
      if (!authService.isAuthenticated()) {
        handleSessionExpired()
      }
    }

    // Verifica periodicamente a cada 5 segundos
    const intervalId = window.setInterval(
      checkSession,
      5000
    )

    // Verifica quando o usuário retorna à aba
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        checkSession()
      }
    }

    // Escuta eventos de sessão expirada emitidos pela API
    window.addEventListener(
      'taskflow:session-expired',
      handleSessionExpired
    )

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    // Verifica a sessão imediatamente
    checkSession()

    // Remove listeners e intervalo ao desmontar
    return () => {
      window.clearInterval(intervalId)

      window.removeEventListener(
        'taskflow:session-expired',
        handleSessionExpired
      )

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )
    }

  }, [user])

  // ========================================
  // ATUALIZAR DADOS DA CONTA NA INTERFACE
  // ========================================

  function handleUserUpdated(updatedUser: AuthUser) {
    sessionStorage.setItem('taskflow_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  // ========================================
  // ENCERRAR SESSÃO
  // ========================================

  function handleLogout() {

    authService.logout()

    // Desmonta o dashboard e volta ao login
    setUser(null)
  }

  // ========================================
  // USUÁRIO NÃO AUTENTICADO
  // ========================================

  if (!user) {
    return (
      <LoginScreen
        onLogin={setUser}
      />
    )
  }

  // ========================================
  // USUÁRIO AUTENTICADO
  // ========================================

  return (
    <TaskProvider key={user.userId}>
      <TaskFlowContent
        user={user}
        onLogout={handleLogout}
        onUserUpdated={handleUserUpdated}
      />
    </TaskProvider>
  )
}
