import React, { useEffect } from 'react'
import { Form, Input, Select } from 'antd'
import CustomDialog, { CustomDialogProps } from '../CustomDialog'
import type { AssetDataSourceOption, AssetTableInfoOption } from '../../types'

const { Option } = Select

interface EditAssetCategoryDialogProps extends Omit<CustomDialogProps, 'children' | 'onOk'> {
    /** 类别名称 */
    name: string
    /** 数据源ID */
    dataSourceId: string
    /** 表名列表 */
    tables: string[]
    /** 数据源选项列表 */
    dataSourceOptions: AssetDataSourceOption[]
    /** 表信息选项列表 */
    tableInfoOptions: AssetTableInfoOption[]
    /** 数据源选项加载状态 */
    dataSourceOptionsLoading?: boolean
    /** 表信息选项加载状态 */
    tableInfoOptionsLoading?: boolean
    /** 是否禁用数据源选择 */
    disableDataSource?: boolean
    /** 确定按钮回调，接收表单值 */
    onOk?: (values: { name: string; dataSourceId: string; tables: string[] }) => Promise<void> | void
}

/**
 * 编辑资产类别对话框组件
 * 用于编辑资产类别的名称、数据源和表列表
 */
export const EditAssetCategoryDialog: React.FC<EditAssetCategoryDialogProps> = ({
    name: initialName,
    dataSourceId: initialDataSourceId,
    tables: initialTables,
    dataSourceOptions,
    tableInfoOptions,
    dataSourceOptionsLoading = false,
    tableInfoOptionsLoading = false,
    disableDataSource = false,
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
            tables: initialTables,
        })
    }, [initialName, initialDataSourceId, initialTables, form])

    // 处理确定按钮
    const handleOk = async (e: React.MouseEvent<HTMLElement>) => {
        try {
            const values = await form.validateFields()
            if (!values.tables || values.tables.length === 0) {
                form.setFields([
                    {
                        name: 'tables',
                        errors: ['请至少选择一个表'],
                    },
                ])
                throw new Error('请至少选择一个表')
            }
            if (onOk) {
                await onOk(values as { name: string; dataSourceId: string; tables: string[] })
            }
        } catch (error) {
            // 表单验证失败，不关闭弹窗
            throw error
        }
    }

    return (
        <CustomDialog
            title="编辑资产类别"
            onOk={handleOk}
            onCancel={onCancel}
            width={600}
            {...restProps}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="类别名称"
                    rules={[{ required: true, message: '请输入类别名称' }]}
                >
                    <Input placeholder="请输入类别名称" />
                </Form.Item>
                <Form.Item
                    name="dataSourceId"
                    label="所属数据源"
                    rules={[{ required: true, message: '请选择数据源' }]}
                >
                    <Select
                        placeholder="请选择数据源"
                        disabled={disableDataSource}
                        loading={dataSourceOptionsLoading}
                        showSearch
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
                <Form.Item
                    name="tables"
                    label="选择表"
                    rules={[{ required: true, message: '请至少选择一个表' }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="请选择表（可多选）"
                        loading={tableInfoOptionsLoading}
                        showSearch
                        filterOption={(input, option) => {
                            const label = String(option?.label ?? '')
                            return label.toLowerCase().includes(input.toLowerCase())
                        }}
                    >
                        {tableInfoOptions.map(table => {
                            // 处理表注释中的换行符
                            const cleanComment = (table.tableComment || '')
                                .replace(/\r\n/g, ' ')
                                .replace(/\n/g, ' ')
                                .trim()
                            return (
                                <Option
                                    key={table.tableName}
                                    value={table.tableName}
                                    label={`${table.tableName} - ${cleanComment}`}
                                >
                                    {table.tableName} - {cleanComment || '-'}
                                </Option>
                            )
                        })}
                    </Select>
                </Form.Item>
            </Form>
        </CustomDialog>
    )
}

