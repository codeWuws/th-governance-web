import React, { useState } from 'react'
import {
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    Tag,
    Tree,
    Card,
    Row,
    Col,
    Descriptions,
    Popconfirm,
} from 'antd'
import {
    SafetyOutlined,
    TeamOutlined,
    MenuOutlined,
    ApiOutlined,
    ControlOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import {
    selectPermissions,
    selectPermissionLoading,
    selectMenuPermissions,
    type SystemPermission,
} from '../../../store/slices/systemPermissionSlice'
import {
    selectRoles,
    assignPermissionsToRole,
    type SystemRole,
} from '../../../store/slices/systemRoleSlice'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'
import { logger } from '../../../utils/logger'
import uiMessage from '@/utils/uiMessage'

const { Option } = Select

/**
 * 权限设置页面组件
 * 提供权限管理和角色权限分配功能
 */
const PermissionSettings: React.FC = () => {
    const dispatch = useAppDispatch()
    const permissions = useAppSelector(selectPermissions)
    const menuPermissions = useAppSelector(selectMenuPermissions)
    const loading = useAppSelector(selectPermissionLoading)
    const roles = useAppSelector(selectRoles)

    const [isRolePermissionModalVisible, setIsRolePermissionModalVisible] = useState(false)
    const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null)
    const [checkedPermissions, setCheckedPermissions] = useState<string[]>([])
    const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false)
    const [editingPermission, setEditingPermission] = useState<SystemPermission | null>(null)
    const [parentPermission, setParentPermission] = useState<SystemPermission | null>(null)
    const [form] = Form.useForm()

    // 构建树形表格数据
    const buildTreeTableData = (permissions: SystemPermission[]): SystemPermission[] => {
        const permissionMap = new Map<string, SystemPermission>()
        permissions.forEach(permission => {
            permissionMap.set(permission.id, permission)
        })

        const buildChildren = (parentId: string | null): SystemPermission[] => {
            return permissions
                .filter(p => p.parentId === parentId)
                .sort((a, b) => a.sort - b.sort)
                .map(permission => ({
                    ...permission,
                    children: buildChildren(permission.id),
                }))
        }

        return buildChildren(null)
    }

    // 获取树形表格数据
    const treeTableData = buildTreeTableData(permissions)

    // 获取权限图标
    const getPermissionIcon = (type: string) => {
        switch (type) {
            case 'menu':
                return <MenuOutlined style={{ color: '#1890ff' }} />
            case 'button':
                return <ControlOutlined style={{ color: '#52c41a' }} />
            case 'api':
                return <ApiOutlined style={{ color: '#faad14' }} />
            default:
                return <SafetyOutlined />
        }
    }

    // 获取权限类型标签
    const getPermissionTypeTag = (type: string) => {
        const typeMap = {
            menu: { color: 'blue', text: '菜单' },
            button: { color: 'green', text: '按钮' },
            api: { color: 'orange', text: 'API' },
        }
        const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type }
        return <Tag color={config.color}>{config.text}</Tag>
    }

    // 权限管理操作函数
    const handleAddSubPermission = (parent: SystemPermission) => {
        setParentPermission(parent)
        setEditingPermission(null)
        form.resetFields()
        form.setFieldsValue({
            parentId: parent.id,
            type: 'menu',
            status: 'active',
            sort: 0,
        })
        setIsPermissionModalVisible(true)
    }

    const handleEditPermission = (permission: SystemPermission) => {
        setEditingPermission(permission)
        setParentPermission(null)
        form.setFieldsValue(permission)
        setIsPermissionModalVisible(true)
    }

    const handleDeletePermission = (_permissionId: string) => {
        // 这里应该调用删除权限的 Redux action
        uiMessage.success('权限删除成功')
    }

    // 表格列配置 - 树形表格
    const columns: ColumnsType<SystemPermission> = [
        {
            title: '权限名称',
            dataIndex: 'name',
            key: 'name',
            width: 300,
            render: (text, record) => (
                <Space>
                    {getPermissionIcon(record.type)}
                    <span style={{ fontWeight: record.parentId === null ? 'bold' : 'normal' }}>
                        {text}
                    </span>
                    {getPermissionTypeTag(record.type)}
                </Space>
            ),
        },
        {
            title: '权限编码',
            dataIndex: 'code',
            key: 'code',
            width: 180,
            render: text => <Tag color='geekblue'>{text}</Tag>,
        },
        {
            title: '路径',
            dataIndex: 'path',
            key: 'path',
            width: 200,
            render: path => (path ? <Tag color='purple'>{path}</Tag> : '-'),
        },
        {
            title: '排序',
            dataIndex: 'sort',
            key: 'sort',
            width: 80,
            sorter: (a, b) => a.sort - b.sort,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: status => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? '启用' : '禁用'}
                </Tag>
            ),
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            width: 200,
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space size='small'>
                    <Button
                        type='link'
                        size='small'
                        icon={<PlusOutlined />}
                        onClick={() => handleAddSubPermission(record)}
                        title='添加子权限'
                    />
                    <Button
                        type='link'
                        size='small'
                        icon={<EditOutlined />}
                        onClick={() => handleEditPermission(record)}
                        title='编辑'
                    />
                    <Popconfirm
                        title='确定删除此权限吗？'
                        description='删除后将无法恢复，且会同时删除所有子权限'
                        onConfirm={() => handleDeletePermission(record.id)}
                        okText='确定'
                        cancelText='取消'
                    >
                        <Button
                            type='link'
                            size='small'
                            danger
                            icon={<DeleteOutlined />}
                            title='删除'
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    const handleAddRootPermission = () => {
        setParentPermission(null)
        setEditingPermission(null)
        form.resetFields()
        form.setFieldsValue({
            parentId: null,
            type: 'menu',
            status: 'active',
            sort: 0,
        })
        setIsPermissionModalVisible(true)
    }

    const handlePermissionSubmit = async () => {
        try {
            await form.validateFields()
            if (editingPermission) {
                // 更新权限
                uiMessage.success('权限更新成功')
            } else {
                // 添加权限
                uiMessage.success('权限添加成功')
            }
            setIsPermissionModalVisible(false)
            form.resetFields()
        } catch (error) {
            logger.error('表单验证失败:', error instanceof Error ? error : new Error(String(error)))
        }
    }

    // 构建权限树数据（用于角色权限分配）
    const buildPermissionTree = (permissions: SystemPermission[]): DataNode[] => {
        const permissionMap = new Map<string, SystemPermission>()
        permissions.forEach(permission => {
            permissionMap.set(permission.id, permission)
        })

        const buildNode = (permission: SystemPermission): DataNode => {
            const children = permissions
                .filter(p => p.parentId === permission.id)
                .sort((a, b) => a.sort - b.sort)
                .map(child => buildNode(child))

            return {
                key: permission.id,
                title: (
                    <Space>
                        {getPermissionIcon(permission.type)}
                        {permission.name}
                        {getPermissionTypeTag(permission.type)}
                    </Space>
                ),
                children: children.length > 0 ? children : undefined,
            }
        }

        return permissions
            .filter(permission => permission.parentId === null)
            .sort((a, b) => a.sort - b.sort)
            .map(permission => buildNode(permission))
    }

    // 处理角色权限分配
    const handleRolePermissionAssign = (role: SystemRole) => {
        setSelectedRole(role)
        setCheckedPermissions(role.permissionIds)
        setIsRolePermissionModalVisible(true)
    }

    // 处理权限树选择
    const handlePermissionCheck = (
        checkedKeys: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] },
        _info: unknown
    ) => {
        const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked
        setCheckedPermissions(keys.map(key => String(key)))
    }

    // 保存角色权限
    const handleSaveRolePermissions = () => {
        if (selectedRole) {
            dispatch(
                assignPermissionsToRole({
                    roleId: selectedRole.id,
                    permissionIds: checkedPermissions,
                })
            )
            uiMessage.success('角色权限分配成功')
            setIsRolePermissionModalVisible(false)
            setSelectedRole(null)
            setCheckedPermissions([])
        }
    }

    // 取消角色权限分配
    const handleCancelRolePermissions = () => {
        setIsRolePermissionModalVisible(false)
        setSelectedRole(null)
        setCheckedPermissions([])
    }

    const permissionTreeData = buildPermissionTree(menuPermissions)

    return (
        <div className='permission-settings'>
            {/* 权限管理 - 树形表格 */}
            <Card
                title='权限管理'
                size='small'
                style={{ marginBottom: 16 }}
                extra={
                    <Button
                        type='primary'
                        icon={<PlusOutlined />}
                        onClick={handleAddRootPermission}
                    >
                        添加根权限
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={treeTableData}
                    rowKey='id'
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={false}
                    expandable={{
                        defaultExpandAllRows: true,
                        indentSize: 20,
                    }}
                />
            </Card>

            {/* 角色权限分配 */}
            <Card title='角色权限分配' size='small'>
                <Row gutter={[16, 16]}>
                    {roles.map(role => (
                        <Col key={role.id} span={6}>
                            <Card
                                size='small'
                                title={
                                    <Space>
                                        <TeamOutlined />
                                        {role.name}
                                    </Space>
                                }
                                extra={
                                    <Tag color={role.status === 'active' ? 'green' : 'red'}>
                                        {role.status === 'active' ? '启用' : '禁用'}
                                    </Tag>
                                }
                                actions={[
                                    <Button
                                        key='assign'
                                        type='link'
                                        onClick={() => handleRolePermissionAssign(role)}
                                    >
                                        分配权限
                                    </Button>,
                                ]}
                            >
                                <Descriptions size='small' column={1}>
                                    <Descriptions.Item label='编码'>
                                        <Tag color='geekblue'>{role.code}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label='权限数'>
                                        <Tag color='blue'>{role.permissionIds.length}项</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label='用户数'>
                                        <Tag color='green'>{role.userIds.length}人</Tag>
                                    </Descriptions.Item>
                                </Descriptions>
                                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                                    {role.description}
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>

            {/* 权限编辑模态框 */}
            <Modal
                title={
                    editingPermission
                        ? '编辑权限'
                        : parentPermission
                          ? `添加子权限 - ${parentPermission.name}`
                          : '添加根权限'
                }
                open={isPermissionModalVisible}
                onOk={handlePermissionSubmit}
                onCancel={() => {
                    setIsPermissionModalVisible(false)
                    form.resetFields()
                }}
                width={600}
                okText='保存'
                cancelText='取消'
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{
                        type: 'menu',
                        status: 'active',
                        sort: 0,
                    }}
                >
                    {parentPermission && (
                        <Form.Item label='父级权限'>
                            <Input
                                value={`${parentPermission.name} (${parentPermission.code})`}
                                disabled
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        name='name'
                        label='权限名称'
                        rules={[{ required: true, message: '请输入权限名称' }]}
                    >
                        <Input placeholder='请输入权限名称' />
                    </Form.Item>

                    <Form.Item
                        name='code'
                        label='权限编码'
                        rules={[{ required: true, message: '请输入权限编码' }]}
                    >
                        <Input placeholder='请输入权限编码，如：system:user:list' />
                    </Form.Item>

                    <Form.Item
                        name='type'
                        label='权限类型'
                        rules={[{ required: true, message: '请选择权限类型' }]}
                    >
                        <Select placeholder='请选择权限类型'>
                            <Option value='menu'>菜单</Option>
                            <Option value='button'>按钮</Option>
                            <Option value='api'>API</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name='path' label='路径'>
                        <Input placeholder='请输入路径，如：/system/user' />
                    </Form.Item>

                    <Form.Item
                        name='sort'
                        label='排序'
                        rules={[{ required: true, message: '请输入排序值' }]}
                    >
                        <Input type='number' placeholder='请输入排序值' />
                    </Form.Item>

                    <Form.Item name='status' label='状态' valuePropName='checked'>
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>

                    <Form.Item name='description' label='描述'>
                        <Input.TextArea rows={3} placeholder='请输入权限描述' />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 角色权限分配模态框 */}
            <Modal
                title={`分配权限 - ${selectedRole?.name}`}
                open={isRolePermissionModalVisible}
                onOk={handleSaveRolePermissions}
                onCancel={handleCancelRolePermissions}
                width={600}
                okText='保存'
                cancelText='取消'
            >
                {selectedRole && (
                    <>
                        <Descriptions size='small' style={{ marginBottom: 16 }}>
                            <Descriptions.Item label='角色名称'>
                                {selectedRole.name}
                            </Descriptions.Item>
                            <Descriptions.Item label='角色编码'>
                                {selectedRole.code}
                            </Descriptions.Item>
                            <Descriptions.Item label='当前权限数'>
                                {selectedRole.permissionIds.length}项
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
                            选择权限（主要为菜单权限）：
                        </div>

                        <div
                            style={{
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                padding: '12px',
                                maxHeight: '400px',
                                overflow: 'auto',
                            }}
                        >
                            <Tree
                                checkable
                                checkedKeys={checkedPermissions}
                                onCheck={handlePermissionCheck}
                                treeData={permissionTreeData}
                                defaultExpandAll
                            />
                        </div>

                        <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                            已选择 {checkedPermissions.length} 项权限
                        </div>
                    </>
                )}
            </Modal>
        </div>
    )
}

export default PermissionSettings
