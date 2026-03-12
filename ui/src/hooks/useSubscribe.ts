import { useState } from "react"
import { subscribeToNewsletter } from "../api/newsletter"

export type SubscribeStatus = "idle" | "loading" | "success" | "error"

export function useSubscribe() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<SubscribeStatus>("idle")
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("loading")
    setMessage(null)
    try {
      const res = await subscribeToNewsletter(email.trim())
      setStatus("success")
      setMessage(res.detail)
      setEmail("")
    } catch (err) {
      setStatus("error")
      setMessage((err as Error).message)
    }
  }

  function reset() {
    setStatus("idle")
    setMessage(null)
  }

  return { email, setEmail, status, message, handleSubmit, reset }
}

