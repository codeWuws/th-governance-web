import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../components/Layout/MainLayout'
import Dashboard from '../pages/Dashboard'
import DatabaseConnection from '../pages/DatabaseConnection'
import DataGovernance from '../pages/DataGovernance'
import { ExecutionHistory } from '../pages/DataGovernance/ExecutionHistory'
import WorkflowConfig from '../pages/DataGovernance/WorkflowConfig'
import WorkflowDetail from '../pages/DataGovernance/WorkflowDetail'
import DataQualityControl from '../pages/DataQualityControl'
import IntegratedQualityControlManagement from '../pages/DataQualityControl/IntegratedQualityControlManagement'
import FlowManagement from '../pages/DataQualityControl/FlowManagement'
import QCExecutionHistory from '../pages/DataQualityControl/ExecutionHistory'
import QualityControlFlowDetail from '../pages/DataQualityControl/QualityControlFlowDetail'

import DataManagement from '../pages/DataManagement'
import DataAssetManagement from '../pages/DataManagement/DataAssetManagement'
import CategoryStandardManagement from '../pages/DataManagement/CategoryStandardManagement'
import IndexGenerationRules from '../pages/DataManagement/IndexGenerationRules'
import IndexConfiguration from '../pages/DataManagement/IndexConfiguration'
import IndexProcessingManagement from '../pages/DataManagement/IndexProcessingManagement'

import BusinessDatasetManagement from '../pages/DataManagement/BusinessDatasetManagement'
import MedicalDictionaryManagement from '../pages/DataManagement/MedicalDictionaryManagement'
import StateDictionaryManagement from '../pages/DataManagement/StateDictionaryManagement'
import StandardDictionaryMapping from '../pages/DataManagement/StandardDictionaryMapping'
import DataParsing, { DataAnnotation, MedicalRecordParsing } from '../pages/DataParsing'
import FullTextSearch from '../pages/DataRetrieval/FullTextSearch'
import AdvancedSearch from '../pages/DataRetrieval/AdvancedSearch'
import ConditionTreeSearch from '../pages/DataRetrieval/ConditionTreeSearch'
import SearchAnalysis from '../pages/DataRetrieval/SearchAnalysis'
import VisualizationView from '../pages/DataRetrieval/VisualizationView'
import SystemSettings from '../pages/SystemSettings'
import UserSettings from '../pages/SystemSettings/UserSettings'
import RoleSettings from '../pages/SystemSettings/RoleSettings'
import PermissionSettings from '../pages/SystemSettings/PermissionSettings'

export const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <MainLayout />,
            children: [
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: 'dashboard',
                element: <Dashboard />,
            },
            {
                path: 'database-connection',
                element: <DatabaseConnection />,
            },
            {
                path: 'data-governance',
                element: <DataGovernance />,
            },
            {
                path: 'data-governance/workflow-config',
                element: <WorkflowConfig />,
            },
            {
                path: 'data-governance/execution-history',
                element: <ExecutionHistory />,
            },
            {
                path: 'data-governance/workflow/:taskId',
                element: <WorkflowDetail />,
            },
            {
                path: 'data-quality-control',
                element: <DataQualityControl />,
            },
            {
                path: 'data-quality-control/flow-management',
                element: <FlowManagement />,
            },
            {
                path: 'data-quality-control/execution-history',
                element: <QCExecutionHistory />,
            },
            {
                path: 'data-quality-control/integrated',
                element: <IntegratedQualityControlManagement />,
            },
            {
                path: 'data-quality-control/flow/:taskId',
                element: <QualityControlFlowDetail />,
            },
            {
                path: 'data-management',
                element: <DataManagement />,
                children: [
                    {
                        path: 'data-asset',
                        element: <DataAssetManagement />,
                    },
                    {
                        path: 'category-standards',
                        element: <CategoryStandardManagement />,
                    },
                    {
                        path: 'business-datasets',
                        element: <BusinessDatasetManagement />,
                    },
                    {
                        path: 'medical-dictionaries',
                        element: <MedicalDictionaryManagement />,
                    },
                    {
                        path: 'state-dictionaries',
                        element: <StateDictionaryManagement />,
                    },
                    {
                        path: 'standard-dictionary-mapping',
                        element: <StandardDictionaryMapping />,
                    },
                    {
                        path: 'index-rules',
                        element: <IndexGenerationRules />,
                    },
                    {
                        path: 'index-configuration',
                        element: <IndexConfiguration />,
                    },
                    {
                        path: 'index-processing',
                        element: <IndexProcessingManagement />,
                    },
                ],
            },
            {
                path: 'data-parsing',
                element: <DataParsing />,
            },
            {
                path: 'data-parsing/annotation',
                element: <DataAnnotation />,
            },
            {
                path: 'data-parsing/medical-record',
                element: <MedicalRecordParsing />,
            },
            // 数据检索模块
            {
                path: 'data-retrieval',
                children: [
                    {
                        index: true,
                        element: <FullTextSearch />,
                    },
                    {
                        path: 'fulltext',
                        element: <FullTextSearch />,
                    },
                    {
                        path: 'advanced',
                        element: <AdvancedSearch />,
                    },
                    {
                        path: 'condition-tree',
                        element: <ConditionTreeSearch />,
                    },
                    {
                        path: 'analysis',
                        element: <SearchAnalysis />,
                    },
                    // 支持无 ID 的可视化路由，用于演示或回退到模拟数据
                    {
                        path: 'visualization',
                        element: <VisualizationView />,
                    },
                    {
                        path: 'visualization/:id',
                        element: <VisualizationView />,
                    },
                ],
            },
            // 系统设置模块
            {
                path: 'system-settings',
                element: <SystemSettings />,
                children: [
                    {
                        index: true,
                        element: <UserSettings />,
                    },
                    {
                        path: 'users',
                        element: <UserSettings />,
                    },
                    {
                        path: 'roles',
                        element: <RoleSettings />,
                    },
                    {
                        path: 'permissions',
                        element: <PermissionSettings />,
                    },
                ],
            },
        ],
    },
    ],
    {
        basename: '/dataflow',
    }
)

export default router
