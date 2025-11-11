import type { ArgsProps } from 'antd/es/message/interface'
import { messageBus } from '@/utils/messageBus'

// Generate a unique key if caller does not provide one
const uniqueKey = (): string => `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`

export const uiMessage = {
    open(args: ArgsProps): void {
        messageBus.publish({ type: 'open', args })
    },
    success(content: ArgsProps['content'], duration?: number): void {
        this.open({ type: 'success', content, duration })
    },
    error(content: ArgsProps['content'], duration?: number): void {
        this.open({ type: 'error', content, duration })
    },
    info(content: ArgsProps['content'], duration?: number): void {
        this.open({ type: 'info', content, duration })
    },
    warning(content: ArgsProps['content'], duration?: number): void {
        this.open({ type: 'warning', content, duration })
    },
    /**
     * Loading message. Returns a key that can be used to destroy later.
     * For React 19 compatibility, we recommend using key-based destroy.
     */
    loading(content: ArgsProps['content'], duration: number = 0, key?: string): string {
        const k = key || uniqueKey()
        this.open({ type: 'loading', content, duration, key: k })
        return k
    },
    /** Destroy message by key or destroy all if key is undefined */
    destroy(key?: string): void {
        messageBus.publish({ type: 'destroy', key })
    },
}

export default uiMessage
