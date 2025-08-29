import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Button, Card, CardContent, Stack, Typography } from '@mui/material'

async function fetchEvent(id){
  const res = await fetch(`/api/event/${id}`)
  if(!res.ok) throw new Error('No se pudo cargar el evento')
  return res.json()
}

function EventDetailPage(){
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({ queryKey: ['event', id], queryFn: ()=> fetchEvent(id) })

  async function enroll(){
    const token = localStorage.getItem('jwt_token')
    const res = await fetch(`/api/event/${id}/enrollment`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
    if(!res.ok){ alert('No se pudo inscribir'); return }
    alert('Inscripción exitosa')
  }

  async function unenroll(){
    const token = localStorage.getItem('jwt_token')
    const res = await fetch(`/api/event/${id}/enrollment`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
    if(!res.ok){ alert('No se pudo desinscribir'); return }
    alert('Baja exitosa')
  }

  if(isLoading) return <Typography>Cargando...</Typography>
  if(error) return <Typography color="error">{String(error.message || error)}</Typography>

  const ev = data

  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h5">{ev.name}</Typography>
          <Typography>{ev.description}</Typography>
          <Typography>Fecha: {ev.start_date}</Typography>
          <Typography>Duración: {ev.duration_in_minutes} min</Typography>
          <Typography>Precio: {ev.price}</Typography>
          <Typography>Capacidad: {ev.max_assistance}</Typography>
          <Typography>Habilitado: {String(ev.enabled_for_enrollment)}</Typography>
          <Typography variant="subtitle1">Ubicación: {ev.event_location?.name} - {ev.event_location?.full_address}</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={enroll}>Inscribirme</Button>
            <Button variant="outlined" onClick={unenroll}>Cancelar inscripción</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default EventDetailPage


