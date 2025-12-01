import { FileTextOutlined, InboxOutlined, TableOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Form, Input, Row, Select, Space, Typography, Upload } from 'antd'
import type { UploadFile, UploadProps } from 'antd/es/upload'
import type { ColumnsType } from 'antd/es/table'
import React, { useState } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'

const { Title, Text, Paragraph } = Typography
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
    textContent?: string
    uploadFile?: UploadFile<any>[]
}

const TextQualityControl: React.FC = () => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [qualityText, setQualityText] = useState<string>('')
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('')
    const normFile = (e: any) => {
        if (Array.isArray(e)) return e
        return e?.fileList || []
    }

    // 模拟表选项
    const tableOptions = [
        { label: '患者基本信息表', value: 'patient_info' },
        { label: '诊断信息表', value: 'diagnosis_info' },
        { label: '检查报告表', value: 'examination_report' },
        { label: '用药记录表', value: 'medication_record' },
        { label: '手术信息表', value: 'surgery_record' },
    ]

    // 文件上传配置（支持文档与图片）
    const uploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        accept: '.txt,.doc,.docx,.pdf,.png,.jpg,.jpeg,.bmp,.tif,.tiff',
        listType: 'text',
        showUploadList: { showPreviewIcon: false },
        maxCount: 1,
        beforeUpload: file => {
            const isDoc =
                file.type === 'text/plain' ||
                file.type === 'application/msword' ||
                file.type ===
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'application/pdf'
            const isImage = file.type.startsWith('image/') ||
                ['image/tiff', 'image/bmp'].includes(file.type)
            if (!isDoc && !isImage) {
                uiMessage.error('仅支持文本/文档或图片格式（TXT/DOC/DOCX/PDF/PNG/JPG/JPEG/BMP/TIFF）')
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
            const fileList = info.fileList || []
            try {
                form.setFieldsValue({ uploadFile: fileList })
                form.validateFields(['uploadFile']).catch(() => {})
            } catch {}
            if (!fileList.length) setImagePreviewUrl('')
        },
        onPreview: async file => {
            try {
                const src = (file as any).thumbUrl || (file as any).url
                if (src) {
                    window.open(src, '_blank')
                    return
                }
                const f = file.originFileObj as File | undefined
                if (!f) return
                const reader = new FileReader()
                reader.onload = e => {
                    const result = e.target?.result as string
                    if (result) window.open(result, '_blank')
                }
                reader.readAsDataURL(f)
            } catch {}
        },
    }

    const extractTextFromImage = (file: File): Promise<string> => {
        return new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = () => {
                setTimeout(() => {
                    resolve('患者姓名: 张三\n诊断描述: 支气管炎\n医生签名: 缺失')
                }, 1200)
            }
            reader.readAsDataURL(file)
        })
    }

    const extractTextFromDoc = (file: File): Promise<string> => {
        return new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = () => {
                const content = '从文档提取的文本（示例）：\n患者姓名: 李四\n诊断描述: 肺炎\n医生签名: 王医生'
                resolve(content)
            }
            // 尝试以文本读取；实际项目可接入后端解析
            try {
                reader.readAsText(file)
            } catch {
                reader.readAsArrayBuffer(file)
            }
        })
    }

    const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = e => resolve((e.target?.result as string) || '')
            reader.readAsDataURL(file)
        })
    }

    const buildTextQualityOutput = (_text: string, table?: string): string => {
        if (table === 'surgery_record') {
            return (
                '经对手术信息表进行可靠性质控校验：病历摘要描述完整，手术前诊断为腰椎间盘突出（L3/4、L4/5、L5/S1），诊断依据MRI与体征一致；' +
                '病情评估稳定，手术指征明确；拟行手术为经皮椎间盘镜切除术，麻醉方式为局麻+镇静；' +
                '术前检验（Hb 153 g/L、APTT 30.1 s、HBsAg 阴性、RH 阴性）在可接受范围。字段格式规范、必填项完整、跨表关联一致，未发现明显异常；质控结果一致。'
            )
        }
        return '经对上传内容进行可靠性质控校验，整体格式规范、内容完整、字符合规，未发现明显异常；质控结果一致。'
    }

    const exportTxt = (content: string, filename: string) => {
        try {
            if (!content.trim()) {
                uiMessage.warning('暂无可导出的文本')
                return
            }
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            window.URL.revokeObjectURL(url)
            uiMessage.success('导出成功')
        } catch {
            uiMessage.error('导出失败，请重试')
        }
    }

    // 执行质控检查
    const handleQualityCheck = async (_values: TextQualityFormValues) => {
        setLoading(true)
        try {
            // 模拟质控检查过程
            await new Promise(resolve => setTimeout(resolve, 2000))
            const uploadList = _values.uploadFile || []
            const firstFile = uploadList[0]?.originFileObj as File | undefined

            if (!firstFile) {
                uiMessage.warning('请上传文件后再执行')
                return
            }
            if (firstFile) {
                const isImage = firstFile.type.startsWith('image/') ||
                    ['image/tiff', 'image/bmp'].includes(firstFile.type)
                if (isImage) {
                    const previewUrl = await fileToDataUrl(firstFile)
                    setImagePreviewUrl(previewUrl)
                    const text = await extractTextFromImage(firstFile)
                    const output = buildTextQualityOutput(text, _values.targetTable)
                    setQualityText(output)
                    uiMessage.success('图片解析并质控完成！')
                } else {
                    const text = await extractTextFromDoc(firstFile)
                    const output = buildTextQualityOutput(text, _values.targetTable)
                    setImagePreviewUrl('')
                    setQualityText(output)
                    uiMessage.success('文档解析并质控完成！')
                }
            }
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
                    可靠性质控
                </Title>
            </div>

            {/* 信息提示 */}
            <Alert
                message='可靠性质控功能'
                description='针对文本数据进行可靠性评估，包括格式规范、内容完整性与字符合规性，保障数据可信与稳定。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Row gutter={[16, 16]}>
                {/* 左侧：质控配置 */}
                <Col xs={24} lg={10}>
                    <Card title={<><TableOutlined style={{ marginRight: 8 }} />质控配置</>}>
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
                                name='uploadFile'
                                label='文件上传'
                                valuePropName='fileList'
                                getValueFromEvent={normFile}
                                rules={[
                                    {
                                        validator: async (_rule, value) => {
                                            const hasFile = Array.isArray(value) && value.length > 0
                                            if (!hasFile) {
                                                return Promise.reject('请上传文件')
                                            }
                                            return Promise.resolve()
                                        },
                                    },
                                ]}
                            >
                                <Dragger {...uploadProps}>
                                    <p className='ant-upload-drag-icon'>
                                        <InboxOutlined />
                                    </p>
                                    <p className='ant-upload-text'>点击或拖拽文件到此区域上传</p>
                                    <p className='ant-upload-hint'>
                                        支持 TXT、DOC、DOCX、PDF、PNG、JPG、JPEG、BMP、TIFF 格式，文件大小不超过 10MB
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
                    <Card title={<><FileTextOutlined style={{ marginRight: 8 }} />质控结果</>}>
                        {qualityText ? (
                            <div>
                                {imagePreviewUrl && (
                                    <div style={{ marginBottom: 16 }}>
                                        <img
                                            src={imagePreviewUrl}
                                            alt='预览图'
                                            style={{
                                                width: '100%',
                                                maxHeight: 480,
                                                objectFit: 'contain',
                                                border: '1px solid #f0f0f0',
                                                borderRadius: 8,
                                            }}
                                        />
                                    </div>
                                )}
                                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{qualityText}</Paragraph>
                                <Space>
                                    <Button onClick={() => exportTxt(qualityText, '可靠性质控_结果.txt')}>导出文本</Button>
                                </Space>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                                <div>暂无质控结果</div>
                                <div style={{ fontSize: 12, marginTop: 8 }}>
                                    请先上传文件并点击开始质控检查
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
