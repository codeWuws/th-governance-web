import React, { useEffect } from 'react'
import { Form, Input, Select } from 'antd'
import CustomDialog, { CustomDialogProps } from '../CustomDialog'
import type { AssetDataSourceOption } from '../../types'

const { Option } = Select

interface EditAssetDialogProps extends Omit<CustomDialogProps, 'children' | 'onOk'> {
    /** 资产名称 */
    name: string
    /** 数据源ID */
    dataSourceId: string
    /** 数据源选项列表 */
    dataSourceOptions: AssetDataSourceOption[]
    /** 数据源选项加载状态 */
    dataSourceOptionsLoading?: boolean
    /** 确定按钮回调，接收表单值 */
    onOk?: (values: { name: string; dataSourceId: string }) => Promise<void> | void
}

/**
 * 编辑资产对话框组件
 * 用于编辑数据源的名称和数据源
 */
export const EditAssetDialog: React.FC<EditAssetDialogProps> = ({
    name: initialName,
    dataSourceId: initialDataSourceId,
    dataSourceOptions,
    dataSourceOptionsLoading = false,
    onOk,
    onCancel,
    ...restProps
}) => {
    const [form] = Form.useForm()

    // 初始化表单值
    useEffect(() => {
        form.setFieldsValue({
            name: initialName,
            dataSourceId: initialDataSourceId,
        })
    }, [initialName, initialDataSourceId, form])

    // 处理确定按钮
    const handleOk = async (e: React.MouseEvent<HTMLElement>) => {
        try {
            const values = await form.validateFields()
            if (onOk) {
                await onOk(values as { name: string; dataSourceId: string })
            }
        } catch (error) {
            // 表单验证失败，不关闭弹窗
            throw error
        }
    }

    return (
        <CustomDialog
            title="编辑资产"
            onOk={handleOk}
            onCancel={onCancel}
            width={500}
            {...restProps}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="资产名称"
                    rules={[{ required: true, message: '请输入资产名称' }]}
                >
                    <Input placeholder="请输入资产名称" />
                </Form.Item>
                <Form.Item
                    name="dataSourceId"
                    label="数据源"
                    rules={[{ required: true, message: '请选择数据源' }]}
                >
                    <Select
                        placeholder="请选择数据源"
                        showSearch
                        loading={dataSourceOptionsLoading}
                        filterOption={(input, option) => {
                            const label = String(option?.label ?? '')
                            return label.toLowerCase().includes(input.toLowerCase())
                        }}
                    >
                        {dataSourceOptions.map(option => (
                            <Option
                                key={option.id}
                                value={option.id}
                                label={`${option.dbName} (${option.dbType})`}
                            >
                                {option.dbName} ({option.dbType.toUpperCase()})
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </CustomDialog>
    )
}

