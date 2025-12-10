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
import { Button, Card, Progress, Spin, Steps, Tag, Typography, Space } from 'antd'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { selectExecutionByTaskId, selectExecutionMessages, initializeExecution } from '@/store/slices/qcExecutionSlice'
import { dataQualityControlService } from '@/services/dataQualityControlService'
import { logger } from '@/utils/logger'
import { uiMessage } from '@/utils/uiMessage'
import type { WorkflowExecutionMessage, QCTaskLogDetailData, QCTaskLogItem, QCTaskLogSummary } from '@/types'
import dayjs from 'dayjs'
import { showDialog } from '@/utils/showDialog'
import QCResultDialog from './components/QCResultDialog'
import { subscribeWorkflow } from '@/utils/workflowUtils'

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
    table?: string // 当前处理的表
    tableName?: string // 当前处理的表名
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
    const dispatch = useAppDispatch()

    // 从URL参数获取质控类型
    const typesParam = searchParams.get('types') || ''
    const types = typesParam.split(',').filter(Boolean)

    // 从全局状态获取执行信息和消息
    const qcExecution = useAppSelector(state => (taskId ? selectExecutionByTaskId(taskId)(state) : null))
    const executionMessages = useAppSelector(state => (taskId ? selectExecutionMessages(taskId)(state) : []))

    // UI状态管理
    const [loading, setLoading] = useState(false)
    const [logDetailData, setLogDetailData] = useState<QCTaskLogDetailData | null>(null)
    const [continueLoading, setContinueLoading] = useState(false)

    // 初始化执行状态（如果不存在）
    useEffect(() => {
        if (taskId && !qcExecution) {
            dispatch(initializeExecution({ taskId }))
        }
    }, [taskId, qcExecution, dispatch])

    // 获取日志详情
    const fetchLogDetail = useCallback(async () => {
        if (!taskId) return

        try {
            setLoading(true)
            logger.info('开始获取质控任务日志详情', { taskId })
            const response = await dataQualityControlService.getQCTaskLogDetail(taskId)

            if (response.code === 200 && response.data) {
                setLogDetailData(response.data)
                logger.info('成功获取质控任务日志详情', {
                    taskId,
                    logCount: response.data.logList?.length || 0,
                })
            } else {
                const errorMsg = response.msg || '获取日志详情失败'
                logger.error('获取质控任务日志详情失败', new Error(errorMsg))
                uiMessage.error(errorMsg)
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '获取日志详情时发生未知错误'
            logger.error('获取质控任务日志详情异常', error instanceof Error ? error : new Error(errorMsg))
            uiMessage.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }, [taskId])

    // 组件初始化时获取日志详情并初始化质控任务执行状态
    useEffect(() => {
        if (taskId) {
            // 初始化质控任务执行状态（如果还不存在）
            if (!qcExecution) {
                dispatch(initializeExecution({ taskId }))
            }
            // 只在初始化时获取一次日志详情，后续通过SSE更新
            fetchLogDetail()
        }
    }, [taskId, dispatch, fetchLogDetail]) // qcExecution 在此处不应作为依赖，避免无限循环

    // 订阅质控流程完成/关闭事件
    useEffect(() => {
        if (!taskId) return

        let unsubscribe: (() => void) | null = null
        try {
            unsubscribe = subscribeWorkflow(String(taskId), evt => {
                if (!evt || evt.taskId !== String(taskId)) return
                if (evt.type === 'completed' || evt.type === 'closed') {
                    // 仅在完成或关闭时刷新详情
                    fetchLogDetail()
                }
            })
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : '订阅质控流程事件时发生未知错误'
            logger.error('订阅质控流程事件失败', e instanceof Error ? e : new Error(errMsg))
        }

        // 清理订阅
        return () => {
            try {
                unsubscribe?.()
            } catch (e) {
                const errMsg = e instanceof Error ? e.message : '取消订阅时发生未知错误'
                logger.error('取消订阅质控流程事件失败', e instanceof Error ? e : new Error(errMsg))
            }
        }
    }, [taskId, fetchLogDetail])

    // 获取质控流程详情，如果有SSE连接的情况下优先从SSE中获取步骤详情
    const displayDetail = useMemo(() => {
        if (!logDetailData) {
            // 如果没有日志数据，返回空结构
            return null
        }

        // 深拷贝日志数据，避免直接修改原始数据
        const detail = JSON.parse(JSON.stringify(logDetailData)) as QCTaskLogDetailData
        const executionMessages = qcExecution?.messages || []

        // 如果有SSE消息，将SSE消息中的进度信息合并到日志详情中
        if (executionMessages.length > 0 && detail.logList) {
            // 找到最后一个正在执行的步骤
            const lastExecutingStep = executionMessages.at(-1)
            const lastNode = executionMessages.findLast(
                msg => msg.executionStatus !== 'end' && !!msg.node && (typeof msg.node === 'string' ? msg.node !== '-' : true)
            )
            const isEnd =
                lastExecutingStep?.executionStatus === 'end' &&
                (typeof lastNode?.node === 'object' && lastNode?.node !== null
                    ? lastNode.node.nodeType === detail.logList?.at(-1)?.node_type
                    : false)

            // 遍历SSE消息，更新对应的日志步骤
            executionMessages.forEach(msgInfo => {
                const { node, tableQuantity, completedQuantity, status, tableName, table } = msgInfo

                // 找到对应的日志步骤
                const step = detail.logList.find(
                    log => log.node_type === node.nodeType
                ) as QCTaskLogItem | undefined

                if (step) {
                    // 更新进度信息
                    if (completedQuantity !== undefined) {
                        step.completedQuantity = completedQuantity
                    }
                    if (tableQuantity !== undefined) {
                        step.table_quantity = tableQuantity
                    }

                    // 更新tableName和table字段
                    if (tableName !== undefined) {
                        step.tableName = tableName
                    }
                    if (table !== undefined) {
                        step.table = table
                    }

                    // 找到最后一个节点的索引
                    const lastIndex = detail.logList?.findIndex(
                        step => step.node_type === lastNode?.node.nodeType
                    )

                    // 更新步骤状态
                    if ((isEnd || (lastIndex !== undefined && step.step_no < lastIndex + 1)) && step.enabled) {
                        step.step_status = 2 // 已完成
                    } else {
                        // 根据SSE消息的状态更新
                        if (status !== undefined) {
                            step.step_status = status
                        }
                    }
                }
            })

            // 更新摘要信息
            if (lastNode) {
                detail.logSummary.node_type = lastNode.node.nodeType
            }
            if (isEnd) {
                detail.logSummary.status = 2 // 已完成
            } else if (lastNode?.node && !lastNode.node.isAuto) {
                detail.logSummary.status = 3 // 暂停
            } else {
                detail.logSummary.status = 1 // 执行中
            }
        }

        return detail
    }, [logDetailData, qcExecution?.messages, taskId])

    // 根据日志数据或类型生成执行步骤
    const executionSteps = useMemo(() => {
        // 优先使用组合后的详情数据
        const detailData = displayDetail || logDetailData
        if (detailData?.logList && detailData.logList.length > 0) {
            const nodeTypeToValue: Record<string, string> = {
                TimelinessQC: 'comprehensive',
                CompletenessQC: 'completeness',
                ConsistencyQC: 'basic-medical-logic',
                AccuracyQC: 'core-data',
            }
            return detailData.logList.map((log, index) => {
                const type = nodeTypeToValue[log.node_type] || log.node_type
                const typeInfo = QC_TYPE_MAP[type]
                return {
                    stepIndex: index,
                    title: log.step_name || typeInfo?.label || log.node_type,
                    description: typeInfo?.description || '',
                    icon: typeInfo?.icon,
                    type: type,
                    logItem: log, // 保存日志项引用
                }
            })
        }
        // 如果没有日志数据，使用URL参数中的types
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
    }, [displayDetail, logDetailData, types])

    // 根据组合后的详情数据生成流程详情
    const flowDetail: QCFlowDetail = useMemo(() => {
        // 优先使用组合后的详情数据
        if (displayDetail) {
            const summary = displayDetail.logSummary
            const logList = displayDetail.logList || []

            // 从task_types或logList中获取类型
            const nodeTypeToValue: Record<string, string> = {
                TimelinessQC: 'comprehensive',
                CompletenessQC: 'completeness',
                ConsistencyQC: 'basic-medical-logic',
                AccuracyQC: 'core-data',
            }

            const taskTypes = summary.task_types
                ? summary.task_types.split(',').map(type => nodeTypeToValue[type.trim()] || type.trim()).filter(Boolean)
                : logList.map(log => nodeTypeToValue[log.node_type] || log.node_type).filter(Boolean)

            // 将logList转换为steps，使用SSE更新后的数据
            const steps: QCStepStatus[] = logList.map((log) => ({
                stepIndex: log.step_no - 1, // step_no从1开始，stepIndex从0开始
                status: log.step_status,
                completedQuantity: log.completedQuantity || (log.step_status === 2 ? 100 : log.step_status === 1 ? 50 : 0),
                totalQuantity: log.table_quantity || 100,
                startTime: log.create_time ? dayjs(log.create_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
                endTime: log.end_time ? dayjs(log.end_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
                resultSummary: log.step_status === 2 ? `${log.step_name}执行完成` : undefined,
                errorMessage: log.step_status === 5 ? '执行失败' : undefined,
                table: log.table,
                tableName: log.tableName,
            }))

            return {
                taskId: String(summary.batch_id),
                types: taskTypes,
                status: summary.status,
                startTime: summary.start_time ? new Date(summary.start_time).getTime() : Date.now(),
                endTime: summary.end_time ? new Date(summary.end_time).getTime() : undefined,
                steps,
            }
        }

        // 如果没有日志数据，使用全局状态中的消息
        const baseDetail: QCFlowDetail = {
            taskId: taskId || '无',
            types: types,
            status: qcExecution?.status === 'completed' ? 2 : qcExecution?.status === 'running' ? 1 : 0,
            startTime: qcExecution?.startTime || Date.now(),
            endTime: qcExecution?.endTime || undefined,
            steps: executionSteps.map((step, index) => ({
                stepIndex: index,
                status: 0,
                completedQuantity: 0,
                totalQuantity: 100,
            })),
        }

        // 根据消息更新步骤状态
        if (executionMessages.length > 0) {
            executionMessages.forEach((message: WorkflowExecutionMessage) => {
                // 根据 nodeType 找到对应的步骤索引
                const nodeTypeToValue: Record<string, string> = {
                    TimelinessQC: 'comprehensive',
                    CompletenessQC: 'completeness',
                    ConsistencyQC: 'basic-medical-logic',
                    AccuracyQC: 'core-data',
                }
                const type = nodeTypeToValue[message.node.nodeType] || message.node.nodeType
                const stepIndex = executionSteps.findIndex(step => step.type === type)

                if (stepIndex >= 0 && stepIndex < baseDetail.steps.length) {
                    const step = baseDetail.steps[stepIndex]
                    if (!step) return
                    
                    // 更新步骤状态
                    if (message.executionStatus === 'running') {
                        step.status = 1 // 执行中
                    } else if (message.executionStatus === 'completed' || message.executionStatus === 'end') {
                        step.status = 2 // 已完成
                    } else if (message.executionStatus === 'error' || message.executionStatus === 'failed') {
                        step.status = 5 // 失败
                        step.errorMessage = '执行失败'
                    }

                    // 更新进度信息
                    step.completedQuantity = message.completedQuantity || 0
                    step.totalQuantity = message.tableQuantity || 100

                    // 更新表和表名信息
                    if (message.table) {
                        step.table = message.table
                    }
                    if (message.tableName) {
                        step.tableName = message.tableName
                    }

                    // 更新开始和结束时间
                    if (message.executionStatus === 'running' && !step.startTime) {
                        step.startTime = new Date().toLocaleString('zh-CN')
                    }
                    if (message.executionStatus === 'completed' || message.executionStatus === 'end') {
                        step.endTime = new Date().toLocaleString('zh-CN')
                        const stepInfo = executionSteps[stepIndex]
                        if (stepInfo) {
                            step.resultSummary = `${stepInfo.title}执行完成`
                        }
                    }
                }
            })
        }

        return baseDetail
    }, [taskId, types, executionSteps, qcExecution, executionMessages, displayDetail])

    // 返回上一页
    const goBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/data-quality-control/flow-management')
        }
    }

    // 刷新日志详情
    const handleRefresh = async () => {
        await fetchLogDetail()
        uiMessage.success('刷新成功')
    }

    // 查看执行结果
    const handleViewResult = (stepIndex: number) => {
        const step = executionSteps[stepIndex]
        if (!step) return

        // 从组合后的详情数据中获取步骤信息
        const logItem = displayDetail?.logList?.[stepIndex] || logDetailData?.logList?.[stepIndex]

        // 使用 showDialog 显示结果弹窗
        showDialog(QCResultDialog, {
            title: step.title,
            type: step.type,
            step: logItem,
            batchId: taskId,
        })
    }

    // 获取当前步骤索引（仅用于展示）
    const getCurrentStep = () => {
        if (displayDetail?.logSummary?.node_type && displayDetail.logList) {
            // 使用组合后的详情数据中的node_type来找到当前步骤
            const currentIndex = displayDetail.logList.findIndex(
                step => step.node_type === displayDetail.logSummary.node_type
            )
            return currentIndex >= 0 ? currentIndex : displayDetail.logList.length
        }
        if (!flowDetail) return 0
        const currentIndex = flowDetail.steps.findIndex(step => step.status === 1)
        return currentIndex >= 0 ? currentIndex : flowDetail.steps.length
    }

    // 获取状态标签
    const getStatusTag = (status: number) => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0]
        return <Tag color={config.color}>{config.text}</Tag>
    }

    // 计算是否全部步骤已完成（仅用于展示）
    const isFlowCompleted = flowDetail?.status === 2 || flowDetail?.steps.every(step => step.status === 2)

    // 渲染进度条（仅用于展示）
    const renderProgressBar = (step: QCStepStatus, stepIndex: number) => {
        if ([2, 3, 4, 5].includes(step.status)) {
            return null
        }

        if (!step.completedQuantity || !step.totalQuantity) return null

        const percentage = Math.round((step.completedQuantity / step.totalQuantity) * 100)
        const isRunning = step.status === 1 && stepIndex === getCurrentStep()

        return (
            <div style={{ marginTop: 8 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: isRunning ? 8 : 0,
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
                {/* 在进度条下方显示table信息 */}
                {isRunning && (step.table || step.tableName) && (
                    <div>
                        <Text type='secondary' style={{ fontSize: 12 }}>
                            正在处理数据表{step.table || ''}
                            {step.table && step.tableName ? `(${step.tableName})` : step.tableName ? `(${step.tableName})` : ''}
                        </Text>
                    </div>
                )}
            </div>
        )
    }

    if (loading) {
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
                        <Text copyable>{flowDetail?.taskId || '无'}</Text>
                    </div>
                    <div>
                        <Text strong>任务名称：</Text>
                        <Text>{displayDetail?.logSummary?.name || logDetailData?.logSummary?.name || '无'}</Text>
                    </div>
                    <div>
                        <Text strong>质控类型：</Text>
                        <Space>
                            {flowDetail?.types.map(type => {
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
                        {getStatusTag(flowDetail?.status ?? 0)}
                    </div>
                    <div>
                        <Text strong>开始时间：</Text>
                        <Text>
                            {displayDetail?.logSummary?.start_time
                                ? dayjs(displayDetail.logSummary.start_time).format('YYYY-MM-DD HH:mm:ss')
                                : logDetailData?.logSummary?.start_time
                                ? dayjs(logDetailData.logSummary.start_time).format('YYYY-MM-DD HH:mm:ss')
                                : flowDetail?.startTime
                                ? new Date(flowDetail.startTime).toLocaleString('zh-CN')
                                : '未开始'}
                        </Text>
                    </div>
                    <div>
                        <Text strong>结束时间：</Text>
                        <Text>
                            {displayDetail?.logSummary?.end_time
                                ? dayjs(displayDetail.logSummary.end_time).format('YYYY-MM-DD HH:mm:ss')
                                : logDetailData?.logSummary?.end_time
                                ? dayjs(logDetailData.logSummary.end_time).format('YYYY-MM-DD HH:mm:ss')
                                : flowDetail?.endTime
                                ? new Date(flowDetail.endTime).toLocaleString('zh-CN')
                                : '进行中'}
                        </Text>
                    </div>
                    {(displayDetail?.logSummary?.remark || logDetailData?.logSummary?.remark) && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Text strong>备注：</Text>
                            <Text>{displayDetail?.logSummary?.remark || logDetailData?.logSummary?.remark}</Text>
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
                                        {renderProgressBar(stepStatus, index)}

                                        {/* 继续执行按钮 - 仅在暂停状态的步骤显示 */}
                                        {stepStatus.status === 3 && (
                                            <Button
                                                type='primary'
                                                size='small'
                                                icon={<PlayCircleOutlined />}
                                                onClick={() => setContinueLoading(true)}
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
                                                查看结果
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

        </div>
    )
}

export default QualityControlFlowDetail
