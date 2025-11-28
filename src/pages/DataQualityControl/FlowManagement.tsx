import {
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    BarChartOutlined,
    PieChartOutlined,
    LinkOutlined,
    HeartOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Col, Row, Space, Statistic, Typography, Tag } from 'antd'
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import styles from './FlowManagement.module.scss'
import { uiMessage } from '../../utils/uiMessage'

const { Title, Text } = Typography

type QcTypeOption = { label: string; value: string; description: string; icon?: React.ReactNode }

const deriveQcOptions = (): QcTypeOption[] => {
    return [
        {
            label: '及时性质控',
            value: 'comprehensive',
            description:
                '关注数据时效与更新延迟、准点率与管道稳定性，支持结果解析与指标统计。',
            icon: <BarChartOutlined />,
        },
        {
            label: '完整性质控',
            value: 'completeness',
            description:
                '针对表与字段的填充率进行检查，识别空值与缺失数据，输出表级与字段级完整性分析。',
            icon: <PieChartOutlined />,
        },
        {
            label: '一致性质控',
            value: 'basic-medical-logic',
            description:
                '一致性校验，包含主附表关联与基础规则（时间、年龄、性别等）。',
            icon: <LinkOutlined />,
        },
        {
            label: '准确性质控',
            value: 'core-data',
            description:
                '开展核心医疗数据的准确性评估，包含编码规范、字段值校验与对比分析。',
            icon: <HeartOutlined />,
        },
    ]
}

const MAX_SELECT = 4

const FlowManagement: React.FC = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [starting, setStarting] = useState(false)
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])

    const qcOptions = useMemo(deriveQcOptions, [])

    const selectedLabels = useMemo(() => {
        const map = new Map(qcOptions.map(o => [o.value, o.label]))
        return selectedTypes.map(v => map.get(v) || v)
    }, [selectedTypes])

    const handleStart = async () => {
        if (!selectedTypes.length) {
            uiMessage.warning('请至少选择一个质控类型')
            return
        }
        if (selectedTypes.length > MAX_SELECT) {
            uiMessage.error(`最多可选择 ${MAX_SELECT} 个质控类型`)
            return
        }
        setStarting(true)
        try {
            const taskId =
                (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
                `${Date.now()}-${Math.random().toString(16).slice(2)}`

            const historyItem = {
                id: taskId,
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

            const typesParam = selectedTypes.join(',')
            navigate(
                `/data-quality-control/flow/${taskId}?types=${encodeURIComponent(typesParam)}`
            )
        } catch (e) {
            uiMessage.error('启动流程失败，请稍后重试')
        } finally {
            setStarting(false)
        }
    }

    const toggleType = (value: string) => {
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
                    <div className={styles.optionsGrid}>
                        {qcOptions.map(opt => {
                            const selected = selectedTypes.includes(opt.value)
                            return (
                                <div
                                    key={opt.value}
                                    className={`${styles.optionCard} ${selected ? styles.optionSelected : ''}`}
                                    onClick={() => toggleType(opt.value)}
                                >
                                    <div className={styles.optionHeader}>
                                        {opt.icon || (
                                            <CheckCircleOutlined style={{ color: '#0ea5e9' }} />
                                        )}
                                        <span className={styles.optionTitle}>{opt.label}</span>
                                        <div style={{ flex: 1 }} />
                                        {selected && (
                                            <span className={styles.selectedBadge}>已选择</span>
                                        )}
                                    </div>
                                    <div className={styles.optionDesc}>{opt.description}</div>
                                </div>
                            )
                        })}
                    </div>
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
                                    loading={starting}
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
