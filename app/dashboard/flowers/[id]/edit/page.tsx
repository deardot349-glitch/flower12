import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import EditFlowerForm from '@/components/EditFlowerForm'

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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit bouquet</h1>
      <p className="text-sm text-gray-600 mb-6">
        Update the details customers see on your shop page.
      </p>
      <EditFlowerForm flower={flower} />
    </div>
  )
}

