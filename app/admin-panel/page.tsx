'use client';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 w-full max-w-sm shadow-lg rounded-lg border border-gray-200 text-center">
        <div className="text-6xl mb-4">🔧</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Under maintenance</h1>
        <p className="text-sm text-gray-600">The admin panel is temporarily unavailable. Please try again later.</p>
      </div>
    </div>
  );
}
