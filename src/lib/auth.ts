import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Add your authentication logic here
        // This is a placeholder - implement your actual authentication
        if (credentials?.email && credentials?.password) {
          // Example: Check against your database
          // const user = await getUserByEmail(credentials.email)
          // if (user && await verifyPassword(credentials.password, user.password)) {
          //   return { id: user.id, email: user.email, name: user.name }
          // }
          
          // For now, return a mock user for testing
          return {
            id: "1",
            email: credentials.email,
            name: "Test User"
          }
        }
        return null
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
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  session: {
    strategy: "jwt"
  }
}
