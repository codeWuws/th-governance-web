import React, { useState } from 'react'
import { Form, Input } from 'antd'
import CustomDialog, { CustomDialogProps } from '@/components/CustomDialog'
import { logger } from '@/utils/logger'
import { uiMessage } from '@/utils/uiMessage'

interface StartQCProcessDialogProps extends Omit<CustomDialogProps, 'children'> {
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
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

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

            // 直接生成taskId
            const taskId =
                (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
                `${Date.now()}-${Math.random().toString(16).slice(2)}`

            logger.info('启动质控流程', { taskId, processName, selectedTypes })
            
            // 模拟异步操作，确保loading状态显示
            await new Promise(resolve => setTimeout(resolve, 300))
            
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

