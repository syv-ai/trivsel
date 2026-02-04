import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Send, X } from "lucide-react"
import { toast } from "sonner"
import { OpenAPI } from "@/client"

interface SendSurveyDialogProps {
  studentId: string
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendSurveyDialog({
  studentId,
  studentName,
  open,
  onOpenChange,
}: SendSurveyDialogProps) {
  const queryClient = useQueryClient()
  const [showQuestion1, setShowQuestion1] = useState(false)
  const [showQuestion2, setShowQuestion2] = useState(false)
  const [question1, setQuestion1] = useState("")
  const [question2, setQuestion2] = useState("")

  const sendSurveyMutation = useMutation({
    mutationFn: async (customQuestions: string[] | null) => {
      const response = await fetch(
        `${OpenAPI.BASE}/api/v1/students/${studentId}/send-survey`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            custom_questions: customQuestions,
          }),
        }
      )
      if (!response.ok) {
        const text = await response.text()
        let errorMessage = "Kunne ikke sende trivselstjek"
        if (text) {
          try {
            const error = JSON.parse(text)
            errorMessage = error.detail || errorMessage
          } catch {
            errorMessage = text
          }
        }
        throw new Error(errorMessage)
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] })
      toast.success(data.message || "Trivselstjek sendt")
      handleClose()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleClose = () => {
    setShowQuestion1(false)
    setShowQuestion2(false)
    setQuestion1("")
    setQuestion2("")
    onOpenChange(false)
  }

  const handleSendWithoutQuestions = () => {
    sendSurveyMutation.mutate(null)
  }

  const handleSendWithQuestions = () => {
    const questions: string[] = []
    if (question1.trim()) questions.push(question1.trim())
    if (question2.trim()) questions.push(question2.trim())
    sendSurveyMutation.mutate(questions.length > 0 ? questions : null)
  }

  const handleAddQuestion1 = () => {
    setShowQuestion1(true)
  }

  const handleAddQuestion2 = () => {
    setShowQuestion2(true)
  }

  const handleRemoveQuestion1 = () => {
    setShowQuestion1(false)
    setQuestion1("")
    // If question 2 exists, move it to question 1
    if (showQuestion2) {
      setShowQuestion1(true)
      setQuestion1(question2)
      setShowQuestion2(false)
      setQuestion2("")
    }
  }

  const handleRemoveQuestion2 = () => {
    setShowQuestion2(false)
    setQuestion2("")
  }

  const hasCustomQuestions = showQuestion1 && question1.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send trivselstjek
          </DialogTitle>
          <DialogDescription>
            Send trivselstjek til <span className="font-medium">{studentName}</span>.
            Du kan valgfrit tilføje op til 2 ekstra spørgsmål.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Question 1 */}
          {showQuestion1 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="question1">Ekstra spørgsmål 1</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveQuestion1}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                id="question1"
                value={question1}
                onChange={(e) => setQuestion1(e.target.value)}
                placeholder="Skriv dit spørgsmål her..."
                className="min-h-[80px] rounded-xl resize-none"
              />
            </div>
          ) : null}

          {/* Question 2 */}
          {showQuestion2 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="question2">Ekstra spørgsmål 2</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveQuestion2}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                id="question2"
                value={question2}
                onChange={(e) => setQuestion2(e.target.value)}
                placeholder="Skriv dit spørgsmål her..."
                className="min-h-[80px] rounded-xl resize-none"
              />
            </div>
          ) : null}

          {/* Add question buttons */}
          {!showQuestion1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddQuestion1}
              className="w-full rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tilføj ekstra spørgsmål
            </Button>
          )}

          {showQuestion1 && !showQuestion2 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddQuestion2}
              className="w-full rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tilføj endnu et spørgsmål
            </Button>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!hasCustomQuestions ? (
            <Button
              onClick={handleSendWithoutQuestions}
              disabled={sendSurveyMutation.isPending}
              className="w-full sm:w-auto rounded-xl"
            >
              {sendSurveyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sender...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send trivselstjek
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendWithoutQuestions}
                disabled={sendSurveyMutation.isPending}
                className="w-full sm:w-auto rounded-xl"
              >
                Send uden ekstra spørgsmål
              </Button>
              <Button
                onClick={handleSendWithQuestions}
                disabled={sendSurveyMutation.isPending}
                className="w-full sm:w-auto rounded-xl"
              >
                {sendSurveyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sender...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send trivselstjek
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
