import clsx from 'clsx'
import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'violet' | 'black' | 'white'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  type?: 'submit' | 'reset' | 'button'
  width?: string | number
  loading?: boolean
  disabled?: boolean
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

export function Button({ children, className, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'w-full block bg-indigo-400 px-4 rounded',
        { '!bg-gray-200 pointer-events-none': disabled },
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
