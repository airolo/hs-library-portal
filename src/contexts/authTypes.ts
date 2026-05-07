import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types/domain'

export interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (payload: {
    email: string
    password: string
    firstName: string
    lastName: string
    program?: string
  }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}
