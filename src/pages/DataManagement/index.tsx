import React from 'react'
import { Card, Row, Col, Typography, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
    DatabaseOutlined,
    FileTextOutlined,
    LinkOutlined,
    KeyOutlined,
    MergeCellsOutlined,
    ToolOutlined,
    SafetyCertificateOutlined,
    BarChartOutlined,
} from '@ant-design/icons'

const { Title, Paragraph } = Typography

const DataManagement: React.FC = () => {
    const navigate = useNavigate()

    const modules = [
        {
            key: 'metadata',
            title: '元数据管理',
            description: '对元数据进行管理，包括数据源、表结构、字段定义等信息的维护',
            icon: <DatabaseOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
            path: '/data-management/metadata',
        },
        {
            key: 'standards',
            title: '数据标准管理',
            description: '制定和维护数据标准，确保数据的一致性和规范性',
            icon: <FileTextOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
            path: '/data-management/standards',
        },
        {
            key: 'relationships',
            title: '表关联关系管理',
            description: '管理表与表之间的关联关系，支持复杂的数据模型定义',
            icon: <LinkOutlined style={{ fontSize: '48px', color: '#faad14' }} />,
            path: '/data-management/relationships',
        },
        {
            key: 'index-rules',
            title: '主索引生成规则',
            description: '配置主索引生成规则，确保数据的唯一性和可识别性',
            icon: <KeyOutlined style={{ fontSize: '48px', color: '#f5222d' }} />,
            path: '/data-management/index-rules',
        },
        {
            key: 'merge-rules',
            title: '主索引合并规则',
            description: '管理不同患者主索引的合并和拆分规则，支持复杂的身份识别',
            icon: <MergeCellsOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
            path: '/data-management/merge-rules',
        },
        {
            key: 'index-processing',
            title: '主索引处理管理',
            description: '支持手工进行主索引规则处理，提供灵活的数据管理功能',
            icon: <ToolOutlined style={{ fontSize: '48px', color: '#13c2c2' }} />,
            path: '/data-management/index-processing',
        },
        {
            key: 'quality-control',
            title: '数据质控',
            description: '支撑数据质量评估逻辑，提供全面的数据质量监控',
            icon: <SafetyCertificateOutlined style={{ fontSize: '48px', color: '#eb2f96' }} />,
            path: '/data-management/quality-control',
        },
        {
            key: 'quality-assessment',
            title: '数据质量评估',
            description: '对电子病历数据进行标注和质量评估，确保数据准确性',
            icon: <BarChartOutlined style={{ fontSize: '48px', color: '#fa8c16' }} />,
            path: '/data-management/quality-assessment',
        },
    ]

    const handleModuleClick = (path: string) => {
        navigate(path)
    }

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>数据管理</Title>
                <Paragraph type='secondary'>
                    提供基本的清洗、转换、融合能力，包含元数据管理、标准管理、表关联关系管理、主索引管理等支撑模块，制定数据标准，提高数据治理质量和效率，实现数据治理全流程管控。
                </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
                {modules.map(module => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={module.key}>
                        <Card
                            hoverable
                            style={{ height: '100%' }}
                            onClick={() => handleModuleClick(module.path)}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                {module.icon}
                            </div>
                            <h3 style={{ textAlign: 'center', marginBottom: '12px' }}>
                                {module.title}
                            </h3>
                            <Paragraph
                                ellipsis={{ rows: 2 }}
                                style={{ textAlign: 'center', marginBottom: '16px' }}
                            >
                                {module.description}
                            </Paragraph>
                            <div style={{ textAlign: 'center' }}>
                                <Button
                                    type='primary'
                                    onClick={e => {
                                        e.stopPropagation()
                                        handleModuleClick(module.path)
                                    }}
                                >
                                    进入模块
                                </Button>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    )
}

export default DataManagement
