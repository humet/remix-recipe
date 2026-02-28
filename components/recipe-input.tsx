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
        {/* Image Previews */}
        {images.length > 0 && (
          <div className="flex flex-col gap-3">
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
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={img.preview} 
                    alt={`Recipe image ${index + 1}`} 
                    className="w-full h-full object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1.5 -right-1.5 h-6 w-6 flex items-center justify-center rounded-full bg-background border border-border text-foreground shadow-sm"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 text-xs font-medium bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-foreground">
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
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-colors"
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
          className="h-14 rounded-xl text-base font-semibold gap-2"
        >
          <Sparkles className="h-5 w-5" />
          Analyze Recipe
        </Button>
      </div>
    </div>
  )
}
