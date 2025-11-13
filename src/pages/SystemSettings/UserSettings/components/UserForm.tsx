/**
 * 用户表单组件
 * 用于新建和编辑用户
 */

import React, { useEffect } from 'react'
import { Form, Input, Select, Switch, Row, Col, Button, Space, Avatar, Upload } from 'antd'
import { UserOutlined, UploadOutlined } from '@ant-design/icons'
import { UserFormData, UserStatus, RBACUser, Role } from '@/types/rbac'

const { Option } = Select
const { TextArea } = Input

interface UserFormProps {
    initialValues?: RBACUser | null
    roles: Role[]
    onSubmit: (values: UserFormData) => void
    onCancel: () => void
}

/**
 * 用户表单组件
 */
const UserForm: React.FC<UserFormProps> = ({ initialValues, roles, onSubmit, onCancel }) => {
    const [form] = Form.useForm()

    /**
     * 初始化表单数据
     */
    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                username: initialValues.username,
                email: initialValues.email,
                phone: initialValues.phone,
                realName: initialValues.realName,
                avatar: initialValues.avatar,
                status: initialValues.status,
                roleIds: initialValues.roles?.map(role => role.id) || [],
                department: initialValues.department,
                position: initialValues.position,
            })
        } else {
            form.resetFields()
            form.setFieldsValue({
                status: UserStatus.ACTIVE,
                roleIds: [],
            })
        }
    }, [initialValues, form])

    /**
     * 处理表单提交
     */
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            onSubmit(values)
        } catch (error) {
            console.error('Form validation failed:', error)
        }
    }

    /**
     * 处理头像上传
     */
    const handleAvatarChange = (info: any) => {
        if (info.file.status === 'done') {
            // 这里假设上传成功后返回图片URL
            const imageUrl = info.file.response?.url || URL.createObjectURL(info.file.originFileObj)
            form.setFieldsValue({ avatar: imageUrl })
        }
    }

    /**
     * 自定义上传 (模拟)
     */
    const customUpload = async (options: any) => {
        const { file, onSuccess, onError } = options
        try {
            // 模拟上传延迟
            setTimeout(() => {
                // 这里应该调用真实的上传API
                const fakeUrl = `https://via.placeholder.com/100x100?text=${file.name.charAt(0).toUpperCase()}`
                onSuccess({ url: fakeUrl })
            }, 1000)
        } catch (error) {
            onError(error)
        }
    }

    return (
        <Form
            form={form}
            layout='vertical'
            initialValues={{
                status: UserStatus.ACTIVE,
                roleIds: [],
            }}
        >
            <Row gutter={16}>
                {/* 头像 */}
                <Col span={24}>
                    <Form.Item label='头像' name='avatar'>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                src={form.getFieldValue('avatar')}
                                size={80}
                                icon={<UserOutlined />}
                                style={{ marginRight: 16 }}
                            />
                            <Upload
                                customRequest={customUpload}
                                showUploadList={false}
                                onChange={handleAvatarChange}
                                accept='image/*'
                            >
                                <Button icon={<UploadOutlined />}>上传头像</Button>
                            </Upload>
                        </div>
                    </Form.Item>
                </Col>

                {/* 基本信息 */}
                <Col span={12}>
                    <Form.Item
                        label='用户名'
                        name='username'
                        rules={[
                            { required: true, message: '请输入用户名' },
                            {
                                pattern: /^[a-zA-Z0-9_]{3,20}$/,
                                message: '用户名只能包含字母、数字和下划线，长度3-20位',
                            },
                        ]}
                    >
                        <Input placeholder='请输入用户名' disabled={!!initialValues} />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        label='真实姓名'
                        name='realName'
                        rules={[{ required: true, message: '请输入真实姓名' }]}
                    >
                        <Input placeholder='请输入真实姓名' />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        label='邮箱'
                        name='email'
                        rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '请输入有效的邮箱地址' },
                        ]}
                    >
                        <Input placeholder='请输入邮箱' />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        label='手机号'
                        name='phone'
                        rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}
                    >
                        <Input placeholder='请输入手机号' />
                    </Form.Item>
                </Col>

                {/* 部门和职位 */}
                <Col span={12}>
                    <Form.Item label='部门' name='department'>
                        <Input placeholder='请输入部门' />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item label='职位' name='position'>
                        <Input placeholder='请输入职位' />
                    </Form.Item>
                </Col>

                {/* 角色分配 */}
                <Col span={24}>
                    <Form.Item
                        label='角色'
                        name='roleIds'
                        rules={[{ required: true, message: '请至少选择一个角色' }]}
                    >
                        <Select
                            mode='multiple'
                            placeholder='请选择角色'
                            showSearch
                            filterOption={(input, option) =>
                                option?.children
                                    ?.toString()
                                    .toLowerCase()
                                    .includes(input.toLowerCase()) || false
                            }
                        >
                            {roles.map(role => (
                                <Option key={role.id} value={role.id}>
                                    {role.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>

                {/* 状态 */}
                <Col span={24}>
                    <Form.Item
                        label='状态'
                        name='status'
                        valuePropName='checked'
                        getValueFromEvent={checked => (checked ? 'active' : 'disabled')}
                        getValueProps={value => ({ checked: value === 'active' })}
                    >
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>
                </Col>

                {/* 密码 (新建用户时显示) */}
                {!initialValues && (
                    <>
                        <Col span={12}>
                            <Form.Item
                                label='密码'
                                name='password'
                                rules={[
                                    { required: true, message: '请输入密码' },
                                    { min: 6, message: '密码长度至少6位' },
                                ]}
                            >
                                <Input.Password placeholder='请输入密码' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label='确认密码'
                                name='confirmPassword'
                                dependencies={['password']}
                                rules={[
                                    { required: true, message: '请确认密码' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve()
                                            }
                                            return Promise.reject(new Error('两次输入的密码不一致'))
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password placeholder='请确认密码' />
                            </Form.Item>
                        </Col>
                    </>
                )}

                {/* 备注 */}
                <Col span={24}>
                    <Form.Item label='备注' name='description'>
                        <TextArea rows={3} placeholder='请输入备注信息' maxLength={500} showCount />
                    </Form.Item>
                </Col>
            </Row>

            {/* 操作按钮 */}
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                    <Button onClick={onCancel}>取消</Button>
                    <Button type='primary' onClick={handleSubmit}>
                        {initialValues ? '更新' : '创建'}
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    )
}

export default UserForm
