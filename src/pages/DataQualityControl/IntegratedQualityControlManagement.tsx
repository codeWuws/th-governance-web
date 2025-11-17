import { SafetyCertificateOutlined, FileTextOutlined, BarChartOutlined, PieChartOutlined, LinkOutlined, HeartOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Space, Steps, Tabs, Typography } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TextQualityControl from './TextQualityControl'
import ComprehensiveQualityControl from './ComprehensiveQualityControl'
import CompletenessQualityControl from './CompletenessQualityControl'
import BasicMedicalLogicQualityControl from './BasicMedicalLogicQualityControl'
import CoreDataQualityControl from './CoreDataQualityControl'

const { Title } = Typography
const { TabPane } = Tabs

const IntegratedQualityControlManagement: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const tabParam = searchParams.get('tab') || ''
    const typesParamStr = searchParams.get('types') || ''
    const autoParamStr = searchParams.get('autoflow') || ''
    const typesParam = useMemo(() => typesParamStr.split(',').filter(Boolean), [typesParamStr])
    const autoSet = useMemo(
        () => new Set(autoParamStr.split(',').filter(Boolean)),
        [autoParamStr]
    )
    const fromFlowManagement = typesParam.length > 0
    const typeToTab: Record<string, string> = {
        text: 'reliability',
        comprehensive: 'timeliness',
        completeness: 'completeness',
        'basic-medical-logic': 'consistency',
        'core-data': 'accuracy',
    }
    const typeToLabel: Record<string, string> = {
        text: '可靠性质控',
        comprehensive: '及时性质控',
        completeness: '完整性质控',
        'basic-medical-logic': '一致性质控',
        'core-data': '准确性质控',
    }
    const renderTabContent = (k: string) => {
        const current = steps[currentStep]
        const autoStart = running && current && current.key === k && current.auto
        const onAutoDone = () => setCurrentStep(prev => prev + 1)
        if (k === 'reliability') return <TextQualityControl />
        if (k === 'timeliness')
            return (
                <ComprehensiveQualityControl autoStart={autoStart} onAutoDone={onAutoDone} />
            )
        if (k === 'completeness')
            return (
                <CompletenessQualityControl autoStart={autoStart} onAutoDone={onAutoDone} />
            )
        if (k === 'consistency')
            return (
                <BasicMedicalLogicQualityControl autoStart={autoStart} onAutoDone={onAutoDone} />
            )
        return <CoreDataQualityControl autoStart={autoStart} onAutoDone={onAutoDone} />
    }
    const selectedTabKeys = useMemo(
        () => typesParam.map(t => typeToTab[t]).filter((k): k is string => !!k),
        [typesParam]
    )
    const visibleTabs = useMemo(
        () =>
            selectedTabKeys.length
                ? selectedTabKeys
                : ['reliability', 'timeliness', 'completeness', 'consistency', 'accuracy'],
        [selectedTabKeys]
    )
    const validTabs = useMemo(
        () => new Set(['reliability', 'timeliness', 'completeness', 'consistency', 'accuracy']),
        []
    )
    const [activeKey, setActiveKey] = useState<string>(
        validTabs.has(tabParam) ? tabParam : visibleTabs[0]
    )
    const [currentStep, setCurrentStep] = useState<number>(0)
    const [running, setRunning] = useState<boolean>(false)
    const steps = useMemo(
        () =>
            fromFlowManagement
                ? visibleTabs.map(k => ({
                      title:
                          typeToLabel[
                              Object.keys(typeToTab).find(t => typeToTab[t] === k) || 'text'
                          ] || '质控',
                      key: k,
                      auto: autoSet.has(
                          Object.keys(typeToTab).find(t => typeToTab[t] === k) || ''
                      ),
                  }))
                : [],
        [visibleTabs, autoSet, fromFlowManagement]
    )

    useEffect(() => {
        if (validTabs.has(tabParam) && tabParam !== activeKey) {
            setActiveKey(tabParam)
        }
    }, [tabParam, validTabs])

    useEffect(() => {
        if (!fromFlowManagement) return
        if (steps.length) {
            setRunning(true)
            setCurrentStep(0)
        }
    }, [steps, fromFlowManagement])

    useEffect(() => {
        if (!running) return
        const step = steps[currentStep]
        if (!step) {
            setRunning(false)
            return
        }
        setActiveKey(step.key)
    }, [running, currentStep, steps])

    const onTabChange = (key: string) => {
        setActiveKey(key)
        const next = new URLSearchParams(searchParams)
        next.set('tab', key)
        setSearchParams(next)
    }

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                    综合质控管理
                </Title>
            </div>

            <Alert
                message='综合质控管理'
                description='以标签页整合可靠性、及时性、完整性、一致性、准确性质控，保持原有交互与布局不变。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            {fromFlowManagement ? (
                <Space direction='vertical' style={{ width: '100%' }} size={16}>
                    <Card>
                        <Steps current={currentStep} items={steps.map(s => ({ title: s.title }))} />
                        <div style={{ marginTop: 16 }}>
                            <Space>
                                <Button
                                    type='primary'
                                    onClick={() => {
                                        if (!running) setRunning(true)
                                        else setCurrentStep(prev => prev + 1)
                                    }}
                                >
                                    {running ? '下一步' : '开始执行'}
                                </Button>
                                <Button onClick={() => setRunning(false)}>暂停</Button>
                            </Space>
                        </div>
                    </Card>
                    <Card>
                        <Tabs activeKey={activeKey} onChange={onTabChange}>
                            {visibleTabs.map(k => (
                                <TabPane key={k} tab={
                                    k === 'reliability' ? (
                                        <span><FileTextOutlined /> 可靠性质控</span>
                                    ) : k === 'timeliness' ? (
                                        <span><BarChartOutlined /> 及时性质控</span>
                                    ) : k === 'completeness' ? (
                                        <span><PieChartOutlined /> 完整性质控</span>
                                    ) : k === 'consistency' ? (
                                        <span><LinkOutlined /> 一致性质控</span>
                                    ) : (
                                        <span><HeartOutlined /> 准确性质控</span>
                                    )
                                }>
                                    {renderTabContent(k)}
                                </TabPane>
                            ))}
                        </Tabs>
                    </Card>
                </Space>
            ) : (
                <Card>
                    <Tabs activeKey={activeKey} onChange={onTabChange}>
                        {visibleTabs.map(k => (
                            <TabPane key={k} tab={
                                k === 'reliability' ? (
                                    <span><FileTextOutlined /> 可靠性质控</span>
                                ) : k === 'timeliness' ? (
                                    <span><BarChartOutlined /> 及时性质控</span>
                                ) : k === 'completeness' ? (
                                    <span><PieChartOutlined /> 完整性质控</span>
                                ) : k === 'consistency' ? (
                                    <span><LinkOutlined /> 一致性质控</span>
                                ) : (
                                    <span><HeartOutlined /> 准确性质控</span>
                                )
                            }>
                                {renderTabContent(k)}
                            </TabPane>
                        ))}
                    </Tabs>
                </Card>
            )}
        </div>
    )
}

export default IntegratedQualityControlManagement