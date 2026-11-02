import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
export function Button({className, ...props}: ButtonHTMLAttributes<HTMLButtonElement>) {return <button className={cn('rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40',className)} {...props}/> }
