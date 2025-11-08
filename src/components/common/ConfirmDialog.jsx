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
import Button from "../ui/button"

const ConfirmDialog = ({
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  icon,
  onConfirm,          // () => void | Promise<void>
  disabled = false,
  trigger,            // your button/icon
}) => {
  const isDanger = tone === "danger"
  const Icon = icon ? () => icon : isDanger ? Trash2 : AlertTriangle

  // IMPORTANT:
  // - Do NOT control open state; let Radix handle open/close.
  // - Only stop bubbling on the dialog CONTENT bubble phase,
  //   so clicks don’t reach the clickable card, but Radix still sees them.
  const stopBubble = (e) => e.stopPropagation?.()

  const handleConfirmClick = async (e) => {
    // Let Radix close the dialog via <AlertDialogAction/> default behavior.
    // We just run the user’s onConfirm; if it throws, the dialog will already be closing,
    // which is acceptable for this destructive action UX.
    try {
      await onConfirm?.()
    } catch (err) {
      // optional: surface error via toast if you have one
      console.error("ConfirmDialog onConfirm error:", err)
    }
  }

  return (
    <AlertDialog>
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

      <AlertDialogContent
        className="border border-platerly-border bg-platerly-card text-platerly-text"
        // Stop React synthetic bubbling from reaching clickable parents (card/image/title).
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
            <AlertDialogDescription className="text-platerly-muted">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-platerly-border bg-transparent text-platerly-text hover:bg-platerly-light">
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
