import React from 'react'
import { Form, Input, Select, Switch, InputNumber, Button, Space, message } from 'antd'
import { Role, RoleFormData } from '@/types/rbac'
import { uiMessage } from '@/utils/uiMessage'

const { TextArea } = Input
const { Option } = Select

interface RoleFormProps {
    initialValues?: Role
    onSubmit: (values: RoleFormData) => Promise<void>
    onCancel: () => void
    loading?: boolean
}

/**
 * 角色表单组件
 * 用于创建和编辑角色信息
 */
const RoleForm: React.FC<RoleFormProps> = ({ initialValues, onSubmit, onCancel, loading = false }) => {
    const [form] = Form.useForm()

    // 表单提交处理
    const handleSubmit = async (values: RoleFormData) => {
        try {
            await onSubmit(values)
            form.resetFields()
        } catch (error) {
            uiMessage.handleSystemError('操作失败，请重试')
        }
    }

    // 表单布局配置
    const formItemLayout = {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
    }

    // 按钮布局配置
    const tailFormItemLayout = {
        wrapperCol: {
            span: 18,
            offset: 6,
        },
    }

    return (
        <Form
            form={form}
            onFinish={handleSubmit}
            initialValues={{
                name: initialValues?.name || '',
                code: initialValues?.code || '',
                description: initialValues?.description || '',
                status: initialValues?.status || 'active',
                sortOrder: initialValues?.sortOrder || 0,
            }}
            {...formItemLayout}
        >
            <Form.Item
                name='name'
                label='角色名称'
                rules={[
                    { required: true, message: '请输入角色名称' },
                    { max: 50, message: '角色名称不能超过50个字符' },
                ]}
            >
                <Input placeholder='请输入角色名称' />
            </Form.Item>

            <Form.Item
                name='code'
                label='角色编码'
                rules={[
                    { required: true, message: '请输入角色编码' },
                    { pattern: /^[A-Z_]+$/, message: '角色编码只能包含大写字母和下划线' },
                    { max: 30, message: '角色编码不能超过30个字符' },
                ]}
                tooltip='角色编码用于程序识别，建议使用大写字母和下划线组合'
            >
                <Input placeholder='请输入角色编码' disabled={!!initialValues} />
            </Form.Item>

            <Form.Item
                name='description'
                label='角色描述'
                rules={[{ max: 200, message: '角色描述不能超过200个字符' }]}
            >
                <TextArea rows={3} placeholder='请输入角色描述（可选）' showCount maxLength={200} />
            </Form.Item>

            <Form.Item
                name='status'
                label='状态'
                valuePropName='checked'
                getValueFromEvent={checked => (checked ? 'active' : 'disabled')}
                getValueProps={value => ({ checked: value === 'active' })}
            >
                <Switch checkedChildren='启用' unCheckedChildren='禁用' />
            </Form.Item>

            <Form.Item
                name='sortOrder'
                label='排序'
                rules={[{ type: 'number', min: 0, max: 999, message: '排序值必须在0-999之间' }]}
                tooltip='排序值越小，显示越靠前'
            >
                <InputNumber
                    min={0}
                    max={999}
                    placeholder='请输入排序值'
                    style={{ width: '100%' }}
                />
            </Form.Item>

            <Form.Item {...tailFormItemLayout}>
                <Space>
                    <Button onClick={onCancel} disabled={loading}>取消</Button>
                    <Button type='primary' htmlType='submit' loading={loading}>
                        {initialValues ? '更新' : '创建'}
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    )
}

export default RoleForm
