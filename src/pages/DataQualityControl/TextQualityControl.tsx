import { FileTextOutlined, InboxOutlined, SaveOutlined, TableOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Form, Input, Progress, Radio, Row, Select, Typography, Upload } from 'antd'
import type { UploadFile, UploadProps } from 'antd/es/upload'
import React, { useEffect, useState, useRef } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'
import { dataQualityControlService } from '@/services/dataQualityControlService'
import type { TableInfoItem } from '@/types'
import { api, type SSEManager } from '@/utils/request'
import { store } from '@/store'
import { initializeQCExecution, addQCMessage } from '@/store/slices/qcExecutionSlice'
import { useAppSelector } from '@/store/hooks'
import { selectQCMessages } from '@/store/slices/qcExecutionSlice'

const { Title } = Typography
const { TextArea } = Input
const { Dragger } = Upload

interface TextQualityFormValues {
    targetTable: string
    uploadFile?: UploadFile<any>[]
    qualityDescription?: string
    qualityResult?: 'qualified' | 'unqualified'
}

const TextQualityControl: React.FC = () => {
    const [form] = Form.useForm()
    const [saving, setSaving] = useState(false)
    const [tableOptions, setTableOptions] = useState<Array<{ label: string; value: string }>>([])
    const [tableLoading, setTableLoading] = useState(false)
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
    const [progress, setProgress] = useState<number>(0)
    const sseManagerRef = useRef<SSEManager | null>(null)
    
    // 从Redux获取SSE消息
    const qcMessages = useAppSelector(
        state => (currentTaskId ? selectQCMessages(currentTaskId)(state) : [])
    )
    
    const normFile = (e: any) => {
        if (Array.isArray(e)) return e
        return e?.fileList || []
    }

    // 加载表信息
    const loadTableInfo = async () => {
        try {
            setTableLoading(true)
            const response = await dataQualityControlService.getTableInfo()
            if (response.code === 200 && response.data) {
                const options = response.data.map((item: TableInfoItem) => ({
                    label: item.tableComment 
                        ? `${item.tableName} - ${item.tableComment}` 
                        : item.tableName,
                    value: item.tableName,
                }))
                setTableOptions(options)
                logger.info('表信息加载成功:', options)
            } else {
                logger.warn('获取表信息失败:', response.msg)
                uiMessage.warning(response.msg || '获取表信息失败')
            }
        } catch (error) {
            logger.error('加载表信息失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('加载表信息失败，请重试')
        } finally {
            setTableLoading(false)
        }
    }

    // 组件挂载时加载表信息
    useEffect(() => {
        loadTableInfo()
    }, [])

    // 监听SSE消息，更新进度
    useEffect(() => {
        if (qcMessages.length > 0) {
            const lastMessage = qcMessages[qcMessages.length - 1]
            // 更新进度
            if (lastMessage.progress !== undefined && lastMessage.progress !== null) {
                setProgress(Math.round(Number(lastMessage.progress)))
            }
            
            // 检查是否完成
            if (lastMessage.executionStatus === 'completed' || lastMessage.executionStatus === 'end') {
                // 延迟一下再提示，确保最后的消息已处理
                setTimeout(() => {
                    uiMessage.success('质控结果保存成功！')
                    logger.info('质控结果保存成功')
                    // 保存成功后重置表单
                    form.resetFields()
                    // 断开SSE连接
                    if (sseManagerRef.current) {
                        sseManagerRef.current.disconnect()
                        sseManagerRef.current = null
                    }
                    // 重置状态
                    setSaving(false)
                    setCurrentTaskId(null)
                    setProgress(0)
                }, 500)
            }
        }
    }, [qcMessages, form])

    // 组件卸载时清理SSE连接
    useEffect(() => {
        return () => {
            if (sseManagerRef.current) {
                sseManagerRef.current.disconnect()
                sseManagerRef.current = null
            }
        }
    }, [])

    // 文件上传配置（支持文档与图片）
    const uploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        accept: '.txt,.doc,.docx,.pdf,.png,.jpg,.jpeg,.bmp,.tif,.tiff',
        listType: 'text',
        showUploadList: { showPreviewIcon: false },
        maxCount: 1,
        beforeUpload: file => {
            const isDoc =
                file.type === 'text/plain' ||
                file.type === 'application/msword' ||
                file.type ===
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'application/pdf'
            const isImage = file.type.startsWith('image/') ||
                ['image/tiff', 'image/bmp'].includes(file.type)
            if (!isDoc && !isImage) {
                uiMessage.error('仅支持文本/文档或图片格式（TXT/DOC/DOCX/PDF/PNG/JPG/JPEG/BMP/TIFF）')
                return false
            }
            const isLt10M = file.size / 1024 / 1024 < 10
            if (!isLt10M) {
                uiMessage.error('文件大小不能超过 10MB！')
                return false
            }
            return false // 阻止自动上传
        },
        onChange: info => {
            const fileList = info.fileList || []
            try {
                form.setFieldsValue({ uploadFile: fileList })
                form.validateFields(['uploadFile']).catch(() => {})
            } catch {}
        },
        onPreview: async file => {
            try {
                const src = (file as any).thumbUrl || (file as any).url
                if (src) {
                    window.open(src, '_blank')
                    return
                }
                const f = file.originFileObj as File | undefined
                if (!f) return
                const reader = new FileReader()
                reader.onload = e => {
                    const result = e.target?.result as string
                    if (result) window.open(result, '_blank')
                }
                reader.readAsDataURL(f)
            } catch {}
        },
    }


    // 保存质控结果
    const handleSaveQualityResult = async () => {
        try {
            // 验证表单字段
            const values = await form.validateFields([
                'targetTable',
                'qualityDescription',
                'qualityResult',
                'uploadFile',
            ])
            
            if (!values.qualityResult) {
                uiMessage.warning('请选择质控结果')
                return
            }

            // 检查文件
            const fileList = values.uploadFile as UploadFile<any>[] | undefined
            if (!fileList || fileList.length === 0) {
                uiMessage.warning('请上传文件')
                return
            }

            const file = fileList[0]
            const originFile = file.originFileObj as File | undefined
            if (!originFile) {
                uiMessage.error('文件信息异常，请重新上传')
                return
            }

            setSaving(true)
            setProgress(0)

            // 使用模拟的 fileId（待文件上传接口开发完成后替换）
            const mockFileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // 构建请求参数
            const requestParams = {
                tableName: values.targetTable,
                qcRemark: values.qualityDescription || '',
                qcResult: values.qualityResult === 'qualified', // 将 'qualified'/'unqualified' 转换为 boolean
                fileId: mockFileId,
                fileName: originFile.name,
            }

            // 创建SSE连接
            try {
                const sseManager = api.createSSE({
                    url: '/data/qc/reliabilityQc',
                    method: 'POST',
                    data: requestParams,
                    onOpen: (event) => {
                        console.log('=== SSE连接已建立 ===', event)
                        logger.info('可靠性质控SSE连接已建立', requestParams)
                    },
                    onMessage: (event: MessageEvent) => {
                        console.log('=== SSE消息 ===', {
                            type: event.type,
                            data: event.data,
                            timestamp: new Date().toISOString(),
                        })
                        
                        // 尝试解析JSON数据
                        try {
                            const messageData = JSON.parse(event.data) as Record<string, unknown>
                            console.log('=== SSE消息内容（解析后）===', messageData)
                            logger.info('可靠性质控SSE消息', messageData)
                            
                            // 从消息中提取taskId
                            let extractedTaskId: string | null = messageData.taskId as string | null
                            
                            // 如果没有taskId，尝试从其他字段获取
                            if (!extractedTaskId && messageData.id) {
                                extractedTaskId = String(messageData.id)
                            }

                            if (extractedTaskId) {
                                console.log('=== 提取到taskId ===', extractedTaskId)
                                
                                // 设置当前taskId
                                setCurrentTaskId(extractedTaskId)
                                
                                // 初始化质控流程执行（如果不存在）
                                const state = store.getState()
                                if (!state.qcExecution.executions[extractedTaskId]) {
                                    store.dispatch(initializeQCExecution({ taskId: extractedTaskId }))
                                    console.log('=== 初始化质控流程执行 ===', extractedTaskId)
                                }
                                
                                // 添加消息到Redux
                                store.dispatch(
                                    addQCMessage({
                                        taskId: extractedTaskId,
                                        message: messageData,
                                    })
                                )
                            } else {
                                console.warn('=== 未找到taskId，消息未存储 ===', messageData)
                            }
                        } catch (parseError) {
                            // 如果不是JSON格式，直接输出原始数据
                            console.log('=== SSE消息内容（原始）===', event.data)
                            logger.info('可靠性质控SSE消息（原始）', event.data)
                        }
                    },
                    onError: (event) => {
                        console.error('=== SSE连接错误 ===', event)
                        logger.error('可靠性质控SSE连接错误', new Error(`SSE连接错误: ${event.type || 'unknown'}`))
                        uiMessage.error('质控保存连接异常，请检查网络')
                        setSaving(false)
                        setCurrentTaskId(null)
                        setProgress(0)
                    },
                    onClose: () => {
                        console.log('=== SSE连接已关闭 ===')
                        logger.info('可靠性质控SSE连接已关闭')
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
                uiMessage.error('启动质控保存连接失败，请稍后重试')
                setSaving(false)
                setCurrentTaskId(null)
                setProgress(0)
                throw sseError
            }
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) {
                // 表单验证错误，不显示错误提示
                return
            }
            const errorMessage = error instanceof Error ? error.message : '保存质控结果失败，请重试'
            logger.error('保存质控结果失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error(errorMessage)
            setSaving(false)
            setCurrentTaskId(null)
            setProgress(0)
        }
    }

    return (
        <div>
            {/* 页面标题 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    <FileTextOutlined style={{ marginRight: 8 }} />
                    可靠性质控
                </Title>
            </div>

            {/* 信息提示 */}
            <Alert
                message='可靠性质控功能'
                description='针对文本数据进行可靠性评估，包括格式规范、内容完整性与字符合规性，保障数据可信与稳定。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Row gutter={[16, 16]}>
                {/* 左侧：质控配置 */}
                <Col xs={24} lg={10}>
                    <Card title={<><TableOutlined style={{ marginRight: 8 }} />质控配置</>}>
                        <Form form={form} layout='vertical'>
                            <Form.Item
                                label='选择数据表'
                                name='targetTable'
                                rules={[{ required: true, message: '请选择目标数据表' }]}
                            >
                                <Select
                                    placeholder={tableLoading ? '正在加载表信息...' : '请选择要进行质控的数据表'}
                                    options={tableOptions}
                                    size='large'
                                    loading={tableLoading}
                                    showSearch
                                    filterOption={(input, option) => {
                                        const label = String(option?.label ?? '')
                                        return label.toLowerCase().includes(input.toLowerCase())
                                    }}
                                    allowClear
                                />
                            </Form.Item>

                            <Form.Item
                                label='质控详情'
                                name='qualityDescription'
                                rules={[{ required: true, message: '请输入质控详情' }]}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder='请输入质控详情'
                                    showCount
                                    maxLength={500}
                                />
                            </Form.Item>

                            <Form.Item
                                label='质控结果'
                                name='qualityResult'
                                rules={[{ required: true, message: '请选择质控结果' }]}
                            >
                                <Radio.Group>
                                    <Radio value='qualified'>合格</Radio>
                                    <Radio value='unqualified'>不合格</Radio>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type='primary'
                                    icon={<SaveOutlined />}
                                    size='large'
                                    loading={saving}
                                    onClick={handleSaveQualityResult}
                                    block
                                    disabled={saving}
                                >
                                    保存质控结果
                                </Button>
                            </Form.Item>
                            
                            {/* 进度条显示 */}
                            {saving && (
                                <Form.Item>
                                    <div style={{ marginTop: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                            <Progress
                                                percent={progress}
                                                size='small'
                                                status={progress === 100 ? 'success' : 'active'}
                                                showInfo={false}
                                                style={{ flex: 1 }}
                                            />
                                            <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>
                                                {progress}%
                                            </span>
                                        </div>
                                        {qcMessages.length > 0 && (
                                            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                                {qcMessages[qcMessages.length - 1]?.tableName && (
                                                    <span>正在处理: {qcMessages[qcMessages.length - 1].tableName}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Form.Item>
                            )}
                        </Form>
                    </Card>
                </Col>

                {/* 右侧：文件上传 */}
                <Col xs={24} lg={14}>
                    <Card title={<><InboxOutlined style={{ marginRight: 8 }} />文件上传</>}>
                        <Form form={form} layout='vertical'>
                            <Form.Item
                                name='uploadFile'
                                valuePropName='fileList'
                                getValueFromEvent={normFile}
                                rules={[
                                    {
                                        validator: async (_rule, value) => {
                                            const hasFile = Array.isArray(value) && value.length > 0
                                            if (!hasFile) {
                                                return Promise.reject('请上传文件')
                                            }
                                            return Promise.resolve()
                                        },
                                    },
                                ]}
                            >
                                <Dragger {...uploadProps}>
                                    <p className='ant-upload-drag-icon'>
                                        <InboxOutlined />
                                    </p>
                                    <p className='ant-upload-text'>点击或拖拽文件到此区域上传</p>
                                    <p className='ant-upload-hint'>
                                        支持 TXT、DOC、DOCX、PDF、PNG、JPG、JPEG、BMP、TIFF 格式，文件大小不超过 10MB
                                    </p>
                                </Dragger>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default TextQualityControl
