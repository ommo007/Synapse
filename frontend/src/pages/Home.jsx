import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function Home() {
  const [currentFeature, setCurrentFeature] = useState(0)
  
  const features = [
    {
      icon: "🧠",
      title: "AI-Powered Insights",
      desc: "Every commit translated into beginner-friendly explanations and technical summaries"
    },
    {
      icon: "🎯",
      title: "Smart Timeline",
      desc: "Visual commit history with risk levels, tags, and testing instructions"
    },
    {
      icon: "💬",
      title: "Ask Anything",
      desc: "No question too basic - get instant answers about any commit or change"
    },
    {
      icon: "📋",
      title: "Export Ready",
      desc: "Generate judge-ready documentation and learning reports automatically"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-grid-slate-700/25 bg-[length:75px_75px] opacity-50"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto text-center mb-20">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-sm mb-6">
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-ping"></span>
              Now live for hackathon teams
            </div>
            
            <h1 className="text-7xl md:text-8xl font-black mb-6 leading-none">
              <span className="bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">
                Synapse
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-slate-400 mb-4 font-light">
              Turn messy commits into
            </p>
            <p className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent mb-8">
              crystal-clear insights
            </p>
          </div>
          
          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            AI-powered commit understanding for hackathon teams. Perfect for beginners, 
            powerful for experts, and impressive for judges.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link 
              to="/connect" 
              className="group px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-lg hover:from-violet-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-violet-500/25 hover:scale-105"
            >
              <span className="flex items-center gap-2">
                Connect Your Repo
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </Link>
            
            <button className="px-8 py-4 border border-slate-600 rounded-xl text-slate-300 font-semibold text-lg hover:bg-slate-800/50 transition-all duration-300">
              See Demo
            </button>
          </div>
        </div>

        {/* Interactive Features Section */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-white mb-8">
                Built for <span className="text-violet-400">every skill level</span>
              </h2>
              
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className={`p-6 rounded-xl border transition-all duration-500 cursor-pointer ${
                      currentFeature === index 
                        ? 'bg-violet-500/10 border-violet-500/30 shadow-lg shadow-violet-500/10' 
                        : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50'
                    }`}
                    onClick={() => setCurrentFeature(index)}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{feature.icon}</span>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-slate-400">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mock Terminal/Interface */}
            <div className="relative">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-slate-400 text-sm ml-4">synapse-timeline</div>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Mock Commit Timeline */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <div className="text-slate-300">feat: Add user authentication</div>
                      <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">LOW RISK</div>
                    </div>
                    <div className="ml-6 p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-slate-400 text-sm mb-2">🤖 AI Summary:</p>
                      <p className="text-slate-300 text-sm">Added login system to keep user accounts secure. Users can now sign up and log in safely.</p>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-3 h-3 bg-violet-400 rounded-full animate-pulse"></div>
                      <div className="text-slate-300">fix: Database connection timeout</div>
                      <div className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded text-xs">ANALYZING...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof / Stats */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
              <div className="text-3xl font-bold text-violet-400 mb-2">10x</div>
              <div className="text-slate-300">Faster onboarding</div>
            </div>
            <div className="p-6 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
              <div className="text-3xl font-bold text-blue-400 mb-2">0</div>
              <div className="text-slate-300">"Dumb" questions</div>
            </div>
            <div className="p-6 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
              <div className="text-3xl font-bold text-green-400 mb-2">100%</div>
              <div className="text-slate-300">Judge-ready docs</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 bg-gradient-to-r from-violet-900/30 to-blue-900/30 backdrop-blur border border-violet-500/20 rounded-2xl">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to make commits crystal clear?
            </h3>
            <p className="text-slate-300 mb-6">
              Join the teams already using Synapse to win hackathons and ship faster.
            </p>
            <Link 
              to="/connect" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-lg hover:bg-slate-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started Now
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}