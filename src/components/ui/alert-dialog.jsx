import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger
export const AlertDialogPortal = AlertDialogPrimitive.Portal

export const AlertDialogOverlay = React.forwardRef(function Overlay(
  { className = "", ...props },
  ref
) {
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      className={"fixed inset-0 z-50 bg-black/60 backdrop-blur-sm " + className}
      {...props}
    />
  )
})

/**
 * Allow passing overlayProps to control the overlay's event behavior.
 */
export const AlertDialogContent = React.forwardRef(function Content(
  { className = "", overlayProps = {}, ...props },
  ref
) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay {...overlayProps} />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={
          "fixed z-50 left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 " +
          "rounded-2xl border border-platerly-border bg-platerly-card p-5 shadow-xl " +
          "focus:outline-none " +
          className
        }
        {...props}
      />
    </AlertDialogPortal>
  )
})

export const AlertDialogHeader = ({ className = "", ...props }) => (
  <div className={"mb-3 " + className} {...props} />
)
export const AlertDialogFooter = ({ className = "", ...props }) => (
  <div className={"mt-4 flex gap-2 justify-end " + className} {...props} />
)

export const AlertDialogTitle = React.forwardRef(function Title(
  { className = "", ...props },
  ref
) {
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={"text-lg font-semibold text-platerly-text " + className}
      {...props}
    />
  )
})

export const AlertDialogDescription = React.forwardRef(function Description(
  { className = "", ...props },
  ref
) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={"text-sm text-platerly-muted " + className}
      {...props}
    />
  )
})

export const AlertDialogAction = React.forwardRef(function Action(
  { className = "", ...props },
  ref
) {
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={
        "inline-flex items-center justify-center rounded-xl px-4 py-2 " +
        "bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400 " +
        "text-white disabled:opacity-60 " +
        className
      }
      {...props}
    />
  )
})

export const AlertDialogCancel = React.forwardRef(function Cancel(
  { className = "", ...props },
  ref
) {
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={
        "inline-flex items-center justify-center rounded-xl px-4 py-2 " +
        "border border-platerly-border bg-transparent text-platerly-text " +
        "hover:bg-platerly-light focus:ring-2 focus:ring-emerald-400 " +
        "disabled:opacity-60 " +
        className
      }
      {...props}
    />
  )
})
