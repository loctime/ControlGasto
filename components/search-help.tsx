"use client"

import { HelpCircle, X } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"

export function SearchHelp() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
      >
        <HelpCircle className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Card className="absolute top-12 left-0 right-0 z-50 bg-white dark:bg-gray-900 border shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">🔍 Búsqueda Inteligente</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-foreground mb-1">📝 Por nombre:</p>
            <p className="text-muted-foreground">"supermercado", "gasolina", "restaurante"</p>
          </div>
          
          <div>
            <p className="font-medium text-foreground mb-1">📅 Por mes:</p>
            <p className="text-muted-foreground">"octubre", "enero", "diciembre"</p>
          </div>
          
          <div>
            <p className="font-medium text-foreground mb-1">🗓️ Por año:</p>
            <p className="text-muted-foreground">"2024", "2025"</p>
          </div>
          
          <div>
            <p className="font-medium text-foreground mb-1">📆 Por mes y año:</p>
            <p className="text-muted-foreground">"octubre 2025", "enero 2024"</p>
          </div>
          
          <div>
            <p className="font-medium text-foreground mb-1">🔗 Combinado:</p>
            <p className="text-muted-foreground">"supermercado octubre", "gasolina 2024"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
