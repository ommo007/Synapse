import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsAPI, authAPI } from '../api/client'

export default function Connect() {
  const navigate = useNavigate()
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) {
      setError('Invalid GitHub URL')
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

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Connect Your Repository</h1>
        
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Option 1: GitHub OAuth (Recommended)</h2>
          <button
            onClick={handleOAuth}
            className="btn-primary w-full"
          >
            🔐 Connect with GitHub
          </button>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Option 2: Paste Repository URL</h2>
          <form onSubmit={handleConnect}>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full px-4 py-2 bg-gray-700 rounded-lg mb-4"
              disabled={loading}
            />
            
            {error && (
              <div className="text-red-400 mb-4 p-3 bg-red-900/20 rounded">
                Error: {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Connecting...' : 'Connect Repository'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
