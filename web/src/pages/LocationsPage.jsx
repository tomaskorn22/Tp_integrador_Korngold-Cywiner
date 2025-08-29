import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, Grid, Typography } from '@mui/material'

async function fetchLocations(){
  const token = localStorage.getItem('jwt_token')
  const res = await fetch('/api/event-location', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
  if(!res.ok) throw new Error('Error al cargar ubicaciones')
  return res.json()
}

function LocationsPage(){
  const { data, isLoading, error } = useQuery({ queryKey: ['locations'], queryFn: fetchLocations })
  const collection = Array.isArray(data) ? data : data?.collection || []

  if(isLoading) return <Typography>Cargando...</Typography>
  if(error) return <Typography color="error">{String(error.message || error)}</Typography>

  return (
    <Grid container spacing={2}>
      {collection.map((loc) => (
        <Grid item xs={12} md={6} key={loc.id}>
          <Card>
            <CardContent>
              <Typography variant="h6">{loc.name}</Typography>
              <Typography>{loc.full_address}</Typography>
              <Typography>Capacidad: {loc.max_capacity}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default LocationsPage


