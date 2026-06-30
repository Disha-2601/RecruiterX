import DashboardDemo from '@/components/DashboardDemo';

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-neutral-50 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">🚀 Redrob Ranker Live Shortlist</h1>
        <p className="text-sm text-neutral-600">Explore the top 100 shortlisted candidates. Adjust weights to dynamically re-rank the pool in real-time.</p>
      </div>
      <DashboardDemo />
    </main>
  );
}
