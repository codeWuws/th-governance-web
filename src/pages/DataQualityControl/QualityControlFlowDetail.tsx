import {
    ArrowLeftOutlined,
    ReloadOutlined,
    EyeOutlined,
    PlayCircleOutlined,
    BarChartOutlined,
    PieChartOutlined,
    LinkOutlined,
    HeartOutlined,
} from '@ant-design/icons'
import { Button, Card, Progress, Spin, Steps, Tag, Typography, Modal, Space } from 'antd'
import uiMessage from '@/utils/uiMessage'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { logger } from '@/utils/logger'
import { api } from '@/utils/request'
import type { SSEManager } from '@/utils/request'
import { dataGovernanceService } from '@/services/dataGovernanceService'
import type { QCTaskLogDetailData } from '@/types'

const { Title, Text } = Typography
const { Step } = Steps

// 质控类型映射
const QC_TYPE_MAP: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
    comprehensive: {
        label: '及时性质控',
        icon: <BarChartOutlined />,
        description: '关注数据时效与更新延迟、准点率与管道稳定性，支持结果解析与指标统计。',
    },
    completeness: {
        label: '完整性质控',
        icon: <PieChartOutlined />,
        description: '针对表与字段的填充率进行检查，识别空值与缺失数据，输出表级与字段级完整性分析。',
    },
    'basic-medical-logic': {
        label: '一致性质控',
        icon: <LinkOutlined />,
        description: '一致性校验，包含主附表关联与基础规则（时间、年龄、性别等）。',
    },
    'core-data': {
        label: '准确性质控',
        icon: <HeartOutlined />,
        description: '开展核心医疗数据的准确性评估，包含编码规范、字段值校验与对比分析。',
    },
}

// 执行状态映射
const statusConfig = {
    0: { text: '未执行', color: 'default' },
    1: { text: '执行中', color: 'processing' },
    2: { text: '已完成', color: 'success' },
    3: { text: '暂停', color: 'warning' },
    4: { text: '跳过', color: 'default' },
    5: { text: '失败', color: 'error' },
}

// 步骤状态接口
interface QCStepStatus {
    stepIndex: number
    status: number // 0未执行, 1执行中, 2已完成, 3暂停, 4跳过, 5失败
    completedQuantity?: number
    totalQuantity?: number
    startTime?: string
    endTime?: string
    resultSummary?: string
    errorMessage?: string
}

// 质控流程详情接口
interface QCFlowDetail {
    taskId: string
    types: string[]
    status: number
    startTime: number
    endTime?: number
    steps: QCStepStatus[]
}

const QualityControlFlowDetail: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    // 从URL参数获取质控类型
    const typesParam = searchParams.get('types') || ''
    const types = useMemo(() => typesParam.split(',').filter(Boolean), [typesParam])

    // 状态管理
    const [loading, setLoading] = useState(false)
    const [flowDetail, setFlowDetail] = useState<QCFlowDetail | null>(null)
    const [logDetailData, setLogDetailData] = useState<QCTaskLogDetailData | null>(null)
    const [resultModalVisible, setResultModalVisible] = useState(false)
    const [selectedStepResult, setSelectedStepResult] = useState<{
        title: string
        resultSummary: string
        stepIndex: number
    } | null>(null)
    const [continueLoading, setContinueLoading] = useState(false)
    const [executionLogs, setExecutionLogs] = useState<string[]>([]) // SSE执行日志
    const executionRef = useRef<{ [key: number]: boolean }>({}) // 跟踪每个步骤是否正在执行
    const intervalRef = useRef<NodeJS.Timeout | null>(null) // 存储定时器引用
    const sseManagerRef = useRef<SSEManager | null>(null) // SSE连接管理器
    const logsEndRef = useRef<HTMLDivElement>(null) // 日志滚动到底部的引用

    // 根据类型生成执行步骤（优先使用接口返回的数据）
    const executionSteps = useMemo(() => {
        if (logDetailData?.logList && logDetailData.logList.length > 0) {
            // 使用接口返回的logList
            return logDetailData.logList.map((log, index) => {
                // 根据node_type查找对应的类型信息
                const nodeTypeToValue: Record<string, string> = {
                    TimelinessQC: 'comprehensive',
                    CompletenessQC: 'completeness',
                    ConsistencyQC: 'basic-medical-logic',
                    AccuracyQC: 'core-data',
                }
                const type = nodeTypeToValue[log.node_type] || log.node_type
                const typeInfo = QC_TYPE_MAP[type]
                return {
                    stepIndex: log.step_no - 1,
                    title: log.step_name,
                    description: typeInfo?.description || '',
                    icon: typeInfo?.icon,
                    type: type,
                }
            })
        }
        // 如果没有接口数据，使用URL参数中的types
        return types.map((type, index) => {
            const typeInfo = QC_TYPE_MAP[type]
            return {
                stepIndex: index,
                title: typeInfo?.label || type,
                description: typeInfo?.description || '',
                icon: typeInfo?.icon,
                type: type,
            }
        })
    }, [logDetailData, types])

    // 获取质控任务日志详情
    const fetchLogDetail = useCallback(async () => {
        if (!taskId) {
            return
        }

        try {
            setLoading(true)
            logger.info('开始获取质控任务日志详情', { taskId })
            const response = await dataGovernanceService.getQCTaskLogDetail(taskId)

            if (response.code === 200 && response.data) {
                setLogDetailData(response.data)
                logger.info('成功获取质控任务日志详情', {
                    taskId,
                    logCount: response.data.logList?.length || 0,
                })

                // 将接口数据转换为flowDetail格式
                const summary = response.data.logSummary
                const logList = response.data.logList || []

                // 从task_types或logList中获取类型，并转换为内部使用的类型值
                const nodeTypeToValue: Record<string, string> = {
                    TimelinessQC: 'comprehensive',
                    CompletenessQC: 'completeness',
                    ConsistencyQC: 'basic-medical-logic',
                    AccuracyQC: 'core-data',
                }
                
                const taskTypes = summary.task_types
                    ? summary.task_types.split(',').map(type => nodeTypeToValue[type.trim()] || type.trim()).filter(Boolean)
                    : logList.map(log => nodeTypeToValue[log.node_type] || log.node_type).filter(Boolean)

                // 将logList转换为steps
                const steps: QCStepStatus[] = logList.map((log) => ({
                    stepIndex: log.step_no - 1, // step_no从1开始，stepIndex从0开始
                    status: log.step_status,
                    completedQuantity: log.step_status === 2 ? 100 : log.step_status === 1 ? 50 : 0,
                    totalQuantity: 100,
                    startTime: log.create_time,
                    endTime: log.end_time || undefined,
                    resultSummary: log.step_status === 2 ? `${log.step_name}执行完成` : undefined,
                    errorMessage: log.step_status === 5 ? '执行失败' : undefined,
                }))

                setFlowDetail({
                    taskId: String(summary.batch_id),
                    types: taskTypes,
                    status: summary.status,
                    startTime: new Date(summary.start_time).getTime(),
                    endTime: summary.end_time ? new Date(summary.end_time).getTime() : undefined,
                    steps,
                })
            } else {
                const errorMsg = response.msg || '获取日志详情失败'
                logger.error('获取质控任务日志详情失败', errorMsg)
                uiMessage.error(errorMsg)
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '获取日志详情时发生未知错误'
            logger.error('获取质控任务日志详情异常', errorMsg)
            uiMessage.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }, [taskId])

    // 初始化流程详情 - 调用接口获取数据
    useEffect(() => {
        if (!taskId) {
            uiMessage.error('任务ID不存在')
            navigate('/data-quality-control/flow-management')
            return
        }

        // 调用接口获取日志详情
        fetchLogDetail()
    }, [taskId, navigate, fetchLogDetail])

    // 模拟执行步骤
    const executeStep = useCallback(async (stepIndex: number) => {
        // 防止重复执行
        if (executionRef.current[stepIndex]) {
            return
        }

        executionRef.current[stepIndex] = true

        // 先更新步骤状态为执行中
        setFlowDetail(prev => {
            if (!prev) return prev

            const step = prev.steps[stepIndex]
            if (!step || step.status === 2) {
                executionRef.current[stepIndex] = false
                return prev
            }

            // 更新步骤状态为执行中
            const updatedSteps = [...prev.steps]
            updatedSteps[stepIndex] = {
                ...step,
                status: 1,
                startTime: new Date().toLocaleString('zh-CN'),
            }

            return { ...prev, steps: updatedSteps }
        })

        // 模拟执行过程
        let progress = 0
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        intervalRef.current = setInterval(() => {
            progress += 10
            setFlowDetail(current => {
                if (!current) return current
                const newSteps = [...current.steps]
                const existingStep = newSteps[stepIndex]
                if (existingStep) {
                    newSteps[stepIndex] = {
                        ...existingStep,
                        completedQuantity: progress,
                        totalQuantity: 100,
                    }
                }
                return { ...current, steps: newSteps }
            })

            if (progress >= 100) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current = null
                }

                // 完成当前步骤
                setFlowDetail(current => {
                    if (!current) return current
                    const finalSteps = [...current.steps]
                    const currentStep = finalSteps[stepIndex]
                    if (currentStep) {
                        finalSteps[stepIndex] = {
                            ...currentStep,
                            status: 2,
                            completedQuantity: 100,
                            endTime: new Date().toLocaleString('zh-CN'),
                            resultSummary: `成功完成${executionSteps[stepIndex]?.title}，处理了 ${Math.floor(Math.random() * 10000) + 1000} 条记录，通过率 ${Math.floor(Math.random() * 20) + 80}%`,
                        }
                    }

                    // 如果还有下一步，自动开始执行
                    if (stepIndex < executionSteps.length - 1) {
                        const nextStep = finalSteps[stepIndex + 1]
                        if (nextStep) {
                            finalSteps[stepIndex + 1] = {
                                ...nextStep,
                                status: 1,
                                startTime: new Date().toLocaleString('zh-CN'),
                            }
                        }
                    } else {
                        // 所有步骤完成，更新localStorage中的历史记录
                        const key = 'qcExecutionHistory'
                        const prevStorage = localStorage.getItem(key)
                        const list = prevStorage ? JSON.parse(prevStorage) : []
                        const index = list.findIndex((item: any) => item.id === taskId)
                        if (index !== -1) {
                            list[index] = {
                                ...list[index],
                                status: 'completed',
                                end_time: Date.now(),
                            }
                            localStorage.setItem(key, JSON.stringify(list))
                        }
                    }

                    return {
                        ...current,
                        status: stepIndex < executionSteps.length - 1 ? current.status : 2,
                        endTime: stepIndex < executionSteps.length - 1 ? current.endTime : Date.now(),
                        steps: finalSteps,
                    }
                })

                // 延迟执行下一步，避免状态更新冲突
                if (stepIndex < executionSteps.length - 1) {
                    setTimeout(() => {
                        executionRef.current[stepIndex + 1] = false
                        executeStep(stepIndex + 1)
                    }, 500)
                }

                executionRef.current[stepIndex] = false
            }
        }, 500)
    }, [executionSteps, taskId])

    // 继续执行
    const handleContinueExecution = async () => {
        if (!flowDetail) return

        const currentStepIndex = flowDetail.steps.findIndex(step => step.status === 1 || step.status === 3)
        if (currentStepIndex === -1) {
            // 找到第一个未执行的步骤
            const nextStepIndex = flowDetail.steps.findIndex(step => step.status === 0)
            if (nextStepIndex !== -1) {
                await executeStep(nextStepIndex)
            }
        } else {
            setContinueLoading(true)
            await executeStep(currentStepIndex)
            setContinueLoading(false)
        }
    }

    // 自动开始执行第一个步骤（只执行一次）
    const hasStartedRef = useRef(false)
    useEffect(() => {
        if (flowDetail && flowDetail.steps.length > 0 && !hasStartedRef.current) {
            const firstStep = flowDetail.steps[0]
            if (firstStep && firstStep.status === 1 && firstStep.completedQuantity === 0) {
                hasStartedRef.current = true
                executeStep(0)
            }
        }
    }, [flowDetail, executeStep])

    // 清理定时器
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    // 建立SSE连接监听执行日志
    useEffect(() => {
        if (!taskId) return

        // 建立SSE连接来监听执行日志
        const manager = api.createSSE({
            url: `/data/qc/task/process/log/${taskId}`,
            method: 'GET',
            maxReconnectAttempts: 3,
            reconnectInterval: 5000,
            onOpen: () => {
                logger.info('SSE日志连接已建立')
                setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SSE连接已建立，开始监听执行日志...`])
            },
            onMessage: (event: MessageEvent) => {
                const message = event.data
                logger.info('收到SSE日志消息:', message)
                setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
            },
            onError: (error: Event) => {
                logger.error('SSE日志连接错误', error)
                setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [错误] SSE连接错误`])
            },
            onClose: () => {
                logger.info('SSE日志连接已关闭')
                setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SSE连接已关闭`])
            },
            onMaxReconnectAttemptsReached: () => {
                logger.error('SSE日志重连次数已达上限')
                setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [错误] SSE重连次数已达上限`])
            },
        })

        sseManagerRef.current = manager
        manager.connect()

        // 清理函数
        return () => {
            if (sseManagerRef.current) {
                sseManagerRef.current.disconnect()
                sseManagerRef.current = null
            }
        }
    }, [taskId])

    // 自动滚动日志到底部
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [executionLogs])

    // 返回上一页
    const goBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/data-quality-control/flow-management')
        }
    }

    // 刷新
    const handleRefresh = async () => {
        await fetchLogDetail()
        uiMessage.success('刷新成功')
    }

    // 查看执行结果
    const handleViewResult = (stepIndex: number) => {
        const step = executionSteps[stepIndex]
        const stepStatus = flowDetail?.steps[stepIndex]
        if (!step || !stepStatus) return

        setSelectedStepResult({
            title: step.title,
            resultSummary: stepStatus.resultSummary || '暂无执行结果',
            stepIndex,
        })
        setResultModalVisible(true)
    }

    // 关闭结果弹窗
    const handleCloseResultModal = () => {
        setResultModalVisible(false)
        setSelectedStepResult(null)
    }

    // 获取当前步骤索引
    const getCurrentStep = () => {
        if (!flowDetail) return 0
        const currentIndex = flowDetail.steps.findIndex(step => step.status === 1)
        return currentIndex >= 0 ? currentIndex : flowDetail.steps.length
    }

    // 获取状态标签
    const getStatusTag = (status: number) => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0]
        return <Tag color={config.color}>{config.text}</Tag>
    }

    // 计算是否全部步骤已完成
    const isFlowCompleted = useMemo(() => {
        return flowDetail?.status === 2 || flowDetail?.steps.every(step => step.status === 2)
    }, [flowDetail])

    // 渲染进度条
    const renderProgressBar = (step: QCStepStatus) => {
        if ([2, 3, 4, 5].includes(step.status)) {
            return null
        }

        if (!step.completedQuantity || !step.totalQuantity) return null

        const percentage = Math.round((step.completedQuantity / step.totalQuantity) * 100)

        return (
            <div
                style={{
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                }}
            >
                <Progress
                    percent={percentage}
                    size='small'
                    status={percentage === 100 ? 'success' : 'active'}
                    showInfo={false}
                    style={{ width: 250 }}
                />
                <Text type='secondary' style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {step.completedQuantity}/{step.totalQuantity} ({percentage}%)
                </Text>
            </div>
        )
    }

    if (loading || !flowDetail) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size='large' />
                <div style={{ marginTop: 16 }}>
                    <Text>加载执行详情中...</Text>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* 头部 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={goBack}
                        style={{ marginRight: 16 }}
                    >
                        返回
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>
                        质控流程执行详情
                    </Title>
                </div>
                <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                    刷新
                </Button>
            </div>

            {/* 基本信息 */}
            <Card title='基本信息' style={{ marginBottom: 24 }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 16,
                        marginBottom: 16,
                    }}
                >
                    <div>
                        <Text strong>任务ID：</Text>
                        <Text copyable>
                            {logDetailData?.logSummary?.batch_id
                                ? String(logDetailData.logSummary.batch_id)
                                : flowDetail?.taskId || '无'}
                        </Text>
                    </div>
                    <div>
                        <Text strong>任务名称：</Text>
                        <Text>{logDetailData?.logSummary?.name || '无'}</Text>
                    </div>
                    <div>
                        <Text strong>质控类型：</Text>
                        <Space>
                            {logDetailData?.logList && logDetailData.logList.length > 0
                                ? logDetailData.logList.map((log, index) => {
                                      const nodeTypeToValue: Record<string, string> = {
                                          TimelinessQC: 'comprehensive',
                                          CompletenessQC: 'completeness',
                                          ConsistencyQC: 'basic-medical-logic',
                                          AccuracyQC: 'core-data',
                                      }
                                      const type = nodeTypeToValue[log.node_type] || log.node_type
                                      const typeInfo = QC_TYPE_MAP[type]
                                      return (
                                          <Tag key={`${log.log_id}-${index}`} color='blue'>
                                              {typeInfo?.icon}
                                              <span style={{ marginLeft: 4 }}>
                                                  {log.step_name || typeInfo?.label || log.node_type}
                                              </span>
                                          </Tag>
                                      )
                                  })
                                : flowDetail?.types.map(type => {
                                      const typeInfo = QC_TYPE_MAP[type]
                                      return (
                                          <Tag key={type} color='blue'>
                                              {typeInfo?.icon}
                                              <span style={{ marginLeft: 4 }}>{typeInfo?.label || type}</span>
                                          </Tag>
                                      )
                                  }) || []}
                        </Space>
                    </div>
                    <div>
                        <Text strong>状态：</Text>
                        {getStatusTag(
                            logDetailData?.logSummary?.status ?? flowDetail?.status ?? 0
                        )}
                    </div>
                    <div>
                        <Text strong>开始时间：</Text>
                        <Text>
                            {logDetailData?.logSummary?.start_time
                                ? new Date(logDetailData.logSummary.start_time).toLocaleString('zh-CN')
                                : flowDetail?.startTime
                                  ? new Date(flowDetail.startTime).toLocaleString('zh-CN')
                                  : '未开始'}
                        </Text>
                    </div>
                    <div>
                        <Text strong>结束时间：</Text>
                        <Text>
                            {logDetailData?.logSummary?.end_time
                                ? new Date(logDetailData.logSummary.end_time).toLocaleString('zh-CN')
                                : flowDetail?.endTime
                                  ? new Date(flowDetail.endTime).toLocaleString('zh-CN')
                                  : '进行中'}
                        </Text>
                    </div>
                    {logDetailData?.logSummary?.remark && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Text strong>备注：</Text>
                            <Text>{logDetailData.logSummary.remark}</Text>
                        </div>
                    )}
                </div>
            </Card>

            {/* 执行步骤 */}
            <Card title='执行步骤' style={{ marginBottom: 24 }}>
                <Steps
                    current={getCurrentStep()}
                    direction='vertical'
                    size='small'
                    style={{ marginBottom: 24 }}
                >
                    {executionSteps.map((step, index) => {
                        const stepStatus = flowDetail.steps[index]
                        if (!stepStatus) return null

                        return (
                            <Step
                                key={index}
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{step.title}</span>
                                        {getStatusTag(stepStatus.status)}
                                    </div>
                                }
                                description={
                                    <div>
                                        <div style={{ marginBottom: 8 }}>{step.description}</div>
                                        {/* 进度条展示 */}
                                        {renderProgressBar(stepStatus)}

                                        {/* 继续执行按钮 - 仅在暂停状态的步骤显示 */}
                                        {stepStatus.status === 3 && (
                                            <Button
                                                type='primary'
                                                size='small'
                                                icon={<PlayCircleOutlined />}
                                                onClick={handleContinueExecution}
                                                loading={continueLoading}
                                                style={{ marginTop: 8, marginRight: 8 }}
                                            >
                                                继续执行
                                            </Button>
                                        )}

                                        {/* 查看执行结果按钮 - 仅在已完成的步骤显示 */}
                                        {stepStatus.status === 2 && (
                                            <Button
                                                type='link'
                                                size='small'
                                                icon={<EyeOutlined />}
                                                onClick={() => handleViewResult(index)}
                                                style={{ padding: 0, height: 'auto', marginTop: 8 }}
                                            >
                                                查看执行结果
                                            </Button>
                                        )}

                                        {/* 错误信息 */}
                                        {stepStatus.status === 5 && stepStatus.errorMessage && (
                                            <div style={{ marginTop: 8 }}>
                                                <Text type='danger'>{stepStatus.errorMessage}</Text>
                                            </div>
                                        )}
                                    </div>
                                }
                            />
                        )
                    })}
                </Steps>

                {/* 全部完成后显示提示 */}
                {isFlowCompleted && (
                    <div style={{ marginTop: 8 }}>
                        <Tag color='success' style={{ fontSize: 14, padding: '4px 12px' }}>
                            所有质控步骤已完成
                        </Tag>
                    </div>
                )}
            </Card>

            {/* 执行日志 */}
            <Card title='执行日志' style={{ marginBottom: 24 }}>
                <div
                    style={{
                        maxHeight: 400,
                        overflowY: 'auto',
                        padding: '12px',
                        background: '#f5f5f5',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        minHeight: 200,
                    }}
                >
                    {executionLogs.length > 0 ? (
                        <>
                            {executionLogs.map((log, index) => (
                                <div key={index} style={{ marginBottom: '4px', color: '#333' }}>
                                    {log}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                            暂无执行日志
                        </div>
                    )}
                </div>
            </Card>

            {/* 执行结果查看弹窗 */}
            <Modal
                title={`执行结果 - ${selectedStepResult?.title}`}
                open={resultModalVisible}
                onCancel={handleCloseResultModal}
                footer={[
                    <Button key='close' onClick={handleCloseResultModal}>
                        关闭
                    </Button>,
                ]}
                width={600}
            >
                {selectedStepResult && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>步骤名称：</Text>
                            <Text>{selectedStepResult.title}</Text>
                        </div>
                        <div>
                            <Text strong>执行结果：</Text>
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: 12,
                                    background: '#f5f5f5',
                                    borderRadius: 4,
                                    border: '1px solid #d9d9d9',
                                }}
                            >
                                <Text>{selectedStepResult.resultSummary}</Text>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default QualityControlFlowDetail

