import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function Home() {
  const [currentFeature, setCurrentFeature] = useState(0)
  
  const features = [
    {
      icon: "🧠",
      title: "AI-Powered Project Knowledge",
      desc: "See not just what changed, but why, how, and how to test it."
    },
    {
      icon: "🎯",
      title: "Contextual Timeline, Not Just History",
      desc: "No more guessing what happened or who did what just follow the flow."
    },
    {
      icon: "💬",
      title: "Ask Anything, Get Real Answers",
      desc: "No question too basic, get answers using only your project’s real context so everyone learns, and no one is left behind."
    },
    {
      icon: "📋",
      title: "Powered by Portia SDK",
      desc: "All insights and answers are generated live from your real project data, not templates or fake content."
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
        <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Refined Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent"></div>
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-20">
        {/* Hero Section */}
                
        <div className="text-center mb-20">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-sm font-medium text-violet-300 mb-6">
              <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse shadow-[0_0_10px_#a78bfa,0_0_20px_#a78bfa,0_0_30px_#a78bfa]"></div>
                  Built for AgentHack 2025
              </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">
              Synapse
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            The all-in-one project knowledge hub for fast-moving hackathon teams.
Connect your GitHub repo and turn every commit into shared understanding, not just code history.
          </p>
          
          <Link 
            to="/connect" 
            className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg text-base font-semibold hover:from-violet-700 hover:to-blue-700 transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl"
          >
            Connect to your repository
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* Interactive Features Section */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-white mb-8">
                Built for <span className="text-violet-400">Every skill level</span>
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
              <div className="text-slate-300">Better team collaboration</div>
            </div>
            <div className="p-6 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
              <div className="text-3xl font-bold text-blue-400 mb-2">0</div>
              <div className="text-slate-300">"Dumb" questions</div>
            </div>
            <div className="p-6 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
              <div className="text-3xl font-bold text-green-400 mb-2">100%</div>
              <div className="text-slate-300">Team learning, built-in</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 bg-gradient-to-r from-violet-900/30 to-blue-900/30 backdrop-blur border border-violet-500/20 rounded-2xl">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to turn code into team knowledge?
            </h3>
            <p className="text-slate-300 mb-6">
              Empower your team with Synapse—project clarity, team knowledge, and seamless collaboration in one place.


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