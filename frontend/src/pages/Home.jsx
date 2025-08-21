import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Synapse
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Bringing clarity to every commit. AI-powered insights and team learning for hackathons.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mt-12 mb-12">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">🤖 AI Summaries</h3>
            <p className="text-gray-400">
              Every commit explained in simple and technical terms
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">💬 Ask Questions</h3>
            <p className="text-gray-400">
              No question is too basic - get instant answers
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">📚 Export Learnings</h3>
            <p className="text-gray-400">
              Generate documentation for judges automatically
            </p>
          </div>
        </div>
        
        <Link to="/connect" className="btn-primary text-lg px-8 py-3">
          Connect Your Repo →
        </Link>
      </div>
    </div>
  )
}
