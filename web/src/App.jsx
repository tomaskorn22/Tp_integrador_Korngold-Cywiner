import { Container, CssBaseline } from '@mui/material'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar.jsx'
import EventsListPage from './pages/EventsListPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import MyEventsPage from './pages/MyEventsPage.jsx'
import LocationsPage from './pages/LocationsPage.jsx'

function App() {
  return (
    <>
      <CssBaseline />
      <Navbar />
      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<EventsListPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/mine" element={<MyEventsPage />} />
          <Route path="/locations" element={<LocationsPage />} />
        </Routes>
      </Container>
    </>
  )
}

export default App
