import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Grid, IconButton, Stack, TextField, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const schema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  start_date: z.string().min(10),
  duration_in_minutes: z.coerce.number().min(1),
  price: z.coerce.number().min(0),
  enabled_for_enrollment: z.coerce.boolean().optional(),
  max_assistance: z.coerce.number().min(1),
  id_event_location: z.coerce.number().min(1)
})

async function fetchMyEvents(){
  const res = await fetch('/api/event')
  if(!res.ok) throw new Error('Error al cargar eventos')
  return res.json()
}

function MyEventsPage(){
  const queryClient = useQueryClient()
  const { data, refetch } = useQuery({ queryKey: ['my-events'], queryFn: fetchMyEvents })
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values){
    const token = localStorage.getItem('jwt_token')
    const res = await fetch('/api/event', { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(values) })
    if(res.status !== 201){ const d=await res.json().catch(()=>({})); alert(d?.message||'No se pudo crear'); return }
    reset()
    queryClient.invalidateQueries({ queryKey: ['my-events'] })
    refetch()
  }

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const token = localStorage.getItem('jwt_token')
      const res = await fetch('/api/event', { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) })
      if(!res.ok) throw new Error((await res.json().catch(()=>({})))?.message || 'No se pudo actualizar')
      return res.json().catch(()=>payload)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-events'] }) }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('jwt_token')
      const res = await fetch(`/api/event/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      if(!res.ok) throw new Error((await res.json().catch(()=>({})))?.message || 'No se pudo eliminar')
      return true
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-events'] }) }
  })

  const list = Array.isArray(data?.collection) ? data.collection : Array.isArray(data) ? data : []
  const [editingId, setEditingId] = React.useState(null)
  const [editValues, setEditValues] = React.useState({})

  function startEdit(item){ setEditingId(item.id); setEditValues({ ...item }) }
  function cancelEdit(){ setEditingId(null); setEditValues({}) }
  async function saveEdit(){ await updateMutation.mutateAsync(editValues); cancelEdit(); }

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Crear evento</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><TextField fullWidth label="Nombre" {...register('name')} error={!!errors.name} helperText={errors.name?.message} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Descripción" {...register('description')} error={!!errors.description} helperText={errors.description?.message} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Fecha inicio (YYYY-MM-DD)" {...register('start_date')} error={!!errors.start_date} helperText={errors.start_date?.message} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Duración (min)" type="number" {...register('duration_in_minutes')} error={!!errors.duration_in_minutes} helperText={errors.duration_in_minutes?.message} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Precio" type="number" {...register('price')} error={!!errors.price} helperText={errors.price?.message} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Capacidad máx." type="number" {...register('max_assistance')} error={!!errors.max_assistance} helperText={errors.max_assistance?.message} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="ID Ubicación" type="number" {...register('id_event_location')} error={!!errors.id_event_location} helperText={errors.id_event_location?.message} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Habilitado (true/false)" {...register('enabled_for_enrollment')} error={!!errors.enabled_for_enrollment} helperText={errors.enabled_for_enrollment?.message} /></Grid>
          <Grid item xs={12}><Button type="submit" variant="contained" disabled={isSubmitting}>Crear</Button></Grid>
        </Grid>
      </form>
      <Typography variant="h6">Mis eventos</Typography>
      <Grid container spacing={1}>
        {list.map((ev) => (
          <Grid item xs={12} key={ev.id}>
            {editingId === ev.id ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField size="small" label="Nombre" value={editValues.name||''} onChange={e=>setEditValues(v=>({...v, name:e.target.value}))} />
                <TextField size="small" label="Descripción" value={editValues.description||''} onChange={e=>setEditValues(v=>({...v, description:e.target.value}))} />
                <TextField size="small" label="Fecha" value={editValues.start_date||''} onChange={e=>setEditValues(v=>({...v, start_date:e.target.value}))} />
                <IconButton color="primary" onClick={saveEdit}><SaveIcon /></IconButton>
                <IconButton onClick={cancelEdit}><CloseIcon /></IconButton>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ flex:1 }}>{ev.name} — {ev.start_date}</Typography>
                <IconButton color="primary" onClick={()=> startEdit(ev)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={()=> deleteMutation.mutate(ev.id)}><DeleteIcon /></IconButton>
              </Stack>
            )}
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export default MyEventsPage


