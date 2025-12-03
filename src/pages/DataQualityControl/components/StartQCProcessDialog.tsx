import React, { useState, useEffect, useRef } from 'react'
import { Form, Input } from 'antd'
import CustomDialog, { CustomDialogProps } from '@/components/CustomDialog'
import { api } from '@/utils/request'
import { logger } from '@/utils/logger'
import { uiMessage } from '@/utils/uiMessage'
import type { SSEManager } from '@/utils/request'

interface StartQCProcessDialogProps extends Omit<CustomDialogProps, 'children'> {
    selectedTypes: string[] // 原始的 nodeType 数组，如 ['TimelinessQC', 'CompletenessQC']
    onStartSuccess?: (taskId: string, processName: string) => void
}

const StartQCProcessDialog: React.FC<StartQCProcessDialogProps> = ({
    open,
    onOk,
    onCancel,
    selectedTypes,
    onStartSuccess,
    ...restProps
}) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const sseManagerRef = useRef<SSEManager | null>(null)
    const taskIdRef = useRef<string | null>(null)
    const processNameRef = useRef<string>('')

    // 清理SSE连接
    useEffect(() => {
        return () => {
            if (sseManagerRef.current) {
                sseManagerRef.current.disconnect()
                sseManagerRef.current = null
            }
        }
    }, [])

    // 处理确定按钮
    const handleOk = async (e: React.MouseEvent<HTMLElement>) => {
        try {
            const values = await form.validateFields()
            const processName = values.processName?.trim()
            
            if (!processName) {
                return
            }

            setLoading(true)
            processNameRef.current = processName
            taskIdRef.current = null

            // 生成临时taskId（如果SSE没有返回）
            const tempTaskId =
                (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
                `${Date.now()}-${Math.random().toString(16).slice(2)}`

            // 创建一个Promise来等待taskId
            const taskIdPromise = new Promise<string>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    // 如果5秒内没有获取到taskId，使用临时ID
                    resolve(tempTaskId)
                }, 5000)

                // 调用SSE接口
                const manager = api.createSSE({
                    url: '/data/qc/task/process/start',
                    method: 'POST',
                    data: {
                        taskType: selectedTypes, // string[] 类型，如 ['TimelinessQC', 'CompletenessQC']
                        taskFlowName: processName, // string 类型
                    },
                    maxReconnectAttempts: 3,
                    reconnectInterval: 5000,
                    onOpen: () => {
                        logger.info('SSE连接已建立，开始启动质控流程...')
                    },
                    onMessage: (event: MessageEvent) => {
                        const message = event.data
                        logger.info('收到SSE消息:', message)
                        
                        // 只处理第一条消息来获取taskId
                        if (taskIdRef.current) {
                            return // 已经获取到taskId，不再处理后续消息
                        }
                        
                        // 尝试从消息中解析taskId（根据实际消息格式调整）
                        try {
                            const data = event.data
                            // 如果消息是JSON格式，尝试解析
                            if (data.startsWith('{')) {
                                const parsed = JSON.parse(data)
                                // 优先查找 taskId, task_id, batch_id
                                const id = parsed.taskId || parsed.task_id || parsed.batch_id || parsed.batchId
                                if (id) {
                                    taskIdRef.current = String(id)
                                    clearTimeout(timeout)
                                    // 断开SSE连接，详情页会重新建立
                                    if (sseManagerRef.current) {
                                        sseManagerRef.current.disconnect()
                                        sseManagerRef.current = null
                                    }
                                    resolve(taskIdRef.current)
                                    return
                                }
                            }
                            // 如果消息包含taskId、task_id或batch_id字段
                            if (data.includes('taskId') || data.includes('task_id') || data.includes('batch_id') || data.includes('batchId')) {
                                const patterns = [
                                    /task[Ii]d["\s:]+([^"}\s,]+)/,
                                    /batch[Ii]d["\s:]+([^"}\s,]+)/,
                                ]
                                for (const pattern of patterns) {
                                    const match = data.match(pattern)
                                    if (match && match[1]) {
                                        taskIdRef.current = match[1]
                                        clearTimeout(timeout)
                                        // 断开SSE连接，详情页会重新建立
                                        if (sseManagerRef.current) {
                                            sseManagerRef.current.disconnect()
                                            sseManagerRef.current = null
                                        }
                                        resolve(taskIdRef.current)
                                        return
                                    }
                                }
                            }
                        } catch {
                            // 解析失败，忽略
                        }
                    },
                    onError: (error: Event) => {
                        const msg = 'SSE连接错误'
                        logger.error(msg, error)
                        clearTimeout(timeout)
                        if (sseManagerRef.current) {
                            sseManagerRef.current.disconnect()
                            sseManagerRef.current = null
                        }
                        reject(new Error(msg))
                    },
                    onClose: () => {
                        logger.info('SSE连接已关闭')
                        clearTimeout(timeout)
                        // 如果还没有taskId，使用临时ID
                        if (!taskIdRef.current) {
                            resolve(tempTaskId)
                        } else {
                            resolve(taskIdRef.current)
                        }
                    },
                    onMaxReconnectAttemptsReached: () => {
                        const msg = 'SSE重连次数已达上限'
                        logger.error(msg)
                        clearTimeout(timeout)
                        if (sseManagerRef.current) {
                            sseManagerRef.current.disconnect()
                            sseManagerRef.current = null
                        }
                        reject(new Error(msg))
                    },
                })

                sseManagerRef.current = manager
                manager.connect()
            })

            // 等待获取taskId
            const taskId = await taskIdPromise
            setLoading(false)

            // 调用成功回调，跳转到详情页
            if (onStartSuccess) {
                onStartSuccess(taskId, processName)
            }

        } catch (error) {
            logger.error('启动质控流程失败:', error as Error)
            throw error
        }
    }

    // 处理取消按钮
    const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
        // 断开SSE连接
        if (sseManagerRef.current) {
            sseManagerRef.current.disconnect()
            sseManagerRef.current = null
        }
        form.resetFields()
        if (onCancel) {
            onCancel(e)
        }
    }

    return (
        <CustomDialog
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            title='启动质控流程'
            okText='启动'
            cancelText='取消'
            confirmLoading={loading}
            width={600}
            {...restProps}
        >
            <Form form={form} layout='vertical'>
                <Form.Item
                    label='流程名称'
                    name='processName'
                    rules={[
                        { required: true, message: '请输入流程名称' },
                        { max: 50, message: '流程名称不能超过50个字符' },
                    ]}
                >
                    <Input placeholder='请输入流程名称' />
                </Form.Item>
            </Form>
        </CustomDialog>
    )
}

export default StartQCProcessDialog

