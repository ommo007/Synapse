import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectsAPI, commitsAPI } from '../api/client'
import { format } from 'date-fns'

export default function Timeline() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const [projectRes, commitsRes] = await Promise.all([
        projectsAPI.get(projectId),
        projectsAPI.getCommits(projectId, 1),
      ])
      setProject(projectRes.data)
      setCommits(commitsRes.data)
      setHasMore(commitsRes.data.length === 20)
    } catch (error) {
      console.error('Failed to load data:', error)
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
    try {
      await commitsAPI.summarize(sha)
      const commitsRes = await projectsAPI.getCommits(projectId, 1)
      setCommits(commitsRes.data)
    } catch (error) {
      console.error('Failed to summarize:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading commits...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {project?.github_owner}/{project?.github_repo}
        </h1>
        <p className="text-gray-400">
          Commit Timeline - Showing {commits.length} commits
        </p>
      </div>

      <div className="space-y-4">
        {commits.map((commit) => (
          <div key={commit.sha} className="card hover:border-primary-600 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link 
                  to={`/commit/${commit.sha}`}
                  className="text-lg font-medium hover:text-primary-400 transition-colors"
                >
                  {commit.message.split('\n')[0]}
                </Link>
                
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span>👤 {commit.author_name}</span>
                  <span>📅 {format(new Date(commit.committed_at), 'MMM d, yyyy HH:mm')}</span>
                  <span>📁 {commit.files_summary?.length || 0} files</span>
                </div>

                {commit.ai_summary && (
                  <div className="mt-4 p-3 bg-gray-700/50 rounded">
                    <p className="text-sm">{commit.ai_summary.simple_explanation}</p>
                    <div className="flex gap-2 mt-2">
                      {commit.ai_summary.tags?.map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 bg-primary-600/20 text-primary-400 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!commit.ai_summary && (
                <button
                  onClick={() => handleSummarize(commit.sha)}
                  className="btn-primary text-sm"
                >
                  Generate Summary
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMoreCommits}
            disabled={loadingMore}
            className="btn-primary px-8"
          >
            {loadingMore ? 'Loading...' : 'Load More Commits'}
          </button>
        </div>
      )}

      {!hasMore && commits.length > 0 && (
        <div className="mt-8 text-center text-gray-400">
          <p>No more commits to load</p>
        </div>
      )}
    </div>
  )
}
