import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

function Navbar(){
  const navigate = useNavigate()
  const token = localStorage.getItem('jwt_token')

  function logout(){
    localStorage.removeItem('jwt_token')
    navigate('/login')
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }} component={RouterLink} to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          Eventos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" component={RouterLink} to="/">Listado</Button>
          <Button color="inherit" component={RouterLink} to="/mine">Mis eventos</Button>
          <Button color="inherit" component={RouterLink} to="/locations">Ubicaciones</Button>
          {!token && <Button color="inherit" component={RouterLink} to="/login">Login</Button>}
          {!token && <Button color="inherit" component={RouterLink} to="/register">Registro</Button>}
          {token && <Button color="inherit" onClick={logout}>Salir</Button>}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar


