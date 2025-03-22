import { useState, useEffect } from 'react';
import { Form } from 'antd';
import dayjs from 'dayjs';

export const useParameters = (configLoaded, configParameters, onParamValuesChange) => {
  const [parameters, setParameters] = useState([]);
  const [paramValues, setParamValues] = useState({});
  const [form] = Form.useForm();

  // 处理参数配置
  const processParameters = (params) => {
    if (!params) return;
    // 保存参数配置
    setParameters(params);
    
    // 设置默认参数值
    const defaultValues = {};
    params.forEach(param => {
      if (param.type === 'single_select' || param.type === 'single_input') {
        defaultValues[param.name] = param.default !== undefined ? param.default : '';
      } else if (param.type === 'multi_select' || param.type === 'multi_input') {
        defaultValues[param.name] = param.default !== undefined ? param.default : [];
      } else if (param.type === 'date_picker') {
        defaultValues[param.name] = param.default ? dayjs(param.default) : null;
      }
    });
    
    // 保存参数值
    setParamValues(defaultValues);
    form.setFieldsValue(defaultValues);
    
    return defaultValues;
  };

  useEffect(() => {
    if (configLoaded && configParameters) {
      const defaultValues = processParameters(configParameters);
      // 初始化时也触发回调
      if (defaultValues && onParamValuesChange) {
        onParamValuesChange(defaultValues);
      }
    }
  }, [configLoaded, configParameters, onParamValuesChange]);


  // 处理参数值变化
  const handleParamChange = (name, value) => {
    const newParamValues = {
      ...paramValues,
      [name]: value
    };
    setParamValues(newParamValues);
    // 参数变化时触发回调
    if (onParamValuesChange) {
      onParamValuesChange(newParamValues);
    }
    return newParamValues;
  };


  return {
    parameters,
    paramValues,
    form,
    handleParamChange
  };
};