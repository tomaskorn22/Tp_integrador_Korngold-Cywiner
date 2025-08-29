import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
  first_name: z.string().min(3, 'Min 3 caracteres'),
  last_name: z.string().min(3, 'Min 3 caracteres'),
  username: z.string().email('Email inválido'),
  password: z.string().min(3, 'Min 3 caracteres')
})

function RegisterPage(){
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values){
    const res = await fetch('/api/user/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    if(res.status === 201){ alert('Registrado, ahora inicia sesión'); navigate('/login'); return }
    const data = await res.json().catch(()=>({}))
    alert(data?.message || 'Registro inválido')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <Typography variant="h5">Registro</Typography>
        <TextField label="Nombre" {...register('first_name')} error={!!errors.first_name} helperText={errors.first_name?.message} />
        <TextField label="Apellido" {...register('last_name')} error={!!errors.last_name} helperText={errors.last_name?.message} />
        <TextField label="Email" {...register('username')} error={!!errors.username} helperText={errors.username?.message} />
        <TextField label="Contraseña" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
        <Button type="submit" variant="contained" disabled={isSubmitting}>Registrarme</Button>
      </Stack>
    </form>
  )
}

export default RegisterPage


