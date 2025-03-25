import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, BarChart, Code } from 'lucide-react';
import axios from 'axios';


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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>编辑报表</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>筛选条件</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>数据</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              <span>图表管理</span>
            </TabsTrigger>
          </TabsList>
          
          {/* <TabsContent value="filters" className="mt-4">
            <ParamEditView 
              paramList={paramList} 
              setParamList={setParamList} 
            />
          </TabsContent> */}
          
          <TabsContent value="data" className="mt-4">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span>执行引擎:</span>
                  <Select value={executorType} onValueChange={setExecutorType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="选择执行引擎" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MySQL">MySQL</SelectItem>
                      <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span>更新方式:</span>
                  <Select value={updateMode} onValueChange={setUpdateMode}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="选择更新方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="手动更新">手动更新</SelectItem>
                      <SelectItem value="自动更新">自动更新</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span>DataFrame名称:</span>
                  <Input 
                    value={dataFrameName} 
                    onChange={(e) => setDataFrameName(e.target.value)}
                    className="w-[180px]" 
                  />
                </div>
              </div>
              
              <div className="h-[400px] border rounded">
                {/* <SQLEditor
                  ref={sqlEditorRef}
                  initialSqlCode={sqlCode}
                  configLoaded={true}
                  readOnly={false}
                  queryButtonVisible={false}
                /> */}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="charts" className="mt-4">
            {/* <VisualizationEditView 
              visualizationList={visualizationList} 
              setVisualizationList={setVisualizationList} 
            /> */}
          </TabsContent>
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