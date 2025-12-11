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
import { dataQualityControlService } from '@/services/dataQualityControlService'
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
    0: { text: '待执行', color: 'default' },
    1: { text: '执行中', color: 'processing' },
    2: { text: '已完成', color: 'success' },
    4: { text: '跳过', color: 'default' },
    5: { text: '失败', color: 'error' },
}

// 步骤状态接口
interface QCStepStatus {
    stepIndex: number
    status: number // 0未执行, 1执行中, 2已完成, 4跳过, 5失败
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
    const executionRef = useRef<{ [key: number]: boolean }>({}) // 跟踪每个步骤是否正在执行
    const intervalRef = useRef<NodeJS.Timeout | null>(null) // 存储定时器引用

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

    // 初始化模拟数据（当接口没有返回数据时使用）
    const initializeMockData = useCallback(() => {
        if (!taskId || types.length === 0) return

        const processName = searchParams.get('name') || '质控流程'
        const startTime = Date.now()

        // 根据类型创建步骤
        const steps: QCStepStatus[] = types.map((type, index) => {
            const typeInfo = QC_TYPE_MAP[type]
            return {
                stepIndex: index,
                status: index === 0 ? 1 : 0, // 第一个步骤状态为执行中
                completedQuantity: index === 0 ? 0 : 0,
                totalQuantity: 100,
                startTime: index === 0 ? new Date().toLocaleString('zh-CN') : undefined,
                endTime: undefined,
                resultSummary: undefined,
                errorMessage: undefined,
            }
        })

        const mockFlowDetail: QCFlowDetail = {
            taskId,
            types,
            status: 1, // 执行中
            startTime,
            endTime: undefined,
            steps,
        }

        setFlowDetail(mockFlowDetail)
        
        // 更新执行历史状态为 running（如果历史记录存在）
        const key = 'qcExecutionHistory'
        const prevStorage = localStorage.getItem(key)
        if (prevStorage) {
            const list = JSON.parse(prevStorage)
            const index = list.findIndex((item: any) => item.id === taskId)
            if (index !== -1 && list[index].status === 'starting') {
                list[index].status = 'running'
                localStorage.setItem(key, JSON.stringify(list))
            } else if (index === -1) {
                // 如果历史记录不存在，创建新记录
                const processName = searchParams.get('name') || '质控流程'
                const historyItem = {
                    id: taskId,
                    name: processName,
                    types,
                    status: 'running',
                    start_time: startTime,
                    end_time: null,
                }
                list.unshift(historyItem)
                localStorage.setItem(key, JSON.stringify(list))
            }
        } else {
            // 如果没有历史记录，创建新记录
            const processName = searchParams.get('name') || '质控流程'
            const historyItem = {
                id: taskId,
                name: processName,
                types,
                status: 'running',
                start_time: startTime,
                end_time: null,
            }
            localStorage.setItem(key, JSON.stringify([historyItem]))
        }
        
        logger.info('初始化模拟质控流程数据', { taskId, types, processName })
    }, [taskId, types, searchParams])

    // 获取质控任务日志详情
    const fetchLogDetail = useCallback(async () => {
        if (!taskId) {
            return
        }

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
                // 接口没有返回数据或失败，使用模拟数据
                logger.warn('获取质控任务日志详情失败，使用模拟数据', response.msg)
                initializeMockData()
            }
        } catch (error) {
            // 接口调用异常，使用模拟数据
            const errorMsg = error instanceof Error ? error.message : '获取日志详情时发生未知错误'
            logger.warn('获取质控任务日志详情异常，使用模拟数据', errorMsg)
            initializeMockData()
        } finally {
            setLoading(false)
        }
    }, [taskId, initializeMockData])

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

    // 更新执行历史记录
    const updateExecutionHistory = useCallback((status: 'starting' | 'running' | 'completed' | 'error' | 'cancelled', endTime?: number | null) => {
        if (!taskId) return
        
        const key = 'qcExecutionHistory'
        const prevStorage = localStorage.getItem(key)
        const list = prevStorage ? JSON.parse(prevStorage) : []
        const index = list.findIndex((item: any) => item.id === taskId)
        
        if (index !== -1) {
            list[index] = {
                ...list[index],
                status,
                ...(endTime !== undefined && { end_time: endTime }),
            }
            localStorage.setItem(key, JSON.stringify(list))
        } else {
            // 如果历史记录不存在，创建新记录
            const processName = searchParams.get('name') || '质控流程'
            const typesParam = searchParams.get('types') || ''
            const types = typesParam.split(',').filter(Boolean)
            
            const historyItem = {
                id: taskId,
                name: processName,
                types,
                status,
                start_time: Date.now(),
                end_time: endTime || null,
            }
            list.unshift(historyItem)
            localStorage.setItem(key, JSON.stringify(list))
        }
    }, [taskId, searchParams])

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
            
            // 如果是第一个步骤开始执行，更新主流程状态为 running
            const isFirstStep = stepIndex === 0
            const newStatus = isFirstStep && prev.status === 0 ? 1 : prev.status

            // 更新执行历史状态为 running（如果刚开始执行）
            if (isFirstStep && prev.status === 0) {
                updateExecutionHistory('running')
            }

            return { ...prev, status: newStatus, steps: updatedSteps }
        })

        // 模拟执行过程
        let progress = 0
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        // 随机生成每个步骤的执行时间（3~8秒）
        const stepDuration = Math.floor(Math.random() * 5000) + 3000 // 3000ms ~ 8000ms
        // 更新间隔设置为100ms，确保进度条流畅
        const updateInterval = 100
        // 计算需要更新的次数
        const totalUpdates = Math.ceil(stepDuration / updateInterval)
        // 每次更新的增量
        const progressIncrement = 100 / totalUpdates

        // 使用定时器更新进度
        intervalRef.current = setInterval(() => {
            progress += progressIncrement
            
            setFlowDetail(current => {
                if (!current) return current
                const newSteps = [...current.steps]
                const existingStep = newSteps[stepIndex]
                if (existingStep) {
                    newSteps[stepIndex] = {
                        ...existingStep,
                        completedQuantity: Math.min(progress, 100),
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
                    const stepInfo = executionSteps[stepIndex]
                    
                    if (currentStep && stepInfo) {
                        // 生成详细的执行结果
                        const processedRecords = Math.floor(Math.random() * 10000) + 1000
                        // 生成带小数的通过率（80-100之间，保留两位小数）
                        const passRate = Math.round((Math.random() * 20 + 80) * 100) / 100
                        const errorCount = Math.floor(processedRecords * (100 - passRate) / 100)
                        // 生成带小数的准点率（88-98之间，保留两位小数）
                        const punctualRate = Math.round((Math.random() * 10 + 88) * 100) / 100
                        
                        // 根据不同的质控类型生成不同的结果摘要
                        let resultSummary = ''
                        switch (stepInfo.type) {
                            case 'comprehensive':
                                resultSummary = `及时性质控执行完成\n\n` +
                                    `• 处理记录数：${processedRecords.toLocaleString()} 条\n` +
                                    `• 通过率：${formatPercentage(passRate)}\n` +
                                    `• 异常记录：${errorCount} 条\n` +
                                    `• 平均延迟：${Math.floor(Math.random() * 10) + 5} 分钟\n` +
                                    `• 准点率：${formatPercentage(punctualRate)}`
                                break
                            case 'completeness':
                                resultSummary = `完整性质控执行完成\n\n` +
                                    `• 检查表数：${Math.floor(Math.random() * 20) + 10} 张\n` +
                                    `• 检查字段数：${Math.floor(Math.random() * 100) + 50} 个\n` +
                                    `• 完整率：${formatPercentage(passRate)}\n` +
                                    `• 缺失字段：${errorCount} 个\n` +
                                    `• 空值记录：${Math.floor(errorCount * 0.6)} 条`
                                break
                            case 'basic-medical-logic':
                                resultSummary = `一致性质控执行完成\n\n` +
                                    `• 检查记录数：${processedRecords.toLocaleString()} 条\n` +
                                    `• 一致性通过率：${formatPercentage(passRate)}\n` +
                                    `• 不一致记录：${errorCount} 条\n` +
                                    `• 主附表关联检查：${Math.floor(processedRecords * 0.8).toLocaleString()} 条\n` +
                                    `• 基础规则检查：${Math.floor(processedRecords * 0.6).toLocaleString()} 条`
                                break
                            case 'core-data':
                                resultSummary = `准确性质控执行完成\n\n` +
                                    `• 检查记录数：${processedRecords.toLocaleString()} 条\n` +
                                    `• 准确率：${formatPercentage(passRate)}\n` +
                                    `• 错误记录：${errorCount} 条\n` +
                                    `• 编码规范检查：${Math.floor(processedRecords * 0.7).toLocaleString()} 条\n` +
                                    `• 字段值校验：${Math.floor(processedRecords * 0.9).toLocaleString()} 条`
                                break
                            default:
                                resultSummary = `成功完成${stepInfo.title}，处理了 ${processedRecords.toLocaleString()} 条记录，通过率 ${formatPercentage(passRate)}`
                        }
                        
                        finalSteps[stepIndex] = {
                            ...currentStep,
                            status: 2,
                            completedQuantity: 100,
                            endTime: new Date().toLocaleString('zh-CN'),
                            resultSummary,
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
                        // 所有步骤完成，更新主流程状态和历史记录
                        const endTime = Date.now()
                        updateExecutionHistory('completed', endTime)
                    }

                    return {
                        ...current,
                        status: stepIndex < executionSteps.length - 1 ? current.status : 2, // 2 表示已完成
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
        }, updateInterval) // 每100ms更新一次进度，总时间随机3~8秒
    }, [executionSteps, taskId, updateExecutionHistory])

    // 继续执行（移除暂停功能，此函数保留用于可能的后续需求）
    const handleContinueExecution = async () => {
        if (!flowDetail) return

        const currentStepIndex = flowDetail.steps.findIndex(step => step.status === 1)
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
            // 如果第一个步骤状态为执行中且进度为0，或者状态为未执行，则开始执行
            if (firstStep && (firstStep.status === 1 || firstStep.status === 0)) {
                hasStartedRef.current = true
                // 如果状态为未执行，先更新为执行中
                if (firstStep.status === 0) {
                    setFlowDetail(prev => {
                        if (!prev) return prev
                        const updatedSteps = [...prev.steps]
                        const firstStepData = updatedSteps[0]
                        if (firstStepData) {
                            updatedSteps[0] = {
                                ...firstStepData,
                                stepIndex: firstStepData.stepIndex ?? 0,
                                status: 1,
                                startTime: new Date().toLocaleString('zh-CN'),
                            }
                        }
                        // 更新主流程状态为执行中
                        const newStatus = prev.status === 0 ? 1 : prev.status
                        // 更新执行历史状态为 running
                        if (prev.status === 0) {
                            updateExecutionHistory('running')
                        }
                        return { ...prev, status: newStatus, steps: updatedSteps }
                    })
                }
                // 延迟一下再执行，确保状态更新完成
                setTimeout(() => {
                    executeStep(0)
                }, 100)
            }
        }
    }, [flowDetail, executeStep, updateExecutionHistory])

    // 清理定时器
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

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

    // 获取当前步骤索引（用于 Steps 组件的 current 属性）
    const getCurrentStep = useMemo(() => {
        if (!flowDetail || !flowDetail.steps.length) return 0
        
        // 查找第一个执行中的步骤
        const executingIndex = flowDetail.steps.findIndex(step => step.status === 1)
        if (executingIndex >= 0) {
            return executingIndex
        }
        
        // 如果没有执行中的步骤，查找最后一个已完成的步骤
        let lastCompletedIndex = -1
        for (let i = flowDetail.steps.length - 1; i >= 0; i--) {
            const step = flowDetail.steps[i]
            if (step && step.status === 2) {
                lastCompletedIndex = i
                break
            }
        }
        
        // 如果找到了已完成的步骤，返回下一个步骤的索引（如果存在）
        if (lastCompletedIndex >= 0) {
            return lastCompletedIndex < flowDetail.steps.length - 1 
                ? lastCompletedIndex + 1 
                : flowDetail.steps.length
        }
        
        // 如果都没有，返回 0（第一个步骤）
        return 0
    }, [flowDetail])
    
    // 获取步骤的状态（用于 Steps 组件的 status 属性）
    const getStepStatus = (stepStatus: QCStepStatus): 'wait' | 'process' | 'finish' | 'error' => {
        switch (stepStatus.status) {
            case 0: // 未执行
                return 'wait'
            case 1: // 执行中
                return 'process'
            case 2: // 已完成
                return 'finish'
            case 5: // 失败
                return 'error'
            case 4: // 跳过
            default:
                return 'wait'
        }
    }
    
    // 获取状态标签
    const getStatusTag = (status: number) => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0]
        return <Tag color={config.color}>{config.text}</Tag>
    }
    
    // 获取状态文本（用于显示）
    const getStatusText = (status: number): string => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0]
        return config.text
    }
    
    // 格式化百分比，最多显示两位小数
    const formatPercentage = (value: number): string => {
        // 保留两位小数，去除末尾的0和小数点
        const formatted = value.toFixed(2)
        // 移除末尾的0和小数点（如果小数部分全为0）
        const cleaned = formatted.replace(/\.?0+$/, '')
        return cleaned + '%'
    }

    // 计算是否全部步骤已完成
    const isFlowCompleted = useMemo(() => {
        return flowDetail?.status === 2 || flowDetail?.steps.every(step => step.status === 2)
    }, [flowDetail])

    // 渲染进度条
    const renderProgressBar = (step: QCStepStatus) => {
        if ([2, 4, 5].includes(step.status)) {
            return null
        }

        if (!step.completedQuantity || !step.totalQuantity) return null

        const percentage = (step.completedQuantity / step.totalQuantity) * 100
        const percentageRounded = Math.round(percentage * 100) / 100 // 保留两位小数并四舍五入
        // 进度条前面的数字取整数
        const completedInt = Math.round(step.completedQuantity)
        const totalInt = Math.round(step.totalQuantity)

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
                    percent={percentageRounded}
                    size='small'
                    status={percentageRounded >= 100 ? 'success' : 'active'}
                    showInfo={false}
                    style={{ width: 250 }}
                />
                <Text type='secondary' style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {completedInt}/{totalInt} ({formatPercentage(percentage)})
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
                    current={getCurrentStep}
                    direction='vertical'
                    size='small'
                    style={{ marginBottom: 24 }}
                >
                    {executionSteps.map((step, index) => {
                        const stepStatus = flowDetail.steps[index]
                        if (!stepStatus) return null

                        const stepStatusType = getStepStatus(stepStatus)
                        const statusText = getStatusText(stepStatus.status)

                        return (
                            <Step
                                key={index}
                                status={stepStatusType}
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{step.title}</span>
                                        {getStatusTag(stepStatus.status)}
                                    </div>
                                }
                                description={
                                    <div>
                                        <div style={{ marginBottom: 8 }}>
                                            <Text type='secondary'>{step.description}</Text>
                                        </div>
                                        
                                        {/* 状态信息 */}
                                        <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                                            <div>
                                                <Text strong>状态：</Text>
                                                <Text style={{ marginLeft: 4 }}>{statusText}</Text>
                                            </div>
                                            {stepStatus.startTime && (
                                                <div>
                                                    <Text strong>开始时间：</Text>
                                                    <Text style={{ marginLeft: 4 }}>{stepStatus.startTime}</Text>
                                                </div>
                                            )}
                                            {stepStatus.endTime && (
                                                <div>
                                                    <Text strong>结束时间：</Text>
                                                    <Text style={{ marginLeft: 4 }}>{stepStatus.endTime}</Text>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* 进度条展示 */}
                                        {renderProgressBar(stepStatus)}

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
                width={700}
            >
                {selectedStepResult && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>步骤名称：</Text>
                            <Text>{selectedStepResult.title}</Text>
                        </div>
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>执行结果：</Text>
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: 16,
                                    background: '#f5f5f5',
                                    borderRadius: 4,
                                    border: '1px solid #d9d9d9',
                                    whiteSpace: 'pre-line',
                                    fontFamily: 'monospace',
                                    fontSize: 13,
                                    lineHeight: 1.8,
                                }}
                            >
                                <Text>{selectedStepResult.resultSummary || '暂无执行结果'}</Text>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default QualityControlFlowDetail

