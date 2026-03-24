import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, UserRole } from '../types/domain'
import { AuthContext } from './AuthContextStore'
import type { AuthContextValue } from './authTypes'

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const buildProfileFromUser = useCallback((authUser: User) => {
    const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>
    const role = metadata.role === 'admin' ? 'admin' : 'student'

    return {
      id: authUser.id,
      email: authUser.email ?? '',
      full_name: typeof metadata.full_name === 'string' && metadata.full_name.length > 0
        ? metadata.full_name
        : authUser.email?.split('@')[0] ?? 'Student User',
      role,
      program: typeof metadata.program === 'string' ? metadata.program : null,
      year_level: typeof metadata.year_level === 'number' ? metadata.year_level : null,
    }
  }, [])

  const loadProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle<Profile>()

    if (error) {
      setProfile(null)
      return
    }

    if (data) {
      setProfile(data)
      return
    }

    const fallbackProfile = buildProfileFromUser(authUser)

    const { data: insertedProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert(fallbackProfile)
      .select('*')
      .single<Profile>()

    if (upsertError) {
      setProfile(null)
      return
    }

    setProfile(insertedProfile)
  }, [buildProfileFromUser])

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      setUser(session?.user ?? null)
      await loadProfile(session?.user ?? null)
      setLoading(false)
    }

    initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      await loadProfile(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async ({ email, password, fullName, program, yearLevel }: {
    email: string
    password: string
    fullName: string
    program?: string
    yearLevel?: number
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student' satisfies UserRole,
          program: program || null,
          year_level: yearLevel || null,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (data.user?.id) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'student',
        program: program || null,
        year_level: yearLevel || null,
      })

      if (profileError) {
        return { error: profileError.message }
      }
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = useCallback(async () => {
    await loadProfile(user)
  }, [loadProfile, user])

  const value: AuthContextValue = useMemo(
    () => ({ user, profile, loading, signIn, signUp, signOut, refreshProfile }),
    [user, profile, loading, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
