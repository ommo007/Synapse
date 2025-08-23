import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { projectsAPI, authAPI } from '../api/client'

export default function Connect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('oauth')
  const [authSuccess, setAuthSuccess] = useState(false)
  const [repositories, setRepositories] = useState([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [connectingRepo, setConnectingRepo] = useState(null)
  const [repoFilter, setRepoFilter] = useState('all') // 'all', 'public', 'private'
  const [searchTerm, setSearchTerm] = useState('')

  // Handle OAuth redirect
  useEffect(() => {
    const authStatus = searchParams.get('auth')
    const user = searchParams.get('user')
    
    if (authStatus === 'success' && user) {
      setAuthSuccess(true)
      setError('')
      loadUserRepositories()
      setTimeout(() => {
        navigate('/connect', { replace: true })
      }, 1000)
    } else if (authStatus === 'error') {
      setError('GitHub authentication failed. Please try again.')
      setAuthSuccess(false)
      setTimeout(() => {
        navigate('/connect', { replace: true })
      }, 5000)
    }
  }, [searchParams, navigate])

  const loadUserRepositories = async () => {
    setLoadingRepos(true)
    setError('')
    
    try {
      console.log('🔄 Loading user repositories...')
      const response = await authAPI.getUserRepositories()
      console.log('✅ Repositories response:', response.data)
      
      if (response.data && Array.isArray(response.data)) {
        setRepositories(response.data)
        console.log(`📁 Found ${response.data.length} repositories`)
      } else {
        console.warn('⚠️ Invalid repository data format:', response.data)
        setRepositories([])
      }
    } catch (err) {
      console.error('❌ Failed to load repositories:', err)
      if (err.response?.status === 401) {
        setError('Authentication expired. Please log in again.')
      } else {
        setError(`Failed to load repositories: ${err.response?.data?.detail || err.message}`)
      }
      setRepositories([])
    } finally {
      setLoadingRepos(false)
    }
  }

  const handleConnectRepository = async (repo) => {
    setConnectingRepo(repo.full_name)
    setError('')
    
    try {
      const response = await projectsAPI.create({
        name: repo.name,
        github_owner: repo.owner.login,
        github_repo: repo.name,
      })
      
      if (response.data && response.data.id) {
        navigate(`/timeline/${response.data.id}`)
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to connect repository')
    } finally {
      setConnectingRepo(null)
    }
  }

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
        navigate(`/timeline/${response.data.id}`)
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

  // Filter repositories based on search and filter
  const filteredRepositories = repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repo.owner.login.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = repoFilter === 'all' || 
                         (repoFilter === 'public' && !repo.private) ||
                         (repoFilter === 'private' && repo.private)
    
    return matchesSearch && matchesFilter
  })

  return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center relative overflow-hidden">
      {/* Refined Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
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

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">
              Connect Repository
            </span>
          </h1>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            {authSuccess 
              ? "Choose a repository to start analyzing commits"
              : "Link your GitHub repo to turn every commit into shared project knowledge"
            }
          </p>
        </div>

        {/* OAuth Success + Repository List */}
        {authSuccess && (
          <div className="mb-8">
            <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 mb-6">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold">🎉 Successfully connected to GitHub!</p>
                <p className="text-sm text-green-300">Select a repository below to start analyzing commits.</p>
              </div>
            </div>

            {/* Repository Management */}
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your Repositories ({repositories.length})
                </h3>
                
                <button
                  onClick={loadUserRepositories}
                  disabled={loadingRepos}
                  className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg text-slate-300 text-sm transition-all duration-300 disabled:opacity-50"
                >
                  {loadingRepos ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refreshing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </span>
                  )}
                </button>
              </div>

              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all duration-300"
                  />
                </div>
                
                <div className="flex gap-2">
                  {['all', 'public', 'private'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setRepoFilter(filter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        repoFilter === filter
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      <span className="ml-1 text-xs opacity-75">
                        ({repositories.filter(r => filter === 'all' || (filter === 'public' && !r.private) || (filter === 'private' && r.private)).length})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {loadingRepos ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-8 h-8 animate-spin text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="ml-3 text-slate-300 text-lg">Loading repositories...</span>
                </div>
              ) : filteredRepositories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRepositories.map((repo) => (
                    <div key={repo.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-violet-500/50 transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
                              {repo.name}
                            </h4>
                            {repo.private && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30">
                                Private
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 truncate">
                            {repo.owner.login}/{repo.name}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-slate-400 ml-2">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {repo.stargazers_count}
                        </div>
                      </div>
                      
                      {repo.description && (
                        <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                              {repo.language}
                            </span>
                          )}
                          <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                        </div>
                        
                        <button
                          onClick={() => handleConnectRepository(repo)}
                          disabled={connectingRepo === repo.full_name}
                          className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg text-white text-sm font-medium hover:from-violet-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {connectingRepo === repo.full_name ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Connecting...
                            </span>
                          ) : (
                            'Connect'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-slate-400 text-lg mb-2">
                    {searchTerm ? 'No repositories match your search' : 'No repositories found'}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-violet-400 hover:text-violet-300 text-sm"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Original OAuth/URL tabs - only show if not authenticated */}
        {!authSuccess && (
          <div className="max-w-2xl mx-auto">
            {/* Tab Navigation */}
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

            {/* OAuth Method */}
            {activeTab === 'oauth' && (
              <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-xl">
                <div className="text-center mb-5">
                  <div className="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">GitHub OAuth (Recommended) </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Connect securely with full access to your repositories
                  </p>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-2.5 text-slate-300 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span>Access all your repositories</span>
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

            {/* URL Method */}
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
                  </div>
                  
                  <div className="text-xs text-slate-400 bg-slate-800/30 rounded-lg p-3">
                    <p className="mb-2 font-medium text-slate-300">Examples:</p>
                    <div className="space-y-1 font-mono">
                      <p>github.com/google-gemini/gemini-cli</p>
                      <p>github.com/your-username/your-repo</p>
                    </div>
                  </div>

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

            {/* Security Note */}
            <div className="mt-6 p-3 bg-slate-800/20 border border-slate-700/30 rounded-lg text-center">
              <p className="text-slate-400 text-xs">
                <span className="text-green-400 mr-1">🔒</span>
                We only access repository data. Your code remains secure.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mt-6">
            <div className="flex items-center gap-2.5 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}