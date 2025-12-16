import React, { useState, useRef } from 'react'
import { Form, Input } from 'antd'
import CustomDialog, { CustomDialogProps } from '@/components/CustomDialog'
import { logger } from '@/utils/logger'
import { uiMessage } from '@/utils/uiMessage'
import { api, SSEManager } from '@/utils/request'
import { store } from '@/store'
import { addQCMessage, initializeQCExecution } from '@/store/slices/qcExecutionSlice'

interface StartQCProcessDialogProps extends Omit<CustomDialogProps, 'children'> {
    selectedTypes: string[]
    onStartSuccess?: (taskId: string) => void
}

const StartQCProcessDialog: React.FC<StartQCProcessDialogProps> = ({
    onOk,
    onCancel,
    selectedTypes,
    onStartSuccess,
    ...restProps
}) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const sseManagerRef = useRef<SSEManager | null>(null)

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

            // 调用SSE接口启动质控流程
            try {
                // 准备请求参数
                const requestData = {
                    taskType: selectedTypes, // nodeType 数组，如 ['TimelinessQC', 'CompletenessQC']
                    taskFlowName: processName, // 流程名称
                }
                // 创建SSE连接
                const sseManager = api.createSSE({
                    url: '/data/qc/task/process/start',
                    method: 'POST',
                    data: requestData,
                    onOpen: (event) => {
                        console.log('=== SSE连接已建立 ===', event)
                        logger.info('SSE连接已建立', { processName, selectedTypes })
                    },
                    onMessage: (event: MessageEvent) => {
                        // 输出所有消息到console
                        console.log('=== SSE消息 ===', {
                            type: event.type,
                            data: event.data,
                            origin: event.origin,
                            lastEventId: (event as any).lastEventId,
                            timestamp: new Date().toISOString(),
                        })
                        
                        // 尝试解析JSON数据
                        try {
                            const messageData = JSON.parse(event.data) as Record<string, unknown>
                            console.log('=== SSE消息内容（解析后）===', messageData)
                            logger.info('SSE消息', messageData)
                            
                            // 从消息中提取taskId
                            let extractedTaskId: string | null = messageData.taskId as string;

                            if (extractedTaskId && messageData.success && onStartSuccess) {
                                onStartSuccess(extractedTaskId)
                            }

                            // 如果找到了taskId，存储到Redux
                            if (extractedTaskId) {
                                console.log('=== 提取到taskId ===', extractedTaskId)
                                
                                // 初始化质控流程执行（如果不存在）
                                const state = store.getState()
                                if (!state.qcExecution.executions[extractedTaskId]) {
                                    store.dispatch(initializeQCExecution({ taskId: extractedTaskId }))
                                    console.log('=== 初始化质控流程执行 ===', extractedTaskId)
                                }
                                
                                // 添加消息到Redux，以taskId为唯一标识
                                store.dispatch(
                                    addQCMessage({
                                        taskId: extractedTaskId,
                                        message: messageData,
                                    })
                                )
                                
                                // 获取更新后的状态以显示消息数量
                                const updatedState = store.getState()
                                console.log('=== 消息已存储到Redux ===', {
                                    taskId: extractedTaskId,
                                    messageCount: updatedState.qcExecution.executions[extractedTaskId]?.messages.length || 0,
                                })
                            } else {
                                console.warn('=== 未找到taskId，消息未存储 ===', messageData)
                            }
                        } catch (parseError) {
                            // 如果不是JSON格式，直接输出原始数据
                            console.log('=== SSE消息内容（原始）===', event.data)
                            logger.info('SSE消息（原始）', event.data)
                        }
                    },
                    onError: (event) => {
                        console.error('=== SSE连接错误 ===', event)
                        logger.error('SSE连接错误', new Error(`SSE连接错误: ${event.type || 'unknown'}`))
                        uiMessage.error('质控流程连接异常，请检查网络')
                    },
                    onClose: () => {
                        console.log('=== SSE连接已关闭 ===')
                        logger.info('SSE连接已关闭', { processName, selectedTypes })
                    },
                })

                // 保存SSE连接引用
                sseManagerRef.current = sseManager

                // 建立连接
                sseManager.connect()

                // 等待一小段时间确保连接建立
                await new Promise(resolve => setTimeout(resolve, 500))
                
            } catch (sseError) {
                logger.error('启动SSE连接失败:', sseError instanceof Error ? sseError : new Error(String(sseError)))
                console.error('=== 启动SSE连接失败 ===', sseError)
                uiMessage.error('启动质控流程连接失败，请稍后重试')
                throw sseError
            }
            
            setLoading(false)
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

