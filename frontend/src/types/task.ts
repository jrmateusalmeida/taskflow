export type Status = 'A fazer' | 'Em andamento' | 'Concluída'
export type Priority = 'Alta' | 'Média' | 'Baixa'
export type Task = { id:string; title:string; project:string; status:Status; priority:Priority; due:string; description?:string; subtasks?:{id:string;title:string;done:boolean}[]; comments?:{id:string;text:string;createdAt:string}[]; activity?:{id:string;message:string;createdAt:string}[] }
export type Project = {id:string;name:string;description:string;color:string}
