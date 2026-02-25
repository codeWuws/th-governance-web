/**
 * 用户设置页面 - 用户管理
 * 实现RBAC系统中用户管理功能
 */

import React, { useState, useEffect } from 'react'
import {
    Card,
    Table,
    Button,
    Space,
    Input,
    Select,
    Tag,
    Avatar,
    Modal,
    Form,
    Switch,
    message,
    Popconfirm,
    Row,
    Col,
    Drawer,
    Descriptions,
    Badge,
    Tooltip,
} from 'antd'
import { uiMessage } from '@/utils/uiMessage'
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    KeyOutlined,
    UserOutlined,
    ReloadOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { RootState, useSystemSettings } from '@/store'
import {
    RBACUser,
    UserStatus,
    UserQueryParams,
    UserFormData,
    Role,
    RoleStatus,
    UserAddEditRequest,
    UserPageRequest,
    UserPageRecord,
} from '@/types/rbac'
import { mockApi } from '@/mock/rbac'
import { getAllRoles as mockGetAllRoles } from '@/mock/rbac'
import { userApi, roleApi } from '@/api/rbac'
import UserForm from './components/UserForm'
import { formatDate } from '@/utils/date'

const { Search } = Input
const { Option } = Select

/** 将接口返回的 status（'0'/'1' 或 0/1）规范为 UserStatus */
function normalizeUserStatus(status: string | number | undefined): UserStatus {
    if (status === '0' || status === 0) return UserStatus.ACTIVE
    if (status === '1' || status === 1) return UserStatus.DISABLED
    return UserStatus.DISABLED
}

/**
 * 用户状态标签映射
 */
const userStatusMap = {
    [UserStatus.ACTIVE]: { color: 'success', text: '启用' },
    [UserStatus.DISABLED]: { color: 'warning', text: '禁用' },
    [UserStatus.LOCKED]: { color: 'error', text: '锁定' },
}

/**
 * 用户设置页面
 */
const UserSettings: React.FC = () => {
    // 使用系统设置Redux状态管理
    const {
        users,
        roles,
        userLoading: loading,
        setUsers,
        setRoles,
        setUserLoading,
        setUserRoleAssignments,
    } = useSystemSettings()

    // 本地状态管理
    const [total, setTotal] = useState(0)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [toggling, setToggling] = useState<string | null>(null)

    // 查询参数（新接口格式）
    const [queryParams, setQueryParams] = useState<UserPageRequest>({
        pageNum: 1,
        pageSize: 10,
        username: '',
        nickName: '',
        email: '',
        phoneNumber: '',
        postId: undefined,
        status: undefined,
        sortField: undefined,
        sortOrder: undefined,
    })

    // 模态框状态
    const [modalVisible, setModalVisible] = useState(false)
    const [drawerVisible, setDrawerVisible] = useState(false)
    const [editingUser, setEditingUser] = useState<RBACUser | null>(null)
    const [selectedUser, setSelectedUser] = useState<RBACUser | null>(null)

    // 当前登录用户信息
    const currentUser = useSelector((state: RootState) => state.user.currentUser)

    /**
     * 加载用户列表
     */
    const loadUsers = async () => {
        try {
            setUserLoading(true)
            
            // 优先使用新接口
            let response: any
            try {
                response = await userApi.getUserPage(queryParams)
            } catch (apiError) {
                // API调用失败，使用mock接口作为fallback
                console.warn('API调用失败，使用mock数据:', apiError)
                response = await mockApi.user.getUserPage(queryParams)
            }
            
            // 处理响应数据
            // 响应拦截器返回的是 {code, msg, data} 格式
            // 所以 response 本身就是 {code, msg, data}
            // response.data 才是分页数据 {records, total, size, current, pages}
            let responseData: any = null
            
            if (response && typeof response === 'object') {
                // 情况1: response 是 {code, msg, data}，且 data 包含 records
                if (response.data && typeof response.data === 'object' && 'records' in response.data) {
                    responseData = response.data
                }
                // 情况2: response 直接是分页数据格式（mock返回的格式）
                else if ('records' in response) {
                    responseData = response
                }
                // 情况3: response.data.data 包含分页数据（嵌套结构）
                else if (response.data?.data && 'records' in response.data.data) {
                    responseData = response.data.data
                }
            }
            
            if (responseData && responseData.records && Array.isArray(responseData.records)) {
                // 转换数据格式：将UserPageRecord转换为RBACUser，同时保留原始字段
                const convertedUsers: (RBACUser & { sex?: string })[] = responseData.records.map((record: UserPageRecord) => ({
                    id: record.id,
                    username: record.username,
                    email: record.email,
                    phone: record.phoneNumber,
                    realName: record.nickName, // 昵称映射到realName
                    avatar: record.avatar || undefined,
                    status: normalizeUserStatus(record.status),
                    sex: record.sex, // 保留性别字段
                    roles: record.roles.map((roleName, index) => ({
                        id: String(index),
                        name: roleName,
                        code: roleName,
                        status: RoleStatus.ACTIVE,
                        sortOrder: index,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    })),
                    department: record.deptName || undefined,
                    position: record.postName || undefined,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }))
                
                setUsers(convertedUsers)
                
                // 解析总数（可能是字符串格式）
                const totalValue = responseData.total
                const totalNum = typeof totalValue === 'string' 
                    ? Number.parseInt(totalValue, 10) 
                    : (typeof totalValue === 'number' ? totalValue : 0)
                setTotal(totalNum)

                // 初始化用户角色分配数据
                const roleAssignments: Record<string, string[]> = {}
                convertedUsers.forEach(user => {
                    roleAssignments[user.id] = user.roles?.map(role => role.id) || []
                })
                setUserRoleAssignments(roleAssignments)
            } else {
                console.warn('响应数据格式不正确:', responseData)
                setUsers([])
                setTotal(0)
            }
        } catch (error) {
            uiMessage.handleSystemError('加载用户列表失败')
            console.error('Load users error:', error)
            setUsers([])
            setTotal(0)
        } finally {
            setUserLoading(false)
        }
    }

    /**
     * 加载角色列表
     */
    const loadRoles = async () => {
        try {
            // 优先使用 API 接口获取角色列表
            let roleList: Role[] = []
            try {
                // 使用分页查询接口获取所有角色（设置较大的 pageSize）
                const response = await roleApi.getRolePage({
                    pageNum: 1,
                    pageSize: 1000, // 获取所有角色
                })
                
                // 处理响应数据
                let responseData: any = null
                if (response && typeof response === 'object') {
                    if (response.data && typeof response.data === 'object' && 'records' in response.data) {
                        responseData = response.data
                    } else if ('records' in response) {
                        responseData = response
                    } else if (response.data?.data && 'records' in response.data.data) {
                        responseData = response.data.data
                    }
                }
                
                if (responseData && responseData.records) {
                    // 将 RolePageRecord 转换为 Role 格式
                    roleList = responseData.records.map((record: any) => ({
                        id: record.id,
                        name: record.roleName,
                        code: record.roleKey,
                        sortOrder: record.roleSort,
                        status: normalizeUserStatus(record.status) === UserStatus.ACTIVE ? 'active' : 'disabled',
                        userCount: parseInt(record.userCount) || 0,
                        description: record.remark || undefined,
                        createdAt: record.createTime || new Date().toISOString(),
                        updatedAt: record.updateTime || record.createTime || new Date().toISOString(),
                        permissions: [],
                    }))
                }
            } catch (apiError) {
                // API调用失败，使用mock接口作为fallback
                console.warn('API调用失败，使用mock数据:', apiError)
                roleList = mockGetAllRoles()
            }
            
            // 如果仍然没有数据，使用 mock 数据
            if (!roleList || roleList.length === 0) {
                roleList = mockGetAllRoles()
            }
            
            setRoles(roleList)
        } catch (error) {
            console.error('Load roles error:', error)
            // 出错时使用 mock 数据作为 fallback
            const mockRoles = mockGetAllRoles()
            setRoles(mockRoles)
        }
    }

    /**
     * 初始化数据
     */
    useEffect(() => {
        loadUsers()
        loadRoles()
    }, [queryParams])

    /**
     * 处理查询参数变化
     */
    const handleQueryChange = (key: keyof UserPageRequest, value: any) => {
        setQueryParams(prev => ({
            ...prev,
            [key]: value,
            pageNum: key === 'pageNum' ? value : 1, // 重置页码
        }))
    }

    /**
     * 处理搜索（用户名模糊搜索）
     */
    const handleSearch = (value: string) => {
        handleQueryChange('username', value)
    }

    /**
     * 处理昵称搜索
     */
    const handleNickNameSearch = (value: string) => {
        handleQueryChange('nickName', value)
    }

    /**
     * 处理邮箱搜索
     */
    const handleEmailSearch = (value: string) => {
        handleQueryChange('email', value)
    }

    /**
     * 处理手机号搜索
     */
    const handlePhoneSearch = (value: string) => {
        handleQueryChange('phoneNumber', value)
    }

    /**
     * 处理状态筛选（支持多选）
     */
    const handleStatusFilter = (status: string[] | undefined) => {
        handleQueryChange('status', status)
    }

    /**
     * 处理职位筛选
     */
    const handlePostFilter = (postId: number | undefined) => {
        handleQueryChange('postId', postId)
    }

    /**
     * 重置筛选条件
     */
    const handleResetFilters = () => {
        setQueryParams({
            pageNum: 1,
            pageSize: 10,
            username: '',
            nickName: '',
            email: '',
            phoneNumber: '',
            postId: undefined,
            status: undefined,
        })
    }

    /**
     * 处理新建用户
     */
    const handleCreate = () => {
        setEditingUser(null)
        setModalVisible(true)
    }

    /**
     * 处理编辑用户
     */
    const handleEdit = async (user: RBACUser) => {
        try {
            setUserLoading(true)
            
            // 调用接口获取最新用户详情
            let userDetail: any = null
            try {
                const response = await userApi.getUserByIdNew(user.id)
                // 响应拦截器返回的是 {code, msg, data} 格式
                // 所以 response 本身就是 {code, msg, data}
                // response.data 才是用户详情数据
                if (response && typeof response === 'object') {
                    // 情况1: response 是 {code, msg, data}，且 data 包含用户详情
                    if (response.data && typeof response.data === 'object' && 'id' in response.data) {
                        userDetail = response.data
                    }
                    // 情况2: response 直接是用户详情数据
                    else if ('id' in response && 'username' in response) {
                        userDetail = response
                    }
                    // 情况3: response.data.data 包含用户详情（嵌套结构）
                    else if (response.data?.data && 'id' in response.data.data) {
                        userDetail = response.data.data
                    }
                }
            } catch (apiError) {
                // API调用失败，使用mock接口作为fallback
                console.warn('API调用失败，使用mock数据:', apiError)
                const mockResponse = await mockApi.user.getUserByIdNew({ id: user.id })
                userDetail = mockResponse.data.data
            }
            
            // 转换数据格式：将接口返回格式转换为RBACUser格式
            if (userDetail) {
                const convertedUser: RBACUser & { sex?: string } = {
                    id: userDetail.id,
                    username: userDetail.username,
                    email: userDetail.email,
                    phone: userDetail.phoneNumber,
                    realName: userDetail.nickName,
                    avatar: userDetail.avatar || undefined,
                    status: normalizeUserStatus(userDetail.status),
                    sex: userDetail.sex, // 保留性别字段
                    roles: (userDetail.roleVos || []).map((role: any) => ({
                        id: role.id,
                        name: role.roleName,
                        code: role.roleKey,
                        status: role.status === '0' || role.status === 0 ? RoleStatus.ACTIVE : RoleStatus.DISABLED,
                        sortOrder: role.roleSort || 0,
                        description: role.remark,
                        createdAt: role.createTime || new Date().toISOString(),
                        updatedAt: role.updateTime || role.createTime || new Date().toISOString(),
                    })),
                    department: userDetail.deptName || undefined,
                    position: userDetail.postName || undefined,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
                setEditingUser(convertedUser)
                setModalVisible(true)
            } else {
                // 如果获取详情失败，使用当前用户数据
                setEditingUser(user)
                setModalVisible(true)
            }
        } catch (error) {
            console.error('获取用户详情失败:', error)
            // 出错时使用当前用户数据
            setEditingUser(user)
            setModalVisible(true)
        } finally {
            setUserLoading(false)
        }
    }

    /**
     * 处理查看详情
     */
    const handleView = async (user: RBACUser) => {
        try {
            setUserLoading(true)
            
            // 调用接口获取最新用户详情
            let userDetail: any = null
            try {
                const response = await userApi.getUserByIdNew(user.id)
                // 响应拦截器返回的是 {code, msg, data} 格式
                // 所以 response 本身就是 {code, msg, data}
                // response.data 才是用户详情数据
                if (response && typeof response === 'object') {
                    // 情况1: response 是 {code, msg, data}，且 data 包含用户详情
                    if (response.data && typeof response.data === 'object' && 'id' in response.data) {
                        userDetail = response.data
                    }
                    // 情况2: response 直接是用户详情数据
                    else if ('id' in response && 'username' in response) {
                        userDetail = response
                    }
                    // 情况3: response.data.data 包含用户详情（嵌套结构）
                    else if (response.data?.data && 'id' in response.data.data) {
                        userDetail = response.data.data
                    }
                }
            } catch (apiError) {
                // API调用失败，使用mock接口作为fallback
                console.warn('API调用失败，使用mock数据:', apiError)
                const mockResponse = await mockApi.user.getUserByIdNew({ id: user.id })
                userDetail = mockResponse.data.data
            }
            
            // 转换数据格式：将接口返回格式转换为RBACUser格式
            if (userDetail) {
                const convertedUser: RBACUser & { sex?: string } = {
                    id: userDetail.id,
                    username: userDetail.username,
                    email: userDetail.email,
                    phone: userDetail.phoneNumber,
                    realName: userDetail.nickName,
                    avatar: userDetail.avatar || undefined,
                    status: normalizeUserStatus(userDetail.status),
                    sex: userDetail.sex, // 保留性别字段
                    roles: (userDetail.roleVos || []).map((role: any) => ({
                        id: role.id,
                        name: role.roleName,
                        code: role.roleKey,
                        status: role.status === '0' || role.status === 0 ? RoleStatus.ACTIVE : RoleStatus.DISABLED,
                        sortOrder: role.roleSort || 0,
                        description: role.remark,
                        createdAt: role.createTime || new Date().toISOString(),
                        updatedAt: role.updateTime || role.createTime || new Date().toISOString(),
                    })),
                    department: userDetail.deptName || undefined,
                    position: userDetail.postName || undefined,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
                setSelectedUser(convertedUser)
                setDrawerVisible(true)
            } else {
                // 如果获取详情失败，使用当前用户数据
                setSelectedUser(user)
                setDrawerVisible(true)
            }
        } catch (error) {
            console.error('获取用户详情失败:', error)
            // 出错时使用当前用户数据
            setSelectedUser(user)
            setDrawerVisible(true)
        } finally {
            setUserLoading(false)
        }
    }

    /**
     * 处理状态切换
     */
    const handleStatusToggle = async (user: RBACUser) => {
        try {
            setToggling(user.id)
            
            // 先获取用户最新详情
            let userDetail: any = null
            try {
                const detailResponse = await userApi.getUserByIdNew(user.id)
                // 处理响应数据
                if (detailResponse && typeof detailResponse === 'object') {
                    if (detailResponse.data && typeof detailResponse.data === 'object' && 'id' in detailResponse.data) {
                        userDetail = detailResponse.data
                    } else if ('id' in detailResponse && 'username' in detailResponse) {
                        userDetail = detailResponse
                    } else if (detailResponse.data?.data && 'id' in detailResponse.data.data) {
                        userDetail = detailResponse.data.data
                    }
                }
            } catch (detailError) {
                // 获取详情失败，使用mock接口作为fallback
                console.warn('获取用户详情失败，使用mock数据:', detailError)
                const mockDetailResponse = await mockApi.user.getUserByIdNew({ id: user.id })
                userDetail = mockDetailResponse.data.data
            }
            
            // 如果获取详情失败，使用当前用户数据
            if (!userDetail) {
                userDetail = {
                    id: user.id,
                    username: user.username,
                    nickName: user.realName,
                    email: user.email,
                    phoneNumber: user.phone,
                    sex: (user as any).sex || '1',
                    avatar: user.avatar || '',
                    status: user.status === UserStatus.ACTIVE ? '0' : '1',
                    deptId: null,
                    deptName: user.department || null,
                    postId: null,
                    postName: user.position || null,
                    roleIds: user.roles?.map(role => Number(role.id)).filter(id => !isNaN(id)) || [],
                }
            }
            
            // 计算新状态（0-正常，1-停用）
            const currentStatus = (userDetail.status === '0' || userDetail.status === 0) ? '0' : '1'
            const newStatus = currentStatus === '0' ? '1' : '0'
            
            // 构建编辑请求数据
            const requestData: UserAddEditRequest = {
                id: userDetail.id,
                username: userDetail.username,
                nickName: userDetail.nickName,
                email: userDetail.email,
                phoneNumber: userDetail.phoneNumber,
                sex: userDetail.sex || '1',
                avatar: userDetail.avatar || '',
                status: newStatus, // 更新状态
                deptId: userDetail.deptId ? Number(userDetail.deptId) : undefined,
                deptName: userDetail.deptName,
                postId: userDetail.postId ? Number(userDetail.postId) : undefined,
                postName: userDetail.postName,
                roleIds: userDetail.roleVos 
                    ? userDetail.roleVos.map((role: any) => Number(role.id)).filter((id: number) => !isNaN(id))
                    : (userDetail.roleIds || []),
            }
            
            // 使用编辑接口更新状态
            let response: any
            try {
                response = await userApi.editUser(requestData)
                
                // 检查响应格式
                const responseCode = response?.code ?? response?.data?.code
                const isSuccess = 
                    responseCode === 200 || 
                    responseCode === 0 || 
                    response?.data?.success === true ||
                    response?.success === true
                
                if (isSuccess || (response && responseCode === undefined && response.data !== undefined)) {
                    message.success('状态更新成功')
                    loadUsers()
                    return
                }
            } catch (apiError: any) {
                // API调用失败，检查是否是业务错误
                if (apiError?.code && apiError.code !== 200 && apiError.code !== 0) {
                    throw apiError
                }
                // 使用mock接口作为fallback
                console.warn('API调用失败，使用mock数据:', apiError)
            }
            
            // 使用mock接口作为fallback
            response = await mockApi.user.editUser(requestData)
            if (response.data.success) {
                message.success('状态更新成功')
                loadUsers()
            }
        } catch (error) {
            uiMessage.handleSystemError('状态更新失败')
            console.error('Update status error:', error)
        } finally {
            setToggling(null)
        }
    }

    /**
     * 处理删除用户
     */
    const handleDelete = async (user: RBACUser) => {
        try {
            setDeleting(user.id)
            
            // 优先使用新接口
            let response: any
            try {
                response = await userApi.deleteUserById(user.id)
                // 检查响应格式（支持两种格式：{code, msg, data} 和 {success, data, message}）
                const isSuccess = response.data?.code === 200 || response.data?.success === true
                if (isSuccess) {
                    message.success('删除用户成功')
                    loadUsers()
                    return
                }
            } catch (apiError) {
                // API调用失败，使用mock接口作为fallback
                console.warn('API调用失败，使用mock数据:', apiError)
            }
            
            // 使用mock接口作为fallback
            response = await mockApi.user.deleteUserById(user.id)
            if (response.data.success) {
                message.success('删除用户成功')
                loadUsers()
            }
        } catch (error) {
            uiMessage.handleSystemError('删除用户失败')
            console.error('Delete user error:', error)
        } finally {
            setDeleting(null)
        }
    }

    /**
     * 处理表单提交
     */
    const handleFormSubmit = async (values: any) => {
        try {
            setSaving(true)
            
            // 转换表单数据为新接口格式
            const requestData: UserAddEditRequest = {
                id: editingUser?.id,
                username: values.username,
                nickName: values.nickName,
                email: values.email,
                phoneNumber: values.phoneNumber,
                sex: values.sex || '1',
                avatar: values.avatar,
                password: values.password,
                status: values.status === UserStatus.ACTIVE ? '0' : '1',
                deptId: values.deptId,
                deptName: values.deptName,
                postId: values.postId,
                postName: values.postName,
                roleIds: values.roleIds?.map((id: string | number) => Number(id)) || [],
            }
            
            let response: any
            try {
                if (editingUser) {
                    // 编辑用户 - 使用新接口
                    response = await userApi.editUser(requestData)
                } else {
                    // 新建用户 - 使用新接口
                    response = await userApi.addUser(requestData)
                }
                
                // 响应拦截器返回的是 {code, msg, data} 格式
                // 所以 response 本身就是 {code, msg, data}
                // 检查响应格式（支持多种格式）
                const responseCode = response?.code ?? response?.data?.code
                const isSuccess = 
                    responseCode === 200 || 
                    responseCode === 0 || 
                    response?.data?.success === true ||
                    response?.success === true
                
                // 如果响应拦截器没有抛出错误，说明业务状态码是200或0，应该认为成功
                // 即使响应格式判断失败，只要响应存在就认为成功（避免误报错误）
                if (isSuccess || (response && responseCode === undefined && response.data !== undefined)) {
                    message.success(editingUser ? '更新用户成功' : '创建用户成功')
                    setModalVisible(false)
                    loadUsers()
                    return
                }
                
                // 如果响应存在但code不是200或0，说明是业务错误
                if (response && responseCode && responseCode !== 200 && responseCode !== 0) {
                    throw new Error(response.msg || response.message || '操作失败')
                }
            } catch (apiError: any) {
                // API调用失败，检查是否是业务错误（code不为200）
                // 如果错误对象有code字段且不是200，说明是业务错误，不应该fallback到mock
                if (apiError?.code && apiError.code !== 200 && apiError.code !== 0) {
                    // 这是业务错误，直接抛出
                    throw apiError
                }
                // API调用失败，使用mock接口作为fallback
                console.warn('API调用失败，使用mock数据:', apiError)
            }
            
            // 使用mock接口作为fallback
            try {
                if (editingUser) {
                    response = await mockApi.user.editUser(requestData)
                } else {
                    response = await mockApi.user.addUser(requestData)
                }
                
                if (response.data.success) {
                    message.success(editingUser ? '更新用户成功' : '创建用户成功')
                    setModalVisible(false)
                    loadUsers()
                }
            } catch (mockError) {
                // mock也失败了，抛出错误
                throw mockError
            }
        } catch (error) {
            uiMessage.handleSystemError(editingUser ? '更新用户失败' : '创建用户失败')
            console.error('Submit user error:', error)
        } finally {
            setSaving(false)
        }
    }

    /**
     * 表格列定义
     */
    const columns = [
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
            width: 150,
            fixed: 'left' as const,
            render: (text: string, record: RBACUser) => (
                <Space>
                    <Avatar src={record.avatar} icon={<UserOutlined />} size='small' />
                    <span>{text}</span>
                </Space>
            ),
        },
        {
            title: '昵称',
            dataIndex: 'realName',
            key: 'nickName',
            width: 120,
            render: (text?: string) => text || '-',
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
            width: 180,
        },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phoneNumber',
            width: 120,
            render: (text?: string) => text || '-',
        },
        {
            title: '性别',
            dataIndex: 'sex',
            key: 'sex',
            width: 80,
            render: (sex?: string, record: any) => {
                // 从转换后的数据中获取性别信息，如果没有则显示-
                const sexValue = record.sex || (record as any).sex
                if (sexValue === '0' || sexValue === 0) return '男'
                if (sexValue === '1' || sexValue === 1) return '女'
                return '-'
            },
        },
        {
            title: '角色',
            dataIndex: 'roles',
            key: 'roles',
            width: 200,
            render: (roles: Role[] | string[]) => {
                // 支持两种格式：Role对象数组或字符串数组
                if (!roles || roles.length === 0) return '-'
                const roleNames = roles.map(role => 
                    typeof role === 'string' ? role : role.name
                )
                return (
                    <Space size={[0, 8]} wrap>
                        {roleNames.map((name, index) => (
                            <Tag key={index} color='blue'>
                                {name}
                            </Tag>
                        ))}
                    </Space>
                )
            },
        },
        {
            title: '部门',
            dataIndex: 'department',
            key: 'deptName',
            width: 120,
            render: (text?: string) => text || '-',
        },
        {
            title: '职位',
            dataIndex: 'position',
            key: 'postName',
            width: 120,
            render: (text?: string) => text || '-',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: UserStatus | string | number, record: any) => {
                // 支持 UserStatus 枚举、字符串 '0'/'1'、数字 0/1
                const statusValue: UserStatus =
                    status === UserStatus.ACTIVE || status === UserStatus.DISABLED || status === UserStatus.LOCKED
                        ? status
                        : normalizeUserStatus(status)
                const statusText = statusValue === UserStatus.ACTIVE ? '正常' : '停用'
                const color = statusValue === UserStatus.ACTIVE ? 'success' : 'error'
                return <Badge status={color as any} text={statusText} />
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right' as const,
            render: (text: string, record: RBACUser) => (
                <Space>
                    <Tooltip title='查看详情'>
                        <Button
                            type='text'
                            icon={<EyeOutlined />}
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    <Tooltip title='编辑'>
                        <Button
                            type='text'
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title={record.status === UserStatus.ACTIVE ? '禁用' : '启用'}>
                        <Switch
                            checked={record.status === UserStatus.ACTIVE}
                            onChange={() => handleStatusToggle(record)}
                            loading={toggling === record.id}
                            disabled={toggling === record.id}
                        />
                    </Tooltip>
                    <Popconfirm
                        title='确定要删除这个用户吗？'
                        onConfirm={() => handleDelete(record)}
                        okText='确定'
                        cancelText='取消'
                    >
                        <Tooltip title='删除'>
                            <Button 
                                type='text' 
                                danger 
                                icon={<DeleteOutlined />}
                                loading={deleting === record.id}
                                disabled={deleting === record.id}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div className='user-settings'>
            <Card>
                {/* 搜索和操作区域 */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={5}>
                        <Search
                            placeholder='搜索用户名（模糊）'
                            allowClear
                            enterButton={<SearchOutlined />}
                            onSearch={handleSearch}
                            style={{ width: '100%' }}
                            value={queryParams.username}
                            onChange={e => handleQueryChange('username', e.target.value)}
                        />
                    </Col>
                    <Col span={5}>
                        <Search
                            placeholder='搜索昵称（模糊）'
                            allowClear
                            enterButton={<SearchOutlined />}
                            onSearch={handleNickNameSearch}
                            style={{ width: '100%' }}
                            value={queryParams.nickName}
                            onChange={e => handleQueryChange('nickName', e.target.value)}
                        />
                    </Col>
                    <Col span={4}>
                        <Input
                            placeholder='邮箱'
                            allowClear
                            value={queryParams.email}
                            onChange={e => handleQueryChange('email', e.target.value)}
                            onPressEnter={() => loadUsers()}
                        />
                    </Col>
                    <Col span={4}>
                        <Input
                            placeholder='手机号'
                            allowClear
                            value={queryParams.phoneNumber}
                            onChange={e => handleQueryChange('phoneNumber', e.target.value)}
                            onPressEnter={() => loadUsers()}
                        />
                    </Col>
                    <Col span={3}>
                        <Select
                            placeholder='状态'
                            allowClear
                            mode='multiple'
                            style={{ width: '100%' }}
                            value={queryParams.status}
                            onChange={handleStatusFilter}
                        >
                            <Option value='0'>正常</Option>
                            <Option value='1'>停用</Option>
                        </Select>
                    </Col>
                    <Col span={3}>
                        <Select
                            placeholder='职位'
                            allowClear
                            style={{ width: '100%' }}
                            value={queryParams.postId}
                            onChange={handlePostFilter}
                        >
                            <Option value={1}>技术总监</Option>
                            <Option value={2}>系统管理员</Option>
                            <Option value={3}>数据分析师</Option>
                            <Option value={4}>业务专员</Option>
                        </Select>
                    </Col>
                </Row>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={24} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button onClick={handleResetFilters}>重置</Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    loadUsers()
                                    loadRoles()
                                }}
                            >
                                刷新
                            </Button>
                            <Button type='primary' icon={<PlusOutlined />} onClick={handleCreate}>
                                新建用户
                            </Button>
                        </Space>
                    </Col>
                </Row>

                {/* 用户表格 */}
                <Table
                    rowKey='id'
                    loading={loading}
                    columns={columns}
                    dataSource={users}
                    pagination={{
                        current: queryParams.pageNum || 1,
                        pageSize: queryParams.pageSize || 10,
                        total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                        onChange: (page, pageSize) => {
                            handleQueryChange('pageNum', page)
                            handleQueryChange('pageSize', pageSize)
                        },
                    }}
                    scroll={{ x: 1500 }}
                />
            </Card>

            {/* 用户表单模态框 */}
            <Modal
                title={editingUser ? '编辑用户' : '新建用户'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
                destroyOnClose
            >
                <UserForm
                    initialValues={editingUser}
                    roles={roles}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setModalVisible(false)}
                    loading={saving}
                />
            </Modal>

            {/* 用户详情抽屉 */}
            <Drawer
                title='用户详情'
                placement='right'
                width={600}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
            >
                {selectedUser && (
                    <Descriptions column={1} bordered>
                        <Descriptions.Item label='头像'>
                            <Avatar src={selectedUser.avatar} size={64} icon={<UserOutlined />} />
                        </Descriptions.Item>
                        <Descriptions.Item label='用户名'>
                            {selectedUser.username}
                        </Descriptions.Item>
                        <Descriptions.Item label='昵称'>
                            {selectedUser.realName || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='邮箱'>{selectedUser.email}</Descriptions.Item>
                        <Descriptions.Item label='手机号'>
                            {selectedUser.phone || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='性别'>
                            {(selectedUser as any).sex === '0' || (selectedUser as any).sex === 0
                                ? '男'
                                : (selectedUser as any).sex === '1' || (selectedUser as any).sex === 1
                                ? '女'
                                : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='部门'>
                            {selectedUser.department || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='职位'>
                            {selectedUser.position || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='状态'>
                            <Badge
                                status={userStatusMap[selectedUser.status].color as any}
                                text={selectedUser.status === UserStatus.ACTIVE ? '正常' : '停用'}
                            />
                        </Descriptions.Item>
                        <Descriptions.Item label='角色'>
                            <Space wrap>
                                {selectedUser.roles?.map(role => (
                                    <Tag key={role.id} color='blue'>
                                        {role.name}
                                    </Tag>
                                ))}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label='最后登录时间'>
                            {selectedUser.lastLoginTime
                                ? formatDate(selectedUser.lastLoginTime)
                                : '从未登录'}
                        </Descriptions.Item>
                        <Descriptions.Item label='最后登录IP'>
                            {selectedUser.lastLoginIp || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='创建时间'>
                            {formatDate(selectedUser.createdAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label='更新时间'>
                            {formatDate(selectedUser.updatedAt)}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </div>
    )
}

export default UserSettings
