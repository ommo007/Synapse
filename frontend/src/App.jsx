import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Connect from './pages/Connect'
import Timeline from './pages/Timeline'
import CommitDetail from './pages/CommitDetail'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/timeline/:projectId" element={<Timeline />} />
        {/* or */}
        <Route path="/project/:projectId" element={<Timeline />} />
        {/* Make sure the route matches what you're navigating to */}
        <Route path="/commit/:sha" element={<CommitDetail />} />
      </Routes>
    </Router>
  )
}

export default App
