import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { commitsAPI, aiAPI } from '../api/client'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'

export default function CommitDetail() {
  const { sha } = useParams()
  const navigate = useNavigate()
  const [commit, setCommit] = useState(null)
  const [question, setQuestion] = useState('')
  const [qna, setQna] = useState([])
  const [loading, setLoading] = useState(true)
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    loadCommit()
  }, [sha])

  const loadCommit = async () => {
    try {
      const response = await commitsAPI.get(sha)
      setCommit(response.data)
    } catch (error) {
      console.error('Failed to load commit:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAsk = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    setAsking(true)
    try {
      const response = await aiAPI.ask(commit.project_id, {
        sha,
        question,
      })
      setQna([...qna, response.data])
      setQuestion('')
    } catch (error) {
      console.error('Failed to ask question:', error)
    } finally {
      setAsking(false)
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
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-lg">Loading commit details...</span>
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
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="group mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Timeline
        </button>

        <div className="space-y-8">
          {/* Enhanced Commit Header Card */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/70 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl border border-violet-500/30">
                    <svg className="w-6 h-6 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-1">Commit Details</div>
                    <div className="text-xs text-slate-400">In-depth AI analysis</div>
                  </div>
                </div>
                
                <h1 className="text-4xl font-black text-white mb-4 leading-tight">
                  <span className="bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">
                    {commit?.message.split('\n')[0]}
                  </span>
                </h1>
                
                {commit?.message.split('\n').length > 1 && (
                  <div className="text-slate-300 mt-4 p-5 bg-slate-800/50 rounded-xl border border-slate-700/40">
                    <div className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Extended Description</div>
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {commit.message.split('\n').slice(1).join('\n').trim()}
                    </pre>
                  </div>
                )}
              </div>

              {commit?.ai_summary && (
                <div className="ml-6 flex flex-col items-end gap-3">
                  <div className={`px-5 py-3 rounded-xl text-sm font-bold border-2 shadow-lg ${getRiskLevelColor(commit.ai_summary.risk_level)}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-current animate-pulse"></div>
                      <span className="tracking-wider">{commit.ai_summary.risk_level?.toUpperCase() || 'ANALYZED'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 text-right">
                    AI Risk Assessment
                  </div>
                </div>
              )}
            </div>
            
            {/* Enhanced Professional Meta Grid */}
            <div className="grid md:grid-cols-4 gap-6 text-sm">
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Author</div>
                    <div className="text-white font-bold text-lg">{commit?.author_name}</div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Committed</div>
                    <div className="text-white font-bold text-lg">
                      {commit && format(new Date(commit.committed_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-slate-400">
                      {commit && format(new Date(commit.committed_at), 'HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Commit Hash</div>
                    <div className="text-amber-300 font-mono font-bold text-lg">{sha.substring(0, 7)}</div>
                    <div className="text-xs text-slate-400 font-mono">{sha.substring(7, 14)}...</div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Files Changed</div>
                    <div className="text-white font-bold text-lg">{commit?.files?.length || 0} files</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced AI Summary Section */}
          {commit?.ai_summary && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Simple Explanation - Enhanced */}
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl hover:border-violet-400/40 transition-all duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl border border-violet-500/30">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-400 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-black">AI</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Smart Explanation</h3>
                    <p className="text-violet-400 text-sm font-semibold">For everyone to understand</p>
                  </div>
                </div>
                <p className="text-slate-200 leading-relaxed text-lg font-medium">
                  {commit.ai_summary.simple_explanation}
                </p>
              </div>

              {/* Technical Details - Enhanced */}
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl hover:border-blue-400/40 transition-all duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Technical Details</h3>
                    <p className="text-blue-400 text-sm font-semibold">Developer insights</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {commit.ai_summary.technical_summary?.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 group">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-500/30 flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      </div>
                      <span className="text-slate-200 leading-relaxed font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How to Test */}
              {commit.ai_summary.how_to_test?.steps && (
                <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <span className="text-2xl">🧪</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">How to Test</h3>
                  </div>
                  <ol className="space-y-3 text-slate-300 mb-4">
                    {commit.ai_summary.how_to_test.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {i + 1}
                        </div>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  
                  {commit.ai_summary.how_to_test.curl && (
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-400 font-medium text-sm">cURL Command</span>
                      </div>
                      <pre className="text-sm text-slate-300 font-mono overflow-x-auto">
                        {commit.ai_summary.how_to_test.curl}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {commit.ai_summary.tags && commit.ai_summary.tags.length > 0 && (
                <div className="lg:col-span-2">
                  <div className="flex flex-wrap gap-3">
                    {commit.ai_summary.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="px-4 py-2 bg-violet-500/20 text-violet-300 rounded-xl text-sm font-medium border border-violet-500/30 hover:bg-violet-500/30 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Files Changed Section */}
          {commit?.files && commit.files.length > 0 && (
            <div className="backdrop-blur-xl bg-slate-900/60 rounded-3xl p-8 border border-slate-700/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Files Changed</h2>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                  {commit.files.length} files
                </span>
              </div>
              
              <div className="space-y-3">
                {commit.files.map((file, index) => (
                  <div key={index} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-mono text-sm">{file.filename}</div>
                          <div className="text-xs text-slate-400">{file.status || 'modified'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        {file.additions !== undefined && (
                          <span className="flex items-center gap-1 text-green-400">
                            <span className="text-green-300">+{file.additions}</span>
                          </span>
                        )}
                        {file.deletions !== undefined && (
                          <span className="flex items-center gap-1 text-red-400">
                            <span className="text-red-300">-{file.deletions}</span>
                          </span>
                        )}
                        {file.changes !== undefined && (
                          <span className="text-slate-400">{file.changes} changes</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Q&A Section */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <span className="text-2xl">💬</span>
              </div>
              <h2 className="text-2xl font-semibold text-white">Ask About This Commit</h2>
            </div>
            
            <form onSubmit={handleAsk} className="mb-8">
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What would you like to know about this commit? (e.g., 'Explain like I'm 5', 'What could go wrong?', 'How does this affect the API?')"
                  className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all duration-300 resize-none"
                  rows="3"
                  disabled={asking}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>AI will answer based only on this commit's context</span>
                </div>
                <button
                  type="submit"
                  disabled={asking || !question.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl text-white font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {asking ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Thinking...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h7a1 1 0 000 2H4v10a2 2 0 002 2h6l2 2h-8a2 2 0 01-2-2V5zM15 7v3a1 1 0 11-2 0V7.5a.5.5 0 00-.5-.5H10a1 1 0 110-2h2.5A2.5 2.5 0 0115 7.5V7z" />
                      </svg>
                      Ask Question
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Q&A History */}
            <div className="space-y-6">
              {qna.map((item) => (
                <div key={item.id} className="border-l-4 border-amber-500/30 pl-6 bg-slate-800/30 rounded-r-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-400 text-sm">Q</span>
                    </div>
                    <div className="font-semibold text-white">{item.question}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-400 text-sm">A</span>
                    </div>
                    <div className="text-slate-300 prose prose-invert max-w-none prose-sm">
                      <ReactMarkdown>{item.answer}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              
              {qna.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No questions asked yet. Ask anything about this commit!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
