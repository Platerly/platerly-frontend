/**
 * ConfirmDialog.jsx — Accessible, reusable confirmation dialog for Recipzee.
 *
 * Layer: Common UI / presentational.
 *
 * Built on top of Radix UI AlertDialog primitives (see alert-dialog.jsx) which
 * handle focus-trap, ARIA roles, and keyboard dismissal automatically.
 *
 * Two usage modes:
 *   1. Trigger mode (default): provide a `trigger` element or omit it for a
 *      default destructive button; the dialog opens when the trigger is clicked.
 *   2. Controlled mode: provide `open` + `onOpenChange` props and manage
 *      visibility externally (used by CommentsSection, CookbookRecipeCard, etc.).
 *
 * The `tone` prop switches the icon and button colour between danger (red) and
 * a neutral/confirmation style (emerald).
 *
 * Props:
 *   @prop {string}    [title]          — Dialog heading.
 *   @prop {string}    [description]    — Body text explaining the consequence.
 *   @prop {string}    [confirmLabel]   — Label for the confirm button.
 *   @prop {string}    [cancelLabel]    — Label for the cancel button.
 *   @prop {'danger'|'default'} [tone='danger'] — Visual style (red vs emerald).
 *   @prop {ReactNode} [icon]           — Custom icon element; falls back to Trash2/AlertTriangle.
 *   @prop {() => void|Promise<void>} [onConfirm]  — Async-safe confirm callback.
 *   @prop {() => void}               [onCancel]   — Called when cancelled (controlled mode).
 *   @prop {boolean}   [disabled=false] — Disables the trigger button.
 *   @prop {ReactNode} [trigger]        — Custom trigger element (trigger mode).
 *   @prop {boolean}   [open]           — Controlled open state.
 *   @prop {(open: boolean) => void} [onOpenChange] — Controlled state setter.
 */

import React from "react"
import { AlertTriangle, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import Button from "../ui/Button"
import { logger } from "../../utils/logger"

/**
 * Confirm dialog with two modes:
 * 1. Trigger mode (default): Pass a `trigger` element, dialog opens when clicked
 * 2. Controlled mode: Pass `open` and `onOpenChange` props to control visibility
 */
const ConfirmDialog = ({
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  icon,
  onConfirm,          // () => void | Promise<void>
  onCancel,           // () => void (for controlled mode)
  disabled = false,
  trigger,            // Trigger element (for trigger mode)
  open,               // Controlled open state (for controlled mode)
  onOpenChange,       // Controlled state handler (for controlled mode)
}) => {
  const isDanger = tone === "danger"
  const Icon = icon ? () => icon : isDanger ? Trash2 : AlertTriangle
  const isControlled = open !== undefined

  const stopBubble = (e) => e.stopPropagation?.()

  const handleConfirmClick = async () => {
    try {
      await onConfirm?.()
    } catch (err) {
      logger.error("ConfirmDialog onConfirm error:", err)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange?.(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && (
        <AlertDialogTrigger asChild>
          {trigger ?? (
            <Button
              variant={isDanger ? "destructive" : "default"}
              disabled={disabled}
              className={isDanger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
            >
              {isDanger ? <Trash2 className="mr-2 h-4 w-4" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              {confirmLabel}
            </Button>
          )}
        </AlertDialogTrigger>
      )}

      <AlertDialogContent
        className="border border-recipzee-border bg-recipzee-card text-recipzee-text"
        onClick={stopBubble}
        onMouseDown={stopBubble}
        onPointerDown={stopBubble}
        onKeyDown={stopBubble}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={isDanger ? "text-red-400" : "text-emerald-400"} />
            {title}
          </AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="text-recipzee-muted">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleCancel}
            className="border-recipzee-border bg-transparent text-recipzee-text hover:bg-recipzee-light"
          >
            {cancelLabel}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleConfirmClick}
            className={isDanger
              ? "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-400"
              : "bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400"}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialog
