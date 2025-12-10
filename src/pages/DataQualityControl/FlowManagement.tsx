import {
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    BarChartOutlined,
    PieChartOutlined,
    LinkOutlined,
    HeartOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Col, Row, Space, Spin, Statistic, Typography, Tag } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import styles from './FlowManagement.module.scss'
import { uiMessage } from '../../utils/uiMessage'
import { dataQualityControlService } from '../../services/dataQualityControlService'
import { logger } from '../../utils/logger'
import type { QCTaskConfigItem } from '../../types'
import { showDialog } from '../../utils/showDialog'
import StartQCProcessDialog from './components/StartQCProcessDialog'

const { Title, Text } = Typography

type QcTypeOption = { label: string; value: string; description: string; icon?: React.ReactNode; enabled: boolean }

// nodeType 到 value 的映射（用于兼容现有流程）
const NODE_TYPE_TO_VALUE_MAP: Record<string, string> = {
    TimelinessQC: 'comprehensive',
    CompletenessQC: 'completeness',
    ConsistencyQC: 'basic-medical-logic',
    AccuracyQC: 'core-data',
}

// nodeType 到图标的映射
const NODE_TYPE_ICON_MAP: Record<string, React.ReactNode> = {
    TimelinessQC: <BarChartOutlined />,
    CompletenessQC: <PieChartOutlined />,
    ConsistencyQC: <LinkOutlined />,
    AccuracyQC: <HeartOutlined />,
}

const MAX_SELECT = 4

const FlowManagement: React.FC = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [qcConfigList, setQcConfigList] = useState<QCTaskConfigItem[]>([])

    // 从接口获取质控配置列表
    useEffect(() => {
        const fetchQcConfigList = async () => {
            try {
                setLoading(true)
                const response = await dataQualityControlService.getQCTaskConfigList()
                if (response.code === 200) {
                    setQcConfigList(response.data || [])
                    logger.info('成功获取质控任务配置列表', response.data)
                } else {
                    uiMessage.error(response.msg || '获取质控配置列表失败')
                    logger.error('获取质控配置列表失败', response.msg)
                }
            } catch (error) {
                logger.error('获取质控配置列表异常', error as Error)
                uiMessage.error('获取质控配置列表失败，请稍后重试')
            } finally {
                setLoading(false)
            }
        }
        fetchQcConfigList()
    }, [])

    // 将接口数据转换为选项格式
    const qcOptions = useMemo((): QcTypeOption[] => {
        return qcConfigList.filter(item => ['TimelinessQC', 'CompletenessQC', 'ConsistencyQC', 'AccuracyQC'].includes(item.nodeType))
            .sort((a, b) => a.nodeStep - b.nodeStep) // 按步骤排序
            .map(item => ({
                label: item.nodeName,
                value: NODE_TYPE_TO_VALUE_MAP[item.nodeType] || item.nodeType,
                description: item.descript,
                icon: NODE_TYPE_ICON_MAP[item.nodeType] || <CheckCircleOutlined />,
                enabled: item.enabled,
            }))
    }, [qcConfigList])

    const selectedLabels = useMemo(() => {
        const map = new Map(qcOptions.map(o => [o.value, o.label]))
        return selectedTypes.map(v => map.get(v) || v)
    }, [selectedTypes, qcOptions])

    const handleStart = async () => {
        if (!selectedTypes.length) {
            uiMessage.warning('请至少选择一个质控类型')
            return
        }
        if (selectedTypes.length > MAX_SELECT) {
            uiMessage.error(`最多可选择 ${MAX_SELECT} 个质控类型`)
            return
        }

        // 将 selectedTypes（映射后的值）转换为原始的 nodeType 数组
        const selectedNodeTypes = selectedTypes.map(value => {
            // 从 qcConfigList 中找到对应的 nodeType
            const config = qcConfigList.find(item => 
                (NODE_TYPE_TO_VALUE_MAP[item.nodeType] || item.nodeType) === value
            )
            return config?.nodeType || value
        })

        try {
            const result = await showDialog(StartQCProcessDialog, {
                title: '启动质控流程',
                selectedTypes: selectedNodeTypes, // 传递原始的 nodeType 数组
                onStartSuccess: (taskId: string, processName: string) => {
                    // 保存到历史记录
                    const historyItem = {
                        id: taskId,
                        name: processName,
                        types: selectedTypes,
                        status: 'starting',
                        start_time: Date.now(),
                        end_time: null as number | null,
                    }

                    const key = 'qcExecutionHistory'
                    const prev = localStorage.getItem(key)
                    const list = prev ? JSON.parse(prev) : []
                    list.unshift(historyItem)
                    localStorage.setItem(key, JSON.stringify(list))

                    uiMessage.success('质控流程已启动并记录历史')

                    // 导航到流程详情页
                    const typesParam = selectedTypes.join(',')
                    navigate(
                        `/data-quality-control/flow/${taskId}?types=${encodeURIComponent(typesParam)}&name=${encodeURIComponent(processName)}`
                    )
                },
            })

            if (result) {
                logger.info('用户确认启动质控流程')
            } else {
                logger.info('用户取消启动质控流程')
            }
        } catch (error) {
            logger.error('启动质控流程失败:', error as Error)
            uiMessage.error('启动流程失败，请稍后重试')
        }
    }

    const toggleType = (value: string) => {
        const option = qcOptions.find(opt => opt.value === value)
        if (!option) return
        
        // 如果选项被禁用，不允许选择
        if (!option.enabled) {
            uiMessage.warning(`${option.label} 当前未启用，无法选择`)
            return
        }
        
        setSelectedTypes(prev => {
            if (prev.includes(value)) return prev.filter(v => v !== value)
            if (prev.length >= MAX_SELECT) {
                uiMessage.warning(`最多可选择 ${MAX_SELECT} 项`)
                return prev
            }
            return [...prev, value]
        })
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.header}>
                <Title level={2} style={{ margin: 0 }}>
                    <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                    质控流程管理
                </Title>
            </div>

            <div className={styles.subHeader}>以左侧菜单的质控类型为基准动态生成目录</div>

            <Alert
                message='请选择需要参与流程的质控类型，最多可多选四项。点击启动后将进入流程执行页面，实时查看进度与日志。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            <div className={styles.grid}>
                <div className={styles.panel}>
                    <Spin spinning={loading}>
                        <div className={styles.optionsGrid}>
                            {qcOptions.length > 0 ? (
                                qcOptions.map(opt => {
                                    const selected = selectedTypes.includes(opt.value)
                                    const isDisabled = !opt.enabled
                                    return (
                                        <div
                                            key={opt.value}
                                            className={`${styles.optionCard} ${selected ? styles.optionSelected : ''} ${isDisabled ? styles.optionDisabled : ''}`}
                                            onClick={() => !isDisabled && toggleType(opt.value)}
                                            style={{
                                                opacity: isDisabled ? 0.6 : 1,
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            <div className={styles.optionHeader}>
                                                {opt.icon || (
                                                    <CheckCircleOutlined style={{ color: '#0ea5e9' }} />
                                                )}
                                                <span className={styles.optionTitle}>{opt.label}</span>
                                                <div style={{ flex: 1 }} />
                                                {isDisabled && (
                                                    <Tag color='default' size='small'>未启用</Tag>
                                                )}
                                                {selected && !isDisabled && (
                                                    <span className={styles.selectedBadge}>已选择</span>
                                                )}
                                            </div>
                                            <div className={styles.optionDesc}>{opt.description}</div>
                                        </div>
                                    )
                                })
                            ) : (
                                !loading && (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                        <Text type='secondary'>暂无质控类型配置</Text>
                                    </div>
                                )
                            )}
                        </div>
                    </Spin>
                </div>
                <div className={styles.panel}>
                    <Space direction='vertical' style={{ width: '100%' }}>
                        <Card className={styles.selectorBox}>
                            <Space size={24} wrap>
                                <Statistic
                                    title='已选择'
                                    value={selectedTypes.length}
                                    suffix={`/${MAX_SELECT}`}
                                />
                                <div className={styles.tagList}>
                                    {selectedLabels.length ? (
                                        selectedLabels.map(t => (
                                            <Tag key={t} color='geekblue'>
                                                {t}
                                            </Tag>
                                        ))
                                    ) : (
                                        <Text type='secondary'>未选择</Text>
                                    )}
                                </div>
                            </Space>
                            <div className={styles.help}>
                                <div className={styles.helpTitle}>执行说明</div>
                                <div className={styles.helpList}>
                                    <Text>• 包含数据预检查、队列调度与实时进度记录</Text>
                                    <Text>• 最多选择4个质控类型，支持顺序执行与状态回写</Text>
                                    <Text>• 执行历史将保留在「质控执行历史」，可随时查看详情</Text>
                                    <Text>• 建议在非高峰时段启动，以减少资源冲突</Text>
                                </div>
                            </div>
                            <div className={styles.actions}>
                                <Button
                                    type='primary'
                                    onClick={handleStart}
                                    disabled={!selectedTypes.length}
                                >
                                    启动质控流程
                                </Button>
                            </div>
                        </Card>
                    </Space>
                </div>
            </div>
        </div>
    )
}

export default FlowManagement
