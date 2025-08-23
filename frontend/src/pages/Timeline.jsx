import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { projectsAPI, commitsAPI } from '../api/client'
import { format } from 'date-fns'

export default function Timeline() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [summarizingCommit, setSummarizingCommit] = useState(null)

  useEffect(() => {
  console.log('🔄 Timeline mounted with projectId:', projectId)
  console.log('🔄 Current URL:', window.location.href)
  
  if (!projectId) {
    console.error('❌ No projectId provided')
    return
  }
  
  loadData()
}, [projectId])

const loadData = async () => {
  console.log('🔄 Starting to load project data...')
  setLoading(true)
  
  try {
    console.log('📡 Fetching project details for ID:', projectId)
    const projectRes = await projectsAPI.get(projectId)
    console.log('✅ Project loaded:', projectRes.data)
    setProject(projectRes.data)

    console.log('📡 Fetching commits for project:', projectId)
    const commitsRes = await projectsAPI.getCommits(projectId, 1)
    console.log('✅ Raw commits response:', commitsRes)
    console.log('✅ Commits data:', commitsRes.data)
    console.log('📊 Number of commits:', commitsRes.data.length)
    
    // Debug each commit
    commitsRes.data.forEach((commit, index) => {
      console.log(`Commit ${index + 1}:`, {
        sha: commit.sha.substring(0, 8),
        message: commit.message.substring(0, 50),
        has_ai_summary: !!commit.ai_summary,
        ai_summary_data: commit.ai_summary
      })
    })
    
    // Check if any commits have AI summaries
    const commitsWithAI = commitsRes.data.filter(c => c.ai_summary)
    console.log('🧠 Commits with AI summaries:', commitsWithAI.length)
    
    setCommits(commitsRes.data)
    setHasMore(commitsRes.data.length === 20)
  } catch (error) {
    console.error('❌ Failed to load data:', error)
    console.error('❌ Error response:', error.response?.data)
  } finally {
    setLoading(false)
  }
}

  const loadMoreCommits = async () => {
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const commitsRes = await projectsAPI.getCommits(projectId, nextPage)
      setCommits([...commits, ...commitsRes.data])
      setPage(nextPage)
      setHasMore(commitsRes.data.length === 20)
    } catch (error) {
      console.error('Failed to load more commits:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSummarize = async (sha) => {
    setSummarizingCommit(sha)
    try {
      console.log(`🔄 Requesting AI summary for commit: ${sha}`)
      const response = await commitsAPI.summarize(sha)
      console.log(`✅ AI Summary response:`, response.data)
    
      // Refresh the commits list to show the new summary
      console.log('🔄 Refreshing commits list...')
      const commitsRes = await projectsAPI.getCommits(projectId, 1)
      console.log('📊 Updated commits:', commitsRes.data)
      setCommits(commitsRes.data)
    
    } catch (error) {
      console.error('❌ Failed to generate AI summary:', error)
      console.error('Error response:', error.response?.data)
      setError('Failed to generate AI summary. Please try again.')
    } finally {
      setSummarizingCommit(null)
    }
  }

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30'
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30'
    }
  }

  const goBack = () => {
    navigate('/connect')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-lg">Loading commit timeline...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-slate-700/15 bg-[length:50px_50px] opacity-30"></div>
      <div className="absolute top-1/4 left-1/6 w-48 h-48 bg-violet-500/8 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/6 w-48 h-48 bg-blue-500/8 rounded-full blur-2xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={goBack}
            className="group mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Connect
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl">
              <svg className="w-6 h-6 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">
                <span className="bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">
                  {project?.github_owner}/{project?.github_repo}
                </span>
              </h1>
              <p className="text-slate-400">
                <span className="text-violet-400 font-semibold">{commits.length}</span> commits analyzed • 
                <span className="text-blue-400 font-semibold ml-2">AI-powered</span> insights
              </p>
            </div>
          </div>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Main Timeline Line with Enhanced Gradients */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-400/60 via-blue-400/40 via-indigo-400/30 to-slate-600/20 rounded-full shadow-lg shadow-violet-500/20"></div>
          
          {/* Commits */}
          <div className="space-y-8">
            {commits.map((commit, index) => (
              <div key={commit.sha} className="relative group">
                {/* Branch Curve - SVG for smooth curves */}
                <svg className="absolute left-4 top-6 w-20 h-12 z-0" viewBox="0 0 80 48">
                  <path
                    d={`M 16 24 Q 30 ${index % 3 === 0 ? '8' : index % 3 === 1 ? '24' : '40'} 60 24`}
                    stroke={index % 3 === 0 ? '#8b5cf6' : index % 3 === 1 ? '#3b82f6' : '#06b6d4'}
                    strokeWidth="2"
                    fill="none"
                    opacity="0.4"
                    className="group-hover:opacity-70 transition-opacity duration-500"
                  />
                  <circle
                    cx="60"
                    cy="24"
                    r="3"
                    fill={index % 3 === 0 ? '#8b5cf6' : index % 3 === 1 ? '#3b82f6' : '#06b6d4'}
                    opacity="0.6"
                    className="group-hover:opacity-100 transition-opacity duration-500"
                  />
                </svg>
                
                {/* Enhanced Timeline Node */}
                <div className="absolute left-6 w-6 h-6 z-20 flex items-center justify-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-violet-400 rounded-full shadow-lg shadow-violet-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 bg-gradient-to-br from-violet-400 to-blue-400 rounded-full animate-pulse group-hover:animate-none"></div>
                  </div>
                  {/* Node glow effect */}
                  <div className="absolute w-8 h-8 bg-violet-400/20 rounded-full -z-10 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>
                </div>
                
                {/* Professional Commit Card */}
                <div className="ml-20 group">
                  <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-6 shadow-2xl hover:border-violet-400/40 hover:shadow-violet-500/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 transform">
                    {/* Enhanced Commit Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1">
                        <Link 
                          to={`/commit/${commit.sha}`}
                          className="text-xl font-bold text-white hover:text-violet-300 transition-all duration-300 block mb-3 group-hover:translate-x-2 transform leading-tight"
                        >
                          {commit.message.split('\n')[0]}
                          <svg className="w-5 h-5 inline ml-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                        
                        {/* Enhanced Commit Meta with better typography */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                          <div className="flex items-center gap-2 text-slate-400">
                            <div className="p-1.5 bg-violet-500/10 rounded-lg">
                              <svg className="w-3.5 h-3.5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="font-medium text-white truncate">{commit.author_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <div className="p-1.5 bg-blue-500/10 rounded-lg">
                              <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="font-medium text-white">{format(new Date(commit.committed_at), 'MMM d')}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-slate-400">
                            <div className="p-1.5 bg-amber-500/10 rounded-lg">
                              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                              </svg>
                            </div>
                            <span className="text-xs font-mono bg-slate-800/60 px-2 py-1 rounded-md text-amber-300 border border-amber-500/20">
                              {commit.sha.substring(0, 7)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Action Button */}
                      {!commit.ai_summary ? (
                        <button
                          onClick={() => handleSummarize(commit.sha)}
                          disabled={summarizingCommit === commit.sha}
                          className="px-5 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 rounded-xl text-white text-sm font-bold hover:from-violet-700 hover:via-purple-700 hover:to-blue-700 transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 shadow-lg hover:shadow-violet-500/30 hover:shadow-xl group-hover:scale-105 transform border border-violet-500/20 hover:border-violet-400/40"
                        >
                          {summarizingCommit === commit.sha ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="font-medium">Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                                <span className="text-xs">🧠</span>
                              </div>
                              <span className="font-medium">Generate AI Summary</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className={`px-4 py-2 rounded-xl text-xs font-bold border-2 ${getRiskLevelColor(commit.ai_summary.risk_level)} shadow-lg`}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                              {commit.ai_summary.risk_level?.toUpperCase() || 'ANALYZED'}
                            </div>
                          </div>
                          <div className="px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-lg text-xs font-semibold border border-green-500/30">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              AI READY
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced AI Summary Section */}
                    {commit.ai_summary && (
                      <div className="border-t border-slate-700/40 pt-5 space-y-5">
                        <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 rounded-xl p-5 border border-slate-700/30 shadow-inner">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl border border-violet-500/30">
                              <div className="w-6 h-6 bg-gradient-to-br from-violet-400 to-purple-400 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-bold">AI</span>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-lg mb-1">Smart Explanation</h4>
                              <p className="text-slate-400 text-sm">Generated for all skill levels</p>
                            </div>
                          </div>
                          <p className="text-slate-200 leading-relaxed text-base font-medium">
                            {commit.ai_summary.simple_explanation}
                          </p>
                        </div>

                        {/* Enhanced Tags */}
                        {commit.ai_summary.tags && commit.ai_summary.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2.5">
                            {commit.ai_summary.tags.map((tag, tagIndex) => (
                              <span 
                                key={tag} 
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-300 hover:scale-105 cursor-default ${
                                  tagIndex % 3 === 0 
                                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 hover:bg-violet-500/30' 
                                    : tagIndex % 3 === 1 
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
                                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                                }`}
                              >
                                <span className="mr-1">#</span>{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Professional Technical Preview */}
                        {commit.ai_summary.technical_summary && commit.ai_summary.technical_summary.length > 0 && (
                          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-600/30">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-blue-300 font-semibold text-sm">Technical Highlights</span>
                            </div>
                            <ul className="space-y-2">
                              {commit.ai_summary.technical_summary.slice(0, 2).map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm">
                                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-slate-300 leading-relaxed">{item}</span>
                                </li>
                              ))}
                              {commit.ai_summary.technical_summary.length > 2 && (
                                <li className="flex items-center gap-2 mt-3">
                                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full"></div>
                                  <Link 
                                    to={`/commit/${commit.sha}`}
                                    className="text-violet-400 text-xs font-semibold hover:text-violet-300 transition-colors flex items-center gap-1"
                                  >
                                    View {commit.ai_summary.technical_summary.length - 2} more details
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </Link>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-12 text-center">
              <button
                onClick={loadMoreCommits}
                disabled={loadingMore}
                className="px-8 py-3 bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl text-slate-300 font-medium hover:bg-slate-700/50 hover:border-violet-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
              >
                {loadingMore ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Loading more commits...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    Load More Commits
                  </>
                )}
              </button>
            </div>
          )}

          {!hasMore && commits.length > 0 && (
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/30 border border-slate-700/50 rounded-xl text-slate-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                All commits loaded
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
