"use client"

import { Button } from "@/components/ui/button"
import { Table, Grid } from "lucide-react"

type ViewToggleProps = {
  view: "table" | "cards"
  onViewChange: (view: "table" | "cards") => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 border rounded-md p-1">
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className="h-8 px-3"
      >
        <Table className="h-4 w-4 mr-1" />
        Table
      </Button>
      <Button
        variant={view === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("cards")}
        className="h-8 px-3"
      >
        <Grid className="h-4 w-4 mr-1" />
        Cards
      </Button>
    </div>
  )
}
