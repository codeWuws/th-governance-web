import type { ArgsProps } from 'antd/es/message/interface'

export type UIMessageAction = { type: 'open'; args: ArgsProps } | { type: 'destroy'; key?: string }

type Subscriber = (action: UIMessageAction) => void

// Lightweight event bus with buffering until the first subscriber attaches
class MessageBus {
    private subscribers: Set<Subscriber> = new Set()
    private buffer: UIMessageAction[] = []

    subscribe(fn: Subscriber): () => void {
        this.subscribers.add(fn)
        // Flush buffered events on first subscription
        if (this.buffer.length) {
            this.buffer.forEach(action => {
                try {
                    fn(action)
                } catch {
                    /* swallow */
                }
            })
            this.buffer = []
        }
        return () => {
            this.subscribers.delete(fn)
        }
    }

    publish(action: UIMessageAction): void {
        if (this.subscribers.size === 0) {
            // Buffer until host is ready
            this.buffer.push(action)
            return
        }
        this.subscribers.forEach(fn => {
            try {
                fn(action)
            } catch {
                /* swallow */
            }
        })
    }
}

export const messageBus = new MessageBus()
