'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChefHat, ImagePlus, Sparkles, X, Clipboard } from 'lucide-react'

interface ImageData {
  base64: string
  mediaType: string
  preview: string
}

interface RecipeInputProps {
  onImprove: (text: string, images: { base64: string; mediaType: string }[]) => void
  isLoading: boolean
}

export function RecipeInput({ onImprove, isLoading }: RecipeInputProps) {
  const [recipeText, setRecipeText] = useState('')
  const [images, setImages] = useState<ImageData[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const base64 = result.split(',')[1]
      setImages(prev => [...prev, { 
        base64, 
        mediaType: file.type,
        preview: result 
      }])
    }
    reader.readAsDataURL(file)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    let hasImage = false
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          handleImageUpload(file)
          hasImage = true
        }
      }
    }
    if (hasImage) {
      e.preventDefault()
    }
  }, [handleImageUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleImageUpload(file)
      }
    })
  }, [handleImageUpload])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      handleImageUpload(file)
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!recipeText.trim() && images.length === 0) return
    const imageDataArray = images.map(({ base64, mediaType }) => ({ base64, mediaType }))
    onImprove(recipeText, imageDataArray)
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
    <div className="flex flex-col gap-6 p-5 pt-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 pb-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/25">
          <ChefHat className="h-10 w-10" />
        </div>
        <div className="text-center">
          <h1 className="font-serif text-3xl font-medium text-foreground tracking-tight">RecipeAI</h1>
          <p className="text-sm text-muted-foreground mt-1">Transform any recipe into an easy guide</p>
        </div>
      </div>

      {/* Input Area */}
      <div 
        className="flex flex-col gap-5"
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Image Previews */}
        {images.length > 0 && (
          <div className="flex flex-col gap-3 p-4 glass rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {images.length} {images.length === 1 ? 'image' : 'images'} added
              </span>
              <button
                onClick={() => setImages([])}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                type="button"
              >
                Remove all
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={img.preview} 
                    alt={`Recipe image ${index + 1}`} 
                    className="w-full h-full object-cover rounded-xl shadow-md"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 h-7 w-7 flex items-center justify-center rounded-full glass-strong text-foreground shadow-lg"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 text-xs font-semibold glass-strong px-2 py-0.5 rounded-lg text-foreground">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text Input */}
        <div className="relative">
          <Textarea
            placeholder="Paste your recipe here, or add an image of a recipe..."
            value={recipeText}
            onChange={(e) => setRecipeText(e.target.value)}
            className="min-h-[200px] resize-none rounded-2xl glass text-base leading-relaxed placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:ring-offset-0 border-0"
          />
          <button
            onClick={handlePasteFromClipboard}
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-foreground glass-strong rounded-xl hover:scale-105 active:scale-95 transition-transform"
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
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed border-border/50 glass-subtle text-muted-foreground hover:border-primary/50 hover:text-primary transition-all hover:scale-[1.01] active:scale-[0.99]"
          type="button"
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-sm font-medium">
            {images.length > 0 ? 'Add more images' : 'Add recipe images'}
          </span>
        </button>

        {/* Improve Button */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || (!recipeText.trim() && images.length === 0)}
          size="lg"
          className="h-14 rounded-2xl text-base font-semibold gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="h-5 w-5" />
          Analyze Recipe
        </Button>
      </div>
    </div>
  )
}
