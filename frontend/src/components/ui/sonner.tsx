'use client'

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      // theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'color-mix(var(--color-blue-6) 90%, transparent)',
          '--normal-text': 'var(--color-gold-2)',
          '--normal-border': 'var(--color-gold-4)',
          '--error-border': '#f00',
          '--border-radius': '0',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast rounded-500 bg-red-500',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
