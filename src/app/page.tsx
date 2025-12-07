import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">TapShop</h1>
          <Link
            href="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Seller Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Sell Online in Minutes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Create your mobile-first shop, accept PromptPay payments, and deliver with Lalamove.
            No coding required.
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 shadow-lg"
          >
            Start Selling Free
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-4">🛒</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Your Own Shop
            </h3>
            <p className="text-gray-600">
              Get a custom shop URL. Add products with photos and prices.
              Share on LINE, Facebook, or Instagram.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-4">💳</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              PromptPay Payments
            </h3>
            <p className="text-gray-600">
              Customers pay directly to your PromptPay.
              No fees, no middleman. Money goes straight to you.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-4">🛵</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Lalamove Delivery
            </h3>
            <p className="text-gray-600">
              One-click delivery booking. Customers pay driver directly on delivery.
              Real-time tracking included.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-xl p-8 shadow-sm mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mx-auto mb-3">
                1
              </div>
              <p className="text-gray-700 font-medium">Sign up with phone</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mx-auto mb-3">
                2
              </div>
              <p className="text-gray-700 font-medium">Add your products</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mx-auto mb-3">
                3
              </div>
              <p className="text-gray-700 font-medium">Share your shop link</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mx-auto mb-3">
                4
              </div>
              <p className="text-gray-700 font-medium">Get paid & ship!</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Perfect for Instagram sellers, home businesses, and small shops.
          </p>
          <Link
            href="/login"
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-lg font-bold hover:bg-gray-800"
          >
            Create Your Shop
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>TapShop - Simple e-commerce for Thailand</p>
        </div>
      </footer>
    </div>
  )
}
