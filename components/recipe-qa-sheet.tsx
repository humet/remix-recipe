'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai'
import { X, MessageCircle, Send, Loader2, AlertCircle, Sparkles, Check, RotateCcw } from 'lucide-react'
import { ImprovedRecipe } from '@/lib/recipe-types'

interface RecipeQASheetProps {
  isOpen: boolean
  onClose: () => void
  recipeContext: string
  recipe: ImprovedRecipe
  onRecipeUpdate: (recipe: ImprovedRecipe) => void
}

const SUGGESTED_QUESTIONS = [
  'What equipment do I need?',
  'Can I make this ahead of time?',
  'What should I serve with this?',
  'How do I store leftovers?',
]

export function RecipeQASheet({ isOpen, onClose, recipeContext, recipe, onRecipeUpdate }: RecipeQASheetProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [appliedToolCallIds] = useState(() => new Set<string>())

  const { messages, sendMessage, status, setMessages, stop, error, clearError, regenerate, addToolApprovalResponse } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ask-recipe',
      body: { recipeContext, recipe },
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  })

  const isReady = status === 'ready'

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  // Auto-apply recipe updates when tool output becomes available
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant' || !message.parts) continue
      for (const part of message.parts) {
        if (
          part.type === 'tool-modifyRecipe' &&
          part.state === 'output-available' &&
          !appliedToolCallIds.has(part.toolCallId)
        ) {
          appliedToolCallIds.add(part.toolCallId)
          const output = part.output as { recipe?: ImprovedRecipe; error?: string }
          if (output?.recipe) {
            onRecipeUpdate(output.recipe)
          }
        }
      }
    }
  }, [messages, appliedToolCallIds, onRecipeUpdate])

  const handleClose = () => {
    if (status === 'streaming' || status === 'submitted') {
      stop()
    }
    setMessages([])
    setInput('')
    onClose()
  }

  const handleSend = (text: string) => {
    if (!text.trim() || !isReady) return
    if (error) clearError()
    sendMessage({ text: text.trim() })
    setInput('')
  }

  const getErrorMessage = (err: Error) => {
    const msg = err.message?.toLowerCase() ?? ''
    if (msg.includes('rate limit')) return 'Rate limit exceeded. Please wait a moment.'
    if (msg.includes('network') || msg.includes('fetch')) return 'Network error. Check your connection.'
    if (msg.includes('timeout')) return 'Request timed out. Try again.'
    return 'Something went wrong. Try asking again.'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="glass-strong rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Ask About This Recipe</h2>
            </div>
            <button
              onClick={handleClose}
              className="h-9 w-9 flex items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 min-h-[200px] max-h-[55vh]">
            {messages.length === 0 ? (
              /* Empty state with suggested questions */
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  Ask anything about this recipe
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleSend(question)}
                      disabled={!isReady}
                      className="px-3.5 py-2 glass rounded-xl text-sm text-foreground hover:ring-2 hover:ring-primary/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((message) => {
                  if (message.role === 'user') {
                    const text = message.parts
                      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                      .map((p) => p.text)
                      .join('') || ''

                    return (
                      <div key={message.id} className="flex justify-end">
                        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-gradient-to-r from-primary to-accent text-white text-sm leading-relaxed">
                          {text}
                        </div>
                      </div>
                    )
                  }

                  // Assistant message — render each part
                  return (
                    <div key={message.id} className="flex flex-col gap-2">
                      {message.parts?.map((part, partIndex) => {
                        if (part.type === 'text') {
                          if (!part.text) return null
                          return (
                            <div key={partIndex} className="flex justify-start">
                              <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md glass text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                {part.text}
                              </div>
                            </div>
                          )
                        }

                        if (part.type === 'tool-modifyRecipe') {
                          return (
                            <div key={partIndex} className="flex justify-start">
                              <div className="max-w-[85%] w-full">
                                <ToolApprovalCard
                                  part={part}
                                  onApprove={(approvalId) => addToolApprovalResponse({ id: approvalId, approved: true })}
                                  onDeny={(approvalId) => addToolApprovalResponse({ id: approvalId, approved: false, reason: 'User declined' })}
                                />
                              </div>
                            </div>
                          )
                        }

                        if (part.type === 'step-start') {
                          return null
                        }

                        return null
                      })}

                      {/* Show loading dots if assistant message has no visible content yet */}
                      {!message.parts?.some(p =>
                        (p.type === 'text' && p.text) || p.type === 'tool-modifyRecipe'
                      ) && (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md glass text-foreground text-sm leading-relaxed">
                            <span className="flex gap-1 items-center py-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse" />
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:150ms]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:300ms]" />
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Error state */}
                {error && (
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 glass rounded-2xl text-sm text-destructive">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{getErrorMessage(error)}</span>
                    </div>
                    <button
                      onClick={() => regenerate()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg glass text-xs font-medium text-foreground hover:text-primary transition-colors shrink-0"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="border-t border-border/30 p-4 pb-8">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                rows={1}
                className="flex-1 min-h-[44px] max-h-[120px] px-4 py-2.5 glass rounded-xl border-0 bg-transparent text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || !isReady}
                className="h-11 w-11 flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform shrink-0"
                aria-label="Send"
              >
                {status === 'submitted' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function ToolApprovalCard({
  part,
  onApprove,
  onDeny,
}: {
  part: { state: string; toolCallId: string; input?: unknown; output?: unknown; errorText?: string; approval?: { id: string; approved?: boolean } }
  onApprove: (approvalId: string) => void
  onDeny: (approvalId: string) => void
}) {
  if (part.state === 'approval-requested') {
    return (
      <div className="glass rounded-2xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Apply to your recipe?</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(part.approval!.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <Check className="h-4 w-4" />
            Yes, apply
          </button>
          <button
            onClick={() => onDeny(part.approval!.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl glass text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
            No thanks
          </button>
        </div>
      </div>
    )
  }

  if (part.state === 'approval-responded' || part.state === 'input-available') {
    if (part.approval?.approved === false) {
      return (
        <div className="glass rounded-2xl p-4 border border-border/30">
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Change declined</span>
          </div>
        </div>
      )
    }
    return (
      <div className="glass rounded-2xl p-4 border border-primary/20">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Applying changes...</span>
        </div>
      </div>
    )
  }

  if (part.state === 'output-available') {
    return (
      <div className="glass rounded-2xl p-4 border border-accent/30">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-foreground">Changes applied</span>
        </div>
      </div>
    )
  }

  if (part.state === 'output-error') {
    return (
      <div className="glass rounded-2xl p-4 border border-destructive/30">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">Failed to apply changes. Try again.</span>
        </div>
      </div>
    )
  }

  if (part.state === 'output-denied') {
    return (
      <div className="glass rounded-2xl p-4 border border-border/30">
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Change declined</span>
        </div>
      </div>
    )
  }

  return null
}
