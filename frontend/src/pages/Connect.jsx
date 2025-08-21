import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsAPI, authAPI } from '../api/client'

export default function Connect() {
  const navigate = useNavigate()
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('oauth')

  const handleConnect = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) {
      setError('Please enter a valid GitHub repository URL')
      setLoading(false)
      return
    }

    const [, owner, repo] = match

    try {
      const response = await projectsAPI.create({
        name: repo,
        github_owner: owner,
        github_repo: repo.replace('.git', ''),
      })
      
      if (response.data && response.data.id) {
        navigate(`/project/${response.data.id}`)
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to connect repository')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = () => {
    authAPI.githubLogin()
  }

  const goBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Background Elements - Smaller and more subtle */}
      <div className="absolute inset-0 bg-grid-slate-700/15 bg-[length:50px_50px] opacity-40"></div>
      <div className="absolute top-1/4 left-1/6 w-48 h-48 bg-violet-500/8 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/6 w-48 h-48 bg-blue-500/8 rounded-full blur-2xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="group mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        {/* Compact Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">
              Connect Repository
            </span>
          </h1>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            Link your GitHub repo to start generating AI-powered commit insights
          </p>
          
          {/* Compact Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <div className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-xs">
              <span className="mr-1">🔒</span>Secure
            </div>
            <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-xs">
              <span className="mr-1">⚡</span>Instant
            </div>
            <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-300 text-xs">
              <span className="mr-1">🎯</span>Public Only
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="max-w-2xl mx-auto">
          {/* Compact Tab Navigation */}
          <div className="flex mb-6 bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-lg p-1.5">
            <button
              onClick={() => setActiveTab('oauth')}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all duration-300 ${
                activeTab === 'oauth'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <span className="mr-1.5">🔐</span>
              OAuth
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all duration-300 ${
                activeTab === 'url'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <span className="mr-1.5">🔗</span>
              URL
            </button>
          </div>

          {/* OAuth Method - More Compact */}
          {activeTab === 'oauth' && (
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">GitHub OAuth</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Connect securely with full access to your public repositories
                </p>
              </div>

              {/* Compact Benefits List */}
              <div className="space-y-2.5 mb-5">
                <div className="flex items-center gap-2.5 text-slate-300 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Access all public repositories</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Automatic commit sync</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Real-time updates</span>
                </div>
              </div>

              <button
                onClick={handleOAuth}
                className="group w-full py-3 px-5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg text-white font-semibold hover:from-violet-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-violet-500/20 hover:scale-[1.01]"
              >
                <span className="flex items-center justify-center gap-2.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
            </div>
          )}

          {/* URL Method - More Compact */}
          {activeTab === 'url' && (
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Repository URL</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Paste any public GitHub repository URL to get started
                </p>
              </div>

              <form onSubmit={handleConnect} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all duration-300"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                </div>
                
                {/* Compact Examples */}
                <div className="text-xs text-slate-400 bg-slate-800/30 rounded-lg p-3">
                  <p className="mb-2 font-medium text-slate-300">Examples:</p>
                  <div className="space-y-1 font-mono">
                    <p>github.com/facebook/react</p>
                    <p>github.com/your-username/your-repo</p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading || !repoUrl.trim()}
                  className="group w-full py-3 px-5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg text-white font-semibold hover:from-blue-700 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Connect Repository
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Compact Security Note */}
          <div className="mt-6 p-3 bg-slate-800/20 border border-slate-700/30 rounded-lg text-center">
            <p className="text-slate-400 text-xs">
              <span className="text-green-400 mr-1">🔒</span>
              We only access public repository data. Your code remains secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}