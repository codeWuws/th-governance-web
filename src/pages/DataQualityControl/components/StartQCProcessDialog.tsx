import React, { useState, useRef } from 'react'
import { Form, Input } from 'antd'
import CustomDialog, { CustomDialogProps } from '@/components/CustomDialog'
import { api } from '@/utils/request'
import { logger } from '@/utils/logger'
import { uiMessage } from '@/utils/uiMessage'
import type { SSEManager } from '@/utils/request'
import { useAppDispatch } from '@/store/hooks'
import { initializeExecution, addMessage } from '@/store/slices/qcExecutionSlice'
import type { WorkflowExecutionMessage } from '@/types'

interface StartQCProcessDialogProps extends Omit<CustomDialogProps, 'children' | 'open'> {
    selectedTypes: string[] // 原始的 nodeType 数组，如 ['TimelinessQC', 'CompletenessQC']
    onStartSuccess?: (taskId: string, processName: string) => void
}

const StartQCProcessDialog: React.FC<StartQCProcessDialogProps> = ({
    onOk,
    onCancel,
    selectedTypes,
    onStartSuccess,
    ...restProps
}) => {
    const dispatch = useAppDispatch()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const sseManagerRef = useRef<SSEManager | null>(null)
    const taskIdRef = useRef<string | null>(null)
    const processNameRef = useRef<string>('')

    // 处理确定按钮
    const handleOk = async (e: React.MouseEvent<HTMLElement>) => {
        try {
            const values = await form.validateFields()
            const processName = values.processName?.trim()
            
            if (!processName) {
                // 表单验证会处理这个错误，不需要额外处理
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
                        
                        try {
                            // 解析SSE消息
                            const data = typeof message === 'string' ? JSON.parse(message) : message
                            
                            // 获取taskId（从消息中或已存储的ref中）
                            const currentTaskId = data.taskId ? String(data.taskId) : taskIdRef.current
                            
                            // 如果是第一条消息且包含taskId，初始化执行状态
                            if (!taskIdRef.current && currentTaskId) {
                                taskIdRef.current = currentTaskId
                                // 初始化质控任务执行状态
                                dispatch(initializeExecution({ taskId: currentTaskId }))
                                clearTimeout(timeout)
                                resolve(currentTaskId)
                            }
                            
                            // 如果已经获取到taskId，将消息存储到全局状态
                            if (currentTaskId && data.taskId) {
                                // 构造 WorkflowExecutionMessage 格式的消息
                                const executionMessage: WorkflowExecutionMessage = {
                                    tableQuantity: data.tableQuantity || 0,
                                    node: {
                                        id: data.node?.id || 0,
                                        nodeName: data.node?.nodeName || '',
                                        nodeType: data.node?.nodeType || '',
                                        nodeStep: data.node?.nodeStep || 0,
                                        enabled: data.node?.enabled ?? true,
                                        isAuto: data.node?.isAuto ?? true,
                                        descript: data.node?.descript || '',
                                    },
                                    executionStatus: data.executionStatus || 'running',
                                    progress: data.progress || 0,
                                    completedQuantity: data.completedQuantity || 0,
                                    taskId: data.taskId,
                                    status: data.status || 1,
                                    tableName: data.tableName,
                                    table: data.table,
                                }
                                
                                // 存储消息到全局状态
                                dispatch(addMessage({ taskId: currentTaskId, message: executionMessage }))
                                logger.info('质控消息已存储到全局状态', { taskId: currentTaskId, message: executionMessage })
                            }
                        } catch (error) {
                            logger.error('解析SSE消息失败', error as Error)
                            // 如果解析失败，尝试从字符串中提取taskId
                            if (typeof message === 'string') {
                                const taskIdMatch = message.match(/taskId["\s:]+(\d+)/)
                                if (taskIdMatch && taskIdMatch[1] && !taskIdRef.current) {
                                    const taskId = taskIdMatch[1]
                                    taskIdRef.current = taskId
                                    dispatch(initializeExecution({ taskId }))
                                    clearTimeout(timeout)
                                    resolve(taskId)
                                }
                            }
                        }
                    },
                    onError: (error: Event) => {
                        const msg = 'SSE连接错误'
                        logger.error(msg, new Error(msg))
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

            // 函数正常返回，showDialog 会自动关闭弹窗
            // 注意：不要在成功时调用 onOk，因为 onOk 已经在 showDialog 中被调用

        } catch (error) {
            setLoading(false)
            logger.error('启动质控流程失败:', error as Error)
            uiMessage.error('启动质控流程失败，请稍后重试')
            // 抛出错误，让 showDialog 知道操作失败，弹窗保持打开以便用户重试
            throw error
        }
    }

    // 处理取消按钮
    const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
        form.resetFields()
        if (onCancel) {
            onCancel(e)
        }
    }

    return (
        <CustomDialog
            onOk={handleOk}
            onCancel={handleCancel}
            title='启动质控流程'
            okText='启动'
            cancelText='取消'
            confirmLoading={loading}
            okClose
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

