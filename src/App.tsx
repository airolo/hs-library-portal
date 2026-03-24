import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { supabaseEnvError } from './lib/supabase'
import { AppRouter } from './routes/AppRouter'

function App() {
  if (supabaseEnvError) {
    return (
      <main className="setup-screen">
        <section className="setup-card">
          <h1>Supabase Setup Needed</h1>
          <p>{supabaseEnvError}</p>
          <p>
            Create a <strong>.env</strong> file in the project root and set:
          </p>
          <ul>
            <li>VITE_SUPABASE_URL=your-project-url</li>
            <li>VITE_SUPABASE_ANON_KEY=your-anon-key</li>
          </ul>
          <p>Then restart the dev server.</p>
        </section>
      </main>
    )
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
