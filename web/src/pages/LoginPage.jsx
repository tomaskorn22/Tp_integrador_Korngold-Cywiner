import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
  username: z.string().email('Email inválido'),
  password: z.string().min(3, 'Min 3 caracteres')
})

function LoginPage(){
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values){
    const res = await fetch('/api/user/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    const data = await res.json().catch(()=>({}))
    if(!res.ok || !data?.token){ alert(data?.message || 'Login inválido'); return }
    localStorage.setItem('jwt_token', data.token)
    navigate('/')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <Typography variant="h5">Ingresar</Typography>
        <TextField label="Email" {...register('username')} error={!!errors.username} helperText={errors.username?.message} />
        <TextField label="Contraseña" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
        <Button type="submit" variant="contained" disabled={isSubmitting}>Entrar</Button>
      </Stack>
    </form>
  )
}

export default LoginPage


