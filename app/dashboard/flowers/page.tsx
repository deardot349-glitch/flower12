import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import FlowerList from '@/components/FlowerList'
import AddFlowerForm from '@/components/AddFlowerForm'

export default async function FlowersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const shopId = session.user.shopId

  const flowers = await prisma.flower.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Flowers</h1>
        <p className="text-gray-600">Add, edit, or remove flowers from your shop</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Flower</h2>
            <AddFlowerForm shopId={shopId} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <FlowerList flowers={flowers} />
        </div>
      </div>
    </div>
  )
}
