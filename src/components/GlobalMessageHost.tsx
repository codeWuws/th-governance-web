import React, { useEffect } from 'react'
import { App as AntdApp } from 'antd'
import { messageBus, type UIMessageAction } from '@/utils/messageBus'

// Global host component that bridges our messageBus to Antd's message API via App.useApp()
const GlobalMessageHost: React.FC = () => {
    const { message } = AntdApp.useApp()

    useEffect(() => {
        const unsubscribe = messageBus.subscribe((action: UIMessageAction) => {
            try {
                if (action.type === 'open') {
                    message.open(action.args)
                } else if (action.type === 'destroy') {
                    // Antd supports destroying all or by key
                    if (action.key) {
                        message.destroy(action.key)
                    } else {
                        message.destroy()
                    }
                }
            } catch (e) {
                // As a fallback, log to console
                console.error('GlobalMessageHost error handling message', e)
            }
        })
        return () => unsubscribe()
    }, [message])

    // It renders nothing; it only bridges events
    return null
}

export default GlobalMessageHost
