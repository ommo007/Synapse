import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { commitsAPI, aiAPI } from '../api/client'
import ReactMarkdown from 'react-markdown'

export default function CommitDetail() {
  const { sha } = useParams()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading commit details...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="card mb-6">
          <h1 className="text-2xl font-bold mb-4">{commit?.message}</h1>
          
          <div className="text-sm text-gray-400 mb-4">
            <span>Author: {commit?.author_name}</span>
            <span className="mx-2">•</span>
            <span>SHA: {sha.substring(0, 7)}</span>
          </div>

          {commit?.ai_summary && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Simple Explanation</h3>
                <p className="text-gray-300">{commit.ai_summary.simple_explanation}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Technical Details</h3>
                <ul className="list-disc list-inside text-gray-300">
                  {commit.ai_summary.technical_summary?.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {commit.ai_summary.how_to_test?.steps && (
                <div>
                  <h3 className="font-semibold mb-2">How to Test</h3>
                  <ol className="list-decimal list-inside text-gray-300">
                    {commit.ai_summary.how_to_test.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  
                  {commit.ai_summary.how_to_test.curl && (
                    <pre className="mt-2 p-3 bg-gray-800 rounded text-sm overflow-x-auto">
                      {commit.ai_summary.how_to_test.curl}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Ask About This Commit</h2>
          
          <form onSubmit={handleAsk} className="mb-6">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to know about this commit?"
              className="w-full px-4 py-2 bg-gray-700 rounded-lg mb-4"
              rows="3"
              disabled={asking}
            />
            <button
              type="submit"
              disabled={asking}
              className="btn-primary"
            >
              {asking ? 'Thinking...' : 'Ask Question'}
            </button>
          </form>

          <div className="space-y-4">
            {qna.map((item) => (
              <div key={item.id} className="border-l-2 border-primary-600 pl-4">
                <div className="font-medium mb-2">Q: {item.question}</div>
                <div className="text-gray-300">
                  <ReactMarkdown>{item.answer}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
