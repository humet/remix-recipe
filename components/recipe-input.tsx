'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChefHat, ImagePlus, Sparkles, X, Clipboard } from 'lucide-react'

interface RecipeInputProps {
  onImprove: (text: string, imageData: { base64: string; mediaType: string } | null) => void
  isLoading: boolean
}

export function RecipeInput({ onImprove, isLoading }: RecipeInputProps) {
  const [recipeText, setRecipeText] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageData, setImageData] = useState<{ base64: string; mediaType: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      // Extract base64 data without the data URL prefix
      const base64 = result.split(',')[1]
      setImageData({ base64, mediaType: file.type })
    }
    reader.readAsDataURL(file)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          handleImageUpload(file)
          e.preventDefault()
          return
        }
      }
    }
  }, [handleImageUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleImageUpload(file)
    }
  }, [handleImageUpload])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageData(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    if (!recipeText.trim() && !imageData) return
    onImprove(recipeText, imageData)
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setRecipeText(text)
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 pt-4 pb-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <ChefHat className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h1 className="font-serif text-2xl font-normal text-foreground">RecipeAI</h1>
          <p className="text-sm text-muted-foreground">Transform any recipe into an easy guide</p>
        </div>
      </div>

      {/* Input Area */}
      <div 
        className="flex flex-col gap-4"
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative">
            <img 
              src={imagePreview} 
              alt="Recipe preview" 
              className="w-full max-h-48 object-cover rounded-xl border border-border"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border border-border text-foreground"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Text Input */}
        <div className="relative">
          <Textarea
            placeholder="Paste your recipe here, or add an image of a recipe..."
            value={recipeText}
            onChange={(e) => setRecipeText(e.target.value)}
            className="min-h-[200px] resize-none rounded-xl border-border bg-card text-base leading-relaxed placeholder:text-muted-foreground focus-visible:ring-primary"
          />
          <button
            onClick={handlePasteFromClipboard}
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            type="button"
          >
            <Clipboard className="h-3.5 w-3.5" />
            Paste
          </button>
        </div>

        {/* Image Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          type="button"
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-sm font-medium">Add recipe image</span>
        </button>

        {/* Improve Button */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || (!recipeText.trim() && !imageData)}
          size="lg"
          className="h-14 rounded-xl text-base font-semibold gap-2"
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Improving recipe...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Improve Recipe
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
