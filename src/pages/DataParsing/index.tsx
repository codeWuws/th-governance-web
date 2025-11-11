import React from 'react'
import { Card, Row, Col, Typography, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
    TagOutlined,
    FileTextOutlined,
    RobotOutlined,
    ApiOutlined,
    DatabaseOutlined,
    BarChartOutlined,
} from '@ant-design/icons'

const { Title, Paragraph } = Typography

const DataParsing: React.FC = () => {
    const navigate = useNavigate()

    const modules = [
        {
            key: 'data-annotation',
            title: '数据标注',
            description:
                '对于电子病历数据进行标注，支持多种标注类型和批量处理功能，提高标注效率和准确性',
            icon: <TagOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
            path: '/data-parsing/data-annotation',
        },
        {
            key: 'medical-record-parsing',
            title: '电子病历解析',
            description:
                '数据结构化解析，通过机器学习、模型训练、数据抽取、标引等过程，实现电子病历的自动化解析结构化',
            icon: <FileTextOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
            path: '/data-parsing/medical-record-parsing',
        },
    ]

    const features = [
        {
            icon: <RobotOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
            title: '机器学习',
            description: '采用先进的机器学习算法，自动识别和解析医疗数据',
        },
        {
            icon: <ApiOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />,
            title: '模型训练',
            description: '支持自定义模型训练，适应不同医疗机构的数据特点',
        },
        {
            icon: <DatabaseOutlined style={{ fontSize: '24px', color: '#13c2c2' }} />,
            title: '数据抽取',
            description: '高效抽取结构化数据，支持多种数据格式和源系统',
        },
        {
            icon: <BarChartOutlined style={{ fontSize: '24px', color: '#eb2f96' }} />,
            title: '智能标引',
            description: '自动化标引过程，提升数据处理的效率和准确率',
        },
    ]

    const handleModuleClick = (path: string) => {
        navigate(path)
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* 页面标题和描述 */}
            <div style={{ marginBottom: '32px' }}>
                <Title level={2}>数据解析</Title>
                <Paragraph type='secondary' style={{ fontSize: '16px' }}>
                    主要包含数据标注和电子病历解析，通过机器学习、模型训练、数据抽取、标引等过程，
                    实现电子病历的自动化解析，提升数据处理的效率、质量和准确率。
                </Paragraph>
            </div>

            {/* 核心功能特性 */}
            <div style={{ marginBottom: '32px' }}>
                <Title level={4} style={{ marginBottom: '16px' }}>
                    核心功能
                </Title>
                <Row gutter={[16, 16]}>
                    {features.map((feature, index) => (
                        <Col xs={24} sm={12} lg={6} key={index}>
                            <Card size='small' style={{ textAlign: 'center', height: '100%' }}>
                                <div style={{ marginBottom: '12px' }}>{feature.icon}</div>
                                <Title level={5} style={{ marginBottom: '8px', fontSize: '16px' }}>
                                    {feature.title}
                                </Title>
                                <Paragraph
                                    ellipsis={{ rows: 2 }}
                                    style={{ margin: 0, fontSize: '14px' }}
                                >
                                    {feature.description}
                                </Paragraph>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* 功能模块 */}
            <div>
                <Title level={4} style={{ marginBottom: '16px' }}>
                    功能模块
                </Title>
                <Row gutter={[24, 24]}>
                    {modules.map(module => (
                        <Col xs={24} sm={12} lg={12} key={module.key}>
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
                                    ellipsis={{ rows: 3 }}
                                    style={{ textAlign: 'center', marginBottom: '16px' }}
                                >
                                    {module.description}
                                </Paragraph>
                                <div style={{ textAlign: 'center' }}>
                                    <Button
                                        type='primary'
                                        size='large'
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
        </div>
    )
}

export default DataParsing
