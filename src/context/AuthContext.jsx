import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

import { supabase } from "../lib/supabase"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [member, setMember] = useState(null)

  const [loading, setLoading] = useState(true)

  const loadMemberProfile = async (authUser) => {
    if (!authUser) {
      setMember(null)
      return null
    }

    const { data, error } = await supabase
      .from("members")
      .select(
        `
          id,
          full_name,
          email,
          company_position,
          portal_role,
          account_status,
          account_user_id,
          profile_photo_path
        `
      )
      .eq("account_user_id", authUser.id)
      .maybeSingle()

    if (error) {
      console.error(
        "Unable to load member profile:",
        error
      )

      setMember(null)
      return null
    }

    setMember(data)

    return data
  }

  useEffect(() => {
    let mounted = true

    const loadInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadMemberProfile(
            session.user
          )
        } else {
          setMember(null)
        }
      } catch (error) {
        console.error(
          "Session loading error:",
          error
        )

        if (mounted) {
          setSession(null)
          setUser(null)
          setMember(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession)
        setUser(
          newSession?.user ?? null
        )

        if (event === "SIGNED_OUT") {
          setMember(null)
          setLoading(false)
          return
        }

        if (newSession?.user) {
          // Keep the callback itself lightweight.
          setTimeout(async () => {
            await loadMemberProfile(
              newSession.user
            )

            if (mounted) {
              setLoading(false)
            }
          }, 0)
        } else {
          setMember(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const { error } =
      await supabase.auth.signOut()

    if (error) {
      console.error(
        "Sign out error:",
        error
      )

      throw error
    }

    setSession(null)
    setUser(null)
    setMember(null)
  }

  const refreshMember = async () => {
    if (!user) return null

    return loadMemberProfile(user)
  }

  const value = {
    session,
    user,
    member,
    loading,

    role: member?.portal_role ?? null,

    isApproved:
      member?.account_status ===
      "approved",

    isMainAdmin:
      member?.portal_role ===
      "main_admin",

    isTreasurer:
      member?.portal_role ===
      "treasurer",

    isDirector:
      member?.portal_role ===
      "director",

    signOut,
    refreshMember,
  }

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    )
  }

  return context
}