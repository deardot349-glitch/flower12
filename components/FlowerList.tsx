'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, Pencil, Trash2, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'

interface Flower {
  id: string
  name: string
  price: number
  imageUrl: string | null
  availability: string
  description: string | null
  madeAt?: string | Date | null
}

function getAgeLabel(madeAt?: string | Date | null): string | null {
  if (!madeAt) return null
  const diff = Math.floor((Date.now() - new Date(madeAt).getTime()) / 86_400_000)
  if (diff === 0) return 'Сьогодні'
  if (diff === 1) return '1 день'
  if (diff < 5) return `${diff} дні`
  return `${diff} днів`
}

const availabilityConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'muted' }> = {
  in_stock:     { label: 'В наявності', variant: 'success' },
  limited:      { label: 'Мало',        variant: 'warning' },
  out_of_stock: { label: 'Немає',       variant: 'muted'   },
}

export default function FlowerList({ flowers }: { flowers: Flower[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/flowers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ variant: 'success', title: 'Букет видалено' })
      router.refresh()
    } catch {
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося видалити букет.' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggle = async (flower: Flower) => {
    const newAvailability = flower.availability === 'in_stock' ? 'out_of_stock' : 'in_stock'
    setTogglingId(flower.id)
    try {
      const res = await fetch(`/api/flowers/${flower.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: newAvailability }),
      })
      if (!res.ok) throw new Error()
      toast({
        variant: 'success',
        title: newAvailability === 'in_stock' ? 'Букет показано' : 'Букет приховано',
      })
      router.refresh()
    } catch {
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося оновити наявність.' })
    } finally {
      setTogglingId(null)
    }
  }

  if (flowers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
        <div className="text-5xl mb-4">🌸</div>
        <h3 className="text-base font-bold text-gray-900 mb-1">Букетів ще немає</h3>
        <p className="text-sm text-muted-foreground">Додайте перший букет за допомогою форми зліва</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {flowers.map((flower) => {
        const avail = availabilityConfig[flower.availability] ?? availabilityConfig['in_stock']
        const isDeleting = deletingId === flower.id
        const isToggling = togglingId === flower.id

        return (
          <div
            key={flower.id}
            className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 border border-gray-100 hover:shadow-md transition-shadow"
          >
            {/* Thumbnail */}
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {flower.imageUrl ? (
                <Image src={flower.imageUrl} alt={flower.name} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🌸</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-bold text-gray-900 leading-snug">{flower.name}</h3>
                <Badge variant={avail.variant}>{avail.label}</Badge>
              </div>

              <p className="text-base font-bold text-pink-600 mb-1">
                ₴{flower.price.toFixed(0)}
              </p>

              {flower.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{flower.description}</p>
              )}

              {flower.madeAt && (
                <p className="text-xs text-purple-500 font-medium mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getAgeLabel(flower.madeAt)} · {new Date(flower.madeAt).toLocaleDateString('uk-UA')}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(flower)}
                  disabled={isToggling}
                  className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  {isToggling
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : flower.availability === 'in_stock'
                      ? <><EyeOff className="h-3.5 w-3.5" /> Приховати</>
                      : <><Eye className="h-3.5 w-3.5" /> Показати</>
                  }
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <Link href={`/dashboard/flowers/${flower.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5" /> Редагувати
                  </Link>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isDeleting}
                      className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      {isDeleting
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <><Trash2 className="h-3.5 w-3.5" /> Видалити</>
                      }
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Видалити букет?</AlertDialogTitle>
                      <AlertDialogDescription>
                        «{flower.name}» буде видалено назавжди. Цю дію не можна скасувати.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Скасувати</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(flower.id)}>
                        Видалити
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
