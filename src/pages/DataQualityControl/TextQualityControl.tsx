import { FileTextOutlined, InboxOutlined, SaveOutlined, TableOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Form, Input, Radio, Row, Select, Typography, Upload } from 'antd'
import type { UploadFile, UploadProps } from 'antd/es/upload'
import React, { useEffect, useState } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'
import { dataQualityControlService } from '@/services/dataQualityControlService'
import type { TableInfoItem } from '@/types'

const { Title } = Typography
const { TextArea } = Input
const { Dragger } = Upload

interface TextQualityFormValues {
    targetTable: string
    uploadFile?: UploadFile<any>[]
    qualityDescription?: string
    qualityResult?: 'qualified' | 'unqualified'
}

const TextQualityControl: React.FC = () => {
    const [form] = Form.useForm()
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)
    const [tableOptions, setTableOptions] = useState<Array<{ label: string; value: string }>>([])

    const normFile = (e: any) => {
        if (Array.isArray(e)) return e
        return e?.fileList || []
    }

    // 获取表信息列表
    const fetchTableInfo = async () => {
        try {
            setLoading(true)
            const response = await dataQualityControlService.getTableInfo()
            if (response.code === 200 && response.data) {
                const options = response.data.map((item: TableInfoItem) => ({
                    label: `${item.tableComment} (${item.tableName})`,
                    value: item.tableName,
                }))
                setTableOptions(options)
            } else {
                logger.warn('获取表信息列表失败:', response.msg)
                uiMessage.warning(response.msg || '获取表信息列表失败')
            }
        } catch (error) {
            logger.error('获取表信息列表异常:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('获取表信息列表失败，请重试')
        } finally {
            setLoading(false)
        }
    }

    // 组件加载时获取表信息
    useEffect(() => {
        fetchTableInfo()
    }, [])

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


    /**
     * 生成文件假ID
     * @description 根据文件名和时间戳生成唯一的文件ID
     * @param fileName 文件名
     * @returns 文件ID
     */
    const generateFileId = (fileName: string): string => {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 9)
        return `file_${timestamp}_${random}_${fileName}`
    }

    // 保存质控结果
    const handleSaveQualityResult = async () => {
        try {
            const values = await form.validateFields([
                'targetTable',
                'qualityDescription',
                'qualityResult',
                'uploadFile',
            ])
            if (!values.qualityResult) {
                uiMessage.warning('请选择质控结果')
                return
            }
            if (!values.uploadFile || values.uploadFile.length === 0) {
                uiMessage.warning('请上传文件')
                return
            }

            setSaving(true)

            // 获取上传的文件
            const uploadFile = values.uploadFile[0]
            const file = uploadFile.originFileObj as File | undefined
            if (!file) {
                uiMessage.error('文件信息获取失败，请重新上传')
                return
            }

            // 生成文件ID和文件名
            const fileName = file.name
            const fileId = generateFileId(fileName)

            // 转换质控结果为布尔值：qualified -> true, unqualified -> false
            const qcResult = values.qualityResult === 'qualified'

            // 调用保存接口
            const result = await dataQualityControlService.saveReliabilityQC({
                tableName: values.targetTable,
                qcRemark: values.qualityDescription || '',
                qcResult,
                fileId,
                fileName,
            })

            if (result.code === 200) {
                uiMessage.success('质控结果保存成功！')
                logger.info('质控结果保存成功:', {
                    tableName: values.targetTable,
                    qcResult,
                    fileId,
                    fileName,
                })
                // 可选：保存成功后重置表单
                // form.resetFields()
            } else {
                uiMessage.error(result.msg || '保存质控结果失败')
                logger.warn('保存质控结果失败:', result.msg)
            }
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) {
                // 表单验证错误
                return
            }
            logger.error('保存质控结果失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('保存质控结果失败，请重试')
        } finally {
            setSaving(false)
        }
    }

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
                        <Form form={form} layout='vertical'>
                            <Form.Item
                                label='选择数据表'
                                name='targetTable'
                                rules={[{ required: true, message: '请选择目标数据表' }]}
                            >
                                <Select
                                    placeholder='请选择要进行质控的数据表'
                                    options={tableOptions}
                                    size='large'
                                    loading={loading}
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>

                            <Form.Item
                                label='质控详情'
                                name='qualityDescription'
                                rules={[{ required: true, message: '请输入质控详情' }]}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder='请输入质控详情'
                                    showCount
                                    maxLength={500}
                                />
                            </Form.Item>

                            <Form.Item
                                label='质控结果'
                                name='qualityResult'
                                rules={[{ required: true, message: '请选择质控结果' }]}
                            >
                                <Radio.Group>
                                    <Radio value='qualified'>合格</Radio>
                                    <Radio value='unqualified'>不合格</Radio>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type='primary'
                                    icon={<SaveOutlined />}
                                    size='large'
                                    loading={saving}
                                    onClick={handleSaveQualityResult}
                                    block
                                >
                                    保存质控结果
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                {/* 右侧：文件上传 */}
                <Col xs={24} lg={14}>
                    <Card title={<><InboxOutlined style={{ marginRight: 8 }} />文件上传</>}>
                        <Form form={form} layout='vertical'>
                            <Form.Item
                                name='uploadFile'
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
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default TextQualityControl
