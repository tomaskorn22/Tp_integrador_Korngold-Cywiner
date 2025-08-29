import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Pagination, Stack, TextField, Typography } from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'

async function fetchEvents({ page, name, startdate, tag }){
  const params = new URLSearchParams()
  if(page) params.set('page', String(page))
  if(name) params.set('name', name)
  if(startdate) params.set('startdate', startdate)
  if(tag) params.set('tag', tag)
  const res = await fetch(`/api/event/?${params.toString()}`)
  if(!res.ok) throw new Error('Error al cargar eventos')
  return res.json()
}

function EventsListPage(){
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const pageParam = Number(searchParams.get('page') || '1')
  const [name, setName] = useState(searchParams.get('name') || '')
  const [startdate, setStartdate] = useState(searchParams.get('startdate') || '')
  const [tag, setTag] = useState(searchParams.get('tag') || '')

  const { data, isLoading, error } = useQuery({
    queryKey: ['events', pageParam, name, startdate, tag],
    queryFn: () => fetchEvents({ page: pageParam, name, startdate, tag })
  })

  const collection = useMemo(() => data?.collection || data || [], [data])
  const totalPages = data?.totalPages || 10

  function onSearch(){
    const next = new URLSearchParams()
    if(name) next.set('name', name)
    if(startdate) next.set('startdate', startdate)
    if(tag) next.set('tag', tag)
    next.set('page', '1')
    setSearchParams(next)
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Eventos</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}><TextField fullWidth label="Nombre" value={name} onChange={e=>setName(e.target.value)} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Fecha inicio (YYYY-MM-DD)" value={startdate} onChange={e=>setStartdate(e.target.value)} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth label="Tag" value={tag} onChange={e=>setTag(e.target.value)} /></Grid>
        <Grid item xs={12} md={1}><Button fullWidth variant="contained" onClick={onSearch}>Buscar</Button></Grid>
      </Grid>

      {isLoading && <Typography>Cargando...</Typography>}
      {error && <Typography color="error">{String(error.message || error)}</Typography>}

      <Grid container spacing={2}>
        {collection.map((ev) => (
          <Grid item xs={12} md={6} lg={4} key={ev.id || ev._id || Math.random()}>
            <Card>
              <CardActionArea onClick={()=> navigate(`/event/${ev.id || ev._id}`)}>
                <CardContent>
                  <Typography variant="h6">{ev.name || ev.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{ev.description}</Typography>
                  <Typography variant="body2">{ev.start_date || ev.date}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box display="flex" justifyContent="center">
        <Pagination page={pageParam} count={totalPages} onChange={(_, p)=> setSearchParams({ page: String(p), name, startdate, tag })} />
      </Box>
    </Stack>
  )
}

export default EventsListPage


