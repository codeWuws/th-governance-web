import React from 'react'
import { Form, Select } from 'antd'
import CustomDialog from '@/components/CustomDialog'
import styles from './AddMappingDialog.module.scss'

const { Option } = Select

/**
 * 添加映射弹窗属性
 */
export interface AddMappingDialogProps {
    /** 分类数据选项列表 */
    categoryDataOptions: Array<{ value: string; label: string }>
    /** 原始字段枚举值选项列表 */
    originFieldEnumOptions: Array<{ value: string; label: string }>
    /** 已使用的分类数据值 */
    usedCategoryValues: string[]
    /** 已使用的原始字段枚举值 */
    usedOriginFieldValues: string[]
    /** 确定回调 */
    onOk?: (categoryValue: string, originFieldValue: string) => void
    /** 取消回调 */
    onCancel?: () => void
}

/**
 * 添加映射弹窗组件
 */
const AddMappingDialog: React.FC<AddMappingDialogProps> = ({
    categoryDataOptions = [],
    originFieldEnumOptions = [],
    usedCategoryValues = [],
    usedOriginFieldValues = [],
    onOk,
    onCancel,
}) => {
    const [form] = Form.useForm()

    /**
     * 处理确定
     */
    const handleOk = async () => {
        try {
            const values = await form.validateFields()
            const { categoryValue, originFieldValue } = values

            // 确保值不为空
            if (!categoryValue || !originFieldValue) {
                throw new Error('请选择分类数据和原始字段枚举值')
            }

            // 调用onOk回调，传递选中的值（确保是字符串类型）
            onOk?.(String(categoryValue), String(originFieldValue))
            // 验证通过后，弹窗会自动关闭（因为okClose默认为true）
        } catch (error) {
            // 验证失败时不关闭弹窗，form.validateFields会抛出错误
            console.error('表单验证失败:', error)
            throw error // 重新抛出错误，阻止弹窗关闭
        }
    }

    /**
     * 处理取消
     */
    const handleCancel = () => {
        form.resetFields()
        onCancel?.()
    }

    return (
        <CustomDialog
            title='添加映射关系'
            width={600}
            onOk={handleOk}
            onCancel={handleCancel}
            okText='确定'
            cancelText='取消'
        >
            <Form form={form} layout='vertical' className={styles.dialogForm}>
                <Form.Item
                    name='categoryValue'
                    label='分类数据'
                    rules={[{ required: true, message: '请选择分类数据' }]}
                >
                    <Select
                        placeholder='请选择分类数据'
                        showSearch
                        optionFilterProp='children'
                        allowClear
                    >
                        {categoryDataOptions
                            .filter(option => !usedCategoryValues.includes(option.value))
                            .map(option => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name='originFieldValue'
                    label='原始字段枚举值'
                    rules={[{ required: true, message: '请选择原始字段枚举值' }]}
                >
                    <Select
                        placeholder='请选择原始字段枚举值'
                        showSearch
                        optionFilterProp='children'
                        allowClear
                    >
                        {originFieldEnumOptions
                            .filter(option => !usedOriginFieldValues.includes(option.value))
                            .map(option => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                    </Select>
                </Form.Item>
            </Form>
        </CustomDialog>
    )
}

export default AddMappingDialog

