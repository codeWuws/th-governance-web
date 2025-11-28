import { SafetyCertificateOutlined, FileTextOutlined, BarChartOutlined, PieChartOutlined, LinkOutlined, HeartOutlined } from '@ant-design/icons'
import { Alert, Card, Tabs, Typography } from 'antd'
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
    const visibleTabs = useMemo(
        () => ['reliability', 'timeliness', 'completeness', 'consistency', 'accuracy'],
        []
    )
    const validTabs = useMemo(
        () => new Set(['reliability', 'timeliness', 'completeness', 'consistency', 'accuracy']),
        []
    )
    const [activeKey, setActiveKey] = useState<string>(
        validTabs.has(tabParam) ? tabParam : (visibleTabs[0] || 'reliability')
    )

    const renderTabContent = (k: string) => {
        if (k === 'reliability') return <TextQualityControl />
        if (k === 'timeliness') return <ComprehensiveQualityControl />
        if (k === 'completeness') return <CompletenessQualityControl />
        if (k === 'consistency') return <BasicMedicalLogicQualityControl />
        return <CoreDataQualityControl />
    }

    useEffect(() => {
        if (validTabs.has(tabParam) && tabParam !== activeKey) {
            setActiveKey(tabParam)
        }
    }, [tabParam, validTabs, activeKey])

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
        </div>
    )
}

export default IntegratedQualityControlManagement