"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "core/components/ui/card"
import { Button } from "core/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "core/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "core/components/ui/popover"
import { cn } from "@/src/lib/utils"
import { useCourts } from "@/src/lib/api/courts"

export default function Homepage() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedCourts, setSelectedCourts] = useState<string[]>([])
  
  const { data: courts = [], isLoading, error } = useCourts()

  const toggleCourt = (id: string) => {
    setSelectedCourts((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const removeCourt = (id: string) => {
    setSelectedCourts((prev) => prev.filter((v) => v !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCourts.length > 0) {
      const params = new URLSearchParams()
      params.set("courts", selectedCourts.join(","))
      router.push(`/districts?${params.toString()}`)
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">خطا در دریافت اطلاعات</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="flex flex-col items-center gap-2 mb-6 md:mb-8">
        <Image src="/logo.svg" alt="دادار" width={56} height={56} className="md:w-16 md:h-16" />
        <h1 className="text-3xl md:text-4xl font-bold text-primary">دادار</h1>
        <p className="text-sm text-muted-foreground">سامانه یافتن حوزه قضایی</p>
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>انتخاب خدمت</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between h-auto min-h-10"
                  disabled={isLoading}
                >
                  <div className="flex flex-wrap gap-1 flex-1 text-right">
                    {isLoading ? (
                      <span className="text-muted-foreground">در حال بارگذاری...</span>
                    ) : selectedCourts.length > 0 ? (
                      selectedCourts.map((id) => {
                        const court = courts.find((c) => c.id === id)
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
                          >
                            {court?.name}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeCourt(id)
                              }}
                            />
                          </span>
                        )
                      })
                    ) : (
                      <span className="text-muted-foreground">خدمت را انتخاب کنید...</span>
                    )}
                  </div>
                  <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="جستجوی دادگاه..." />
                  <CommandList>
                    <CommandEmpty>دادگاهی یافت نشد.</CommandEmpty>
                    <CommandGroup>
                      {courts.map((court) => (
                        <CommandItem
                          key={court.id}
                          value={court.name}
                          onSelect={() => toggleCourt(court.id)}
                        >
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4",
                              selectedCourts.includes(court.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {court.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              type="submit"
              className="w-full"
              disabled={selectedCourts.length === 0 || isLoading}
            >
              ثبت
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
