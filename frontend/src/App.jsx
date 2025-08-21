import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Connect from './pages/Connect'
import Timeline from './pages/Timeline'
import CommitDetail from './pages/CommitDetail'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/project/:projectId" element={<Timeline />} />
          <Route path="/commit/:sha" element={<CommitDetail />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
