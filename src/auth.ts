import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { loginSchema } from '@/lib/validations'

/**
 * Configuration Auth.js (v5). Stratégie de session JWT (pas d'adaptateur BDD
 * requis) + fournisseur Credentials (e-mail / mot de passe hashé bcrypt).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const parsed = loginSchema.safeParse(creds)
        if (!parsed.success) return null
        const user = await db.user.findUnique({ where: { email: parsed.data.email } })
        if (!user) return null
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name ?? undefined }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.uid = user.id
      return token
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string
      return session
    },
  },
})
