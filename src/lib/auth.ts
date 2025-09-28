import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./database"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user by email
          const user = await db
            .selectFrom('users')
            .selectAll()
            .where('email', '=', credentials.email)
            .executeTakeFirst()

          if (!user) {
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name || user.email,
            isAdmin: user.is_admin,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = user.isAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    }
  },
  session: {
    strategy: "jwt"
  }
}
