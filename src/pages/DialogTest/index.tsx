import React, { useState } from 'react'
import { Button, Card, Space, Typography, Divider, Input, Form, message } from 'antd'
import CustomDialog, { CustomDialogProps } from '@/components/CustomDialog'
import { showDialog } from '@/utils/showDialog'
import { createDeferred } from '@/utils/createControllablePromise'

const { Title, Paragraph, Text } = Typography

/**
 * Dialog 测试页面
 * 用于测试 CustomDialog 组件和 showDialog 方法的各种功能
 */
const DialogTest: React.FC = () => {
    const [jsxDialogOpen, setJsxDialogOpen] = useState(false)
    const [formDialogOpen, setFormDialogOpen] = useState(false)

    // 示例 1: 基础 JSX 用法
    const handleBasicJsx = () => {
        console.log('🚀 [示例1] 打开基础 JSX Dialog')
        setJsxDialogOpen(true)
    }

    // 示例 2: 简洁写法 - 直接 await showDialog()
    const handleSimpleShowDialog = async () => {
        console.log('🚀 [示例2-简洁] 使用简洁写法: const isConfirm = await showDialog({...})')
        try {
            const isConfirm = await showDialog({
                title: '确认操作',
                children: <p>确定要执行此操作吗？</p>,
                okText: '确定',
                cancelText: '取消',
            })

            console.log('✨ [示例2-简洁] showDialog 返回结果:', isConfirm)
            if (isConfirm) {
                console.log('✅ [示例2-简洁] 用户确认了操作')
                message.success('用户确认了操作')
            } else {
                console.log('❌ [示例2-简洁] 用户取消了操作')
                message.info('用户取消了操作')
            }
        } catch (error) {
            console.error('❌ [示例2-简洁] 操作失败:', error)
            message.error('操作失败: ' + (error as Error).message)
        }
    }

    // 示例 3: 带异步操作的 showDialog
    const handleAsyncShowDialog = async () => {
        console.log('🚀 [示例3] 开始显示异步操作 Dialog')
        try {
            const result = await showDialog(CustomDialog, {
                title: '异步操作确认',
                children: (
                    <div>
                        <p>确定要执行此操作吗？</p>
                        <p style={{ color: '#999', fontSize: '12px' }}>这将执行一个异步操作，可能需要几秒钟...</p>
                    </div>
                ),
                okText: '确定执行',
                cancelText: '取消',
                onOk: async () => {
                    console.log('⏳ [示例3] onOk 开始执行，等待2秒...')
                    // 模拟异步操作
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    console.log('✅ [示例3] 异步操作完成')
                    message.success('操作执行成功！')
                },
            })

            console.log('✨ [示例3] showDialog 返回结果:', result)
            if (result) {
                console.log('✅ [示例3] 用户点击了确定')
                message.info('用户点击了确定')
            } else {
                console.log('❌ [示例3] 用户点击了取消或关闭')
                message.info('用户点击了取消或关闭')
            }
        } catch (error) {
            console.error('❌ [示例3] 操作失败:', error)
            message.error('操作失败: ' + (error as Error).message)
        }
    }

    // 示例 4: 带错误处理的异步操作
    const handleAsyncWithError = async () => {
        console.log('🚀 [示例3] 开始显示可能失败的操作 Dialog')
        try {
            await showDialog(CustomDialog, {
                title: '可能失败的操作',
                children: <p>这个操作可能会失败，用于测试错误处理</p>,
                onOk: async () => {
                    console.log('⏳ [示例3] onOk 开始执行，等待1秒...')
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    // 模拟随机失败
                    const shouldFail = Math.random() > 0.5
                    console.log(`🎲 [示例3] 随机结果: ${shouldFail ? '失败' : '成功'}`)
                    if (shouldFail) {
                        console.error('❌ [示例3] 抛出错误: 操作失败，请重试')
                        throw new Error('操作失败，请重试')
                    }
                    console.log('✅ [示例3] 操作成功')
                    message.success('操作成功！')
                },
            })
            console.log('✨ [示例3] Dialog 正常关闭')
        } catch (error) {
            console.error('❌ [示例3] 捕获到错误:', error)
            message.error('操作失败: ' + (error as Error).message)
        }
    }

    // 示例 4: 自定义组件 Dialog
    interface WorkFlowDialogProps extends CustomDialogProps {
        workflowName?: string
        workflowId?: string
    }

    const WorkFlowDialog: React.FC<WorkFlowDialogProps> = ({
        workflowName = '未命名工作流',
        workflowId,
        open,
        onOk,
        onCancel,
        ...rest
    }) => {
        return (
            <CustomDialog
                {...rest}
                open={open}
                onOk={onOk}
                onCancel={onCancel}
                title={`工作流: ${workflowName}`}
            >
                <div>
                    <p><strong>工作流名称:</strong> {workflowName}</p>
                    {workflowId && <p><strong>工作流ID:</strong> {workflowId}</p>}
                    <p>这是一个自定义的工作流对话框组件</p>
                </div>
            </CustomDialog>
        )
    }

    const handleCustomComponent = async () => {
        const result = await showDialog(WorkFlowDialog, {
            workflowName: '测试工作流',
            workflowId: 'WF-001',
            onOk: async () => {
                await new Promise(resolve => setTimeout(resolve, 1000))
                message.success('工作流操作成功！')
            },
        })

        if (result) {
            console.log('工作流对话框返回:', result)
        }
    }

    // 示例 5: 带表单的 Dialog
    const handleFormDialog = () => {
        setFormDialogOpen(true)
    }

    const handleFormSubmit = async () => {
        // 模拟表单验证和提交
        await new Promise(resolve => setTimeout(resolve, 1500))
        message.success('表单提交成功！')
        setFormDialogOpen(false)
    }

    // 示例 6: 不同尺寸的 Dialog
    const handleSizeDialog = (width?: number) => async () => {
        await showDialog(CustomDialog, {
            title: `宽度为 ${width || '默认'} 的对话框`,
            width: width,
            children: (
                <div>
                    <p>这是一个 {width ? `${width}px` : '默认'} 宽度的对话框</p>
                    <p>可以通过 width 属性自定义对话框宽度</p>
                </div>
            ),
        })
    }

    // 示例 7: 无底部按钮的 Dialog
    const handleNoFooterDialog = async () => {
        await showDialog(CustomDialog, {
            title: '无底部按钮的对话框',
            footer: null,
            children: (
                <div>
                    <p>这个对话框没有底部按钮</p>
                    <p>可以通过设置 footer: null 来隐藏底部</p>
                </div>
            ),
        })
    }

    // 示例 8: 自定义底部按钮
    const handleCustomFooter = async () => {
        await showDialog(CustomDialog, {
            title: '自定义底部按钮',
            footer: (
                <div style={{ textAlign: 'right', padding: '10px 0' }}>
                    <Button onClick={() => message.info('点击了自定义按钮1')}>
                        自定义按钮1
                    </Button>
                    <Button type="primary" style={{ marginLeft: 8 }} onClick={() => message.info('点击了自定义按钮2')}>
                        自定义按钮2
                    </Button>
                </div>
            ),
            children: <p>这个对话框使用了自定义的底部按钮</p>,
        })
    }

    // 示例 9: 带确认的删除操作
    const handleDeleteConfirm = async () => {
        const result = await showDialog(CustomDialog, {
            title: '确认删除',
            okText: '删除',
            okButtonProps: { danger: true },
            cancelText: '取消',
            children: (
                <div>
                    <p style={{ color: '#ff4d4f', marginBottom: 16 }}>
                        <strong>警告：此操作不可恢复！</strong>
                    </p>
                    <p>确定要删除这条记录吗？</p>
                </div>
            ),
            onOk: async () => {
                await new Promise(resolve => setTimeout(resolve, 1000))
                message.success('删除成功！')
            },
        })

        if (result) {
            console.log('用户确认删除')
        }
    }

    // 示例 10: 带遮罩层和 ESC 键控制
    const handleMaskClosable = async (maskClosable: boolean) => {
        await showDialog(CustomDialog, {
            title: `遮罩层${maskClosable ? '可' : '不可'}关闭`,
            maskClosable: maskClosable,
            keyboard: maskClosable,
            children: (
                <div>
                    <p>maskClosable: {maskClosable ? 'true' : 'false'}</p>
                    <p>keyboard: {maskClosable ? 'true' : 'false'}</p>
                    {maskClosable ? (
                        <p>点击遮罩层或按 ESC 键可以关闭</p>
                    ) : (
                        <p>只能通过按钮关闭</p>
                    )}
                </div>
            ),
        })
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <Title level={2}>CustomDialog 测试页面</Title>
            <Paragraph>
                这个页面用于测试 <Text code>CustomDialog</Text> 组件和 <Text code>showDialog</Text> 方法的各种功能。
            </Paragraph>

            <Divider />

            {/* 示例 1: 基础 JSX 用法 */}
            <Card title="示例 1: 基础 JSX 用法" style={{ marginBottom: 16 }}>
                <Paragraph>
                    使用 JSX 方式直接使用 CustomDialog 组件，完全兼容 Antd Modal 的所有属性。
                </Paragraph>
                <Space>
                    <Button type="primary" onClick={handleBasicJsx}>
                        打开基础 Dialog
                    </Button>
                </Space>
                <CustomDialog
                    title="基础 Dialog 示例"
                    open={jsxDialogOpen}
                    onOk={() => {
                        console.log('✅ [示例1] 用户点击了确定按钮')
                        message.success('点击了确定')
                        setJsxDialogOpen(false)
                    }}
                    onCancel={() => {
                        console.log('❌ [示例1] 用户点击了取消按钮')
                        setJsxDialogOpen(false)
                    }}
                    onClose={() => {
                        console.log('🔒 [示例1] Dialog 关闭')
                        setJsxDialogOpen(false)
                    }}
                >
                    <div>
                        <p>这是使用 JSX 方式创建的 Dialog</p>
                        <p>支持所有 Antd Modal 的属性，如 title、width、centered 等</p>
                    </div>
                </CustomDialog>
            </Card>

            {/* 示例 2: 简洁写法 - 直接 await showDialog() */}
            <Card title="示例 2: 简洁写法 - 直接 await showDialog()" style={{ marginBottom: 16 }}>
                <Paragraph>
                    使用简洁写法：<Text code>const isConfirm = await showDialog(&#123;...&#125;)</Text>，无需传入 CustomDialog 组件。
                </Paragraph>
                <Space>
                    <Button type="primary" onClick={handleSimpleShowDialog}>
                        简洁写法示例
                    </Button>
                </Space>
            </Card>

            {/* 示例 3: showDialog 异步操作 */}
            <Card title="示例 3: showDialog 异步操作" style={{ marginBottom: 16 }}>
                <Paragraph>
                    使用 <Text code>showDialog</Text> 方法，支持 async/await 等待弹窗执行结束。
                </Paragraph>
                <Space>
                    <Button type="primary" onClick={handleAsyncShowDialog}>
                        异步操作 Dialog
                    </Button>
                    <Button onClick={handleAsyncWithError}>
                        可能失败的操作
                    </Button>
                </Space>
            </Card>

            {/* 示例 4: 自定义组件 */}
            <Card title="示例 4: 自定义组件 Dialog" style={{ marginBottom: 16 }}>
                <Paragraph>
                    传入自定义的 Dialog 组件作为第一个参数，支持自定义 props。
                </Paragraph>
                <Space>
                    <Button type="primary" onClick={handleCustomComponent}>
                        打开工作流 Dialog
                    </Button>
                </Space>
            </Card>

            {/* 示例 4: 带表单的 Dialog */}
            <Card title="示例 4: 带表单的 Dialog" style={{ marginBottom: 16 }}>
                <Paragraph>
                    在 Dialog 中嵌入表单，支持异步提交。
                </Paragraph>
                <Space>
                    <Button type="primary" onClick={handleFormDialog}>
                        打开表单 Dialog
                    </Button>
                </Space>
                <CustomDialog
                    title="表单 Dialog"
                    open={formDialogOpen}
                    onOk={handleFormSubmit}
                    onCancel={() => setFormDialogOpen(false)}
                    onClose={() => setFormDialogOpen(false)}
                    width={600}
                >
                    <Form layout="vertical">
                        <Form.Item label="用户名" name="username">
                            <Input placeholder="请输入用户名" />
                        </Form.Item>
                        <Form.Item label="邮箱" name="email">
                            <Input placeholder="请输入邮箱" />
                        </Form.Item>
                        <Form.Item label="备注" name="remark">
                            <Input.TextArea rows={4} placeholder="请输入备注" />
                        </Form.Item>
                    </Form>
                </CustomDialog>
            </Card>

            {/* 示例 5: 不同尺寸 */}
            <Card title="示例 5: 不同尺寸的 Dialog" style={{ marginBottom: 16 }}>
                <Paragraph>
                    通过 width 属性自定义对话框宽度。
                </Paragraph>
                <Space>
                    <Button onClick={handleSizeDialog(400)}>小尺寸 (400px)</Button>
                    <Button onClick={handleSizeDialog(800)}>中尺寸 (800px)</Button>
                    <Button onClick={handleSizeDialog(1200)}>大尺寸 (1200px)</Button>
                    <Button onClick={handleSizeDialog()}>默认尺寸</Button>
                </Space>
            </Card>

            {/* 示例 6: 无底部按钮 */}
            <Card title="示例 6: 无底部按钮的 Dialog" style={{ marginBottom: 16 }}>
                <Paragraph>
                    通过设置 <Text code>footer: null</Text> 隐藏底部按钮。
                </Paragraph>
                <Space>
                    <Button onClick={handleNoFooterDialog}>
                        打开无底部按钮 Dialog
                    </Button>
                </Space>
            </Card>

            {/* 示例 7: 自定义底部按钮 */}
            <Card title="示例 7: 自定义底部按钮" style={{ marginBottom: 16 }}>
                <Paragraph>
                    通过 <Text code>footer</Text> 属性自定义底部内容。
                </Paragraph>
                <Space>
                    <Button onClick={handleCustomFooter}>
                        打开自定义底部 Dialog
                    </Button>
                </Space>
            </Card>

            {/* 示例 8: 删除确认 */}
            <Card title="示例 8: 删除确认 Dialog" style={{ marginBottom: 16 }}>
                <Paragraph>
                    危险操作的确认对话框，使用红色确定按钮。
                </Paragraph>
                <Space>
                    <Button danger onClick={handleDeleteConfirm}>
                        删除操作
                    </Button>
                </Space>
            </Card>

            {/* 示例 9: 遮罩层控制 */}
            <Card title="示例 9: 遮罩层和 ESC 键控制" style={{ marginBottom: 16 }}>
                <Paragraph>
                    通过 <Text code>maskClosable</Text> 和 <Text code>keyboard</Text> 控制是否可以通过点击遮罩层或 ESC 键关闭。
                </Paragraph>
                <Space>
                    <Button onClick={() => handleMaskClosable(true)}>
                        可关闭遮罩层
                    </Button>
                    <Button onClick={() => handleMaskClosable(false)}>
                        不可关闭遮罩层
                    </Button>
                </Space>
            </Card>

            {/* 示例 10: 其他 Antd 属性 */}
            <Card title="示例 10: 其他 Antd Modal 属性" style={{ marginBottom: 16 }}>
                <Paragraph>
                    测试其他 Antd Modal 的属性，如 centered、closable、destroyOnClose 等。
                </Paragraph>
                <Space wrap>
                    <Button
                        onClick={() =>
                            showDialog(CustomDialog, {
                                title: '居中显示',
                                centered: true,
                                children: <p>这个对话框在屏幕中央显示</p>,
                            })
                        }
                    >
                        居中显示
                    </Button>
                    <Button
                        onClick={() =>
                            showDialog(CustomDialog, {
                                title: '无关闭按钮',
                                closable: false,
                                children: <p>这个对话框没有右上角的关闭按钮</p>,
                            })
                        }
                    >
                        无关闭按钮
                    </Button>
                    <Button
                        onClick={() =>
                            showDialog(CustomDialog, {
                                title: '关闭时销毁',
                                destroyOnClose: true,
                                children: <p>关闭时会销毁 DOM 节点</p>,
                            })
                        }
                    >
                        关闭时销毁
                    </Button>
                </Space>
            </Card>

            <Divider />

            {/* 示例 11: createDeferred 基础用法 */}
            <Card title="示例 11: createDeferred 基础用法" style={{ marginBottom: 16 }}>
                <Paragraph>
                    使用 <Text code>createDeferred</Text> 创建一个可控制的异步任务，返回的就是 Promise，可以直接 await。
                </Paragraph>
                <Space>
                    <Button
                        type="primary"
                        onClick={async () => {
                            console.log('🚀 [示例11-1] 开始创建 createDeferred')
                            const task = createDeferred<string>()
                            console.log('✅ [示例11-1] createDeferred 已创建，等待 resolve')
                            
                            // 模拟异步操作
                            setTimeout(() => {
                                console.log('📝 [示例11-1] 调用 task.resolve("任务完成！")')
                                task.resolve('任务完成！')
                            }, 2000)

                            const hide = message.loading('任务执行中...', 0)
                            try {
                                console.log('⏳ [示例11-1] 开始 await task...')
                                const result = await task
                                console.log('✨ [示例11-1] Promise resolved，结果:', result)
                                hide()
                                message.success(result)
                            } catch (error) {
                                console.error('❌ [示例11-1] Promise rejected:', error)
                                hide()
                                message.error((error as Error).message)
                            }
                        }}
                    >
                        基础用法（2秒后完成）
                    </Button>
                    <Button
                        onClick={async () => {
                            console.log('🚀 [示例11-2] 开始创建 createDeferred（模拟失败）')
                            const task = createDeferred<string>()
                            console.log('✅ [示例11-2] createDeferred 已创建，等待 reject')

                            // 模拟失败
                            setTimeout(() => {
                                console.log('📝 [示例11-2] 调用 task.reject(new Error("任务执行失败"))')
                                task.reject(new Error('任务执行失败'))
                            }, 2000)

                            const hide = message.loading('任务执行中...', 0)
                            try {
                                console.log('⏳ [示例11-2] 开始 await task...')
                                await task
                                hide()
                            } catch (error) {
                                console.error('❌ [示例11-2] Promise rejected，错误:', error)
                                hide()
                                message.error((error as Error).message)
                            }
                        }}
                    >
                        模拟失败
                    </Button>
                </Space>
            </Card>


            {/* 示例 12: 在 Dialog 中使用 createDeferred */}
            <Card title="示例 12: 在 Dialog 中使用 createDeferred" style={{ marginBottom: 16 }}>
                <Paragraph>
                    结合 <Text code>showDialog</Text> 和 <Text code>createDeferred</Text> 使用。
                </Paragraph>
                <Space>
                    <Button
                        type="primary"
                        onClick={async () => {
                            console.log('🚀 [示例12-1] 开始创建用户输入 createDeferred')
                            const userInputTask = createDeferred<string>()
                            console.log('✅ [示例12-1] createDeferred 已创建')

                            // 先显示对话框，不等待它关闭
                            console.log('📱 [示例12-1] 显示输入对话框')
                            showDialog(CustomDialog, {
                                title: '输入确认',
                                children: (
                                    <div>
                                        <Input
                                            id="user-input-dialog"
                                            placeholder="请输入内容"
                                            onPressEnter={(e) => {
                                                const value = (e.target as HTMLInputElement).value
                                                console.log('⌨️ [示例12-1] 用户按下 Enter，输入值:', value)
                                                if (value.trim()) {
                                                    console.log('✅ [示例12-1] 调用 userInputTask.resolve(value)')
                                                    userInputTask.resolve(value)
                                                }
                                            }}
                                        />
                                    </div>
                                ),
                                onOk: async () => {
                                    const input = document.getElementById('user-input-dialog') as HTMLInputElement
                                    const value = input?.value || ''
                                    console.log('👆 [示例12-1] 用户点击确定按钮，输入值:', value)
                                    if (input && input.value.trim()) {
                                        console.log('✅ [示例12-1] 调用 userInputTask.resolve(input.value)')
                                        userInputTask.resolve(input.value)
                                    } else {
                                        console.log('❌ [示例12-1] 输入为空，调用 userInputTask.reject')
                                        userInputTask.reject(new Error('请输入内容'))
                                    }
                                },
                                onCancel: () => {
                                    console.log('❌ [示例12-1] 用户点击取消按钮')
                                    console.log('📝 [示例12-1] 调用 userInputTask.reject("用户取消")')
                                    userInputTask.reject(new Error('用户取消'))
                                },
                            })

                            // 等待用户输入
                            try {
                                console.log('⏳ [示例12-1] 开始 await userInputTask，等待用户操作...')
                                const userInput = await userInputTask
                                console.log('✨ [示例12-1] Promise resolved，用户输入:', userInput)
                                message.success(`用户输入: ${userInput}`)
                            } catch (error) {
                                console.error('❌ [示例12-1] Promise rejected，错误:', error)
                                message.info((error as Error).message)
                            }
                        }}
                    >
                        等待用户输入
                    </Button>
                    <Button
                        onClick={async () => {
                            console.log('🚀 [示例12-2] 开始创建确认 createDeferred')
                            const confirmTask = createDeferred<boolean>()
                            console.log('✅ [示例12-2] createDeferred 已创建')

                            console.log('📱 [示例12-2] 显示确认对话框')
                            showDialog(CustomDialog, {
                                title: '确认操作',
                                children: <p>确定要执行此操作吗？</p>,
                                onOk: () => {
                                    console.log('✅ [示例12-2] 用户点击确定，调用 confirmTask.resolve(true)')
                                    confirmTask.resolve(true)
                                },
                                onCancel: () => {
                                    console.log('❌ [示例12-2] 用户点击取消，调用 confirmTask.resolve(false)')
                                    confirmTask.resolve(false)
                                },
                            })

                            console.log('⏳ [示例12-2] 开始 await confirmTask，等待用户选择...')
                            const confirmed = await confirmTask
                            console.log('✨ [示例12-2] Promise resolved，用户选择:', confirmed ? '确认' : '取消')
                            if (confirmed) {
                                message.success('用户确认了操作')
                            } else {
                                message.info('用户取消了操作')
                            }
                        }}
                    >
                        确认对话框
                    </Button>
                </Space>
            </Card>
        </div>
    )
}

export default DialogTest

