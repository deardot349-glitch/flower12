import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const shopId = session.user.shopId

  const orders = await prisma.order.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
        <p className="text-gray-600">View and manage customer orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">No orders yet. Orders will appear here when customers place them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {order.customerName}
                  </h3>
                  <p className="text-gray-600">{order.phone}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>
              {order.message && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-gray-700">{order.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
