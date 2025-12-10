import {
    HeartOutlined,
    SearchOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Progress,
    Row,
    Select,
    Typography,
} from 'antd'
import React, { useEffect, useState, useRef } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'
import { api } from '@/utils/request'
import type { SSEManager } from '@/utils/request'
import { useAppDispatch } from '@/store/hooks'
import { initializeExecution, addMessage } from '@/store/slices/qcExecutionSlice'
import type { WorkflowExecutionMessage } from '@/types'
import { showDialog } from '@/utils/showDialog'
import QCResultDialog from './components/QCResultDialog'

const { Title, Text } = Typography

interface CoreDataFormValues {
    dataType: string
    comparison: string
}

type AutoProps = { autoStart?: boolean; onAutoDone?: () => void }

const CoreDataQualityControl: React.FC<AutoProps> = ({ autoStart, onAutoDone }) => {
    const dispatch = useAppDispatch()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    // SSE相关状态
    const sseManagerRef = useRef<SSEManager | null>(null)
    const taskIdRef = useRef<string | null>(null)
    const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
    const [progress, setProgress] = useState(0)
    const [completedQuantity, setCompletedQuantity] = useState(0)
    const [totalQuantity, setTotalQuantity] = useState(0)
    const [currentTable, setCurrentTable] = useState<string>('')
    const [currentTableName, setCurrentTableName] = useState<string>('')

    // 数据类型选项
    const dataTypeOptions = [
        { label: '全部核心数据', value: 'all' },
        { label: '患者基础信息', value: 'patient_basic' },
        { label: '诊断信息', value: 'diagnosis' },
        { label: '手术信息', value: 'surgery' },
        { label: '用药信息', value: 'medication' },
        { label: '检验检查', value: 'lab_exam' },
        { label: '生命体征', value: 'vital_signs' },
        { label: '护理记录', value: 'nursing' },
    ]

    // 对比维度选项
    const comparisonOptions = [
        { label: '时间对比', value: 'time_comparison' },
        { label: '科室对比', value: 'department_comparison' },
        { label: '医生对比', value: 'doctor_comparison' },
        { label: '行业基准对比', value: 'benchmark_comparison' },
    ]

    // 执行准确性质控检查（使用SSE）
    const handleCoreDataCheck = async (_values: CoreDataFormValues) => {
        if (loading || executionStatus === 'running') {
            return
        }

        setLoading(true)
        setExecutionStatus('running')
        setProgress(0)
        setCompletedQuantity(0)
        setTotalQuantity(0)
        setCurrentTable('')
        setCurrentTableName('')
        taskIdRef.current = null

        try {
            // 生成临时taskId
            const tempTaskId =
                (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
                `${Date.now()}-${Math.random().toString(16).slice(2)}`

            // 调用SSE接口
            const manager = api.createSSE({
                url: '/data/qc/accuracyQc',
                method: 'POST',
                data: {}, // 空对象
                maxReconnectAttempts: 3,
                reconnectInterval: 5000,
                onOpen: () => {
                    logger.info('SSE连接已建立，开始启动准确性质控检查...')
                    uiMessage.info('准确性检查已启动')
                },
                onMessage: (event: MessageEvent) => {
                    const message = event.data
                    logger.info('收到SSE消息:', message)

                    try {
                        // 解析SSE消息
                        const data = typeof message === 'string' ? JSON.parse(message) : message

                        // 获取taskId
                        const currentTaskId = data.taskId ? String(data.taskId) : taskIdRef.current || tempTaskId

                        // 如果是第一条消息且包含taskId，初始化执行状态
                        if (!taskIdRef.current && currentTaskId) {
                            taskIdRef.current = currentTaskId
                            dispatch(initializeExecution({ taskId: currentTaskId }))
                        }

                        // 构造 WorkflowExecutionMessage 格式的消息
                        const executionMessage: WorkflowExecutionMessage = {
                            tableQuantity: data.tableQuantity || data.table_quantity || 0,
                            node: {
                                id: data.node?.id || 0,
                                nodeName: data.node?.nodeName || '准确性质控',
                                nodeType: data.node?.nodeType || 'AccuracyQC',
                                nodeStep: data.node?.nodeStep || 0,
                                enabled: data.node?.enabled ?? true,
                                isAuto: data.node?.isAuto ?? true,
                                descript: data.node?.descript || '',
                            },
                            executionStatus: data.executionStatus || 'running',
                            progress: data.progress || 0,
                            completedQuantity: data.completedQuantity || 0,
                            taskId: data.taskId || currentTaskId,
                            status: data.status || 1,
                            tableName: data.tableName,
                            table: data.table,
                        }

                        // 更新进度信息
                        if (executionMessage.tableQuantity) {
                            setTotalQuantity(executionMessage.tableQuantity)
                        }
                        if (executionMessage.completedQuantity !== undefined) {
                            setCompletedQuantity(executionMessage.completedQuantity)
                        }
                        if (executionMessage.progress !== undefined) {
                            setProgress(executionMessage.progress)
                        }
                        if (executionMessage.table) {
                            setCurrentTable(executionMessage.table)
                        }
                        if (executionMessage.tableName) {
                            setCurrentTableName(executionMessage.tableName)
                        }

                        // 存储消息到全局状态
                        if (taskIdRef.current) {
                            dispatch(addMessage({ taskId: taskIdRef.current, message: executionMessage }))
                        }

                        // 检查是否完成
                        if (
                            executionMessage.executionStatus === 'completed' ||
                            executionMessage.executionStatus === 'end'
                        ) {
                            setExecutionStatus('completed')
                            setProgress(100)
                            uiMessage.success('准确性检查已完成！')
                            if (sseManagerRef.current) {
                                sseManagerRef.current.disconnect()
                                sseManagerRef.current = null
                            }
                        } else if (
                            executionMessage.executionStatus === 'error' ||
                            executionMessage.executionStatus === 'failed'
                        ) {
                            setExecutionStatus('error')
                            uiMessage.error('准确性检查执行失败')
                            if (sseManagerRef.current) {
                                sseManagerRef.current.disconnect()
                                sseManagerRef.current = null
                            }
                        }
                    } catch (error) {
                        logger.error('解析SSE消息失败', error as Error)
                    }
                },
                onError: (error: Event) => {
                    const msg = 'SSE连接错误'
                    logger.error(msg, new Error(msg))
                    setExecutionStatus('error')
                    uiMessage.error('准确性检查连接失败')
                    if (sseManagerRef.current) {
                        sseManagerRef.current.disconnect()
                        sseManagerRef.current = null
                    }
                },
                onClose: () => {
                    logger.info('SSE连接已关闭')
                    setExecutionStatus(prev => {
                        if (prev === 'running') {
                            uiMessage.warning('连接已断开')
                            return 'error'
                        }
                        return prev
                    })
                },
                onMaxReconnectAttemptsReached: () => {
                    const msg = 'SSE重连次数已达上限'
                    logger.error(msg)
                    setExecutionStatus('error')
                    uiMessage.error(msg)
                    if (sseManagerRef.current) {
                        sseManagerRef.current.disconnect()
                        sseManagerRef.current = null
                    }
                },
            })

            sseManagerRef.current = manager
            manager.connect()
        } catch (error) {
            logger.error('启动准确性检查失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('启动准确性检查失败，请重试')
            setExecutionStatus('error')
        } finally {
            setLoading(false)
        }
    }

    // 查看质控结果
    const handleViewResult = () => {
        if (!taskIdRef.current) {
            uiMessage.warning('暂无执行结果')
            return
        }

        showDialog(QCResultDialog, {
            title: '准确性质控结果',
            type: 'core-data',
            batchId: taskIdRef.current,
        })
    }

    // 清理SSE连接
    useEffect(() => {
        return () => {
            if (sseManagerRef.current) {
                sseManagerRef.current.disconnect()
                sseManagerRef.current = null
            }
        }
    }, [])


    useEffect(() => {
        let cancelled = false
        const run = async () => {
            if (!autoStart || loading) return
            try {
                await handleCoreDataCheck({
                    dataType: 'all',
                    comparison: 'time_comparison',
                })
            } finally {
                if (!cancelled) onAutoDone && onAutoDone()
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [autoStart])


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
                    <HeartOutlined style={{ marginRight: 8 }} />
                    准确性质控
                </Title>
            </div>

            {/* 信息提示 */}
            <Alert
                message='准确性质控功能'
                description='针对核心医疗数据开展准确性评估，包括编码规范、字段值校验与跨周期/科室/医生维度的对比分析。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Row gutter={[16, 16]}>
                {/* 分析配置 */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <>
                                <HeartOutlined style={{ marginRight: 8 }} />
                                分析配置
                            </>
                        }
                    >
                        <Form
                            form={form}
                            layout='vertical'
                            onFinish={handleCoreDataCheck}
                            initialValues={{
                                dataType: 'all',
                                comparison: 'time_comparison',
                            }}
                        >
                            <Form.Item
                                label='数据类型'
                                name='dataType'
                                rules={[{ required: true, message: '请选择数据类型' }]}
                            >
                                <Select
                                    placeholder='请选择要分析的数据类型'
                                    options={dataTypeOptions}
                                    size='large'
                                />
                            </Form.Item>

                            <Form.Item
                                label='对比维度'
                                name='comparison'
                                rules={[{ required: true, message: '请选择对比维度' }]}
                            >
                                <Select
                                    placeholder='请选择对比分析维度'
                                    options={comparisonOptions}
                                    size='large'
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type='primary'
                                    htmlType='submit'
                                    loading={loading || executionStatus === 'running'}
                                    icon={<SearchOutlined />}
                                    size='large'
                                    block
                                    disabled={executionStatus === 'running'}
                                >
                                    {executionStatus === 'running' ? '检查进行中...' : '开始核心数据分析'}
                                </Button>
                            </Form.Item>

                            {/* 进度条展示 */}
                            {executionStatus === 'running' && (
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ marginBottom: 8 }}>
                                        <Text strong>执行进度：</Text>
                                    </div>
                                    <Progress
                                        percent={progress}
                                        status={progress === 100 ? 'success' : 'active'}
                                        showInfo
                                    />
                                    {totalQuantity > 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            <Text type='secondary' style={{ fontSize: 12 }}>
                                                已完成: {completedQuantity} / {totalQuantity} ({progress}%)
                                            </Text>
                                        </div>
                                    )}
                                    {(currentTable || currentTableName) && (
                                        <div style={{ marginTop: 8 }}>
                                            <Text type='secondary' style={{ fontSize: 12 }}>
                                                正在处理: {currentTable}
                                                {currentTableName ? ` (${currentTableName})` : ''}
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 执行完成后的结果按钮 */}
                            {executionStatus === 'completed' && (
                                <div style={{ marginTop: 16 }}>
                                    <Button
                                        type='primary'
                                        icon={<EyeOutlined />}
                                        size='large'
                                        block
                                        onClick={handleViewResult}
                                    >
                                        查看质控结果
                                    </Button>
                                </div>
                            )}
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default CoreDataQualityControl
