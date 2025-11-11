import { FileTextOutlined, InboxOutlined, TableOutlined, UploadOutlined } from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Select,
    Space,
    Table,
    Typography,
    Upload,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd/es/upload'
import React, { useState } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'

const { Title, Text } = Typography
const { TextArea } = Input
const { Dragger } = Upload

interface QualityResult {
    key: string
    field: string
    issue: string
    severity: 'high' | 'medium' | 'low'
    suggestion: string
}

interface TextQualityFormValues {
    targetTable: string
    textContent: string
}

const TextQualityControl: React.FC = () => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [qualityResults, setQualityResults] = useState<QualityResult[]>([])

    // 模拟表选项
    const tableOptions = [
        { label: '患者基本信息表', value: 'patient_info' },
        { label: '诊断信息表', value: 'diagnosis_info' },
        { label: '检查报告表', value: 'examination_report' },
        { label: '用药记录表', value: 'medication_record' },
        { label: '手术记录表', value: 'surgery_record' },
    ]

    // 文件上传配置
    const uploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        accept: '.txt,.doc,.docx,.pdf',
        beforeUpload: file => {
            const isValidType =
                file.type === 'text/plain' ||
                file.type === 'application/msword' ||
                file.type ===
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'application/pdf'
            if (!isValidType) {
                uiMessage.error('只支持 TXT、DOC、DOCX、PDF 格式的文件！')
                return false
            }
            const isLt10M = file.size / 1024 / 1024 < 10
            if (!isLt10M) {
                uiMessage.error('文件大小不能超过 10MB！')
                return false
            }
            return false // 阻止自动上传
        },
        onChange: info => {
            const { status } = info.file
            if (status === 'done') {
                uiMessage.success(`${info.file.name} 文件上传成功`)
            } else if (status === 'error') {
                uiMessage.error(`${info.file.name} 文件上传失败`)
            }
        },
    }

    // 执行质控检查
    const handleQualityCheck = async (_values: TextQualityFormValues) => {
        setLoading(true)
        try {
            // 模拟质控检查过程
            await new Promise(resolve => setTimeout(resolve, 2000))

            // 模拟质控结果
            const mockResults: QualityResult[] = [
                {
                    key: '1',
                    field: '患者姓名',
                    issue: '存在特殊字符',
                    severity: 'medium',
                    suggestion: '建议清理特殊字符，保持姓名格式统一',
                },
                {
                    key: '2',
                    field: '诊断描述',
                    issue: '文本长度超出标准范围',
                    severity: 'low',
                    suggestion: '建议控制诊断描述在500字符以内',
                },
                {
                    key: '3',
                    field: '医生签名',
                    issue: '缺少必要信息',
                    severity: 'high',
                    suggestion: '医生签名字段不能为空，需要完善',
                },
            ]

            setQualityResults(mockResults)
            uiMessage.success('文本质控检查完成！')
        } catch (error) {
            logger.error('质控检查失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('质控检查失败，请重试')
        } finally {
            setLoading(false)
        }
    }

    // 质控结果表格列配置
    const columns: ColumnsType<QualityResult> = [
        {
            title: '字段名称',
            dataIndex: 'field',
            key: 'field',
            width: 120,
        },
        {
            title: '问题描述',
            dataIndex: 'issue',
            key: 'issue',
            width: 200,
        },
        {
            title: '严重程度',
            dataIndex: 'severity',
            key: 'severity',
            width: 100,
            render: (severity: string) => {
                const severityConfig = {
                    high: { color: '#ff4d4f', text: '高' },
                    medium: { color: '#faad14', text: '中' },
                    low: { color: '#52c41a', text: '低' },
                }
                const config = severityConfig[severity as keyof typeof severityConfig]
                return (
                    <span style={{ color: config.color, fontWeight: 'bold' }}>{config.text}</span>
                )
            },
        },
        {
            title: '建议处理',
            dataIndex: 'suggestion',
            key: 'suggestion',
        },
    ]

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
                    <FileTextOutlined style={{ marginRight: 8 }} />
                    文本质控
                </Title>
            </div>

            {/* 信息提示 */}
            <Alert
                message='文本质控功能'
                description='上传文本文件并选择对应的数据表，系统将自动检查文本数据的质量问题，包括格式规范、内容完整性、字符合规性等。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Row gutter={[16, 16]}>
                {/* 左侧：质控配置 */}
                <Col xs={24} lg={10}>
                    <Card
                        title={
                            <>
                                <TableOutlined style={{ marginRight: 8 }} />
                                质控配置
                            </>
                        }
                    >
                        <Form form={form} layout='vertical' onFinish={handleQualityCheck}>
                            <Form.Item
                                label='选择数据表'
                                name='targetTable'
                                rules={[{ required: true, message: '请选择目标数据表' }]}
                            >
                                <Select
                                    placeholder='请选择要进行质控的数据表'
                                    options={tableOptions}
                                    size='large'
                                />
                            </Form.Item>

                            <Form.Item
                                label='文本内容'
                                name='textContent'
                                rules={[{ required: true, message: '请输入文本内容或上传文件' }]}
                            >
                                <TextArea
                                    rows={6}
                                    placeholder='请输入要检查的文本内容，或通过下方上传文件...'
                                />
                            </Form.Item>

                            <Form.Item label='文件上传'>
                                <Dragger {...uploadProps}>
                                    <p className='ant-upload-drag-icon'>
                                        <InboxOutlined />
                                    </p>
                                    <p className='ant-upload-text'>点击或拖拽文件到此区域上传</p>
                                    <p className='ant-upload-hint'>
                                        支持 TXT、DOC、DOCX、PDF 格式，文件大小不超过 10MB
                                    </p>
                                </Dragger>
                            </Form.Item>

                            <Form.Item>
                                <Space>
                                    <Button
                                        type='primary'
                                        htmlType='submit'
                                        loading={loading}
                                        icon={<UploadOutlined />}
                                        size='large'
                                    >
                                        开始质控检查
                                    </Button>
                                    <Button size='large' onClick={() => form.resetFields()}>
                                        重置
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                {/* 右侧：质控结果 */}
                <Col xs={24} lg={14}>
                    <Card
                        title={
                            <>
                                <FileTextOutlined style={{ marginRight: 8 }} />
                                质控结果
                            </>
                        }
                        extra={
                            qualityResults.length > 0 && (
                                <Text type='secondary'>共发现 {qualityResults.length} 个问题</Text>
                            )
                        }
                    >
                        {qualityResults.length > 0 ? (
                            <Table
                                columns={columns}
                                dataSource={qualityResults}
                                pagination={false}
                                size='middle'
                                scroll={{ x: 600 }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                                <div>暂无质控结果</div>
                                <div style={{ fontSize: 12, marginTop: 8 }}>
                                    请先配置质控参数并执行检查
                                </div>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default TextQualityControl
