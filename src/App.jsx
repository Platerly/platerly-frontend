import React, { useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import Button from './components/ui/Button'
import Input from './components/ui/Input'

const App = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold text-center mb-6">Platerly</h1>
      <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          error={error}
        />
        <Button onClick={() => {
          if (!email.includes('@')) {
            setError('Please enter a valid email.')
          } else {
            setError('')
            alert('Submitted!')
          }
        }}>
          Submit
        </Button>
      </div>
    </AppLayout>
  )
}

export default App
