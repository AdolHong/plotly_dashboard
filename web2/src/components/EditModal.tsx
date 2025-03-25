import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, Database, BarChart2, Layout } from 'lucide-react';
import axios from 'axios';
import { toast } from "sonner"


interface EditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (params: any[], visualizations: any[], sqlCode: string) => void;
  parameters: any[];
  visualizations?: any[];
  dashboardConfig: any;
  initialSqlCode: string;
}

const EditModal = ({ 
  open, 
  onClose, 
  onSave, 
  parameters, 
  visualizations = [], 
  dashboardConfig, 
  initialSqlCode 
}: EditModalProps) => {
  const [paramList, setParamList] = useState<any[]>([]);
  const [visualizationList, setVisualizationList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('filters');
  const [sqlCode, setSqlCode] = useState(initialSqlCode || '');
  const [executorType, setExecutorType] = useState('MySQL');
  const [dataFrameName, setDataFrameName] = useState('df');
  const [updateMode, setUpdateMode] = useState('手动更新');
  const sqlEditorRef = useRef<any>(null);

  // 当modal显示或dashboardConfig变化时初始化SQL相关配置
  useEffect(() => {
    if (dashboardConfig?.query) {
      setSqlCode(dashboardConfig.query.code || '');
      setExecutorType(dashboardConfig.query.executorType || 'MySQL');
      setDataFrameName(dashboardConfig.query.dataFrameName || 'df');
      setUpdateMode(dashboardConfig.query.updateMode || '手动更新');
    }
  }, [dashboardConfig]);

  // 当参数列表变化时更新表单
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      setParamList([...parameters]);
    } else {
      setParamList([]);
    }
    
    // 当可视化列表变化时更新
    if (visualizations && visualizations.length > 0) {
      setVisualizationList([...visualizations]);
    } else {
      setVisualizationList([]);
    }
  }, [parameters, visualizations]);

  const handleSave = async () => {
    try {
      // 从SQLEditor获取最新的SQL查询
      const currentSqlCode = sqlEditorRef.current ? sqlEditorRef.current.getSqlQuery() : sqlCode;
      
      // 构建更新后的配置
      const newConfig = { 
        ...dashboardConfig, 
        parameters: paramList,
        visualization: visualizationList,
        query: {
          code: currentSqlCode,
          executorType,
          dataFrameName,
          updateMode,
        }
      };
      
      console.log('保存配置到服务器:', newConfig);
      
      // 保存到后端
      const response = await axios.post('http://localhost:8000/api/update_config', {
          config: newConfig
      });

      if (response.data.status === 'success') {
        toast({
          title: "成功",
          description: "配置已保存",
        });
        onSave(paramList, visualizationList, currentSqlCode);
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: response.data.message,
        });
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>编辑报表</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full grid grid-cols-4 sticky top-0 z-10">
          
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter size={24} />
              <span>筛选条件</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database size={24} />
              <span>数据</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart2 size={24} />
              <span>图表管理</span>
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout size={24} />
              <span>布局管理</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* 筛选条件标签页 */}
            <TabsContent value="filters" className="p-4 h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">筛选条件管理</h3>
                  <Button onClick={() => {}}>添加筛选条件</Button>
                </div>
                <div className="border rounded-lg p-4">
                  {/* 这里放筛选条件列表组件 */}
                  <div className="space-y-2">
                    <div>时间范围</div>
                    <div>区域</div>
                    <div>产品类别</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 数据标签页 */}
            <TabsContent value="data" className="p-4 h-full">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label>执行引擎:</label>
                    <Select value={executorType} onValueChange={setExecutorType}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择执行引擎" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MySQL">MySQL</SelectItem>
                        <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label>更新方式:</label>
                    <Select value={updateMode} onValueChange={setUpdateMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择更新方式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="手动更新">手动更新</SelectItem>
                        <SelectItem value="自动更新">自动更新</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label>DataFrame名称:</label>
                    <Input 
                      value={dataFrameName}
                      onChange={(e) => setDataFrameName(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="h-[500px] border rounded-lg">
                  {/* SQL编辑器组件 */}
                </div>
              </div>
            </TabsContent>

            {/* 图表管理标签页 */}
            <TabsContent value="charts" className="p-4 h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">图表管理</h3>
                  <Button onClick={() => {}}>添加图表</Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {/* 图表卡片列表 */}
                  <div className="border rounded-lg p-4">
                    <h4>销售趋势</h4>
                    <p className="text-sm text-gray-500">折线图</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4>区域销售占比</h4>
                    <p className="text-sm text-gray-500">饼图</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4>销售明细数据</h4>
                    <p className="text-sm text-gray-500">表格</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 布局管理标签页 */}
            <TabsContent value="layout" className="p-4 h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">布局管理</h3>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => {}}>添加行</Button>
                    <Button variant="outline" onClick={() => {}}>调整列宽</Button>
                    <Button variant="outline" onClick={() => {}}>调整顺序</Button>
                  </div>
                </div>
                <div className="border rounded-lg p-4 min-h-[500px]">
                  {/* 布局预览区域 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      销售趋势
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      区域销售占比
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      销售明细数据
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditModal; 