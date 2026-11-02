import { useEffect, useState } from 'react'
import type { Task } from '../../types/task'
const seed: Task[] = [
 {id:'1',title:'Definir arquitetura do TaskFlow',project:'TaskFlow',status:'Concluída',priority:'Alta',due:'2026-11-01'},
 {id:'2',title:'Construir dashboard Dark Pro',project:'TaskFlow',status:'Em andamento',priority:'Alta',due:'2026-11-03'},
 {id:'3',title:'Planejar autenticação de usuários',project:'Backend',status:'A fazer',priority:'Média',due:'2026-11-07'},
 {id:'4',title:'Documentar o projeto no GitHub',project:'Portfólio',status:'A fazer',priority:'Baixa',due:'2026-11-10'},
]
const key = 'taskflow.tasks.v1'
function initial(): Task[] { try { const raw=localStorage.getItem(key); if(raw) { const data:unknown=JSON.parse(raw); if(Array.isArray(data)) return data as Task[] } } catch { /* invalid local data */ } return seed }
export function useTasks() {
 const [tasks,setTasks]=useState<Task[]>(initial)
 useEffect(()=>{localStorage.setItem(key,JSON.stringify(tasks))},[tasks])
 function add(title:string,project:string,priority:Task['priority']) {setTasks(prev=>[{id:crypto.randomUUID(),title,project,status:'A fazer',priority,due:new Date().toISOString().slice(0,10)},...prev])}
 function advance(id:string) {setTasks(prev=>prev.map(t=>t.id!==id?t:{...t,status:t.status==='A fazer'?'Em andamento':t.status==='Em andamento'?'Concluída':'A fazer'}))}
 function remove(id:string) {setTasks(prev=>prev.filter(t=>t.id!==id))}
 return {tasks,add,advance,remove}
}
