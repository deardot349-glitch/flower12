import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import EditFlowerForm from '@/components/EditFlowerForm'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function EditFlowerPage({ params }: Props) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const flower = await prisma.flower.findFirst({
    where: {
      id: params.id,
      shop: { ownerId: session.user.id },
    },
  })

  if (!flower) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard/flowers" className="text-sm text-pink-600 hover:text-pink-700 font-semibold mb-3 inline-block">
          ← Повернутись до букетів
        </Link>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Редагувати букет</h1>
        <p className="text-sm text-gray-500">
          Оновіть деталі, які бачать клієнти на вашій сторінці.
        </p>
      </div>
      <EditFlowerForm flower={flower} />
    </div>
  )
}
