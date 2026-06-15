'use client'

import { FormEvent, useState } from 'react'
import type { ViewerProfile } from './StreamingPlatform'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function ChatPanel({ userId, sessionId, viewerLabel, profile }: { userId: string; sessionId: string; viewerLabel: string; profile: ViewerProfile }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    introMessage(viewerLabel),
  ])
  const [input, setInput] = useState(
    `I like ${profile.mood} ${profile.genres.join(', ')} movies${profile.language ? ` in ${profile.language}` : ''}. Remember that preference.`,
  )
  const [isLoading, setIsLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prompt = input.trim()
    if (!prompt || isLoading) return

    const nextMessages = [...messages, { id: crypto.randomUUID(), role: 'user' as const, content: prompt }]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          prompt,
          messages: nextMessages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: [{ type: 'text', text: message.content }],
          })),
        }),
      })

      if (!response.ok) throw new Error(await response.text())

      const text = await readResponseText(response)
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: text || 'I saved that preference.' }])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: error instanceof Error ? `The curator could not respond: ${error.message}` : 'The curator could not respond.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside className="panel chat-panel streaming-chat-panel">
      <div className="panel-kicker">Live curator</div>
      <h2>Ask for the next title</h2>
      <p className="muted">Curating for {viewerLabel}. Gemini Flash 3.1 is grounded in sample_mflix and this viewer’s MongoDB memory.</p>

      <div className="chat-log" aria-live="polite">
        {messages.map((message) => (
          <div className={`message ${message.role}`} key={message.id}>
            {message.role === 'assistant' ? <MarkdownText content={message.content} /> : message.content}
          </div>
        ))}
        {isLoading ? <div className="message assistant">Searching sample_mflix and memory…</div> : null}
      </div>

      <form className="chat-form" onSubmit={submit}>
        <textarea
          className="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask for a recommendation"
          rows={2}
        />
        <button className="primary-button" type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </aside>
  )
}

function introMessage(viewerLabel: string): ChatMessage {
  return {
    id: `assistant-intro-${viewerLabel}`,
    role: 'assistant',
    content: `Tell me what ${viewerLabel} wants to watch. I can remember genres, languages, directors, actors, eras, and content to avoid.`,
  }
}

function MarkdownText({ content }: { content: string }) {
  const blocks = content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <div className="markdown-message">
      {blocks.map((block, index) => {
        const listItems = block
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => /^[-*]\s+/.test(line))

        if (listItems.length > 0) {
          return (
            <ul key={index}>
              {listItems.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`}>{renderInlineMarkdown(item.replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          )
        }

        return <p key={index}>{renderInlineMarkdown(block.replace(/\n/g, ' '))}</p>
      })}
    </div>
  )
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    return <span key={index}>{part}</span>
  })
}

async function readResponseText(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  const raw = await response.text()

  if (contentType.includes('text/plain')) return raw

  const lines = raw.split('\n')
  const textFragments: string[] = []

  for (const line of lines) {
    if (!line.startsWith('data:')) continue
    const payload = line.slice(5).trim()
    if (!payload || payload === '[DONE]') continue

    try {
      const parsed = JSON.parse(payload) as { type?: string; textDelta?: string; delta?: string; text?: string }
      textFragments.push(parsed.textDelta ?? parsed.delta ?? parsed.text ?? '')
    } catch {
      textFragments.push(payload)
    }
  }

  return textFragments.join('').trim() || raw.slice(0, 2000)
}